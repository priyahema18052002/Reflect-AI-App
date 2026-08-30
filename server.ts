import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy GoogleGenAI client initialization
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment.');
    }
    genAiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  config?: any;
}

async function generateContentWithFallback(options: FallbackOptions) {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (let i = 0; i < MODEL_FALLBACK_LADDER.length; i++) {
    const model = MODEL_FALLBACK_LADDER[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
      // If error code is recoverable (503, 429, 404, 500), try next in ladder
      const statusCode = err?.status || err?.statusCode || err?.code;
      const isRecoverable =
        statusCode === 503 ||
        statusCode === 429 ||
        statusCode === 404 ||
        statusCode === 500 ||
        statusCode === 'UNAVAILABLE' ||
        statusCode === 'RESOURCE_EXHAUSTED' ||
        statusCode === 'INTERNAL';

      if (!isRecoverable && i === 0 && !err?.message?.includes('not found')) {
        // Continue to fallback anyway to maximize user resilience
      }
    }
  }
  throw lastError || new Error('All models in fallback ladder failed.');
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Reflection & Dialogue Endpoint
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const mode = typeof data.mode === 'string' ? data.mode : 'deep_reflection';
    const entryTitle = typeof data.title === 'string' ? data.title : '';

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Messages array cannot be empty.' });
    }

    const modePromptMap: Record<string, string> = {
      deep_reflection:
        'You are an empathetic, insightful, and thought-provoking reflection companion. Help the user deeply explore their thoughts, understand their feelings, uncover underlying motives or assumptions, and find clarity. Ask 1-2 open-ended reflective questions to guide them forward.',
      brainstorm:
        'You are an energetic, creative brainstorming partner. Offer diverse, actionable, innovative ideas and unexpected perspectives related to the user entry. Provide concrete next steps.',
      summarize:
        'You are an executive synthesis assistant. Provide a structured, high-clarity summary of the user thoughts, highlighting key themes, underlying challenges, and actionable takeaways.',
      open_dialogue:
        'You are an open, thoughtful intellectual sparring partner and journal assistant. Have a supportive, balanced, and engaging dialogue with the user.',
    };

    const systemInstruction = `
${modePromptMap[mode] || modePromptMap.deep_reflection}
Guidelines:
1. Always maintain a respectful, empathetic, non-judgmental tone.
2. Structure your response clearly using rich Markdown formatting (bullet points, bold text for key concepts, clear sections where appropriate).
3. Extract key insights, action items, a suggested concise title (if none exists or if it can be improved), and 2-3 engaging follow-up prompts the user could choose to explore next.
4. Output your response as a valid JSON object matching the requested schema.
`;

    // Convert messages to Gemini API format
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: 'The main conversational response or reflection to display in the journal conversation.',
        },
        summary: {
          type: Type.STRING,
          description: 'A 1-2 sentence executive summary of the reflection or entry so far.',
        },
        keyInsights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 4 bullet-point key insights distilled from the conversation.',
        },
        actionItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '1 to 3 optional practical steps or mindset shifts.',
        },
        suggestedTitle: {
          type: Type.STRING,
          description: 'A short, poetic or clear title (3-6 words) for this journal interaction.',
        },
        suggestedFollowUps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 3 quick prompts or questions the user could tap on to continue reflecting.',
        },
      },
      required: ['reply'],
    };

    const { response, modelUsed } = await generateContentWithFallback({
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.7,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Received empty response from Gemini model.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Fallback if JSON parsing fails
      parsedResult = {
        reply: responseText,
        keyInsights: [],
        actionItems: [],
        suggestedFollowUps: [],
      };
    }

    return res.json({
      ...parsedResult,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection with Gemini.',
    });
  }
});

// Quick Title & Tag Generator Endpoint
app.post('/api/gemini/quick-summary', async (req, res) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const text = typeof data.text === 'string' ? data.text : '';

    if (!text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const { response, modelUsed } = await generateContentWithFallback({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate a concise title (3-6 words) and 2-4 categorical tags for this journal text:\n\n"${text}"`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: { type: Type.STRING },
          },
          required: ['title', 'tags'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, modelUsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/quick-summary:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate summary.',
    });
  }
});

// Vite Middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server listening on port ${PORT}`);
  });
}

startServer();

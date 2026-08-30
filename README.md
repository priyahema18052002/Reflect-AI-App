# ReflectAI - User-Authenticated Reflection Journal & Brainstorming Studio

ReflectAI is a full-stack, user-authenticated journaling and multi-turn reflection application powered by the **Gemini 3.6 Flash API**, **Firebase Authentication**, and **Cloud Firestore**. Every interaction is securely isolated to the authenticated user's workspace, preventing unauthorized reads or cross-user data leakage.

---

## Architecture & Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│  - Firebase Google Authentication                           │
│  - Real-time Firestore Sync (/users/{uid}/interactions)     │
│  - Multi-Turn Reflection Dialogue & Focus Modes             │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
    Direct Firestore SDK            HTTP /api/gemini/reflect
 (Owner-bound Security Rules)                  │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       Cloud Firestore       │ │   Express + Vite Server     │
│  /users/{userId}            │ │  - Server-side Gemini API   │
│   └── /interactions/{id}    │ │  - Fallback Ladder          │
└─────────────────────────────┘ └──────────────┬──────────────┘
                                               │
                                               ▼
                                ┌─────────────────────────────┐
                                │    Gemini 3.6 Flash API     │
                                └─────────────────────────────┘
```

---

## 1. Prerequisites & Google Cloud Setup

Ensure the following Google Cloud APIs are enabled in your GCP project:

```bash
# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 2. Secret Management Setup

ReflectAI retrieves Gemini API credentials securely without exposing keys to client-side code:

```bash
# 1. Create the Secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API Key as a version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Secret Accessor role to the default Cloud Run runtime service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Firestore Database & Security Rules

ReflectAI uses user-bound Firestore paths ensuring **zero cross-user visibility**. Deploy the following `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Cloud Run Deployment Flow

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Deploy to Google Cloud Run with Secret Manager binding
gcloud run deploy reflect-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

### Mandatory Campaign Labeling

Apply the challenge verification label to register your deployment:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region us-central1
```

---

## 5. End-to-End Functional Test Walkthrough

Below are the test cases covering every user process and interaction:

### Test Suite 1: Authentication & Landing Page
- **TC-1.1**: Visit root path while unauthenticated. Verify landing page renders with value proposition, features bento, and Google Sign-In button.
- **TC-1.2**: Click "Sign in with Google" button. Verify Google account selector triggers and completes successfully.
- **TC-1.3**: Verify user is redirected to private dashboard with user profile avatar and name displayed in the top navbar.

### Test Suite 2: Multi-Turn Reflection Dialogue & Focus Modes
- **TC-2.1**: Select "Deep Reflection" mode tab. Enter a journal reflection and submit via button or `Cmd/Ctrl + Enter`.
- **TC-2.2**: Verify Gemini 3.6 Flash returns a multi-part response with structured markdown formatting.
- **TC-2.3**: Submit a second follow-up turn in the same interaction. Verify multi-turn conversational context is maintained and appended.
- **TC-2.4**: Switch focus mode (e.g. to "Brainstorming" or "Executive Summary") and submit a new turn. Verify Gemini adapts response style.

### Test Suite 3: Firestore Persistence & Isolation
- **TC-3.1**: Verify interaction is automatically saved to Cloud Firestore under `/users/{userId}/interactions/{interactionId}`.
- **TC-3.2**: Check top navbar sync indicator displays "Encrypted in Firestore".
- **TC-3.3**: Reload the page or sign out and sign back in. Verify the journal history loads completely with all past turns intact.
- **TC-3.4**: Sign in as a different user. Verify previous user's entries are not accessible or visible.

### Test Suite 4: History Search, Synthesis & Management
- **TC-4.1**: Type keywords into the history search bar. Verify results filter dynamically across titles, summaries, and messages.
- **TC-4.2**: Click "Synthesis" button in top toolbar to open the Session Synthesis drawer. Verify Executive Summary, Key Insights, and Recommended Actions are displayed.
- **TC-4.3**: Click "Export" to download the interaction transcript as a Markdown (`.md`) file.
- **TC-4.4**: Click the trash icon on a past entry, confirm in modal. Verify the entry is deleted from both UI and Firestore.
- **TC-4.5**: Click "Sign Out". Verify session terminates cleanly and landing page is restored.

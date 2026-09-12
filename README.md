<div align="center">
  <div style="background-color: #2563eb; width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ffffff" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
  </div>
  <h1>OpsEcho | AI Incident Commander</h1>
  <p><strong>Real-time incident response platform powered by Gemini Multimodal Live API.</strong></p>
  
  <p>
    <a href="#features"><img src="https://img.shields.io/badge/Features-Explore-blue" alt="Features"></a>
    <a href="#getting-started"><img src="https://img.shields.io/badge/Setup-Quick_Start-success" alt="Setup"></a>
    <a href="https://react.dev/" target="_blank"><img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React"></a>
    <a href="https://nodejs.org/" target="_blank"><img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs" alt="NodeJS"></a>
  </p>
</div>

---

## 📖 Overview

**OpsEcho** is a modern incident management platform designed to revolutionize how teams handle system outages and critical alerts. Instead of disjointed Slack calls and manual note-taking, OpsEcho provides a dedicated **Voice Response Room** where an AI Observer listens in real-time.

By leveraging the **Gemini Multimodal Live API** and **Agora RTC**, OpsEcho continuously transcribes the conversation, extracting facts, hypotheses, and action items instantly, allowing engineers to focus purely on resolving the issue without worrying about documentation.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [How the AI Observer Works](#-how-the-ai-observer-works)
- [Getting Started (Local Development)](#-getting-started-local-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Key Features

- **Real-Time Voice Rooms**: Low-latency, high-fidelity voice channels powered by Agora RTC.
- **AI-Powered STT (Speech-to-Text)**: Local audio is streamed directly to Gemini's Multimodal Live API, providing lightning-fast, highly accurate transcriptions mapped to each user.
- **Live Intel Extraction**: As the team talks, the AI autonomously extracts actionable insights—categorizing them into **Facts**, **Hypotheses**, and **Action Items**—and posts them to the dashboard.
- **Real-Time Synchronization**: Built with Socket.io for instant state updates across all clients. No refreshing required.
- **Modern & Responsive UI**: Designed with TailwindCSS and Framer Motion for a seamless, beautiful user experience.
- **Serverless Ready**: Designed to be seamlessly deployed on platforms like Vercel with graceful long-polling fallbacks for WebSockets.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS (v4)](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Routing**: [React Router](https://reactrouter.com/)

### Backend
- **Server**: [Express.js](https://expressjs.com/)
- **Real-Time Engine**: [Socket.io](https://socket.io/)
- **Database ORM**: [Prisma](https://www.prisma.io/) (SQLite for local dev, PostgreSQL for production)

### AI & Infrastructure
- **Artificial Intelligence**: `@google/genai` (Gemini Multimodal Live API) & Langchain
- **Voice/RTC**: [Agora RTC SDK](https://www.agora.io/)

---

## 🏗️ Project Architecture

```text
opsecho/
├── server/                 # Express backend server
│   ├── src/                # Backend source code
│   │   ├── services/       # AI, Agora, and WebSocket services
│   │   └── ...
│   └── server.ts           # Server entry point
├── src/                    # React frontend application
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application pages (Landing, Dashboard, etc.)
│   ├── store/              # State management
│   ├── lib/                # Utilities and API clients
│   └── main.tsx            # Frontend entry point
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma ORM schema
├── package.json            # Project dependencies and scripts
└── vite.config.ts          # Vite configuration
```

---

## 🧠 How the AI Observer Works

1. **Voice Capture**: When a user joins the incident room, the client captures raw PCM audio via the browser's `getUserMedia` API.
2. **Streaming STT**: The audio is streamed over a secure WebSocket directly to Google's Gemini Multimodal Live API (bypassing the fragile and inconsistent browser `SpeechRecognition` API).
3. **Broadcasting**: Gemini returns accurate text transcripts in real time. The client broadcasts `TRANSCRIPT_FINAL` to the backend via Socket.io.
4. **Analysis & Extraction**: The backend intercepts the final transcripts and pushes the conversation history to the Gemini text model, prompting it to extract structured JSON data (Facts, Hypotheses, Action Items).
5. **Real-time Updates**: The extracted Intelligence is saved to the database and instantly pushed to all active clients in the room via WebSockets.

---

## 🚀 Getting Started (Local Development)

### Prerequisites

Make sure you have the following installed and configured before starting:
- **Node.js** (v18 or higher)
- A **[Google Gemini API Key](https://aistudio.google.com/)**
- An **[Agora App ID & Certificate](https://console.agora.io/)**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/opsecho.git
cd opsecho
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and add the following keys:

```env
# Database (SQLite for local)
DATABASE_URL="file:./dev.db"

# JWT Auth
JWT_SECRET="your-super-secret-jwt-key"

# Agora Configuration
AGORA_APP_ID="your_agora_app_id"
AGORA_APP_CERTIFICATE="your_agora_app_certificate"

# Google Gemini Configuration
GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Setup the Database

Generate the Prisma client and push the schema to your local SQLite database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the Development Server

Start both the frontend Vite server and the Express backend concurrently:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deployment

OpsEcho is pre-configured for deployment on **Vercel**. 

1. **Push your code** to a GitHub repository.
2. Log in to **Vercel** and import the repository.
3. In the Vercel deployment settings, expand the **Environment Variables** section and add all your keys. 
   - *Important*: Ensure `DATABASE_URL` points to a remote PostgreSQL database (like Supabase, Neon, or Vercel Postgres) instead of a local SQLite file.
4. Set the build command to `npm run build` and output directory to `dist`.
5. Click **Deploy**.

> **Note**: Vercel Serverless Functions do not support persistent WebSockets out of the box. OpsEcho is configured to gracefully fallback to HTTP Long-Polling for Socket.io when deployed on Vercel.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  <p>Built with ❤️ for incident responders.</p>
</div>

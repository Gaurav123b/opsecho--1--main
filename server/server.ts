import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth";
import incidentRoutes from "./src/routes/incidents";
import agoraRoutes from "./src/routes/agora";
import integrationsRoutes from "./src/routes/integrations";
import mockRoutes from "./src/routes/mockTools";
import { initSocket } from "./src/lib/socket";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io only if not running in a Vercel Serverless Function
// (Vercel Serverless does not support persistent WebSockets)
if (!process.env.VERCEL) {
  const io = initSocket(server);
  app.set("io", io);
}

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/agora", agoraRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/mock", mockRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "opsecho-api" });
});

async function startServer() {
  // Vite Middleware for Development (Skip on Vercel)
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Serve static files in production (only if not Vercel)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only start the HTTP server if not running in Vercel
  if (!process.env.VERCEL) {
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`[OpsEcho] Server running on http://localhost:${PORT}`);
    });
  }
}

startServer().catch((err) => {
  console.error("[OpsEcho] Failed to start server:", err);
});

// Export the Express API for Vercel Serverless Functions
export default app;


//this is my commit sync fork
import express from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

import { postToSlack, postResolutionToSlack } from "../services/slack";
import { createJiraTicket } from "../services/jira";
import crypto from "crypto";
import { processTranscript } from "../services/aiProcessor";
import { generateIncidentSummary } from "../services/gemini";

const router = express.Router();

// Generate a human-friendly room code (e.g., PAY-4827)
const generateRoomCode = () => {
  const prefix = ["OPS", "PAY", "DB", "API", "NET", "SRV", "UI", "AUTH"][Math.floor(Math.random() * 8)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
};

// Create Incident
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { title, description, severity, service, environment, impact } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    let roomCode = generateRoomCode();
    // Ensure room code uniqueness
    let exists = await prisma.incident.findUnique({ where: { roomCode } });
    while (exists) {
      roomCode = generateRoomCode();
      exists = await prisma.incident.findUnique({ where: { roomCode } });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity,
        service,
        environment,
        impact,
        roomCode,
        createdById: userId,
        status: "CREATED",
        timeline: {
          create: {
            type: "STATUS_CHANGE",
            description: "Incident created",
            metadata: { severity, service, environment }
          }
        }
      },
    });

    // Add creator as the first participant
    await prisma.incidentParticipant.create({
      data: {
        incidentId: incident.id,
        userId: userId,
      },
    });

    res.status(201).json(incident);
  } catch (error) {
    console.error("Create incident error:", error);
    res.status(500).json({ error: "Failed to create incident" });
  }
});

// Get My Incidents
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const incidents = await prisma.incident.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
        participants: {
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
        },
      },
    });

    res.json(incidents);
  } catch (error) {
    console.error("Get incidents error:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// Join Incident by Room Code
router.post("/join", authenticate, async (req: AuthRequest, res) => {
  const { roomCode } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const incident = await prisma.incident.findUnique({
      where: { roomCode },
    });

    if (!incident) {
      return res.status(404).json({ error: "Incident room not found" });
    }

    if (incident.status === "CLOSED") {
      return res.status(400).json({ error: "This incident room is closed" });
    }

    // Add participant if not already joined
    const participant = await prisma.incidentParticipant.upsert({
      where: {
        incidentId_userId: {
          incidentId: incident.id,
          userId: userId,
        },
      },
      update: {},
      create: {
        incidentId: incident.id,
        userId: userId,
      },
    });

    // Create join event in timeline
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        type: "PARTICIPANT_JOINED",
        description: `User joined the room`,
        metadata: { userId }
      }
    });

    res.json(incident);
  } catch (error) {
    console.error("Join incident error:", error);
    res.status(500).json({ error: "Failed to join incident" });
  }
});

// Get Incident Details
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const isSlim = req.query.slim === 'true';

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, role: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        actions: { include: { owner: { select: { name: true } } } },
        facts: true,
        hypotheses: true,
        decisions: true,
        timeline: isSlim ? false : { orderBy: { timestamp: "asc" } },
        transcripts: isSlim ? false : { orderBy: { timestamp: "desc" }, take: 50 },
      },
    });

    if (!incident) return res.status(404).json({ error: "Incident not found" });

    // Check if user is a participant
    const isParticipant = incident.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: "Forbidden: You are not a participant in this incident" });
    }

    res.json(incident);
  } catch (error) {
    console.error("Get incident details error:", error);
    res.status(500).json({ error: "Failed to fetch incident details" });
  }
});

// Send a chat message (typed or voice-to-text) — REST-based, Vercel-compatible.
// Persists the transcript and asynchronously triggers AI analysis.
router.post("/:id/chat", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { text, source } = req.body;  // source: 'voice' | 'chat' — sent by useGeminiSTT for voice
  const userId = req.user?.id;
  const userName = req.user?.name || 'Unknown';

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!text || !text.trim()) return res.status(400).json({ error: "Empty message" });

  try {
    // Verify participant
    const participant = await prisma.incidentParticipant.findUnique({
      where: { incidentId_userId: { incidentId: id, userId } },
    });
    if (!participant) return res.status(403).json({ error: "Forbidden" });

    // Save transcript to DB
    const transcript = await prisma.transcript.create({
      data: { incidentId: id, userId, userName, text: text.trim() },
    });

    // Respond immediately with the new transcript to the client so UI is unblocked
    res.json(transcript);

    // Trigger AI analysis in the background
    // Await it to ensure Vercel Serverless Function doesn't terminate before it finishes
    const io = req.app.get("io");
    const transcriptSource: 'voice' | 'chat' = source === 'voice' ? 'voice' : 'chat';
    await processTranscript(io, null, id, text.trim(), userName, userId, transcript, transcriptSource);

  } catch (error) {
    console.error("Chat message error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Failed to send message" });
  }
});

// Edit a chat message
router.put("/:id/chat/:chatId", authenticate, async (req: AuthRequest, res) => {
  const { id, chatId } = req.params;
  const { text } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!text || !text.trim()) return res.status(400).json({ error: "Empty message" });

  try {
    const transcript = await prisma.transcript.findUnique({ where: { id: chatId } });
    if (!transcript) return res.status(404).json({ error: "Message not found" });
    if (transcript.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    const updated = await prisma.transcript.update({
      where: { id: chatId },
      data: { text: text.trim() }
    });

    res.json(updated);
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({ error: "Failed to edit message" });
  }
});

// Delete a chat message
router.delete("/:id/chat/:chatId", authenticate, async (req: AuthRequest, res) => {
  const { id, chatId } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const transcript = await prisma.transcript.findUnique({ where: { id: chatId } });
    if (!transcript) return res.status(404).json({ error: "Message not found" });
    if (transcript.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    await prisma.transcript.delete({ where: { id: chatId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Update action status (e.g., confirm a critical action)
router.patch("/:id/actions/:actionId", authenticate, async (req: AuthRequest, res) => {
  const { id, actionId } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!status) return res.status(400).json({ error: "Status required" });

  try {
    const participant = await prisma.incidentParticipant.findUnique({
      where: { incidentId_userId: { incidentId: id, userId } },
    });
    if (!participant) return res.status(403).json({ error: "Forbidden" });

    const action = await prisma.action.update({
      where: { id: actionId },
      data: { status },
    });

    // Log in timeline
    await prisma.timelineEvent.create({
      data: {
        incidentId: id,
        type: 'ACTION_CONFIRMED',
        description: `Critical action confirmed: ${action.description}`,
        metadata: { confirmedBy: userId, actionId }
      }
    });

    // Send to Slack if integration exists
    if (status === 'IN_PROGRESS') {
      await postToSlack(userId, id, action.description);
    }

    res.json(action);
  } catch (error) {
    console.error("Update action error:", error);
    res.status(500).json({ error: "Failed to update action" });
  }
});

// Resolve Incident
router.post("/:id/resolve", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Fetch current incident data for summary
    const currentIncident = await prisma.incident.findUnique({
      where: { id },
      include: {
        facts: true,
        decisions: true,
        actions: true,
        risks: true
      }
    });

    if (!currentIncident) return res.status(404).json({ error: "Incident not found" });

    // 2. Generate summary
    const summary = await generateIncidentSummary(currentIncident);

    // 3. Persist summary and update status
    const incident = await prisma.incident.update({
      where: { id },
      data: { 
        status: "RESOLVED",
        summary: summary,
        timeline: {
          create: {
            type: "STATUS_CHANGE",
            description: "Incident resolved",
            metadata: { resolvedBy: userId }
          }
        }
      },
      include: {
        createdBy: { select: { name: true, role: true } },
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        actions: { include: { owner: { select: { name: true } } } },
        facts: true,
        hypotheses: true,
        decisions: true,
        conflicts: true,
        transcripts: { orderBy: { timestamp: "desc" }, take: 50 },
        timeline: { orderBy: { timestamp: "asc" } },
      },
    });

    // 4. Send to Slack and Jira if integrations exist
    await postResolutionToSlack(userId, id, summary);
    await createJiraTicket(userId, id, summary);

    // 5. Broadcast the final resolved state
    const io = req.app.get("io");
    io?.to(`incident:${id}`).emit("incident:updated", incident);

    res.json(incident);
  } catch (error) {
    console.error("Resolve incident error:", error);
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

// Update Incident Summary
router.patch("/:id/summary", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { summary } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!summary) return res.status(400).json({ error: "Summary is required" });

  try {
    const incident = await prisma.incident.update({
      where: { id },
      data: { summary },
      include: {
        createdBy: { select: { name: true, role: true } },
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        actions: { include: { owner: { select: { name: true } } } },
        facts: true,
        hypotheses: true,
        decisions: true,
        conflicts: true,
        transcripts: { orderBy: { timestamp: "desc" }, take: 50 },
        timeline: { orderBy: { timestamp: "asc" } },
      }
    });

    // Broadcast the updated state
    const io = req.app.get("io");
    io?.to(`incident:${id}`).emit("incident:updated", incident);

    res.json(incident);
  } catch (error) {
    console.error("Update summary error:", error);
    res.status(500).json({ error: "Failed to update incident summary" });
  }
});

export default router;

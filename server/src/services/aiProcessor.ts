import { Socket } from "socket.io";
import prisma from "../lib/prisma";
import { analyzeTranscript } from "./gemini";

export const processTranscript = async (
  io: any, 
  socket: any, 
  incidentId: string, 
  text: string, 
  userName: string,
  userId: string,
  existingTranscript?: any,
  source: 'voice' | 'chat' = 'voice'
) => {
  try {
    // 1. Persist Transcript
    let transcript;
    if (existingTranscript) {
      transcript = existingTranscript;
    } else {
      transcript = await prisma.transcript.create({
        data: {
          incidentId,
          userId,
          userName,
          text,
        },
      });
    }

    // Broadcast transcript to room
    io?.to(`incident:${incidentId}`).emit("TRANSCRIPT_NEW", transcript);

    // 2. Fetch Context for AI — include BOTH voice transcripts AND chat messages
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        facts: true,
        hypotheses: true,
        actions: true,
        decisions: true,
        transcripts: {
          orderBy: { timestamp: "desc" },
          take: 20  // Increased to get richer context from both voice and chat
        }
      }
    });

    if (!incident) return;

    // 3. Build unified conversation history (voice + chat alike — all are transcripts)
    const recentHistory = incident.transcripts
      .slice()
      .reverse()  // oldest first
      .map(t => `[${t.userName}]: ${t.text}`)
      .join("\n");

    // 4. Analyze with AI
    const aiResult = await analyzeTranscript(text, {
      title: incident.title,
      severity: incident.severity,
      existingFacts: incident.facts.map(f => ({ id: f.id, description: f.description })),
      existingHypotheses: incident.hypotheses.map(h => h.description),
      recentHistory: recentHistory,
      source: source === 'voice' ? `${userName} (voice)` : `${userName} (chat)`
    });

    if (!aiResult) return;

    // 5. Handle contradiction demotion (factsToDowngrade)
    //    For each fact the AI says is now invalidated: delete the fact and add it as a hypothesis.
    if (aiResult.factsToDowngrade && aiResult.factsToDowngrade.length > 0) {
      for (const description of aiResult.factsToDowngrade) {
        // Find the matching fact (case-insensitive fuzzy match on description)
        const matchingFact = incident.facts.find(f =>
          f.description.toLowerCase().trim() === description.toLowerCase().trim()
        );

        if (matchingFact) {
          // Delete the old fact
          await prisma.fact.delete({ where: { id: matchingFact.id } });

          // Re-add it as a hypothesis (now considered uncertain)
          await prisma.hypothesis.create({
            data: {
              incidentId,
              description: `[Superseded] ${matchingFact.description}`,
              proposer: 'AI Observer',
            },
          });

          console.log(`[AI] Demoted fact to hypothesis: "${matchingFact.description}"`);
        }
      }
    }

    // 6. Update Database with new AI Insights (Parallelized)
    const promises = [];

    if (aiResult.facts && aiResult.facts.length > 0) {
      promises.push(prisma.fact.createMany({
        data: aiResult.facts.map((f: any) => ({
          incidentId,
          description: f.description,
        })),
      }));
    }

    if (aiResult.hypotheses && aiResult.hypotheses.length > 0) {
      promises.push(prisma.hypothesis.createMany({
        data: aiResult.hypotheses.map((h: any) => ({
          incidentId,
          description: h.description,
          proposer: h.proposer,
        })),
      }));
    }

    if (aiResult.actions && aiResult.actions.length > 0) {
      // Fuzzy-match the AI-extracted owner name to a real participant
      const participants = await prisma.incidentParticipant.findMany({
        where: { incidentId },
        include: { user: { select: { id: true, name: true } } }
      });

      const matchOwner = (ownerName: string): string | null => {
        if (!ownerName) return null;
        const lower = ownerName.toLowerCase().trim();
        const match = participants.find(p =>
          p.user.name.toLowerCase().includes(lower) || lower.includes(p.user.name.toLowerCase().split(' ')[0])
        );
        return match?.user?.id || null;
      };

      promises.push(prisma.action.createMany({
        data: aiResult.actions.map((a: any) => ({
          incidentId,
          description: a.description,
          isCritical: a.isCritical || false,
          ownerId: matchOwner(a.owner || '') || undefined,
        })),
      }));
    }

    if (aiResult.conflicts && aiResult.conflicts.length > 0) {
      promises.push(prisma.conflict.createMany({
        data: aiResult.conflicts.map((c: any) => ({
          incidentId,
          description: c.description,
        })),
      }));
    }

    if (aiResult.decisions && aiResult.decisions.length > 0) {
      promises.push(prisma.decision.createMany({
        data: aiResult.decisions.map((d: any) => ({
          incidentId,
          description: d.description,
          decider: d.decider,
        })),
      }));
    }

    if (aiResult.risks && aiResult.risks.length > 0) {
      promises.push(prisma.risk.createMany({
        data: aiResult.risks.map((r: any) => ({
          incidentId,
          description: r.description,
        })),
      }));
    }

    // Execute all database updates concurrently
    if (promises.length > 0) {
      await Promise.all(promises);
    }

    if (aiResult.aiResponse) {
      const aiTranscript = await prisma.transcript.create({
        data: {
          incidentId,
          userName: "AI Observer",
          text: aiResult.aiResponse,
        }
      });
      io?.to(`incident:${incidentId}`).emit("TRANSCRIPT_NEW", aiTranscript);
      // Emit event specifically for TTS client
      io?.to(`incident:${incidentId}`).emit("AI_SPEAK", { text: aiResult.aiResponse, id: aiTranscript.id });
    }

    // 7. Broadcast refreshed state
    const updatedIncident = await prisma.incident.findUnique({
      where: { id: incidentId },
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

    io?.to(`incident:${incidentId}`).emit("incident:updated", updatedIncident);
  } catch (error) {
    console.error("[AI Processing] Error:", error);
  }
};

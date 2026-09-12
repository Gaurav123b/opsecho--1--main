import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export const analyzeTranscript = async (transcript: string, context: any) => {
  if (!ai) {
    console.warn("[Gemini] API Key missing, skipping analysis.");
    return null;
  }

  const prompt = `
    You are an elite DevOps / Site Reliability Engineering (SRE) AI Incident Commander.
    You analyze ALL input — whether spoken voice transcripts OR typed chat messages — equally and with full rigor.
    Your objective is to assist a highly technical team during a critical outage.

    Analyze the following new input and extract structured information.
    Ensure all descriptions are highly technical, descriptive, and actionable.

    CRITICAL RULES:
    1. ONLY extract FACTS that are EXPLICITLY stated. Translate conversational language into precise technical facts.
       E.g., "db is down" → "Database cluster unreachable, queries failing across all services."
    2. ONLY extract HYPOTHESES clearly stated or strongly implied.
       E.g., "maybe it's the network" → "Potential network partition or VPC route failure isolating the backend."
    3. ONLY identify DECISIONS if a clear technical conclusion is reached.
    4. ONLY identify ACTIONS if a clear task is assigned. Identify the OWNER (user name) if mentioned.
    5. Detect CONFLICTS if two pieces of information technically contradict each other.
    6. Identify RISKS using formal SRE terminology.
    7. If the input is chatter, greetings, or non-incident related, return empty arrays for everything.

    ═══════════ CONTRADICTION & DEMOTION RULE ═══════════
    This is the most important rule:
    Review "Existing Facts" carefully. If the new input CONTRADICTS or INVALIDATES any existing fact:
    - Add the old fact's EXACT description to "factsToDowngrade" (this will demote it to a hypothesis).
    - Add the NEW information as a new FACT.
    
    Example:
    - Existing Fact: "Database is down."
    - New Input: "Actually the database is up, it's the load balancer that's misconfigured."
    - → Put "Database is down." in factsToDowngrade.
    - → Add "Load balancer is misconfigured, causing connection routing failures." as a new fact.
    ═════════════════════════════════════════════════════

    Current Incident Context:
    Title: ${context.title}
    Severity: ${context.severity}
    Existing Facts (check for contradictions!): ${JSON.stringify(context.existingFacts)}
    Existing Hypotheses: ${JSON.stringify(context.existingHypotheses)}

    Recent Conversation History (voice + chat combined):
    ${context.recentHistory}

    New Input (voice transcript or chat message from ${context.source || 'participant'}):
    "${transcript}"

    TURN-TAKING RULES for aiResponse:
    - Only provide an aiResponse if a user directly addresses you, if you detect a critical conflict, or to announce a major downgrade of a fact.
    - DO NOT provide an aiResponse just to acknowledge normal conversation.
    - Remain silent (omit aiResponse) unless your input adds significant tactical value.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            facts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } } },
            hypotheses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, proposer: { type: Type.STRING } } } },
            decisions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, decider: { type: Type.STRING } } } },
            actions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, owner: { type: Type.STRING }, isCritical: { type: Type.BOOLEAN } } } },
            conflicts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } } },
            risks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } } },
            factsToDowngrade: {
              type: Type.ARRAY,
              description: "Exact descriptions of existing facts that are now contradicted and should be demoted to hypotheses.",
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING },
            aiResponse: { type: Type.STRING, description: "A concise response from the AI Incident Commander, only when it adds tactical value." }
          }
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("[Gemini] Analysis failed:", error);
    return null;
  }
};


export const generateIncidentSummary = async (incident: any) => {
  if (!ai) {
    console.warn("[Gemini] API Key missing, skipping summary generation.");
    return "Summary generation skipped (no API key).";
  }

  const prompt = `
    You are an AI Incident Commander. The following incident has just been resolved.
    Generate a comprehensive Final Incident Summary for the dashboard.
    
    Format the summary in cleanly spaced Markdown. Include:
    - **Incident Overview** (1 paragraph)
    - **Confirmed Facts** (bullet points)
    - **Key Decisions** (bullet points)
    - **Actions Taken** (bullet points)
    - **Remaining Risks** (bullet points, if any)
    
    Incident Context:
    Title: ${incident.title}
    Severity: ${incident.severity}
    Facts: ${JSON.stringify(incident.facts)}
    Decisions: ${JSON.stringify(incident.decisions)}
    Actions: ${JSON.stringify(incident.actions)}
    Risks: ${JSON.stringify(incident.risks)}
    
    Respond only with the Markdown text of the summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("[Gemini] Summary generation failed:", error);
    return "Failed to generate incident summary.";
  }
};

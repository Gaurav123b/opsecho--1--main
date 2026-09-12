import { analyzeTranscript } from "./src/services/gemini";

async function run() {
  try {
    const result = await analyzeTranscript("The database is completely down and the load balancer is failing. I need John to restart the instances.", {
      title: "Test Incident",
      severity: "High",
      existingFacts: [],
      existingHypotheses: [],
      recentHistory: "",
      source: "User"
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Caught error:", error);
  }
}
run();

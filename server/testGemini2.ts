import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "hello",
    });
    console.log("3.6-flash:", response.text);
  } catch (e: any) {
    console.log("3.6-flash error:", e.status, e.message);
  }
}
run();

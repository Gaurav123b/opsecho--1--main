import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: "/Users/zaid/Desktop/PROJECTS/opsecho--1--main/.env" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello world"
    });
    console.log("SUCCESS:", response.text);
  } catch (error) {
    console.error("ERROR:", error);
  }
}
test();

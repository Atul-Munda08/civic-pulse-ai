import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Use Google Search tool for grounding (since googleMaps tool isn't standard in Node SDK yet, but we will use the available grounding tools)
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error('Grounding error:', error);
    return NextResponse.json({ error: 'Failed to generate grounded content' }, { status: 500 });
  }
}

import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CLASSIFIER_SYSTEM_PROMPT = `
You are the CivicPulse Issue Classifier. Analyze the provided civic infrastructure image or video.

You MUST return ONLY a valid JSON object — no markdown, no backticks, no preamble. 

Return exactly this structure:
{
  "category": "ROAD|WATER|LIGHTING|WASTE|SEWAGE|ENCROACHMENT|OTHER",
  "subCategory": "string",
  "severity": 1, 
  "confidence": 0.9,
  "riskToLife": false,
  "areaEstimateSqm": 0.0,
  "aiDescription": "string (max 80 words, plain English, citizen-friendly)",
  "evidenceQuality": "HIGH|MEDIUM|LOW",
  "flags": ["string"]
}

SEVERITY GUIDE:
1-3: Minor cosmetic damage, no safety risk
4-6: Functional impact, moderate inconvenience
7-8: Significant damage, potential vehicle/person risk
9-10: Severe damage or immediate safety hazard

RISK TO LIFE: Set true if you see: active water gushing near electrical, open manholes in traffic lanes,
live exposed wires, structural collapse risk, flooding blocking emergency routes.

FLAGS examples: POTHOLE_LARGE, POTHOLE_SMALL, WATER_GUSHING, WATER_SEEPING, LIGHT_OUT_SINGLE,
LIGHT_OUT_MULTIPLE, GARBAGE_PILE_LARGE, ILLEGAL_CONSTRUCTION, BROKEN_FOOTPATH, ROAD_COLLAPSE.
`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    
    const mimeType = file.type || 'image/jpeg';
    
    const model = 'gemini-3.5-flash';

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: `Additional context from citizen: ${description || "No additional context provided."}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    let rawText = response.text;
    if (rawText) {
      rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    return NextResponse.json(JSON.parse(rawText || '{}'));
  } catch (error: any) {
    console.error('Classification error:', error);
    return NextResponse.json({ error: 'Failed to classify issue', details: error.message }, { status: 500 });
  }
}

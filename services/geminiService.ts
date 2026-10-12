
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AIAnalysisResult, Category, Severity, Finding, Inspection } from "../types";
import { AUTHENTICATED_STANDARDS } from "./standardsData";

const findingSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Professional designation for the finding (Max 10 words)." },
    description: { type: Type.STRING, description: "Detailed audit observation. Be concise and factual." },
    category: { 
      type: Type.STRING, 
      enum: [Category.DAMAGE, Category.HAZARD, Category.DEFECT, Category.MAINTENANCE, Category.OTHER],
      description: "Functional classification." 
    },
    severity: { 
      type: Type.STRING, 
      enum: [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL],
      description: "Risk assessment level."
    },
    recommendedAction: { type: Type.STRING, description: "Actionable engineering or safety mitigation steps." },
    regulatoryReference: { type: Type.STRING, description: "The EXACT code from the provided Certified Registry." },
    linkedStandards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["code", "title", "url"]
      }
    },
    visualConfidence: { type: Type.NUMBER, description: "0-100 score." },
    regulatoryConfidence: { type: Type.NUMBER, description: "0-100 score." },
    confidence: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: "Overall inference confidence."
    }
  },
  required: ["title", "description", "category", "severity", "recommendedAction", "confidence", "visualConfidence", "regulatoryConfidence"]
};

export const generateFindingFromImage = async (
  imageBase64: string, 
  userNotes?: string
): Promise<AIAnalysisResult & { sources?: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    const model = 'gemini-3-flash-preview';

    // Inject the local authenticated library into the context
    const registryContext = JSON.stringify(AUTHENTICATED_STANDARDS, null, 2);

    const systemInstruction = `
      ACT AS A CERTIFIED REGULATORY ANALYST. 
      YOU ARE PROVIDED WITH A CERTIFIED REGISTRY OF STANDARDS:
      ${registryContext}

      STRICT RULES:
      1. Analyze the image for safety/quality findings.
      2. You MUST anchor the finding to a code from the provided Certified Registry if it applies.
      3. ONLY output final JSON. DO NOT include internal monologues. 
      4. If a finding is related to excavations, use '29 CFR 1926.651'.
      5. If a finding is related to fall hazards, use '29 CFR 1926.501'.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: `Analyze this evidence. User Context: "${userNotes || 'Standard survey.'}"` }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: findingSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Linkage Failure");
    
    const result = JSON.parse(text) as AIAnalysisResult;
    return { ...result };

  } catch (error) {
    console.error("Neural Scan Error:", error);
    throw error;
  }
};

export const chatWithComplianceExpert = async (
  userMessage: string,
  siteContext: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    const registryContext = JSON.stringify(AUTHENTICATED_STANDARDS, null, 2);

    const systemInstruction = `
      ACT AS A SENIOR ENTERPRISE COMPLIANCE OFFICER.
      You have access to this Certified Library: ${registryContext}.
      Provide accurate, grounded information. Use Markdown.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.1
      }
    });

    const text = response.text || "Connection failed.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Compliance Chat Error:", error);
    throw error;
  }
};

export const generateReportFromFindings = async (inspection: Inspection): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const findingsSummary = inspection.findings.map(f => (
      `## ${f.title}\n- **Ref**: ${f.regulatoryReference}\n- **Priority**: ${f.severity}\n- **Observation**: ${f.description}`
    )).join('\n\n');

    const inspectionDate = new Date().toISOString().slice(0, 10);
    const prompt = `Generate a professional inspection report for site ${inspection.name}.
Inspection date: ${inspectionDate}. Use exactly this date.
Use only the facts below. Do not invent dates, names, locations or measurements; write "Not recorded" for anything missing.
Format with Markdown headings, bold labels and bullet lists. Do not use tables.
Findings:
${findingsSummary}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    return response.text || "Report compilation failed.";
  } catch (error) {
    console.error("Neural Report Synthesis Error:", error);
    throw error;
  }
};

export const generateReportAudio = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `TTS this professional safety briefing: ${text.slice(0, 2000)}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

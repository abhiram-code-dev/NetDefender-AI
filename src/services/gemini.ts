import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeThreatIntel(query: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Perform a deep cybersecurity threat intelligence lookup for the following query: "${query}".
  The query could be an IP address, domain name, or file hash (SHA256).
  
  CRITICAL: Be objective and accurate. 
  - If the query is a well-known safe entity (e.g., 8.8.8.8, google.com, microsoft.com), mark it as "Clean" with a risk score of 0-5.
  - If it is suspicious or unknown, mark it as "Suspicious" with a score of 40-60.
  - Only mark as "Malicious" if there is clear evidence of threat activity (C2, Malware distribution, Phishing).
  
  Provide a structured response with reputation, risk score, location (if IP), organization, and associated threats.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reputation: { type: Type.STRING, description: "Malicious, Suspicious, or Clean" },
          riskScore: { type: Type.INTEGER, description: "0-100" },
          location: { type: Type.STRING, description: "City, Country" },
          org: { type: Type.STRING, description: "ISP or Organization" },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Threat tags like C2, Botnet, Phishing" },
          lastSeen: { type: Type.STRING, description: "ISO date or relative time" },
          aiInsight: { type: Type.STRING, description: "A brief professional analyst insight about this threat" }
        },
        required: ["reputation", "riskScore", "location", "org", "tags", "lastSeen", "aiInsight"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
  } catch (error) {
    console.error("Speech generation failed:", error);
  }
  return null;
}

export async function analyzeThreat(threatData: any) {
  const model = "gemini-3-flash-preview";
  const prompt = `You are a Senior Cybersecurity Analyst at NetDefender AI. 
  Analyze the following cybersecurity threat data and provide a detailed forensic report.
  
  Data: ${JSON.stringify(threatData)}
  
  Your analysis must include:
  1. Threat Level (Low, Medium, High)
  2. Attack Timeline (Step-by-step forensic events)
  3. Explanation (Human-friendly summary)
  4. Recommended Actions (Remediation steps)
  5. Risk Score (0-100 based on severity)
  6. Malware Type (Specific category: e.g., Ransomware, Trojan, Spyware, Rootkit, or Clean)
  7. Root Cause (Technical origin or entry vector)
  
  Important: Stay updated with the latest 2024-2025 threat landscape. If you encounter unknown patterns, analyze their behavior to classify them.
  
  Return the analysis in a structured JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          threatLevel: { type: Type.STRING },
          timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanation: { type: Type.STRING },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskScore: { type: Type.INTEGER },
          malwareType: { type: Type.STRING },
          rootCause: { type: Type.STRING }
        },
        required: ["threatLevel", "timeline", "explanation", "actions", "riskScore", "malwareType", "rootCause"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatWithAI(message: string, history: any[], context?: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are the NetDefender AI Senior Cybersecurity Analyst. 
      Your tone is professional, technical, and authoritative. 
      You are an expert in forensics, malware analysis, and network security.
      
      CONTEXT:
      You are part of the NetDefender AI platform. 
      - Memory Forensics: Analyzes RAM for fileless threats.
      - File Analysis: Scans uploaded files for malware.
      - Threat Intel: Lookups IPs/Domains/Hashes.
      - Scan History: Stores all forensics reports.
      
      USER DATA CONTEXT (Use this to answer questions about "my data" or "my scans"):
      ${context || "No specific user data context provided."}
      
      GUIDELINES:
      - Provide expert-level cybersecurity advice.
      - If a user asks about a specific threat, explain the technical mechanics (e.g. process hollowing, DLL injection).
      - Keep answers concise (2-4 lines) but highly informative.
      - Use professional terminology (TTPs, IOCs, C2, etc.).`
    }
  });

  // Convert history to Gemini format if needed, or just send message
  const response = await chat.sendMessage({ message });
  return response.text;
}

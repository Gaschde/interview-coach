import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGroqLLM } from '../lib/groq.js';

const SYSTEM_PROMPT = `Du bist ein erfahrener Recruiter und Interview-Coach. 
Analysiere das Stelleninserat und erstelle eine strukturierte Stellenanalyse plus die erste Interviewfrage.

Antworte NUR als gültiges JSON mit diesem Schema:
{
  "role": "string",
  "company": "string",
  "seniority": "junior|mid|senior|lead",
  "keyRequirements": ["string"],
  "niceToHave": ["string"],
  "cultureKeywords": ["string"],
  "firstQuestion": "string"
}

Die erste Frage soll eine offene Motivationsfrage sein ("Warum diese Stelle? Warum dieses Unternehmen?").`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobText } = req.body;
  if (!jobText || jobText.trim().length < 50) {
    return res.status(400).json({ error: 'Stellentext zu kurz (min. 50 Zeichen)' });
  }

  try {
    const result = await callGroqLLM(SYSTEM_PROMPT, `Stelleninserat:\n${jobText}`);
    res.status(200).json(result);
  } catch (error) {
    console.error('Analyze job error:', error);
    res.status(500).json({ error: 'Analyse fehlgeschlagen' });
  }
}
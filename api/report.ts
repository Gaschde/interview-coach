import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGroqLLM } from '../lib/groq.js';

const SYSTEM_PROMPT = `Du bist ein erfahrener Recruiter und Interview-Coach für den Schweizer Markt.
Erstelle einen umfassenden Abschlussbericht basierend auf allen Fragen und Antworten.

Antworte NUR als gültiges JSON:
{
  "overallScore": 0-100,
  "qaEvaluations": [
    {
      "questionId": "string",
      "scores": { "structure": 0-100, "relevance": 0-100, "concreteness": 0-100, "clarity": 0-100, "star": 0-100 },
      "strengths": ["string"],
      "weaknesses": ["string"],
      "improvedAnswer": "string",
      "nextFocus": "string"
    }
  ],
  "summary": {
    "topStrengths": ["string"],
    "topWeaknesses": ["string"],
    "threeTrainingGoals": ["string"]
  }
}

Gesamtbewertung:
- overallScore: gewichteter Durchschnitt aller 5 Kriterien über alle Fragen
- qaEvaluations: detaillierte Bewertung pro Frage (falls noch nicht passiert, jetzt nachholen)
- summary: 3 Top-Stärken, 3 Top-Schwächen, 3 konkrete Trainingsziele (SMART formuliert)

Trainingsziele sollen spezifisch, messbar und umsetzbar sein.
Beispiel: "STAR-Methode bei Verhaltensfragen üben: 3x pro Woche 1 Beispiel strukturiert aufschreiben"
Nicht: "Besser werden"

Antworte auf Deutsch (Schweizer Geschäftssprache).`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobText, jobAnalysis, qaPairs } = req.body;
  
  if (!jobText || !qaPairs || qaPairs.length === 0) {
    return res.status(400).json({ error: 'Fehlende Parameter: jobText, qaPairs' });
  }

  try {
    const qaHistory = qaPairs.map((qa: any, i: number) => 
      `Frage ${i+1} (${qa.questionType}): ${qa.question}\nAntwort: ${qa.answer}`
    ).join('\n\n');

    const userPrompt = `Stellenkontext:
${jobText}

Stellenanalyse:
${JSON.stringify(jobAnalysis, null, 2)}

Alle Fragen & Antworten:
${qaHistory}

Erstelle den vollständigen Abschlussbericht.`;

    const result = await callGroqLLM(SYSTEM_PROMPT, userPrompt);
    res.status(200).json(result);
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Bericht-Erstellung fehlgeschlagen' });
  }
}
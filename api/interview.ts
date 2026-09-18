import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGroqLLM } from '../lib/groq.js';

const SYSTEM_PROMPT = `Du bist ein erfahrener Recruiter und Interview-Coach für den Schweizer Markt.
Bewerte die Antwort des Kandidaten auf die Interviewfrage strukturiert und generiere die nächste logische Frage.

Antworte NUR als gültiges JSON:
{
  "evaluation": {
    "scores": {
      "structure": 0-100,
      "relevance": 0-100,
      "concreteness": 0-100,
      "clarity": 0-100,
      "star": 0-100
    },
    "strengths": ["string"],
    "weaknesses": ["string"],
    "improvedAnswer": "string",
    "nextFocus": "string"
  },
  "nextQuestion": {
    "id": "string",
    "text": "string",
    "type": "motivation|technical|behavioral|strength|weakness|situational|closing"
  }
}

Bewertungskriterien (0-100):
- structure: Klare Struktur (STAR, logischer Aufbau, roter Faden)
- relevance: Beantwortet die Frage direkt, nicht am Thema vorbei
- concreteness: Konkrete Beispiele, Zahlen, Details, keine Floskeln
- clarity: Verständlich, prägnant, wenig Füllwörter, gute Ausdrucksweise
- star: Nutzt Situation-Task-Action-Result Struktur erkennbar

Die nächste Frage soll logisch auf der Antwort aufbauen:
- Bei Schwäche in einem Bereich: gezielte Nachfrage / Übung genau dort
- Bei Stärke: nächsten Kompetenzbereich prüfen oder vertiefen
- Typen-Rotation: motivation → technical → behavioral → strength → weakness → situational → closing

Antworte auf Deutsch (Schweizer Geschäftssprache).`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobText, jobAnalysis, qaPairs, currentQuestion } = req.body;
  
  if (!jobText || !qaPairs || !currentQuestion) {
    return res.status(400).json({ error: 'Fehlende Parameter: jobText, qaPairs, currentQuestion' });
  }

  try {
    const qaHistory = qaPairs.map((qa: any, i: number) => 
      `Frage ${i+1} (${qa.questionType}): ${qa.question}\nAntwort: ${qa.answer}`
    ).join('\n\n');

    const userPrompt = `Stellenkontext:
${jobText}

Stellenanalyse:
${JSON.stringify(jobAnalysis, null, 2)}

Bisherige Fragen & Antworten:
${qaHistory}

Aktuelle Frage (${currentQuestion.type}): ${currentQuestion.text}

Bewerte die letzte Antwort und generiere die nächste logische Frage.`;

    const result = await callGroqLLM(SYSTEM_PROMPT, userPrompt);
    res.status(200).json(result);
  } catch (error) {
    console.error('Interview error:', error);
    res.status(500).json({ error: 'Bewertung fehlgeschlagen' });
  }
}
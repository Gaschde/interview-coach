# Interview Coach

**Gratis Interview-Training mit KI** – Stelleninserat als PDF hochladen, massgeschneidertes Vorstellungsgespräch üben, strukturiertes Feedback erhalten. Ohne Login, ohne Account, direkt im Browser.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://interview-coach-flax-five.vercel.app)
[![Groq](https://img.shields.io/badge/Powered%20by-Groq-FF6B35?logo=groq)](https://groq.com)

## Features

- **PDF → Interview**: Laden Sie ein Stelleninserat (PDF) hoch, die KI extrahiert Anforderungen und generiert passende Fragen
- **Sprach-Eingabe**: Antworten per Mikrofon aufnehmen (MediaRecorder), Transkription via **Groq Whisper Large V3**
- **Strukturierte Bewertung**: Jede Antwort wird nach 5 Kriterien bewertet (Struktur, Relevanz, Konkretisierung, Klarheit, STAR-Methode)
- **Adaptive Folgefragen**: Die nächste Frage baut logisch auf der vorherigen Antwort auf (Schwächen gezielt üben, Stärken vertiefen)
- **Abschluss-Report**: Gesamtpunktzahl, detaillierte Auswertung pro Frage, Stärken/Schwächen, 3 konkrete Trainingsziele (SMART)
- **100% kostenlos**: Läuft auf Vercel Free Tier + Groq Free Tier (1000 Requests/Tag), keine API-Kosten
- **Kein Login, keine Datenbank**: Alles client-seitig im Browser, keine persistenten Nutzerdaten
- **Schweizer Kontext**: UI & Feedback in Schweizer Geschäftssprache

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Vanilla CSS (Custom Properties, Mobile-First) |
| PDF-Extraktion | `pdfjs-dist` (client-side) |
| Audio-Aufnahme | `MediaRecorder` API (Browser-nativ) |
| LLM (Fragen, Bewertung, Report) | Groq `llama-3.1-70b-versatile` |
| Speech-to-Text | Groq `whisper-large-v3` |
| Hosting | Vercel (Static + Serverless Functions) |
| CI/CD | GitHub → Vercel Auto-Deploy |

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel Project                              │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React/Vite)          │  Serverless Functions (Node) │
│  ─────────────────────          │  ─────────────────────────── │
│  • PDF Upload → pdf.js          │  /api/analyze-job.ts         │
│  • Audio Recording              │  /api/transcribe.ts          │
│  • Interview Flow (State)       │  /api/interview.ts           │
│  • Results View                 │  /api/report.ts              │
│                                 │                              │
│  State: localStorage only       │  Secrets: GROQ_API_KEY       │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow

1. **PDF hochladen** → Text-Extraktion im Browser (pdf.js)
2. **Analyse** → Groq LLM erstellt Stellenanalyse + erste Frage
3. **Frage für Frage**:
   - Frage anzeigen
   - [🎤 Aufnehmen] → MediaRecorder → `audio/webm`
   - `/api/transcribe` → Groq Whisper Large V3 → Text
   - Transkription prüfen/korrigieren → [Absenden]
   - `/api/interview` → Bewertung (5 Kriterien) + nächste adaptive Frage
4. **Nach 6–8 Fragen** → `/api/report` → Abschlussbericht
5. **Report anzeigen**: Scores, Stärken, Schwächen, verbesserte Antworten, 3 Trainingsziele

## Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/Gaschde/interview-coach.git
cd interview-coach

# Dependencies installieren
npm install

# Environment Variable setzen (Groq API Key)
echo "GROQ_API_KEY=your_key_here" > .env.local

# Dev Server starten
npm run dev
# → http://localhost:5173
```

## Build & Deploy

```bash
# Production Build lokal testen
npm run build

# Deploy zu Vercel (automatisch via GitHub Push)
git push origin main
```

**Vercel Environment Variables** (Settings → Environment Variables):
- `GROQ_API_KEY` – Ihr Groq API Key (erhalten auf https://console.groq.com)

## Projektstruktur

```
interview-coach/
├── api/                    # Vercel Serverless Functions
│   ├── analyze-job.ts      # PDF-Text → Stellenanalyse + 1. Frage
│   ├── transcribe.ts       # Audio → Whisper Large V3 → Text
│   ├── interview.ts        # Antwort bewerten + nächste Frage
│   └── report.ts           # Abschlussbericht generieren
├── lib/
│   └── groq.ts             # Groq Client (LLM + Whisper)
├── src/
│   ├── components/
│   │   ├── PDFUpload.tsx   # Drag & Drop PDF, Text-Extraktion
│   │   ├── QuestionCard.tsx# Frage + Antwort + AudioRecorder
│   │   └── ReportView.tsx  # Abschlussbericht
│   ├── hooks/
│   │   ├── useAudioRecorder.ts
│   │   └── useInterview.ts # Interview State Machine
│   ├── types/index.ts      # TypeScript Interfaces
│   ├── App.tsx             # Main App (Phasen-Rendering)
│   └── App.css             # Styles
├── vercel.json             # Vercel Config (Functions, CORS)
├── package.json
└── tsconfig.json
```

## API Endpoints

| Endpoint | Methode | Body | Response |
|----------|---------|------|----------|
| `/api/analyze-job` | POST | `{ jobText: string }` | `{ role, company, seniority, keyRequirements[], niceToHave[], cultureKeywords[], firstQuestion }` |
| `/api/transcribe` | POST (multipart) | `audio: Blob` | `{ text: string, language: 'de' }` |
| `/api/interview` | POST | `{ jobText, jobAnalysis, qaPairs[], currentQuestion }` | `{ evaluation: { scores, strengths[], weaknesses[], improvedAnswer, nextFocus }, nextQuestion: { id, text, type } }` |
| `/api/report` | POST | `{ jobText, jobAnalysis, qaPairs[] }` | `{ overallScore, qaEvaluations[], summary: { topStrengths[], topWeaknesses[], threeTrainingGoals[] } }` |

## Bewertungsschema (0–100 pro Kriterium)

| Kriterium | Beschreibung |
|-----------|-------------|
| **Struktur** | Klare Struktur (STAR), logischer Aufbau, roter Faden |
| **Relevanz** | Beantwortet die Frage direkt, nicht am Thema vorbei |
| **Konkretisierung** | Konkrete Beispiele, Zahlen, Details, keine Floskeln |
| **Klarheit** | Verständlich, prägnant, wenig Füllwörter |
| **STAR-Methode** | Situation – Task – Action – Result erkennbar |

## Limits & Kosten

| Ressource | Free Tier Limit | Geschätzter Verbrauch (1 Interview ≈ 8 Fragen) |
|-----------|-----------------|-----------------------------------------------|
| Groq LLM Requests | 1.000/Tag | ~10 Requests |
| Groq Whisper Requests | 1.000/Tag | ~8 Requests |
| Tokens/Minute (LLM) | 6.000 | ~5.000 |
| Vercel Function Execution | 100 GB-h/Monat | Vernachlässigbar |
| **Kosten pro Interview** | **$0.00** | **$0.00** |

## Roadmap / Ideen

- [ ] Web Speech API Fallback für Chrome/Edge (0 Download)
- [ ] Transformers.js Whisper Tiny als Offline-Fallback
- [ ] CV-Upload + JD-Abgleich (Match-Score)
- [ ] Interview-Modi: Training / Simulation / Stress
- [ ] Export als PDF
- [ ] Dunkelmodus

## Lizenz

MIT License – frei nutzbar, anpassbar, verteilbar.

---

**Entwickelt für schnelles, kostenloses Interview-Training in der Schweiz.** 🇨🇭
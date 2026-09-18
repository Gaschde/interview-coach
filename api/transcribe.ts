import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGroqWhisper } from '../lib/groq.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type muss multipart/form-data sein' });
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'Kein boundary im Content-Type' });
    }
    
    const parts = buffer.toString('binary').split(`--${boundary}`);
    let audioBuffer: Buffer | null = null;
    
    for (const part of parts) {
      if (part.includes('audio/webm') || part.includes('audio/')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const data = part.slice(headerEnd + 4, -2);
          audioBuffer = Buffer.from(data, 'binary');
          break;
        }
      }
    }
    
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Keine Audiodaten gefunden' });
    }

    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    const text = await callGroqWhisper(audioBlob);
    
    res.status(200).json({ text, language: 'de' });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({ error: 'Transkription fehlgeschlagen' });
  }
}
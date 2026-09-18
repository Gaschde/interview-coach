import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

export async function callGroqLLM(
  systemPrompt: string,
  userPrompt: string,
  schema?: object
): Promise<any> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages,
    temperature: 0.3,
    response_format: schema ? { type: 'json_object' } : undefined,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');
  
  return schema ? JSON.parse(content) : content;
}

export async function callGroqWhisper(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'de');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const result = await response.json();
  return result.text || '';
}
import { useState, useRef } from 'react';

interface QuestionCardProps {
  question: { id: string; text: string; type: string };
  progress: number;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string, audioBlob?: Blob) => void;
  disabled?: boolean;
}

export function QuestionCard({ question, progress, questionNumber, totalQuestions, onAnswer, disabled }: QuestionCardProps) {
  const [answer, setAnswer] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
    }
  };

  return (
    <div className="question-card">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <span className="progress-text">Frage {questionNumber} von {totalQuestions}</span>
      </div>

      <div className="question-header">
        <span className="question-type">{question.type}</span>
        <h2>{question.text}</h2>
      </div>

      <div className="answer-section">
        <label htmlFor="answer-input">Deine Antwort</label>
        <textarea
          id="answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Tippe deine Antwort hier oder nutze die Spracherkennung unten…"
          rows={6}
          disabled={disabled}
        />
      </div>

      <AudioRecorderSection
        onTranscriptReady={(text) => {
          setTranscript(text);
          setShowTranscript(true);
        }}
        disabled={disabled}
      />

      {showTranscript && (
        <div className="transcript-review">
          <h4>Transkription (prüfen & übernehmen)</h4>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
          />
          <div className="transcript-actions">
            <button onClick={() => { setAnswer(transcript); setShowTranscript(false); }}>Übernehmen</button>
            <button className="secondary" onClick={() => setShowTranscript(false)}>Verwerfen</button>
          </div>
        </div>
      )}

      <button className="primary submit-btn" onClick={handleSubmit} disabled={disabled || !answer.trim()}>
        {disabled ? 'Wird verarbeitet…' : 'Antwort absenden'}
      </button>
    </div>
  );
}

function AudioRecorderSection({ onTranscriptReady, disabled }: { onTranscriptReady: (text: string) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.text) onTranscriptReady(data.text);
      };
      setMediaRecorder(mr);
      mr.start();
      setRecording(true);
    } catch {
      alert('Mikrofon-Zugriff verweigert');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  return (
    <div className="audio-recorder">
      {audioUrl && (
        <div className="audio-preview">
          <audio controls src={audioUrl} />
          <button onClick={() => { URL.revokeObjectURL(audioUrl!); setAudioUrl(null); }}>Entfernen</button>
        </div>
      )}
      <button
        className={recording ? 'recording' : ''}
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
      >
        {recording ? '⏹ Stoppen' : '🎤 Aufnehmen'}
      </button>
    </div>
  );
}
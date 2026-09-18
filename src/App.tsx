import { useState, useEffect } from 'react';
import { PDFUpload } from './components/PDFUpload';
import { QuestionCard } from './components/QuestionCard';
import { ReportView } from './components/ReportView';
import { useInterview } from './hooks/useInterview';
import './App.css';

function App() {
  const {
    state,
    setJobText,
    startAnalysis,
    setJobAnalysis,
    setAnalysisError,
    submitAnswer,
    setEvaluation,
    setReport,
    reset,
    currentQuestion,
    progress,
  } = useInterview();

  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!state.jobText.trim()) return;
    startAnalysis();
    setError(null);
    try {
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobText: state.jobText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analyse fehlgeschlagen');
      setJobAnalysis(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setAnalysisError(msg);
      setError(msg);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    submitAnswer(answer);
    if (!currentQuestion) return;
    setError(null);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobText: state.jobText,
          jobAnalysis: state.jobAnalysis,
          qaPairs: state.qaPairs,
          currentQuestion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bewertung fehlgeschlagen');
      setEvaluation(data.evaluation, data.nextQuestion);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(msg);
    }
  };

  const handleGenerateReport = async () => {
    setError(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobText: state.jobText,
          jobAnalysis: state.jobAnalysis,
          qaPairs: state.qaPairs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bericht fehlgeschlagen');
      setReport(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(msg);
    }
  };

  // Auto-trigger report when last question answered
  useEffect(() => {
    if (state.phase === 'evaluating' && state.qaPairs.length >= 8 && !state.report) {
      handleGenerateReport();
    }
  }, [state.phase, state.qaPairs.length, state.report]);

  const isAnalyzing = state.phase === 'analyzing';

  if (state.phase === 'upload' || state.phase === 'analyzing') {
    return (
      <main className="container">
        <header>
          <h1>Interview Coach</h1>
          <p className="subtitle">Stelleninserat hochladen → Interview üben → Feedback erhalten</p>
        </header>
        <PDFUpload 
          onTextExtracted={setJobText} 
          disabled={isAnalyzing} 
        />
        {isAnalyzing && <div className="loading">Analysiere Stelleninserat…</div>}
        {(error || state.error) && <div className="error">{error || state.error}</div>}
        {state.jobText && !isAnalyzing && (
          <button 
            className="primary" 
            onClick={handleAnalyze} 
            disabled={!state.jobText.trim() || isAnalyzing}
          >
            {isAnalyzing ? 'Analysiere…' : 'Interview generieren'}
          </button>
        )}
      </main>
    );
  }

  if (state.phase === 'interview' || state.phase === 'evaluating') {
    return (
      <main className="container interview-mode">
        <header>
          <h1>Interview Coach</h1>
          <div className="progress-ring">
            <svg width="60" height="60">
              <circle
                cx="30" cy="30" r="26"
                stroke="#e0e0e0" strokeWidth="6" fill="none"
              />
              <circle
                cx="30" cy="30" r="26"
                stroke="#2563eb" strokeWidth="6" fill="none"
                strokeDasharray={163.36}
                strokeDashoffset={163.36 - (progress / 100) * 163.36}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
              <text x="30" y="34" textAnchor="middle" fontSize="14" fontWeight="600">
                {Math.round(progress)}%
              </text>
            </svg>
          </div>
        </header>
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            progress={progress}
            questionNumber={state.currentQuestionIndex + 1}
            totalQuestions={8}
            onAnswer={handleSubmitAnswer}
            disabled={state.phase === 'evaluating'}
          />
        )}
        {state.phase === 'evaluating' && state.qaPairs.length < 8 && (
          <div className="loading">Antwort wird bewertet, nächste Frage wird generiert…</div>
        )}
        {(error || state.error) && <div className="error">{error || state.error}</div>}
      </main>
    );
  }

  if (state.phase === 'report' && state.report) {
    return (
      <main className="container">
        <ReportView report={state.report} onRestart={reset} />
      </main>
    );
  }

  return null;
}

export default App;
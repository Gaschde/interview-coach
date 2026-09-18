import type { FinalReport } from '../types';

interface ReportViewProps {
  report: FinalReport;
  onRestart: () => void;
}

const criteriaLabels: Record<string, string> = {
  structure: 'Struktur',
  relevance: 'Relevanz',
  concreteness: 'Konkretisierung',
  clarity: 'Klarheit',
  star: 'STAR-Methode',
};

export function ReportView({ report, onRestart }: ReportViewProps) {
  return (
    <div className="report-view">
      <div className="report-header">
        <h1>Interview-Auswertung</h1>
        <div className="overall-score">
          <span className="score">{report.overallScore}</span>
          <span className="label">Gesamtpunktzahl</span>
        </div>
      </div>

      <section className="summary">
        <h2>Zusammenfassung</h2>
        <div className="summary-grid">
          <div className="summary-box strengths">
            <h3>✅ Stärken</h3>
            <ul>{report.summary.topStrengths.map(s => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="summary-box weaknesses">
            <h3>⚠️ Schwächen</h3>
            <ul>{report.summary.topWeaknesses.map(s => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="summary-box goals">
            <h3>🎯 Trainingsziele</h3>
            <ol>{report.summary.threeTrainingGoals.map(g => <li key={g}>{g}</li>)}</ol>
          </div>
        </div>
      </section>

      <section className="detail-evaluations">
        <h2>Detail-Bewertung pro Frage</h2>
        {report.qaEvaluations.map((evaluation, i) => {
          const avg = Math.round((
            evaluation.scores.structure +
            evaluation.scores.relevance +
            evaluation.scores.concreteness +
            evaluation.scores.clarity +
            evaluation.scores.star
          ) / 5);
          return (
            <details key={evaluation.questionId} className="eval-detail" open={i === 0}>
              <summary>Frage {i + 1} — Ø {avg}%</summary>
              
              <div className="scores-grid">
                {Object.entries(evaluation.scores).map(([key, value]) => (
                  <div key={key} className="score-item">
                    <span className="score-label">{criteriaLabels[key]}</span>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${value}%` }} />
                    </div>
                    <span className="score-value">{value}%</span>
                  </div>
                ))}
              </div>

              <div className="eval-feedback">
                <div className="feedback-box strengths">
                  <h4>Stärken</h4>
                  <ul>{evaluation.strengths.map(s => <li key={s}>{s}</li>)}</ul>
                </div>
                <div className="feedback-box weaknesses">
                  <h4>Verbesserungspotenzial</h4>
                  <ul>{evaluation.weaknesses.map(w => <li key={w}>{w}</li>)}</ul>
                </div>
              </div>

              <div className="improved-answer">
                <h4>Bessere Antwort</h4>
                <p>{evaluation.improvedAnswer}</p>
              </div>

              <div className="next-focus">
                <h4>Nächster Fokus</h4>
                <p>{evaluation.nextFocus}</p>
              </div>
            </details>
          );
        })}
      </section>

      <button className="primary restart-btn" onClick={onRestart}>
        Neues Interview starten
      </button>
    </div>
  );
}
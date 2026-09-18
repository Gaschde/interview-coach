import { useState, useCallback } from 'react';
import type { InterviewState, JobAnalysis, InterviewQuestion, QAPair, Evaluation, FinalReport } from '../types';

const MAX_QUESTIONS = 8;

export function useInterview() {
  const [state, setState] = useState<InterviewState>({
    phase: 'upload',
    jobText: '',
    questions: [],
    currentQuestionIndex: 0,
    qaPairs: [],
    evaluations: [],
  });

  const setJobText = useCallback((text: string) => {
    setState(prev => ({ ...prev, jobText: text }));
  }, []);

  const startAnalysis = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'analyzing' }));
  }, []);

  const setJobAnalysis = useCallback((analysis: JobAnalysis) => {
    setState(prev => ({
      ...prev,
      jobAnalysis: analysis,
      questions: [{ 
        id: 'q1', 
        text: analysis.firstQuestion, 
        type: 'motivation' 
      }],
      phase: 'interview',
      currentQuestionIndex: 0,
      qaPairs: [],
      evaluations: [],
    }));
  }, []);

  const setAnalysisError = useCallback((error: string) => {
    setState(prev => ({ ...prev, phase: 'upload', error }));
  }, []);

  const submitAnswer = useCallback((answer: string, audioBlob?: Blob) => {
    setState(prev => {
      const currentQ = prev.questions[prev.currentQuestionIndex];
      const newQAPair: QAPair = {
        questionId: currentQ.id,
        question: currentQ.text,
        questionType: currentQ.type,
        answer,
        audioBlob,
      };
      return {
        ...prev,
        qaPairs: [...prev.qaPairs, newQAPair],
        phase: 'evaluating',
      };
    });
  }, []);

  const setEvaluation = useCallback((evaluation: Evaluation, nextQuestion: InterviewQuestion) => {
    setState(prev => {
      const isLastQuestion = prev.currentQuestionIndex >= MAX_QUESTIONS - 1 || prev.qaPairs.length >= MAX_QUESTIONS;
      const newQuestions = isLastQuestion ? prev.questions : [...prev.questions, nextQuestion];
      
      return {
        ...prev,
        evaluations: [...prev.evaluations, evaluation],
        questions: newQuestions,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        phase: isLastQuestion ? 'evaluating' : 'interview', // will trigger report generation
      };
    });
  }, []);

  const generateReport = useCallback(async () => {
    setState(prev => ({ ...prev, phase: 'evaluating' }));
    // Report generation happens via API call in component
  }, []);

  const setReport = useCallback((report: FinalReport) => {
    setState(prev => ({ ...prev, phase: 'report', report }));
  }, []);

  const reset = useCallback(() => {
    setState({
      phase: 'upload',
      jobText: '',
      questions: [],
      currentQuestionIndex: 0,
      qaPairs: [],
      evaluations: [],
    });
  }, []);

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = state.questions.length > 0 ? ((state.currentQuestionIndex) / state.questions.length) * 100 : 0;

  return {
    state,
    setJobText,
    startAnalysis,
    setJobAnalysis,
    setAnalysisError,
    submitAnswer,
    setEvaluation,
    generateReport,
    setReport,
    reset,
    currentQuestion,
    progress,
    isComplete: state.phase === 'report',
  };
}
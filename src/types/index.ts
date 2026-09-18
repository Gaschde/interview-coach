export interface JobAnalysis {
  role: string;
  company: string;
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  keyRequirements: string[];
  niceToHave: string[];
  cultureKeywords: string[];
  firstQuestion: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'motivation' | 'technical' | 'behavioral' | 'strength' | 'weakness' | 'situational' | 'closing';
  followUpTo?: string;
}

export interface QAPair {
  questionId: string;
  question: string;
  questionType: string;
  answer: string;
  audioBlob?: Blob;
}

export interface Evaluation {
  questionId: string;
  scores: {
    structure: number;
    relevance: number;
    concreteness: number;
    clarity: number;
    star: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
  nextFocus: string;
}

export interface InterviewState {
  phase: 'upload' | 'analyzing' | 'interview' | 'evaluating' | 'report';
  jobText: string;
  jobAnalysis?: JobAnalysis;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  qaPairs: QAPair[];
  evaluations: Evaluation[];
  report?: FinalReport;
  error?: string;
}

export interface FinalReport {
  overallScore: number;
  qaEvaluations: Evaluation[];
  summary: {
    topStrengths: string[];
    topWeaknesses: string[];
    threeTrainingGoals: string[];
  };
}

export interface TranscribeResult {
  text: string;
  language: string;
}
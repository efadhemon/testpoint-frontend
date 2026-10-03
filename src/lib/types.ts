export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";
export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
};

export type AuthResponse = { token: string; user: User };

export type Option = { id?: number; text: string; correct: boolean };

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type Question = {
  id: number;
  type: QuestionType;
  text: string;
  marks: number;
  explanation: string | null;
  modelAnswer: string | null;
  correctBoolean: boolean | null;
  createdAt: string;
  options: { id: number; text: string; correct: boolean }[];
};

export type QuestionDraft = {
  type: QuestionType;
  text: string;
  marks: number;
  explanation: string | null;
  modelAnswer: string | null;
  correctBoolean: boolean | null;
  options: Option[];
};

export type ClassStudent = { id: number; name: string; email: string };

export type ClassGroup = {
  id: number;
  name: string;
  joinCode: string;
  createdAt: string;
  studentCount: number;
  students: ClassStudent[];
};

export type QuizQuestion = {
  questionId: number;
  text: string;
  type: QuestionType;
  marks: number;
  position: number;
};

export type Assignment = {
  id: number;
  targetType: "CLASS" | "STUDENT";
  classId: number | null;
  className: string | null;
  studentId: number | null;
  studentName: string | null;
};

export type Quiz = {
  id: number;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  shuffleQuestions: boolean;
  maxAttempts: number;
  status: QuizStatus;
  passingMarks: number;
  totalMarks: number;
  questions: QuizQuestion[];
  assignments: Assignment[];
};

export type StudentQuiz = {
  id: number;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  maxAttempts: number;
  attemptsUsed: number;
  inProgressAttemptId: number | null;
  windowState: "UPCOMING" | "OPEN" | "CLOSED";
};

export type TakeQuestion = {
  id: number;
  position: number;
  type: QuestionType;
  text: string;
  marks: number;
  options: { id: number; text: string }[];
  answer: { optionId: number | null; booleanAnswer: boolean | null; textAnswer: string | null };
};

export type TakeView = {
  id: number;
  quizId: number;
  quizTitle: string;
  expiresAt: string;
  serverNow: string;
  status: AttemptStatus;
  questions: TakeQuestion[];
};

export type ResultQuestion = {
  questionId: number;
  text: string;
  type: QuestionType;
  marks: number;
  awardedMarks: number | null;
  correct: boolean | null;
  feedback: string | null;
  gradeSource: "AUTO" | "AI" | "MANUAL" | null;
  yourAnswer: string;
  correctAnswer: string | null;
};

export type ResultView = {
  id: number;
  quizId: number;
  quizTitle: string;
  status: AttemptStatus;
  score: number | null;
  maxScore: number | null;
  passingMarks: number;
  passed: boolean | null;
  pendingReview: boolean;
  aiSummary: string | null;
  submittedAt: string | null;
  questions: ResultQuestion[];
};

export type PendingAnswer = {
  answerId: number;
  attemptId: number;
  quizId: number;
  quizTitle: string;
  studentName: string;
  questionText: string;
  modelAnswer: string | null;
  textAnswer: string | null;
  marks: number;
};

export type QuizAnalytics = {
  quizId: number;
  title: string;
  attemptCount: number;
  averagePercent: number | null;
  passRate: number | null;
  questions: { questionId: number; text: string; accuracyPercent: number; responses: number }[];
};

export type StudentAnalytics = {
  attemptCount: number;
  averagePercent: number | null;
  history: {
    attemptId: number;
    quizId: number;
    quizTitle: string;
    score: number | null;
    maxScore: number | null;
    status: AttemptStatus;
    submittedAt: string | null;
  }[];
};

export type AdminStats = {
  users: number;
  instructors: number;
  students: number;
  quizzes: number;
  attempts: number;
};

export type InstructorSummary = { classCount: number; quizCount: number; pendingGrades: number };

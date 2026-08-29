import { getGeminiModel } from "@/lib/ai/gemini";
import { INTERVIEW_QUESTIONS_PROMPT, INTERVIEW_EVALUATION_PROMPT } from "@/lib/ai/prompts";
import { safeJsonParse, generateId } from "@/lib/utils";
import type {
  InterviewQuestion,
  AnswerFeedback,
  InterviewType,
  Difficulty,
} from "@/lib/types";

export const MOCK_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q1",
    question:
      "Explain the difference between supervised and unsupervised learning. Give a real-world example of each.",
    category: "technical",
    hint: "Cover the key distinction (labeled vs unlabeled data) and give concrete examples.",
  },
  {
    id: "q2",
    question:
      "You have a dataset with 80% negative class and 20% positive class. How would you handle this class imbalance?",
    category: "problem-solving",
    hint: "Discuss techniques like SMOTE, class weights, resampling, and evaluation metrics.",
  },
  {
    id: "q3",
    question:
      "Walk me through how you would approach a new machine learning problem from data to deployment.",
    category: "technical",
    hint: "Cover the full ML lifecycle: data exploration, preprocessing, model selection, evaluation, and deployment.",
  },
  {
    id: "q4",
    question:
      "Tell me about a time you faced a significant technical challenge. How did you overcome it?",
    category: "behavioral",
    hint: "Use the STAR format: Situation, Task, Action, Result.",
  },
  {
    id: "q5",
    question:
      "How would you explain a machine learning model's predictions to a non-technical stakeholder?",
    category: "situational",
    hint: "Think about explainability, visualizations, and simplifying technical concepts.",
  },
];

export async function generateInterviewQuestions(
  role: string,
  type: InterviewType,
  difficulty: Difficulty,
  profileSummary: string
): Promise<InterviewQuestion[]> {
  const model = getGeminiModel();
  const prompt = INTERVIEW_QUESTIONS_PROMPT(role, type, difficulty, profileSummary);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = safeJsonParse<InterviewQuestion[]>(text);
  if (!parsed || !Array.isArray(parsed)) {
    throw new Error("Failed to parse interview questions from AI");
  }

  // Ensure all questions have unique IDs
  return parsed.map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}_${generateId()}`,
  }));
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  category: string
): Promise<AnswerFeedback> {
  const model = getGeminiModel();
  const prompt = INTERVIEW_EVALUATION_PROMPT(question, answer, role, category);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = safeJsonParse<AnswerFeedback>(text);
  if (!parsed) {
    throw new Error("Failed to parse answer evaluation from AI");
  }

  return parsed;
}

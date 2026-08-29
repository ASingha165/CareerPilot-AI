import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { evaluateAnswer } from "@/lib/ai/interview-service";
import type { AnswerFeedback } from "@/lib/types";

const MOCK_FEEDBACK: AnswerFeedback = {
  score: 68,
  whatWasGood: [
    "You correctly identified the key distinction between supervised and unsupervised learning",
    "Good use of a real-world example",
  ],
  improvements: [
    "Answer could be more structured — use the concept → example → application pattern",
    "Mention when you would choose one over the other",
  ],
  missingPoints: [
    "Semi-supervised learning as a middle ground",
    "Specific algorithms for each type (e.g., regression for supervised, k-means for unsupervised)",
  ],
  betterStructure:
    "Start with a clear one-sentence definition of each. Then give an example. Then explain a scenario where you'd choose each approach. Finish by mentioning one algorithm per type.",
  followUpPractice: [
    "Study clustering algorithms: k-means, DBSCAN, hierarchical",
    "Review the ML algorithm cheat sheet to know which type each algorithm belongs to",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, role, category } = body as {
      question: string;
      answer: string;
      role: string;
      category: string;
    };

    if (!question || !role || !category) {
      return NextResponse.json(
        { error: "question, role, and category are required" },
        { status: 400 }
      );
    }

    if (!answer || answer.trim().length < 5) {
      return NextResponse.json({
        success: true,
        feedback: {
          score: 0,
          whatWasGood: [],
          improvements: ["Please provide a detailed answer to receive meaningful feedback"],
          missingPoints: ["A complete answer is needed for evaluation"],
          betterStructure: "Provide a thorough answer covering the key concepts for this question.",
          followUpPractice: ["Study this topic before attempting the question again"],
        } as AnswerFeedback,
        isMock: false,
      });
    }

    let feedback;
    if (isGeminiConfigured()) {
      feedback = await evaluateAnswer(question, answer, role, category);
    } else {
      feedback = MOCK_FEEDBACK;
    }

    return NextResponse.json({
      success: true,
      feedback,
      isMock: !isGeminiConfigured(),
    });
  } catch (error) {
    console.error("[API /interview/evaluate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to evaluate answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

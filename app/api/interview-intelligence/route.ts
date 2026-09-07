import { NextResponse } from "next/server";
import { getGeminiModel, isGeminiConfigured } from "@/lib/ai/gemini";
import { safeJsonParse } from "@/lib/utils";

interface IntelligenceRequest {
  role: string;
  company?: string;
  profileSummary?: string;
  readiness?: Record<string, number>;
  skillGaps?: string[];
}

interface IntelligenceResponse {
  overallReadiness: number;
  headline: string;
  summary: string;
  dimensions: { name: string; score: number; status: string; reason: string }[];
  priorities: { title: string; priority: "high" | "medium" | "low"; reason: string; action: string }[];
  interviewPlan: { category: string; focus: string; sessions: number; difficulty: string }[];
  nextActions: string[];
}

const fallback = (role: string, company: string, skillGaps: string[] = []): IntelligenceResponse => ({
  overallReadiness: 64,
  headline: `${role} interview readiness is building`,
  summary: company
    ? `Your current profile has a workable foundation for ${role} interviews at ${company}. Focus first on the gaps that are most likely to affect technical performance.`
    : `Your current profile has a workable foundation for ${role} interviews. Focus first on the gaps that are most likely to affect technical performance.`,
  dimensions: [
    { name: "Technical fundamentals", score: 72, status: "Solid", reason: "Core concepts are present, but depth should be validated through practice." },
    { name: "Problem solving", score: 61, status: "Developing", reason: "Timed, unfamiliar problems need more deliberate practice." },
    { name: "System design", score: 48, status: "Priority", reason: "Architecture trade-offs and scalability are common differentiators for engineering roles." },
    { name: "Communication", score: 70, status: "Solid", reason: "Practice concise, structured explanations under interview pressure." },
    { name: "Project evidence", score: 76, status: "Strong", reason: "Projects can demonstrate practical ability when explained with measurable outcomes." },
    { name: "AI fluency", score: 78, status: "Strong", reason: "AI-assisted development and verification are increasingly useful interview competencies." },
  ],
  priorities: [
    { title: skillGaps[0] || "System design", priority: "high", reason: "A visible competency gap can reduce performance even when coding fundamentals are strong.", action: "Study one architecture pattern, then explain a design aloud in 10 minutes." },
    { title: "Timed problem solving", priority: "high", reason: "Interview performance depends on reasoning clearly while time is constrained.", action: "Complete 3 medium problems per week and review the approach after each attempt." },
    { title: "Behavioral stories", priority: "medium", reason: "Strong technical candidates still need evidence of ownership and collaboration.", action: "Prepare 5 STAR stories covering failure, conflict, leadership, learning, and impact." },
  ],
  interviewPlan: [
    { category: "DSA / Problem Solving", focus: "Arrays, hashing, graphs, complexity and reasoning", sessions: 3, difficulty: "Medium" },
    { category: "Role Fundamentals", focus: `${role} core concepts and practical scenarios`, sessions: 2, difficulty: "Medium" },
    { category: "System Design", focus: "APIs, data, caching, queues, scalability and trade-offs", sessions: 2, difficulty: "Medium" },
    { category: "Behavioral", focus: "STAR stories, ownership, teamwork and learning", sessions: 1, difficulty: "Medium" },
  ],
  nextActions: [
    "Take a medium technical mock interview focused on your largest skill gap.",
    "Turn one strong project into a 2-minute architecture + impact explanation.",
    "Recalculate readiness after your next two interview sessions.",
  ],
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IntelligenceRequest;
    const role = body.role?.trim();
    const company = body.company?.trim() || "";
    if (!role) return NextResponse.json({ error: "Target role is required" }, { status: 400 });

    if (!isGeminiConfigured()) {
      return NextResponse.json({ ...fallback(role, company, body.skillGaps), isMock: true });
    }

    const prompt = `
You are CareerPilot's interview-readiness strategist. Build an honest, actionable interview preparation profile for a student targeting ${role}${company ? ` at ${company}` : ""}.

Candidate context:
${body.profileSummary || "No detailed profile supplied."}

Existing readiness signals:
${JSON.stringify(body.readiness || {})}

Known skill gaps:
${(body.skillGaps || []).join(", ") || "None supplied"}

Important product rule: do NOT claim access to proprietary or private company interview questions. Use general knowledge about the role/company only. This is interview intelligence, not a copied question bank.

Return ONLY JSON in this exact shape:
{
  "overallReadiness": 0,
  "headline": "short verdict",
  "summary": "2 concise sentences",
  "dimensions": [
    {"name":"Technical fundamentals","score":0,"status":"Strong|Solid|Developing|Priority","reason":"specific reason"}
  ],
  "priorities": [
    {"title":"skill/topic","priority":"high|medium|low","reason":"why this matters","action":"specific next action"}
  ],
  "interviewPlan": [
    {"category":"category","focus":"specific topics","sessions":1,"difficulty":"Easy|Medium|Hard"}
  ],
  "nextActions": ["specific action", "specific action", "specific action"]
}

Rules:
- overallReadiness and all scores are 0-100.
- Include exactly 6 dimensions.
- Include exactly 3 priorities.
- Include exactly 4 interviewPlan items.
- Include exactly 3 nextActions.
- Calibrate for a student/fresher; do not inflate scores.
- Make recommendations specific to the role and supplied gaps.
`;

    const result = await getGeminiModel().generateContent(prompt);
    const parsed = safeJsonParse<IntelligenceResponse>(result.response.text());
    if (!parsed) throw new Error("Failed to parse interview intelligence response");

    return NextResponse.json({ ...parsed, isMock: false });
  } catch (error) {
    console.error("Interview intelligence error:", error);
    return NextResponse.json({ error: "Unable to generate interview intelligence" }, { status: 500 });
  }
}

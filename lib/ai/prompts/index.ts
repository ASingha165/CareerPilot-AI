export const RESUME_ANALYSIS_PROMPT = (resumeText: string, profile?: string) => `
You are an expert career counselor and resume analyst. Analyze the following resume text and extract structured information.

${profile ? `Student Profile Context:\n${profile}\n` : ""}

Resume Text:
---
${resumeText}
---

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "extractedSkills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "education": ["degree and institution"],
  "projects": ["project name and brief description"],
  "experience": ["role at company, duration"],
  "certifications": ["certification name"],
  "achievements": ["achievement description"],
  "technologies": ["technology1", "technology2"],
  "domains": ["domain of work/expertise"],
  "strengths": ["specific strength based on resume content"],
  "weaknesses": ["specific gap or weakness observed"],
  "missingSkills": ["commonly expected skill not found in resume"],
  "suggestions": ["specific, actionable improvement suggestion"]
}

Rules:
- Be specific and based only on what is in the resume
- For missingSkills, consider what is typically expected for the listed experience level and roles
- For suggestions, be constructive and specific (not generic)
- Maximum 8 items per array
- All strings should be concise (under 100 characters each)
`;

export const CAREER_RECOMMENDATION_PROMPT = (
  profile: string,
  resumeAnalysis: string
) => `
You are an expert career advisor. Based on the student profile and resume analysis below, recommend the top 4 most suitable career paths.

Student Profile:
${profile}

Resume Analysis Summary:
${resumeAnalysis}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "role": "Career Role Name",
    "matchPercentage": 85,
    "whyItFits": "2-3 sentence explanation of why this career fits the student",
    "existingStrengths": ["strength that aligns with this career"],
    "missingSkills": ["important skill missing for this career"],
    "recommendedProjects": ["specific project idea to build portfolio"],
    "learningPath": ["specific learning step in order"],
    "nextSteps": ["immediate actionable step"]
  }
]

Career options to consider: AI/ML Engineer, Software Developer, Full-Stack Developer, Data Analyst, Data Scientist, Cybersecurity Analyst, Cloud/DevOps Engineer, Product Manager, Technical Lead

Rules:
- matchPercentage must be between 40 and 98 and be realistic
- Rank by match percentage (highest first)
- Maximum 4 items per sub-arrays
- Be specific to the student's actual profile
- Do not recommend careers that clearly don't fit
`;

export const SKILL_GAP_PROMPT = (
  targetRole: string,
  currentSkills: string[],
  resumeAnalysis: string
) => `
You are a technical education specialist. Generate a detailed skill gap analysis and personalized learning roadmap for a student targeting the role of "${targetRole}".

Current Skills: ${currentSkills.join(", ")}
Resume Summary: ${resumeAnalysis}

Return ONLY a valid JSON object with this exact structure:
{
  "targetRole": "${targetRole}",
  "currentSkills": [
    {
      "skill": "Skill Name",
      "currentLevel": 75,
      "requiredLevel": 90,
      "level": "developing",
      "priority": "important",
      "resources": ["resource or course type"],
      "category": "Programming Languages"
    }
  ],
  "stages": [
    {
      "stage": 1,
      "title": "Stage Title",
      "description": "What this stage covers",
      "skills": ["skill to learn"],
      "estimatedWeeks": 4,
      "difficulty": "beginner",
      "projects": ["project to build"],
      "completed": false
    }
  ],
  "totalEstimatedWeeks": 24
}

Rules:
- currentLevel and requiredLevel are 0-100
- level values: "strong" (>75), "developing" (50-75), "needs-work" (25-50), "beginner" (<25), "not-started" (0)
- priority values: "critical", "important", "nice-to-have"
- Include 6-8 key skills in currentSkills
- Include exactly 5 stages: Foundation, Core Skills, Advanced Skills, Projects, Interview Preparation
- difficulty values: "beginner", "intermediate", "advanced"
- Be realistic with estimated weeks based on complexity
`;

export const READINESS_SCORE_PROMPT = (
  profile: string,
  resumeAnalysis: string,
  interviewHistory: string,
  githubSummary: string
) => `
You are a career readiness assessment expert. Calculate an honest and explainable job readiness score for this student.

Student Profile: ${profile}
Resume Analysis: ${resumeAnalysis}
Interview History: ${interviewHistory || "No interviews taken yet"}
GitHub Activity: ${githubSummary || "GitHub not connected"}

Return ONLY a valid JSON object with this exact structure:
{
  "overall": 72,
  "breakdown": {
    "technicalSkills": 75,
    "projects": 68,
    "experience": 55,
    "certifications": 60,
    "resumeQuality": 70,
    "githubActivity": 45,
    "interviewReadiness": 50
  },
  "label": "Getting There",
  "explanation": "2-3 sentence honest explanation of the overall score",
  "topImprovements": ["specific improvement that would most increase readiness"]
}

Rules:
- All scores are 0-100
- Be honest and calibrated — don't inflate scores
- label must be one of: "Career Ready" (85+), "Almost Ready" (70-84), "Getting There" (55-69), "Building Up" (40-54), "Early Stage" (<40)
- If GitHub or interviews are missing, score githubActivity or interviewReadiness at 0-30
- topImprovements: exactly 3 items, specific and actionable
- overall is NOT an average — it's a weighted assessment
`;

export const INTERVIEW_QUESTIONS_PROMPT = (
  role: string,
  type: string,
  difficulty: string,
  profile: string
) => `
You are an expert technical interviewer. Generate 5 interview questions for a ${difficulty} ${type} interview for a ${role} position.

Candidate Profile: ${profile}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "q1",
    "question": "The interview question text",
    "category": "technical",
    "hint": "optional brief hint or what the interviewer is looking for"
  }
]

Rules:
- category values: "technical", "behavioral", "problem-solving", "situational"
- For "technical" type: 3 technical + 1 problem-solving + 1 behavioral
- For "behavioral" type: 1 technical + 3 behavioral + 1 situational
- For "mixed" type: 2 technical + 1 problem-solving + 1 behavioral + 1 situational
- Tailor questions to the specific role and difficulty level
- Easy: fundamental concepts. Medium: applied knowledge. Hard: advanced/architecture/design
- Make questions realistic for an actual interview
- hint should be 1 sentence about what a good answer covers
`;

export const INTERVIEW_EVALUATION_PROMPT = (
  question: string,
  answer: string,
  role: string,
  category: string
) => `
You are an expert interviewer evaluating a candidate's response. Provide constructive, specific feedback.

Role: ${role}
Question Type: ${category}
Question: ${question}
Candidate's Answer: ${answer}

Return ONLY a valid JSON object with this exact structure:
{
  "score": 72,
  "whatWasGood": ["specific positive point about the answer"],
  "improvements": ["specific improvement needed"],
  "missingPoints": ["important point that should have been mentioned"],
  "betterStructure": "A 2-3 sentence model answer or how to structure the response better",
  "followUpPractice": ["specific topic or skill to practice based on this answer"]
}

Rules:
- score is 0-100, be honest and calibrated
- whatWasGood: 1-3 items (only if genuinely good)
- improvements: 1-3 specific items
- missingPoints: 1-3 items that would make the answer stronger
- betterStructure: give a concise model answer or ideal structure
- followUpPractice: 1-2 specific practice recommendations
- If the answer is blank or very short, score should be 0-20
`;

export const GITHUB_ANALYSIS_PROMPT = (
  username: string,
  reposJson: string
) => `
You are a technical talent evaluator. Analyze this GitHub profile data and provide an assessment of the developer's practical experience.

Username: ${username}
Repository Data:
${reposJson}

Return ONLY a valid JSON object with this exact structure:
{
  "techStack": ["technology inferred from repos"],
  "projectTypes": ["type of projects: web apps, scripts, ML models, etc."],
  "activityLevel": "medium",
  "practicalExperience": "2-3 sentence summary of practical experience level",
  "strengths": ["specific technical strength observed"],
  "suggestions": ["specific suggestion to improve GitHub profile or skills"]
}

Rules:
- activityLevel: "high" (10+ active repos), "medium" (4-9), "low" (1-3), "inactive" (0)
- Be based only on observable data
- techStack: infer from languages and repo names/descriptions
- Maximum 6 items per arrays
- strengths and suggestions should be specific to what you see, not generic
`;

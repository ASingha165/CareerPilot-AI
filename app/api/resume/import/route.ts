import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { skills, education, projects, certifications, achievements } = body;

    let addedSkillsCount = 0;
    let addedProjectsCount = 0;
    let addedEducationCount = 0;
    let addedCertificationsCount = 0;
    let addedAchievementsCount = 0;

    // Import confirmed skills
    if (Array.isArray(skills)) {
      for (const item of skills) {
        const name = typeof item === "string" ? item : item?.name;
        if (name && name.trim()) {
          const category = (typeof item === "object" && item.category) || "Technical";
          const proficiency = (typeof item === "object" && item.proficiency) || "intermediate";
          const res = db.skills.create({
            userId: auth.user.id,
            name: name.trim(),
            category,
            proficiency,
            source: "resume",
          });
          if (!res.isDuplicate) addedSkillsCount++;
        }
      }
    }

    // Import confirmed education
    if (Array.isArray(education)) {
      for (const item of education) {
        if (typeof item === "string" && item.trim()) {
          db.education.create({
            userId: auth.user.id,
            institution: item.trim(),
            degree: "Degree",
            fieldOfStudy: "General",
            startYear: new Date().getFullYear() - 4,
            endYear: new Date().getFullYear(),
          });
          addedEducationCount++;
        } else if (typeof item === "object" && item.institution) {
          db.education.create({
            userId: auth.user.id,
            institution: item.institution,
            degree: item.degree || "Degree",
            fieldOfStudy: item.fieldOfStudy || "Computer Science",
            startYear: item.startYear || new Date().getFullYear() - 4,
            endYear: item.endYear || new Date().getFullYear(),
          });
          addedEducationCount++;
        }
      }
    }

    // Import confirmed projects
    if (Array.isArray(projects)) {
      for (const item of projects) {
        if (typeof item === "string" && item.trim()) {
          db.projects.create({
            userId: auth.user.id,
            name: item.split("—")[0].trim() || item.trim(),
            description: item.includes("—") ? item.split("—")[1].trim() : item.trim(),
            technologies: [],
            role: "Developer",
            startDate: new Date().toISOString().split("T")[0],
            status: "completed",
            skills: [],
          });
          addedProjectsCount++;
        } else if (typeof item === "object" && item.name) {
          db.projects.create({
            userId: auth.user.id,
            name: item.name,
            description: item.description || "Project from resume",
            technologies: item.technologies || [],
            role: item.role || "Developer",
            startDate: item.startDate || new Date().toISOString().split("T")[0],
            status: "completed",
            skills: item.skills || [],
          });
          addedProjectsCount++;
        }
      }
    }

    // Import confirmed certifications
    if (Array.isArray(certifications)) {
      for (const item of certifications) {
        const certName = typeof item === "string" ? item : item?.name;
        if (certName && certName.trim()) {
          db.certifications.create({
            userId: auth.user.id,
            name: certName.trim(),
            issuingOrganization: (typeof item === "object" && item.issuingOrganization) || "Verified Issuer",
            issueDate: new Date().toISOString().split("T")[0],
            relatedSkills: [],
          });
          addedCertificationsCount++;
        }
      }
    }

    // Import confirmed achievements
    if (Array.isArray(achievements)) {
      for (const item of achievements) {
        const title = typeof item === "string" ? item : item?.title;
        if (title && title.trim()) {
          db.achievements.create({
            userId: auth.user.id,
            title: title.trim(),
            description: (typeof item === "object" && item.description) || title.trim(),
            date: new Date().toISOString().split("T")[0],
            skills: [],
            tags: ["Resume"],
          });
          addedAchievementsCount++;
        }
      }
    }

    db.activities.add(
      auth.user.id,
      "Resume Data Imported",
      `Imported ${addedSkillsCount} skills, ${addedProjectsCount} projects, ${addedEducationCount} education from resume`,
      "resume_uploaded"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({
      success: true,
      imported: {
        skills: addedSkillsCount,
        projects: addedProjectsCount,
        education: addedEducationCount,
        certifications: addedCertificationsCount,
        achievements: addedAchievementsCount,
      },
      profile: fullProfile,
    });
  } catch (error) {
    console.error("[API /resume/import POST] Error:", error);
    return NextResponse.json({ error: "Failed to import resume data" }, { status: 500 });
  }
}

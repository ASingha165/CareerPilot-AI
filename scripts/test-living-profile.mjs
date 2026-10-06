import { db } from "../lib/db/index.js";
import { hashPassword, verifyPassword } from "../lib/auth/password.js";
import { createSession } from "../lib/auth/session.js";

async function runTests() {
  console.log("=== STARTING CAREERPILOT-AI LIVING PROFILE VERIFICATION ===");

  // 1. Password Hashing & Salt
  console.log("\n[Test 1] Testing Password Hashing & Verification...");
  const rawPw = "SecurePass123!";
  const { salt, hash } = hashPassword(rawPw);
  const isValid = verifyPassword(rawPw, salt, hash);
  const isInvalid = verifyPassword("WrongPassword!", salt, hash);
  if (!isValid || isInvalid) throw new Error("Password verification failed!");
  console.log("✓ Password hashing & timing-safe verification passed.");

  // 2. Database Seeding & User Isolation
  console.log("\n[Test 2] Testing Database Seeding & Isolation...");
  const demo = db.users.findByEmail("demo@careerpilot.ai");
  if (!demo) throw new Error("Demo user not found!");
  console.log("✓ Found seeded demo user:", demo.email, "id:", demo.id);

  // Create User A and User B
  const pwA = hashPassword("AlicePass123!");
  const userA = db.users.create({
    email: `alice_${Date.now()}@test.com`,
    passwordHash: pwA.hash,
    salt: pwA.salt,
    name: "Alice Developer",
  });
  const pwB = hashPassword("BobPass123!");
  const userB = db.users.create({
    email: `bob_${Date.now()}@test.com`,
    passwordHash: pwB.hash,
    salt: pwB.salt,
    name: "Bob Designer",
  });

  const profileA = db.getFullProfile(userA.id);
  const profileB = db.getFullProfile(userB.id);
  if (!profileA || !profileB) throw new Error("Failed to get full profiles");
  if (profileA.user.id !== userA.id || profileB.user.id !== userB.id) throw new Error("Profile user mismatch");
  console.log("✓ User A and User B created with isolated profiles.");

  // 3. Dynamic Profile Completeness
  console.log("\n[Test 3] Testing Dynamic Profile Completeness...");
  console.log(`User A initial completeness: ${profileA.completeness.overallPercentage}%`);
  if (typeof profileA.completeness.overallPercentage !== "number" || profileA.completeness.overallPercentage <= 0) {
    throw new Error("Invalid completeness score");
  }

  // 4. Skills Management & Duplicate Prevention
  console.log("\n[Test 4] Adding Skills & Preventing Duplicates...");
  const { skill: skill1, isDuplicate: wasDup1 } = db.skills.create({
    userId: userA.id,
    name: "TypeScript",
    category: "Programming",
    proficiency: "intermediate",
    experienceYears: 2,
    source: "manual",
  });
  console.log("✓ Added skill:", skill1.name, "duplicate?", wasDup1);

  // Duplicate attempt
  const { isDuplicate: wasDup2 } = db.skills.create({
    userId: userA.id,
    name: "TypeScript",
    category: "Programming",
    proficiency: "advanced",
    source: "manual",
  });
  if (!wasDup2) throw new Error("Duplicate skill should have been prevented!");
  console.log("✓ Duplicate skill addition successfully prevented.");

  // Verify change detection marked analysis stale
  const updatedProfileA1 = db.getFullProfile(userA.id);
  if (!updatedProfileA1.profile.isAiAnalysisStale) {
    throw new Error("Adding a skill should set isAiAnalysisStale to true!");
  }
  console.log("✓ Stale analysis flag correctly set to true after adding skill.");

  // 5. Add Milestones: Projects, Education, Experience, Certification, Achievements
  console.log("\n[Test 5] Adding Projects, Experience, Certifications, Achievements...");
  db.projects.create({
    userId: userA.id,
    name: "AI Career Copilot",
    description: "Next.js & Gemini powered living profile app",
    technologies: ["Next.js", "React", "Gemini", "TypeScript"],
    role: "Full Stack Engineer",
    githubUrl: "https://github.com/alice/careerpilot",
    startDate: "2024-01-01",
    status: "completed",
    skills: ["Next.js", "TypeScript"],
  });

  db.education.create({
    userId: userA.id,
    institution: "Stanford University",
    degree: "Bachelor of Science",
    fieldOfStudy: "Computer Science",
    startYear: 2022,
    endYear: 2026,
    grade: "3.9 GPA",
  });

  db.certifications.create({
    userId: userA.id,
    name: "AWS Certified Cloud Practitioner",
    issuingOrganization: "Amazon Web Services",
    issueDate: "2024-05",
    credentialId: "AWS-987654",
    relatedSkills: ["AWS", "Cloud Architecture"],
  });

  db.achievements.create({
    userId: userA.id,
    title: "National Hackathon 1st Place",
    description: "Built an AI-assisted accessibility tool",
    date: "2024-11",
    issuingOrganization: "TechFest 2024",
    skillsDemonstrated: ["AI", "Leadership", "React"],
    tags: ["Hackathon", "Award"],
  });

  // Verify profile completeness increased
  const profileWithMilestones = db.getFullProfile(userA.id);
  console.log(`User A completeness with milestones: ${profileWithMilestones.completeness.overallPercentage}%`);
  if (profileWithMilestones.completeness.overallPercentage <= profileA.completeness.overallPercentage) {
    throw new Error("Completeness did not increase after adding records!");
  }
  console.log("✓ Dynamic completeness increased as expected.");

  // 6. User Isolation Test
  console.log("\n[Test 6] Security Check: Data Isolation...");
  const bobSkills = db.skills.findByUserId(userB.id);
  if (bobSkills.length !== 0) throw new Error("Bob should have 0 skills!");
  const bobProjects = db.projects.findByUserId(userB.id);
  if (bobProjects.length !== 0) throw new Error("Bob should have 0 projects!");
  console.log("✓ User B has zero access to User A's skills or projects.");

  // 7. Activity Timeline Test
  console.log("\n[Test 7] Testing Career Activity Timeline...");
  db.activities.add(userA.id, "Skill Added", 'Added "TypeScript" (Intermediate)', "skill_added");
  db.activities.add(userA.id, "Project Created", 'Added "AI Career Copilot"', "project_added");
  db.activities.add(userA.id, "Certification Added", 'Earned "AWS Certified Cloud Practitioner"', "certification_added");

  const activities = db.activities.findByUserId(userA.id);
  console.log(`Found ${activities.length} activity items for User A:`);
  activities.slice(0, 4).forEach((act) => {
    console.log(`  - [${act.type}] ${act.title}: ${act.description}`);
  });
  if (activities.length === 0) throw new Error("Activity log should not be empty!");
  console.log("✓ Activity timeline successfully populated.");

  // 8. AI Re-analysis & Stale Reset Test
  console.log("\n[Test 8] Testing AI Analysis Storage & Stale Flag Reset...");
  const mockAnalysis = {
    userId: userA.id,
    readinessScore: 88,
    targetRole: "Full Stack Engineer",
    strengths: ["Strong TypeScript foundation", "Stanford CS education"],
    skillGaps: ["CI/CD Pipeline mastery", "Docker containerization"],
    recommendations: ["Deploy your project on Vercel with automated GitHub actions"],
    roadmap: [
      {
        phase: "Phase 1: DevOps Basics",
        duration: "2 Weeks",
        milestones: ["Docker basics", "GitHub Actions setup"],
        skillsToLearn: ["Docker", "CI/CD"],
      },
    ],
  };

  db.aiAnalyses.save(mockAnalysis);
  const reanalyzedProfile = db.getFullProfile(userA.id);
  if (reanalyzedProfile.profile.isAiAnalysisStale !== false) {
    throw new Error("Saving AI analysis must clear the stale flag!");
  }
  if (!reanalyzedProfile.latestAnalysis || reanalyzedProfile.latestAnalysis.readinessScore !== 88) {
    throw new Error("Latest analysis mismatch!");
  }
  console.log("✓ AI Analysis saved, stale flag cleared, and readiness updated to 88%.");

  console.log("\n=== ALL CAREERPILOT-AI PROFILE VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

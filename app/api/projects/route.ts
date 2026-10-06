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
    const {
      name,
      description,
      technologies,
      role,
      githubUrl,
      liveUrl,
      startDate,
      endDate,
      status,
      skills,
      imageUrl,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Project name and description are required" },
        { status: 400 }
      );
    }

    const proj = db.projects.create({
      userId: auth.user.id,
      name: name.trim(),
      description: description.trim(),
      technologies: Array.isArray(technologies) ? technologies : [],
      role: role?.trim() || "Developer",
      githubUrl: githubUrl?.trim() || undefined,
      liveUrl: liveUrl?.trim() || undefined,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || undefined,
      status: status || "completed",
      skills: Array.isArray(skills) ? skills : [],
      imageUrl: imageUrl?.trim() || undefined,
    });

    db.activities.add(
      auth.user.id,
      "Project Added",
      `Added "${proj.name}" to portfolio projects`,
      "project_added"
    );

    const fullProfile = db.getFullProfile(auth.user.id);
    return NextResponse.json({ success: true, project: proj, profile: fullProfile });
  } catch (error) {
    console.error("[API /projects POST] Error:", error);
    return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
  }
}

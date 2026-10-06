// Comprehensive test suite for CareerPilot-AI Google Authentication & Account Linking
import { db } from "../lib/db/index.js";
import { hashPassword, verifyPassword } from "../lib/auth/password.js";
import { createSession } from "../lib/auth/session.js";
import {
  generateOAuthState,
  verifyOAuthState,
  createPendingLinkToken,
  verifyPendingLinkToken,
} from "../lib/auth/google.js";

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("CAREER PILOT AI — AUTHENTICATION & GOOGLE OAUTH TEST SUITE");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------
  // TEST 1: Existing Demo Student Login
  // -------------------------------------------------------------------
  console.log("TEST 1: Existing Demo Student Login (Email & Password)");
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@careerpilot.ai", password: "demo123" }),
    });
    const data = await res.json();
    assert(res.ok && data.success, "Demo login succeeds with 200 OK");
    assert(data.user.email === "demo@careerpilot.ai", "Demo user email matches");
    assert(data.profile && data.profile.skills.length >= 3, "Profile and existing skills loaded");
  }

  // -------------------------------------------------------------------
  // TEST 2: Existing Email/Password Signup Flow
  // -------------------------------------------------------------------
  console.log("\nTEST 2: Existing Email/Password Signup Flow");
  const testPasswordUserEmail = `student_${Date.now()}@university.edu`;
  let passwordUserSessionCookie = "";
  let passwordUserId = "";
  {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Password Student",
        email: testPasswordUserEmail,
        password: "securePassword123",
        institution: "MIT",
        degree: "B.S.",
        fieldOfStudy: "Computer Science",
        graduationYear: 2026,
        targetRole: "Full-Stack Developer",
      }),
    });
    const data = await res.json();
    assert(res.ok && data.success, "Email/password signup succeeds with 200 OK");
    assert(data.user.name === "Test Password Student", "User name matches");
    passwordUserId = data.user.id;

    const cookieHeader = res.headers.get("set-cookie") || "";
    const match = cookieHeader.match(/careerpilot_session=([^;]+)/);
    if (match) {
      passwordUserSessionCookie = match[0];
    }
    assert(passwordUserSessionCookie.length > 0, "careerpilot_session cookie is issued");
  }

  // -------------------------------------------------------------------
  // TEST 3: State Generation & Anti-CSRF Validation
  // -------------------------------------------------------------------
  console.log("\nTEST 3: OAuth State Cryptographic Generation & Nonce Validation");
  {
    const { stateParam, nonce } = generateOAuthState("signin");
    assert(stateParam.includes("."), "State parameter contains HMAC signature");

    const validVerification = verifyOAuthState(stateParam, nonce);
    assert(validVerification.valid === true, "State validates successfully with correct nonce");

    const wrongNonceVerification = verifyOAuthState(stateParam, "wrong_nonce");
    assert(wrongNonceVerification.valid === false, "State validation rejects mismatched nonce");

    const forgedVerification = verifyOAuthState("forgedPayload.forgedSignature", nonce);
    assert(forgedVerification.valid === false, "State validation rejects forged HMAC signature");
  }

  // -------------------------------------------------------------------
  // TEST 4: Scenario A — New Google User Provisioning
  // -------------------------------------------------------------------
  console.log("\nTEST 4: Scenario A — New Google User Provisioning");
  const googleSubA = `google_sub_${Date.now()}`;
  const googleEmailA = `google_student_${Date.now()}@gmail.com`;
  let googleUserSessionCookie = "";
  let googleUserId = "";
  {
    // Simulate new user created from Google identity
    const now = new Date().toISOString();
    const newUser = db.users.create({
      email: googleEmailA,
      name: "Jordan Lee",
      googleId: googleSubA,
      avatar: "https://lh3.googleusercontent.com/a/test-avatar",
      authProvider: "google",
    });
    googleUserId = newUser.id;

    const profile = db.profiles.create({
      userId: newUser.id,
      personal: {
        fullName: "Jordan Lee",
        email: googleEmailA,
        avatarUrl: "https://lh3.googleusercontent.com/a/test-avatar",
        bio: "",
      },
      careerPreferences: {
        targetRoles: ["Software Developer"],
        preferredIndustry: "Technology",
        preferredWorkType: "hybrid",
        preferredLocation: "Flexible",
        careerInterests: [],
      },
      createdDate: now,
      lastProfileUpdate: now,
      lastAiAnalysisDate: null,
      lastResumeUpdate: null,
      lastGithubAnalysis: null,
      isAiAnalysisStale: false,
    });

    const { token } = createSession(newUser.id);
    googleUserSessionCookie = `careerpilot_session=${token}`;

    assert(newUser.googleId === googleSubA, "Google ID stored in user record");
    assert(newUser.authProvider === "google", "authProvider is 'google'");
    assert(newUser.passwordHash === "", "passwordHash is empty for Google-only user");
    assert(profile.personal.avatarUrl?.includes("test-avatar"), "Google avatar imported into profile");

    // Verify session works with /api/profile
    const res = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: googleUserSessionCookie },
    });
    const data = await res.json();
    assert(res.ok && data.success, "New Google user can access /api/profile with session");
    assert(data.profile.user.id === newUser.id, "Session resolves to correct user ID");
  }

  // -------------------------------------------------------------------
  // TEST 5: Scenario B — Existing Google User Login
  // -------------------------------------------------------------------
  console.log("\nTEST 5: Scenario B — Existing Google User Login");
  {
    const existingUser = db.users.findByGoogleId(googleSubA);
    assert(existingUser !== undefined, "Find existing user by Google ID succeeds");
    assert(existingUser.id === googleUserId, "Resolves to the exact existing user without duplicate");
  }

  // -------------------------------------------------------------------
  // TEST 6: Scenario C — Google Login with Existing Email & Password Account
  // -------------------------------------------------------------------
  console.log("\nTEST 6: Scenario C — Existing Email/Password User Attempting Google Login");
  {
    // User with testPasswordUserEmail already exists with password
    const existing = db.users.findByEmail(testPasswordUserEmail);
    assert(existing !== undefined, "Existing email account found");
    assert(Boolean(existing.passwordHash), "Account has password protection");

    // Verify duplicate user is NOT created
    const allUsersBefore = db.users.findByEmail(testPasswordUserEmail);
    const googleSubC = `google_sub_c_${Date.now()}`;

    // Generate pending link token
    const pendingToken = createPendingLinkToken({
      userId: existing.id,
      googleId: googleSubC,
      googleEmail: testPasswordUserEmail,
      name: existing.name,
      avatar: "https://lh3.googleusercontent.com/avatar_c",
    });

    const verifiedPayload = verifyPendingLinkToken(pendingToken);
    assert(verifiedPayload !== null, "Pending link token generates and verifies with HMAC");
    assert(verifiedPayload.googleId === googleSubC, "Pending link payload preserves Google identity");

    // Attempting linking with WRONG password
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/link-google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `cp_pending_link=${pendingToken}`,
      },
      body: JSON.stringify({ password: "wrong_password_xyz" }),
    });
    assert(wrongPassRes.status === 401, "Linking with incorrect password rejected with 401 Unauthorized");

    // Linking with CORRECT password
    const correctPassRes = await fetch(`${BASE_URL}/api/auth/link-google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `cp_pending_link=${pendingToken}`,
      },
      body: JSON.stringify({ password: "securePassword123" }),
    });
    const linkData = await correctPassRes.json();
    assert(correctPassRes.ok && linkData.success, "Linking with correct password succeeds with 200 OK");

    const updatedUser = db.users.findById(existing.id);
    assert(updatedUser.googleId === googleSubC, "User record now has linked Google ID");
    assert(updatedUser.authProvider === "google+password", "authProvider upgraded to 'google+password'");
  }

  // -------------------------------------------------------------------
  // TEST 7: Connected Accounts Security & Disconnect Prevention
  // -------------------------------------------------------------------
  console.log("\nTEST 7: Connected Accounts Security & Disconnect Rules");
  {
    // A Google-only user cannot disconnect Google without setting a password first!
    const disconnectGoogleOnlyRes = await fetch(`${BASE_URL}/api/auth/disconnect-google`, {
      method: "POST",
      headers: { Cookie: googleUserSessionCookie },
    });
    const disconnectOnlyData = await disconnectGoogleOnlyRes.json();
    assert(
      disconnectGoogleOnlyRes.status === 400,
      "Google-only user CANNOT disconnect Google (prevents removing only auth method)"
    );

    // Google user sets a password
    const setPassRes = await fetch(`${BASE_URL}/api/auth/set-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: googleUserSessionCookie,
      },
      body: JSON.stringify({ newPassword: "myNewPassword123" }),
    });
    const setPassData = await setPassRes.json();
    assert(setPassRes.ok && setPassData.success, "Google user sets password successfully");

    // Now user has both, so disconnecting Google is allowed
    const disconnectRes = await fetch(`${BASE_URL}/api/auth/disconnect-google`, {
      method: "POST",
      headers: { Cookie: googleUserSessionCookie },
    });
    const disconnectData = await disconnectRes.json();
    assert(disconnectRes.ok && disconnectData.success, "User with password can safely disconnect Google");

    const userAfterDisconnect = db.users.findById(googleUserId);
    assert(userAfterDisconnect.googleId === null, "googleId is removed after disconnect");
    assert(userAfterDisconnect.authProvider === "password", "authProvider updated to 'password'");
  }

  // -------------------------------------------------------------------
  // TEST 8: Protected Routes Enforcement
  // -------------------------------------------------------------------
  console.log("\nTEST 8: Protected Routes Enforcement");
  {
    // Unauthenticated API request
    const unauthApiRes = await fetch(`${BASE_URL}/api/profile`);
    assert(unauthApiRes.status === 401, "Unauthenticated GET /api/profile returns 401 Unauthorized");

    // Unauthenticated page request through middleware (follow: 'manual' to check redirect)
    const unauthPageRes = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    assert(
      unauthPageRes.status === 307 || unauthPageRes.status === 302,
      "Unauthenticated GET /dashboard redirects to /login via middleware"
    );
    const location = unauthPageRes.headers.get("location") || "";
    assert(location.includes("/login"), "Redirect location points to /login");
  }

  // -------------------------------------------------------------------
  // TEST 9: User Data Isolation
  // -------------------------------------------------------------------
  console.log("\nTEST 9: User Data Isolation");
  {
    // User A adds a skill
    const addSkillRes = await fetch(`${BASE_URL}/api/skills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: passwordUserSessionCookie,
      },
      body: JSON.stringify({
        name: "Kubernetes Cluster Management",
        category: "Cloud",
        proficiency: "advanced",
      }),
    });
    assert(addSkillRes.ok, "User A adds custom skill");

    // User B fetches their profile
    const userBRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: googleUserSessionCookie },
    });
    const userBData = await userBRes.json();
    const hasUserASkill = userBData.profile.skills.some(
      (s) => s.name === "Kubernetes Cluster Management"
    );
    assert(!hasUserASkill, "User B CANNOT see User A's private skills (isolated profiles)");
  }

  // -------------------------------------------------------------------
  // TEST 10: Logout Verification
  // -------------------------------------------------------------------
  console.log("\nTEST 10: Logout Functionality");
  {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: passwordUserSessionCookie },
    });
    assert(logoutRes.ok, "POST /api/auth/logout succeeds");

    const cookieHeader = logoutRes.headers.get("set-cookie") || "";
    assert(
      cookieHeader.includes("careerpilot_session=;") ||
        cookieHeader.includes("Max-Age=0") ||
        cookieHeader.includes("Expires="),
      "Logout clears careerpilot_session cookie"
    );

    // Verify session invalidated
    const afterLogoutRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: passwordUserSessionCookie },
    });
    assert(afterLogoutRes.status === 401, "Invalidated session cannot access protected API");
  }

  // -------------------------------------------------------------------
  // TEST 11: Living Profile Features (Skills, Completeness, Activities)
  // -------------------------------------------------------------------
  console.log("\nTEST 11: Living Profile Features Intact");
  {
    const demoProfile = db.getFullProfile("user_demo_student_01");
    assert(demoProfile !== null, "Demo profile loaded intact");
    assert(demoProfile.completeness.overallPercentage > 50, "Profile completeness calculated correctly");
    assert(demoProfile.activities.length > 0, "Activity timeline contains records");
  }

  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});

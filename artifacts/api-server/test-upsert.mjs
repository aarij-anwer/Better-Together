import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const TEST_USER_ID = "test-upsert-verify-" + Date.now();
const TEST_EMAIL = "jane.smith@example.com";

function splitEmailName(email) {
  if (!email || !email.includes("@")) return { firstName: null, lastName: null };
  const localPart = email.split("@")[0];
  const parts = localPart.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function upsertUser(claims) {
  const firstName = typeof claims.first_name === "string" ? claims.first_name.trim() : "";
  const lastName = typeof claims.last_name === "string" ? claims.last_name.trim() : "";
  const userData = {
    id: claims.sub,
    email: claims.email || null,
    firstName: firstName || null,
    lastName: lastName || null,
    profileImageUrl: null,
  };

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userData.id));
  const fallbackName = splitEmailName(userData.email);
  const resolvedFirstName = existing?.firstName ?? userData.firstName ?? fallbackName.firstName;
  const resolvedLastName = existing?.lastName ?? userData.lastName ?? fallbackName.lastName;

  const [user] = await db
    .insert(usersTable)
    .values({
      ...userData,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: userData.email,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

async function cleanup() {
  await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID));
}

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    passed++;
  } else {
    console.log(`  FAIL: ${msg}`);
    failed++;
  }
}

try {
  await cleanup();

  console.log("\n=== Test 1: New user with empty OIDC names → should derive name from email ===");
  const user1 = await upsertUser({ sub: TEST_USER_ID, email: TEST_EMAIL, first_name: "", last_name: "" });
  assert(user1.firstName === "jane", `firstName should be "jane", got "${user1.firstName}"`);
  assert(user1.lastName === "smith", `lastName should be "smith", got "${user1.lastName}"`);

  console.log("\n=== Test 2: Same user logs in again with empty OIDC names → should preserve email-derived name ===");
  const user2 = await upsertUser({ sub: TEST_USER_ID, email: TEST_EMAIL, first_name: "", last_name: "" });
  assert(user2.firstName === "jane", `firstName should still be "jane", got "${user2.firstName}"`);
  assert(user2.lastName === "smith", `lastName should still be "smith", got "${user2.lastName}"`);

  console.log("\n=== Test 3: User manually changes name to 'Alice Wonder' → simulate profile update ===");
  await db.update(usersTable).set({ firstName: "Alice", lastName: "Wonder" }).where(eq(usersTable.id, TEST_USER_ID));
  const [manualCheck] = await db.select().from(usersTable).where(eq(usersTable.id, TEST_USER_ID));
  assert(manualCheck.firstName === "Alice", `firstName should be "Alice", got "${manualCheck.firstName}"`);
  assert(manualCheck.lastName === "Wonder", `lastName should be "Wonder", got "${manualCheck.lastName}"`);

  console.log("\n=== Test 4: User logs in again with empty OIDC names → should PRESERVE custom name ===");
  const user4 = await upsertUser({ sub: TEST_USER_ID, email: TEST_EMAIL, first_name: "", last_name: "" });
  assert(user4.firstName === "Alice", `firstName should still be "Alice", got "${user4.firstName}"`);
  assert(user4.lastName === "Wonder", `lastName should still be "Wonder", got "${user4.lastName}"`);

  console.log("\n=== Test 5: User logs in with OIDC providing a name → should STILL preserve custom name ===");
  const user5 = await upsertUser({ sub: TEST_USER_ID, email: TEST_EMAIL, first_name: "OIDCFirst", last_name: "OIDCLast" });
  assert(user5.firstName === "Alice", `firstName should still be "Alice", got "${user5.firstName}"`);
  assert(user5.lastName === "Wonder", `lastName should still be "Wonder", got "${user5.lastName}"`);

  console.log("\n=== Test 6: Reset name to null → simulate prod DB state, then login ===");
  await db.update(usersTable).set({ firstName: null, lastName: null }).where(eq(usersTable.id, TEST_USER_ID));
  const user6 = await upsertUser({ sub: TEST_USER_ID, email: TEST_EMAIL, first_name: "", last_name: "" });
  assert(user6.firstName === "jane", `firstName should be backfilled to "jane", got "${user6.firstName}"`);
  assert(user6.lastName === "smith", `lastName should be backfilled to "smith", got "${user6.lastName}"`);

  console.log("\n=== Test 7: Reset name to null → login with OIDC providing a real name ===");
  await db.update(usersTable).set({ firstName: null, lastName: null }).where(eq(usersTable.id, TEST_USER_ID));
  const user7 = await upsertUser({ sub: TEST_USER_ID, email: TEST_EMAIL, first_name: "Bob", last_name: "Smith" });
  assert(user7.firstName === "Bob", `firstName should be "Bob", got "${user7.firstName}"`);
  assert(user7.lastName === "Smith", `lastName should be "Smith", got "${user7.lastName}"`);

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  await cleanup();
  process.exit(failed > 0 ? 1 : 0);
} catch (err) {
  console.error("Test error:", err);
  await cleanup();
  process.exit(1);
}

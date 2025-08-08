-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "skillLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "preferences" JSONB,
    "subscriptionStatus" TEXT DEFAULT 'free',
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpires" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'student'
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "name", "passwordHash", "preferences", "resetToken", "resetTokenExpires", "skillLevel", "subscriptionStatus", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "name", "passwordHash", "preferences", "resetToken", "resetTokenExpires", "skillLevel", "subscriptionStatus", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

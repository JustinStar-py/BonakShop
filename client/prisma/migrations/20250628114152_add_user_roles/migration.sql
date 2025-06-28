-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "shopName" TEXT,
    "shopAddress" TEXT,
    "landline" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER'
);
INSERT INTO "new_User" ("createdAt", "id", "landline", "name", "password", "phone", "shopAddress", "shopName") SELECT "createdAt", "id", "landline", "name", "password", "phone", "shopAddress", "shopName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

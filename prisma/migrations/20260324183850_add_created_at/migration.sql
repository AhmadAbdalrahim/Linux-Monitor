-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "agentKey" TEXT NOT NULL,
    "ip" TEXT,
    "os" TEXT,
    "kernel" TEXT,
    "cpuModel" TEXT,
    "cpuCores" INTEGER NOT NULL DEFAULT 0,
    "memoryTotal" BIGINT NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Server" ("agentKey", "cpuCores", "cpuModel", "hostname", "id", "ip", "kernel", "lastSeenAt", "memoryTotal", "name", "os", "sortOrder", "userId") SELECT "agentKey", "cpuCores", "cpuModel", "hostname", "id", "ip", "kernel", "lastSeenAt", "memoryTotal", "name", "os", "sortOrder", "userId" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
CREATE UNIQUE INDEX "Server_agentKey_key" ON "Server"("agentKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

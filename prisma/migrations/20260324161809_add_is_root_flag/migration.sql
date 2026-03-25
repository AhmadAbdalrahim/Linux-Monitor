-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRoot" BOOLEAN NOT NULL DEFAULT true,
    "auditEvents" TEXT NOT NULL,
    "kernelMsgs" TEXT NOT NULL,
    "syslogLines" TEXT NOT NULL,
    CONSTRAINT "AuditSnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditSnapshot" ("auditEvents", "id", "kernelMsgs", "serverId", "syslogLines", "timestamp") SELECT "auditEvents", "id", "kernelMsgs", "serverId", "syslogLines", "timestamp" FROM "AuditSnapshot";
DROP TABLE "AuditSnapshot";
ALTER TABLE "new_AuditSnapshot" RENAME TO "AuditSnapshot";
CREATE TABLE "new_SecuritySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRoot" BOOLEAN NOT NULL DEFAULT true,
    "fimEvents" TEXT NOT NULL,
    "firewallRules" TEXT NOT NULL,
    "selinuxEvents" TEXT NOT NULL,
    "appArmorEvents" TEXT NOT NULL,
    CONSTRAINT "SecuritySnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SecuritySnapshot" ("appArmorEvents", "fimEvents", "firewallRules", "id", "selinuxEvents", "serverId", "timestamp") SELECT "appArmorEvents", "fimEvents", "firewallRules", "id", "selinuxEvents", "serverId", "timestamp" FROM "SecuritySnapshot";
DROP TABLE "SecuritySnapshot";
ALTER TABLE "new_SecuritySnapshot" RENAME TO "SecuritySnapshot";
CREATE TABLE "new_UserActivitySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRoot" BOOLEAN NOT NULL DEFAULT true,
    "activeSessions" TEXT NOT NULL,
    "loginHistory" TEXT NOT NULL,
    "sudoEvents" TEXT NOT NULL,
    "sshEvents" TEXT NOT NULL,
    CONSTRAINT "UserActivitySnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserActivitySnapshot" ("activeSessions", "id", "loginHistory", "serverId", "sshEvents", "sudoEvents", "timestamp") SELECT "activeSessions", "id", "loginHistory", "serverId", "sshEvents", "sudoEvents", "timestamp" FROM "UserActivitySnapshot";
DROP TABLE "UserActivitySnapshot";
ALTER TABLE "new_UserActivitySnapshot" RENAME TO "UserActivitySnapshot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

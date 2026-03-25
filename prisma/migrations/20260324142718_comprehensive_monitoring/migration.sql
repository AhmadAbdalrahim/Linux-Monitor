-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Server" (
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
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processes" TEXT NOT NULL,
    CONSTRAINT "ProcessSnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "services" TEXT NOT NULL,
    "ports" TEXT NOT NULL,
    "cronJobs" TEXT NOT NULL,
    CONSTRAINT "ServiceSnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserActivitySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeSessions" TEXT NOT NULL,
    "loginHistory" TEXT NOT NULL,
    "sudoEvents" TEXT NOT NULL,
    "sshEvents" TEXT NOT NULL,
    CONSTRAINT "UserActivitySnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditEvents" TEXT NOT NULL,
    "kernelMsgs" TEXT NOT NULL,
    "syslogLines" TEXT NOT NULL,
    CONSTRAINT "AuditSnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecuritySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimEvents" TEXT NOT NULL,
    "firewallRules" TEXT NOT NULL,
    "selinuxEvents" TEXT NOT NULL,
    "appArmorEvents" TEXT NOT NULL,
    CONSTRAINT "SecuritySnapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuPercent" REAL NOT NULL DEFAULT 0,
    "cpuPerCore" TEXT,
    "cpuIowait" REAL NOT NULL DEFAULT 0,
    "cpuSteal" REAL NOT NULL DEFAULT 0,
    "loadAvg1" REAL NOT NULL DEFAULT 0,
    "loadAvg5" REAL NOT NULL DEFAULT 0,
    "loadAvg15" REAL NOT NULL DEFAULT 0,
    "memoryTotal" BIGINT NOT NULL DEFAULT 0,
    "memoryUsed" BIGINT NOT NULL DEFAULT 0,
    "memoryPercent" REAL NOT NULL DEFAULT 0,
    "memBuffers" BIGINT NOT NULL DEFAULT 0,
    "memCached" BIGINT NOT NULL DEFAULT 0,
    "swapTotal" BIGINT NOT NULL DEFAULT 0,
    "swapUsed" BIGINT NOT NULL DEFAULT 0,
    "swapPercent" REAL NOT NULL DEFAULT 0,
    "diskTotal" BIGINT NOT NULL DEFAULT 0,
    "diskUsed" BIGINT NOT NULL DEFAULT 0,
    "diskPercent" REAL NOT NULL DEFAULT 0,
    "diskMounts" TEXT,
    "networkBytesSent" BIGINT NOT NULL DEFAULT 0,
    "networkBytesRecv" BIGINT NOT NULL DEFAULT 0,
    "networkInterfaces" TEXT,
    "processCount" INTEGER NOT NULL DEFAULT 0,
    "zombieCount" INTEGER NOT NULL DEFAULT 0,
    "uptimeSeconds" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Metric_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ResetToken_token_key" ON "ResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Server_agentKey_key" ON "Server"("agentKey");

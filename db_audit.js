const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function audit() {
  const users = await prisma.user.findMany();
  const sessions = await prisma.session.findMany({ include: { user: true } });
  const servers = await prisma.server.findMany({ include: { user: true } });
  
  console.log("--- USERS ---");
  users.forEach(u => console.log(`${u.id}: ${u.email}`));
  
  console.log("\n--- SESSIONS ---");
  sessions.forEach(s => console.log(`${s.id} -> User: ${s.user?.email} (${s.userId})`));
  
  console.log("\n--- SERVERS ---");
  servers.forEach(s => console.log(`${s.id} [${s.name}] -> Owner: ${s.user?.email} (${s.userId})`));
}

audit().finally(() => prisma.$disconnect());

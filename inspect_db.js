const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const servers = await prisma.server.findMany();
  const sessions = await prisma.session.findMany();
  
  console.log("USERS:", users.map(u => ({ id: u.id, email: u.email })));
  console.log("SERVERS:", servers.map(s => ({ id: s.id, name: s.name, userId: s.userId })));
  console.log("SESSIONS:", sessions.length);
}

main().finally(() => prisma.$disconnect());

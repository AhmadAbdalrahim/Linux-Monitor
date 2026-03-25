const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("ALL USERS:", users.map(u => ({ id: u.id, email: u.email })));
  
  const sessions = await prisma.session.findMany({ include: { user: true } });
  console.log("ACTIVE SESSIONS:", sessions.map(s => ({ 
    id: s.id, 
    userEmail: s.user?.email, 
    userId: s.userId 
  })));
  
  const servers = await prisma.server.findMany();
  console.log("ALL SERVERS:", servers.map(s => ({ name: s.name, userId: s.userId })));
}

main().finally(() => prisma.$disconnect());

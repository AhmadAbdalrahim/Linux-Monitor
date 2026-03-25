const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const key = "f49e4ee2-d848-432d-8afe-33859c928a6a";
  const server = await prisma.server.findUnique({
    where: { agentKey: key },
    include: { user: true }
  });
  
  if (server) {
    console.log("SERVER FOUND:", {
      id: server.id,
      name: server.name,
      userId: server.userId,
      userEmail: server.user?.email,
      hostname: server.hostname
    });
  } else {
    console.log("SERVER NOT FOUND FOR KEY:", key);
  }

  const allServers = await prisma.server.findMany({ include: { user: true } });
  console.log("ALL SERVERS:", allServers.map(s => ({ name: s.name, email: s.user?.email, key: s.agentKey })));
}

main().finally(() => prisma.$disconnect());

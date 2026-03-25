const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testApi() {
  const sessionId = "a110a568-d9d1-4d37-88ab-d7298646b3f4"; // From my check_users.js output earlier
  
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });
  
  if (!session) {
    console.log("SESSION NOT FOUND");
    return;
  }
  
  console.log("SESSION USER:", session.user.id, session.user.email);
  
  const servers = await prisma.server.findMany({
    where: { userId: session.user.id }
  });
  
  console.log("RAW SERVERS FROM DB:", servers.length);
  
  try {
    const formatted = servers.map((s) => ({
      id: s.id,
      name: s.name,
      memoryTotal: s.memoryTotal.toString(),
    }));
    console.log("FORMATTED SUCCESS:", formatted);
  } catch (e) {
    console.error("FORMATTING ERROR:", e.message);
  }
}

testApi().finally(() => prisma.$disconnect());

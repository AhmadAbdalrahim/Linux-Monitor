const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const http = require("http");

async function testFetch() {
  const session = await prisma.session.findFirst({ include: { user: true } });
  if (!session) {
    console.log("No active sessions found in DB");
    return;
  }
  
  console.log(`Testing with Session ID: ${session.id} (User: ${session.user.email})`);
  
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/servers",
    method: "GET",
    headers: {
      "Cookie": `linux_monitor_session=${session.id}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      console.log("BODY:", data);
    });
  });

  req.on("error", (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.end();
}

testFetch().finally(() => prisma.$disconnect());

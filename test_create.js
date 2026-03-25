const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const http = require("http");

async function testCreate() {
  const session = await prisma.session.findFirst({ include: { user: true } });
  if (!session) {
    console.log("No sessions found");
    return;
  }
  
  const data = JSON.stringify({ name: "Testing Create" });
  
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/agent/create-key",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `linux_monitor_session=${session.id}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = "";
    res.on("data", (chunk) => body += chunk);
    res.on("end", () => console.log("BODY:", body));
  });

  req.write(data);
  req.end();
}

testCreate().finally(() => prisma.$disconnect());

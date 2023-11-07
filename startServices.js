require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");

const { BASE_PORT, N } = process.env;
const servers = [];

const decoder = new TextDecoder();

for (let i = 0; i < N; ++i) {
  const port = (parseInt(BASE_PORT) + i).toString();
  // console.log(port)
  const currentServer = spawn(
    "node",
    [`${path.join(__dirname, "./bin/www")}`],
    {
      // env: { PORT: port },
      env: { ...process.env, PORT: port },
    }
  );
  servers.push(currentServer);
  currentServer.stdout.on("data", (data) =>
    console.log(`(server ${i})`, decoder.decode(data).slice(0, -1))
  );
  // PORT=${basePort + i}
}

process.on("SIGINT", function () {
  servers.forEach((server) => server.kill("SIGINT"));
});

// setInterval(() => console.log(3), 1000)

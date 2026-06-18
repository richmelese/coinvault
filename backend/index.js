const app = require("./app");
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");

const parsedPort = parseInt(process.env.PORT, 10);
const PORT = parsedPort || 4000;

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

const startServer = async () => {
  const { default: getPort } = await import("get-port");
  const final_port = await getPort({ port: PORT });

  app.listen(final_port, () => {
    console.log(`Server running on port ${final_port}`);
  });
};

startServer();
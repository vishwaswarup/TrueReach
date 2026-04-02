import "dotenv/config";
import { createApp } from "./server/app";

async function startServer() {
  const app = await createApp();
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();

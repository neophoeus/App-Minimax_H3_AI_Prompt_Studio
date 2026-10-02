import dotenv from "dotenv";
import { createStudioApp, startStudioServer } from "./server/core/appFactory";
import { LlamaCppEngine } from "./server/engines/llamaCppEngine";

dotenv.config();

const engine = new LlamaCppEngine();
const app = createStudioApp({
  engine,
  engineName: "Local llama.cpp (RTX 5090) Offline Engine",
});

const PORT = Number(process.env.PORT) || 3000;
startStudioServer(app, PORT, "Local llama.cpp");

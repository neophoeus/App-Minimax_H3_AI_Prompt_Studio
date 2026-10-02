import dotenv from "dotenv";
import { createStudioApp, startStudioServer } from "./server/core/appFactory";
import { OllamaEngine } from "./server/engines/ollamaEngine";

dotenv.config();

const engine = new OllamaEngine();
const app = createStudioApp({
  engine,
  engineName: "Local Ollama Offline Engine",
});

const PORT = Number(process.env.PORT) || 3000;
startStudioServer(app, PORT, "Local Ollama");

import dotenv from "dotenv";
import { createStudioApp, startStudioServer } from "./server/core/appFactory";
import { GeminiApiEngine } from "./server/engines/geminiApiEngine";

dotenv.config();

const engine = new GeminiApiEngine();
const app = createStudioApp({
  engine,
  engineName: "Gemini API Direct Engine",
});

const PORT = Number(process.env.PORT) || 3000;
startStudioServer(app, PORT, "Gemini API Direct");

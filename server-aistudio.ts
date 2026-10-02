import dotenv from "dotenv";
import { createStudioApp, startStudioServer } from "./server/core/appFactory";
import { AiStudioEngine } from "./server/engines/aiStudioEngine";

dotenv.config();

const engine = new AiStudioEngine();
const app = createStudioApp({
  engine,
  engineName: "Google AI Studio Cloud Engine",
});

const PORT = Number(process.env.PORT) || 3000;
startStudioServer(app, PORT, "AI Studio");

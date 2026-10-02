import dotenv from "dotenv";
import { createStudioApp, startStudioServer } from "./server/core/appFactory";
import { PaidApiEngine } from "./server/engines/paidApiEngine";

dotenv.config();

const engine = new PaidApiEngine();
const app = createStudioApp({
  engine,
  engineName: "Gemini Paid API Direct Engine",
});

const PORT = Number(process.env.PORT) || 3000;
startStudioServer(app, PORT, "Paid API Direct");

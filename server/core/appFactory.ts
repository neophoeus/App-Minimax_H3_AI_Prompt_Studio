import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { StudioEngine } from "./types";

export interface CreateAppOptions {
  engine: StudioEngine;
  port?: number;
  engineName?: string;
}

export function createStudioApp(options: CreateAppOptions) {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Status endpoint
  app.get("/api/system/mode-status", async (req, res) => {
    try {
      const status = await options.engine.getStatus();
      return res.json(status);
    } catch (err: any) {
      console.error("Error retrieving system mode status:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve status",
      });
    }
  });

  // Prompt generation
  app.post("/api/generate-h3-prompt", async (req, res) => {
    try {
      const data = await options.engine.generateH3Prompt(req.body);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("Error generating MiniMax H3 prompt:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to generate prompt",
      });
    }
  });

  // Dialogue generation
  app.post("/api/generate-dialogue", async (req, res) => {
    try {
      const data = await options.engine.generateDialogue(req.body);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("Error generating dialogue:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to generate dialogue",
      });
    }
  });

  // Reference media analysis
  app.post("/api/analyze-reference-media", async (req, res) => {
    try {
      const description = await options.engine.analyzeReferenceMedia(req.body);
      return res.json({ success: true, description });
    } catch (err: any) {
      console.error("Error analyzing reference media:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to analyze reference media",
      });
    }
  });

  // Optimize prompt
  app.post("/api/optimize-existing-prompt", async (req, res) => {
    try {
      const data = await options.engine.optimizePrompt(req.body);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("Error optimizing prompt:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to optimize prompt",
      });
    }
  });

  // Refine series episode
  app.post("/api/refine-series-episode", async (req, res) => {
    try {
      const refinedEpisode = await options.engine.refineSeriesEpisode(req.body);
      return res.json({ success: true, refinedEpisode });
    } catch (err: any) {
      console.error("Error refining series episode:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to refine episode",
      });
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Server Error:", err);
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || "伺服器處理請求時發生錯誤",
    });
  });

  return app;
}

export async function startStudioServer(app: express.Express, port: number = 3000, engineTitle: string = "Studio") {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || port;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${engineTitle}] MiniMax-H3 Prompt Studio Server running on http://localhost:${PORT}`);
  });
}

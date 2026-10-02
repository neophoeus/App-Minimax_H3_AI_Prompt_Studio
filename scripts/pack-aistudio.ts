import fs from "fs";
import path from "path";

function copyRecursive(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

export function packAiStudio(rootDir: string = process.cwd(), outDirName: string = "dist-aistudio") {
  const targetDir = path.join(rootDir, outDirName);

  console.log(`[AI Studio Packager] Initializing pure AI Studio distribution in: ${targetDir}`);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Copy Frontend Assets & Configs
  console.log("[AI Studio Packager] Copying frontend src and root configuration files...");
  copyRecursive(path.join(rootDir, "src"), path.join(targetDir, "src"));
  fs.copyFileSync(path.join(rootDir, "index.html"), path.join(targetDir, "index.html"));
  fs.copyFileSync(path.join(rootDir, "vite.config.ts"), path.join(targetDir, "vite.config.ts"));
  fs.copyFileSync(path.join(rootDir, "tsconfig.json"), path.join(targetDir, "tsconfig.json"));
  fs.copyFileSync(path.join(rootDir, "metadata.json"), path.join(targetDir, "metadata.json"));

  if (fs.existsSync(path.join(rootDir, "assets"))) {
    copyRecursive(path.join(rootDir, "assets"), path.join(targetDir, "assets"));
  }

  // 2. Copy Shared Core
  console.log("[AI Studio Packager] Copying server/core modules...");
  copyRecursive(path.join(rootDir, "server", "core"), path.join(targetDir, "server", "core"));

  // 3. Copy ONLY AI Studio Engine & Gemini Core
  console.log("[AI Studio Packager] Copying pure AI Studio engine files (excluding Ollama & llama.cpp)...");
  const enginesTargetDir = path.join(targetDir, "server", "engines");
  fs.mkdirSync(enginesTargetDir, { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, "server", "engines", "geminiCore.ts"),
    path.join(enginesTargetDir, "geminiCore.ts")
  );
  fs.copyFileSync(
    path.join(rootDir, "server", "engines", "aiStudioEngine.ts"),
    path.join(enginesTargetDir, "aiStudioEngine.ts")
  );

  // 4. Copy server-aistudio.ts as the root server.ts
  console.log("[AI Studio Packager] Setting up server-aistudio.ts as primary server.ts entry...");
  fs.copyFileSync(path.join(rootDir, "server-aistudio.ts"), path.join(targetDir, "server.ts"));

  // 5. Generate Pure AI Studio package.json
  console.log("[AI Studio Packager] Generating pure AI Studio package.json...");
  const rawPkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
  const purePkg = {
    name: "minimax-h3-ai-prompt-studio",
    private: true,
    version: rawPkg.version || "5.0.0",
    type: "module",
    scripts: {
      dev: "tsx server.ts",
      build: "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
      start: "node dist/server.cjs",
      preview: "vite preview",
      lint: "tsc --noEmit",
    },
    dependencies: rawPkg.dependencies,
    devDependencies: rawPkg.devDependencies,
  };
  fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify(purePkg, null, 2), "utf-8");

  // 6. Generate Clean .env.example
  fs.writeFileSync(
    path.join(targetDir, ".env.example"),
    `# Google AI Studio Environment Variables
GEMINI_API_KEY=
PORT=3000
NODE_ENV=production
AI_STUDIO_MODE=true
`,
    "utf-8"
  );

  console.log("[AI Studio Packager] ✅ Pure AI Studio distribution package created successfully!");
  console.log(`[AI Studio Packager] Target directory: ${targetDir}`);
}

// Self execution when invoked via CLI
if (process.argv[1] && process.argv[1].includes("pack-aistudio")) {
  packAiStudio();
}

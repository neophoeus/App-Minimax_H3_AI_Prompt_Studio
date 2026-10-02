import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { packAiStudio } from "../../scripts/pack-aistudio";

describe("AI Studio Pure Packager Verification", () => {
  const testOutputDir = path.join(process.cwd(), "test-dist-aistudio");

  after(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  test("packAiStudio exports complete and pure package for Google AI Studio", () => {
    packAiStudio(process.cwd(), "test-dist-aistudio");

    // 1. Must include cloud required files
    assert.ok(fs.existsSync(path.join(testOutputDir, "server.ts")), "server.ts must exist as root entry");
    assert.ok(fs.existsSync(path.join(testOutputDir, "metadata.json")), "metadata.json must exist");
    assert.ok(fs.existsSync(path.join(testOutputDir, "package.json")), "package.json must exist");
    assert.ok(fs.existsSync(path.join(testOutputDir, "index.html")), "index.html must exist");
    assert.ok(fs.existsSync(path.join(testOutputDir, "src", "App.tsx")), "src/App.tsx must exist");
    assert.ok(fs.existsSync(path.join(testOutputDir, "server", "core", "prompts.ts")), "server/core/prompts.ts must exist");
    assert.ok(fs.existsSync(path.join(testOutputDir, "server", "engines", "aiStudioEngine.ts")), "aiStudioEngine.ts must exist");
    assert.ok(fs.existsSync(path.join(testOutputDir, "server", "engines", "geminiCore.ts")), "geminiCore.ts must exist");

    // 2. package.json must point to server.ts
    const pkg = JSON.parse(fs.readFileSync(path.join(testOutputDir, "package.json"), "utf-8"));
    assert.equal(pkg.scripts.dev, "tsx server.ts");

    // 3. Strictly exclude offline engines and windows batch scripts
    assert.ok(!fs.existsSync(path.join(testOutputDir, "server", "engines", "ollamaEngine.ts")), "ollamaEngine.ts must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "server", "engines", "llamaCppEngine.ts")), "llamaCppEngine.ts must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "server-ollama.ts")), "server-ollama.ts must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "server-llamacpp.ts")), "server-llamacpp.ts must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "start_ollama.bat")), "start_ollama.bat must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "start_llamacpp.bat")), "start_llamacpp.bat must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "start_paid_api.bat")), "start_paid_api.bat must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "pack_aistudio.bat")), "pack_aistudio.bat must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, ".git")), ".git must be excluded");
    assert.ok(!fs.existsSync(path.join(testOutputDir, "node_modules")), "node_modules must be excluded");
  });
});

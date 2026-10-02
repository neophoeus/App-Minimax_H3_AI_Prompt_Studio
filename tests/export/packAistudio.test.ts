import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { packAiStudio } from "../../scripts/pack-aistudio";

describe("AI Studio Pure Packager Verification", () => {
  const testOutputDir = path.join(process.cwd(), "test-dist-aistudio");
  const testZipPath = path.join(process.cwd(), "test-aistudio.zip");

  after(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testZipPath)) {
      fs.rmSync(testZipPath, { force: true });
    }
  });

  test("packAiStudio exports complete and pure package for Google AI Studio", () => {
    packAiStudio(process.cwd(), "test-dist-aistudio", "test-aistudio.zip");

    // 1. Must include cloud required files in dist directory
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

    // 4. Verify ZIP file exists and ALL entries strictly use POSIX '/' separators
    assert.ok(fs.existsSync(testZipPath), "ZIP archive must be generated");
    const zipBytes = fs.readFileSync(testZipPath);
    let i = 0;
    const zipEntries: string[] = [];
    while (i < zipBytes.length - 4) {
      if (
        zipBytes[i] === 0x50 &&
        zipBytes[i + 1] === 0x4b &&
        zipBytes[i + 2] === 0x01 &&
        zipBytes[i + 3] === 0x02
      ) {
        const nameLen = zipBytes.readUInt16LE(i + 28);
        const extraLen = zipBytes.readUInt16LE(i + 30);
        const commentLen = zipBytes.readUInt16LE(i + 32);
        const name = zipBytes.toString("utf8", i + 46, i + 46 + nameLen);
        zipEntries.push(name);
        i += 46 + nameLen + extraLen + commentLen;
      } else {
        i++;
      }
    }

    assert.ok(zipEntries.length > 0, "ZIP archive must contain files");
    for (const entry of zipEntries) {
      assert.ok(!entry.includes("\\"), `Entry '${entry}' must not contain Windows backslashes`);
      assert.ok(!entry.startsWith("./"), `Entry '${entry}' must not start with './'`);
      assert.ok(!entry.startsWith("/"), `Entry '${entry}' must not start with '/'`);
    }

    // Must contain standard forward-slash paths
    assert.ok(zipEntries.includes("src/App.tsx"), "Must contain 'src/App.tsx' with forward slash");
    assert.ok(zipEntries.includes("server/core/prompts.ts"), "Must contain 'server/core/prompts.ts' with forward slash");
    assert.ok(zipEntries.includes("package.json"), "Must contain 'package.json'");
  });
});

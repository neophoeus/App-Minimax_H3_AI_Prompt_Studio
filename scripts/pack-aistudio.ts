import fs from "fs";
import path from "path";
import zlib from "zlib";

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

interface ZipEntryItem {
  relativePath: string;
  data: Buffer;
}

function getAllFiles(dir: string, baseDir: string = dir): ZipEntryItem[] {
  let results: ZipEntryItem[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      // Force POSIX forward slash path representation for all entries
      const rel = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      results.push({
        relativePath: rel,
        data: fs.readFileSync(fullPath),
      });
    }
  }
  return results;
}

/**
 * Standard PKZIP 2.0 Writer using Node native zlib
 * Enforces POSIX forward slashes ('/') in all entry names for Google AI Studio cloud compatibility.
 */
export function createStandardZip(sourceDir: string, zipFilePath: string): void {
  const files = getAllFiles(sourceDir);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.relativePath, "utf8");
    const content = file.data;
    const crc = zlib.crc32(content);
    const compressed = zlib.deflateRawSync(content);

    // 1. Local File Header (30 bytes)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4);         // Version needed: 2.0 (Deflate)
    localHeader.writeUInt16LE(0x0800, 6);     // Bit 11 set: UTF-8 filename encoding
    localHeader.writeUInt16LE(8, 8);          // Compression method: 8 (Deflate)
    localHeader.writeUInt16LE(0, 10);         // Last mod file time
    localHeader.writeUInt16LE(0, 12);         // Last mod file date
    localHeader.writeUInt32LE(crc, 14);       // CRC-32
    localHeader.writeUInt32LE(compressed.length, 18); // Compressed size
    localHeader.writeUInt32LE(content.length, 22);    // Uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);    // Filename length
    localHeader.writeUInt16LE(0, 28);                 // Extra field length

    localParts.push(localHeader, nameBuf, compressed);

    // 2. Central Directory Header (46 bytes)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);       // Central directory signature
    centralHeader.writeUInt16LE(0x0314, 4);           // Made by UNIX, version 2.0
    centralHeader.writeUInt16LE(20, 6);               // Version needed: 2.0
    centralHeader.writeUInt16LE(0x0800, 8);           // Bit 11 set: UTF-8 filename encoding
    centralHeader.writeUInt16LE(8, 10);               // Compression method: 8 (Deflate)
    centralHeader.writeUInt16LE(0, 12);               // Last mod file time
    centralHeader.writeUInt16LE(0, 14);               // Last mod file date
    centralHeader.writeUInt32LE(crc, 16);             // CRC-32
    centralHeader.writeUInt32LE(compressed.length, 20); // Compressed size
    centralHeader.writeUInt32LE(content.length, 24);    // Uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28);    // Filename length
    centralHeader.writeUInt16LE(0, 30);                 // Extra field length
    centralHeader.writeUInt16LE(0, 32);                 // File comment length
    centralHeader.writeUInt16LE(0, 34);                 // Disk number start
    centralHeader.writeUInt16LE(0, 36);                 // Internal file attributes
    centralHeader.writeUInt32LE((0o100644 * 0x10000) >>> 0, 38); // External file attributes (UNIX regular file 0644)
    centralHeader.writeUInt32LE(offset, 42);            // Relative offset of local header

    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);

  // 3. End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);       // EOCD signature
  eocd.writeUInt16LE(0, 4);                // Disk number
  eocd.writeUInt16LE(0, 6);                // Disk with central dir
  eocd.writeUInt16LE(files.length, 8);     // Total entries on this disk
  eocd.writeUInt16LE(files.length, 10);    // Total entries
  eocd.writeUInt32LE(centralSize, 12);     // Size of central directory
  eocd.writeUInt32LE(centralOffset, 16);   // Offset of central directory
  eocd.writeUInt16LE(0, 20);               // Comment length

  const finalZipBuffer = Buffer.concat([...localParts, ...centralParts, eocd]);
  fs.writeFileSync(zipFilePath, finalZipBuffer);
}

export function packAiStudio(
  rootDir: string = process.cwd(),
  outDirName: string = "dist-aistudio",
  zipFileName: string = "minimax-h3-aistudio.zip"
) {
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
    version: rawPkg.version || "5.1.0",
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

  // 7. Compress into Standard POSIX Forward-Slash Zip
  const zipPath = path.join(rootDir, zipFileName);
  console.log(`[AI Studio Packager] Compressing pure files into standard forward-slash zip: ${zipPath} ...`);
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  createStandardZip(targetDir, zipPath);

  console.log("[AI Studio Packager] ✅ Pure AI Studio distribution package created successfully!");
  console.log(`[AI Studio Packager] Target directory: ${targetDir}`);
  console.log(`[AI Studio Packager] Output zip: ${zipPath}`);
}

// Self execution when invoked via CLI
if (process.argv[1] && process.argv[1].includes("pack-aistudio")) {
  packAiStudio();
}

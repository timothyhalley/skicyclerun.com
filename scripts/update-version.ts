// scripts/update-version.ts  (new file – run with `npx tsx scripts/update-version.ts`)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";

const VERSION_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) V(\d{2})\.(\d{3})$/;

interface Options {
  major?: boolean;
  date?: string;
}

function parseArgs(): Options {
  const options: Options = {};
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg === "--major") options.major = true;
    else if (arg.startsWith("--date=")) options.date = arg.split("=")[1];
  }
  return options;
}

function readVersion(): string {
  const file = readFileSync("version.json", "utf8");
  const { version } = JSON.parse(file) as { version: string };
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(
      `Version in version.json does not match pattern: ${version}`,
    );
  }
  return version;
}

function formatVersion(date: string, major: number, minor: number) {
  return `${date} V${major.toString().padStart(2, "0")}.${minor
    .toString()
    .padStart(3, "0")}`;
}

function bumpVersion(current: string, opts: Options) {
  const [, y, m, d, majorStr, minorStr] = current.match(VERSION_PATTERN)!;
  const date = opts.date ?? `${y}-${m}-${d}`;
  const major = Number(majorStr);
  const minor = Number(minorStr);

  if (opts.major) {
    return {
      version: formatVersion(date, major + 1, 0),
      major: major + 1,
      minor: 0,
    };
  }

  if (date !== `${y}-${m}-${d}`) {
    return {
      version: formatVersion(date, major, 0),
      major,
      minor: 0,
    };
  }

  return {
    version: formatVersion(date, major, minor + 1),
    major,
    minor: minor + 1,
  };
}

function writeVersion(newVersion: string) {
  writeFileSync(
    "version.json",
    JSON.stringify({ version: newVersion }, null, 2) + "\n",
  );
  console.log(`📦 version.json → ${newVersion}`);
}

function updatePackageJson(newVersion: string) {
  const pkgPath = "package.json";
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`📦 ${pkgPath} → ${newVersion}`);
}

function replaceInFile(filePath: string, pattern: RegExp, replacement: string) {
  const absolutePath = join(process.cwd(), filePath);
  const content = readFileSync(absolutePath, "utf8");
  const updated = content.replace(pattern, replacement);
  if (updated !== content) {
    writeFileSync(absolutePath, updated);
    console.log(`✏️  ${filePath} updated`);
  }
}

async function main() {
  const opts = parseArgs();
  const currentVersion = readVersion();
  const { version: newVersion } = bumpVersion(currentVersion, opts);

  writeVersion(newVersion);
  updatePackageJson(newVersion);

  replaceInFile(
    "src/skicyclerun.config.ts",
    /version:\s*"[^"]+"/,
    `version: "${newVersion}"`,
  );

  const mdFiles = await fg(["**/*.md", "!node_modules/**", "!dist/**"]);
  for (const file of mdFiles) {
    replaceInFile(file, /^version:\s?.*$/m, `version: ${newVersion}`);
  }

  console.log(`✅ Version synchronized to ${newVersion}`);
}

main().catch((err) => {
  console.error("Version update failed:", err);
  process.exit(1);
});

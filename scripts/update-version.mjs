import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";

const VERSION_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) V(\d{2})\.(\d{3})$/;

function parseArgs() {
  const options = {};
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--major") {
      options.major = true;
      continue;
    }
    if (arg === "--date") {
      const nextArg = args[index + 1];
      if (nextArg && !nextArg.startsWith("--")) {
        options.date = nextArg;
        index += 1;
      }
      continue;
    }
    if (arg.startsWith("--date=")) {
      options.date = arg.split("=")[1];
    }
  }

  return options;
}

function readVersion() {
  const file = readFileSync("version.json", "utf8");
  const { version } = JSON.parse(file);

  if (!VERSION_PATTERN.test(version)) {
    throw new Error(
      `Version in version.json does not match pattern: ${version}`,
    );
  }

  return version;
}

function formatVersion(date, major, minor) {
  return `${date} V${major.toString().padStart(2, "0")}.${minor.toString().padStart(3, "0")}`;
}

function bumpVersion(current, opts) {
  const [, year, month, day, majorStr, minorStr] =
    current.match(VERSION_PATTERN);
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const date = opts.date ?? todayDate;
  const major = Number(majorStr);
  const minor = Number(minorStr);

  if (opts.major) {
    return {
      version: formatVersion(date, major + 1, 0),
      major: major + 1,
      minor: 0,
    };
  }

  if (date !== `${year}-${month}-${day}`) {
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

function writeVersion(newVersion) {
  writeFileSync(
    "version.json",
    `${JSON.stringify({ version: newVersion }, null, 2)}\n`,
  );
  console.log(`📦 version.json → ${newVersion}`);
}

function updatePackageJson(newVersion) {
  const pkgPath = "package.json";
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`📦 ${pkgPath} → ${newVersion}`);
}

function replaceInFile(filePath, pattern, replacement) {
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

main().catch((error) => {
  console.error("Version update failed:", error);
  process.exit(1);
});

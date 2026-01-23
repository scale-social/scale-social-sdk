const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const mode = process.argv[2];
const isDev = mode === "dev";
const isProd = mode === "prod";

if (!isDev && !isProd) {
  console.error('Usage: node scripts/publish.cjs "dev" | "prod"');
  process.exit(1);
}

const requiredBranch = isDev ? "dev" : "main";
const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
  encoding: "utf8",
}).trim();

if (currentBranch !== requiredBranch) {
  console.error(
    `Refusing to publish ${mode} from "${currentBranch}". ` +
      `Switch to "${requiredBranch}" first.`
  );
  process.exit(1);
}

const targetName = isDev ? "@scale-social/sdk-dev" : "@scale-social/sdk";
const restoreName = "@scale-social/sdk";
const repoRoot = path.resolve(__dirname, "..");

const filePaths = [
  path.join(repoRoot, "package.json"),
  path.join(repoRoot, "package-lock.json"),
  path.join(repoRoot, "README.md"),
].filter((filePath) => fs.existsSync(filePath));

const originalContents = new Map();

const replacePackageName = (text, name) =>
  text.replace(/@scale-social\/sdk-dev|@scale-social\/sdk/g, name);

const writeUpdatedFiles = (name) => {
  filePaths.forEach((filePath) => {
    const original = fs.readFileSync(filePath, "utf8");
    originalContents.set(filePath, original);
    const updated = replacePackageName(original, name);
    fs.writeFileSync(filePath, updated, "utf8");
  });
};

const restoreFiles = (name) => {
  filePaths.forEach((filePath) => {
    const original = originalContents.get(filePath);
    if (original !== undefined) {
      fs.writeFileSync(filePath, original, "utf8");
      return;
    }
    const current = fs.readFileSync(filePath, "utf8");
    const updated = replacePackageName(current, name);
    fs.writeFileSync(filePath, updated, "utf8");
  });
};

try {
  writeUpdatedFiles(targetName);
  execSync("npm publish --access public", { stdio: "inherit" });
} finally {
  if (isDev) {
    restoreFiles(restoreName);
  }
}

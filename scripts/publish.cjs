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
    `Refusing to set ${mode} from "${currentBranch}". ` +
      `Switch to "${requiredBranch}" first.`
  );
  process.exit(1);
}

const targetName = isDev ? "@scale-social/sdk-dev" : "@scale-social/sdk";
const targetLicense = isDev ? "UNLICENSED" : "SEE LICENSE IN LICENSE";
const repoRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");

const filePaths = [
  path.join(repoRoot, "package-lock.json"),
  path.join(repoRoot, "README.md"),
].filter((filePath) => fs.existsSync(filePath));

const replacePackageName = (text, name) =>
  text.replace(/@scale-social\/sdk-dev|@scale-social\/sdk/g, name);

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
packageJson.name = targetName;
packageJson.license = targetLicense;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

filePaths.forEach((filePath) => {
  const original = fs.readFileSync(filePath, "utf8");
  const updated = replacePackageName(original, targetName);
  fs.writeFileSync(filePath, updated, "utf8");
});

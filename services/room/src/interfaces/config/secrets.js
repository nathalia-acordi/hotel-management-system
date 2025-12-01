import fs from "fs";

function readFromFileVar(varName) {
  const filePath = process.env[varName];
  if (!filePath) return null;
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
}

export function getSecret(key, fileKey) {
  if (fileKey) {
    const fileVal = readFromFileVar(fileKey);
    if (fileVal) return fileVal;
  }
  return process.env[key];
}

export function getSecretSource(key, fileKey) {
  if (fileKey && process.env[fileKey]) return "file";
  if (process.env[key]) return "env";
  return null;
}

const fs = require("fs");
const content = fs.readFileSync("src/pages/app-mode/DashboardPage.tsx", "utf8");

const lines = content.split("\n");
let divBalance = 0;
let inComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // simple comment ignore
  if (line.includes("/*")) inComment = true;
  if (line.includes("*/")) {
    inComment = false;
    continue;
  }
  if (inComment) continue;

  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;

  // Also track fragments and tags that self-close or are other elements but we'll just track general open/close if it helps,
  // but let's stick to div balance strictly for this purpose.

  divBalance += opens - closes;
}

console.log("Final div balance:", divBalance);

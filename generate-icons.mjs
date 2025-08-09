import fs from "fs";
import path from "path";

const iconsDir = path.resolve("src/icons");
const indexFile = path.join(iconsDir, "index.ts");

const files = fs
  .readdirSync(iconsDir)
  .filter((file) => file.endsWith(".svg"));

const exports = files
  .map((file) => {
    const name = file
      .replace(".svg", "")
      .replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());
    return `export { default as ${name} } from "./${file}";`;
  })
  .join("\n");

fs.writeFileSync(indexFile, exports);
console.log(`✅ Generated ${indexFile} with ${files.length} icons.`);

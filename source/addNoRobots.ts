import * as fs from "fs-extra";
import * as path from "path";

const directoryPath = path.join(__dirname, "../../docs-realm/source/sdk");
const textToAdd = `.. meta::
   :robots: noindex, nosnippet

`;

async function prependTextToFile(filePath: string) {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const updatedContent = textToAdd + fileContent;
    await fs.writeFile(filePath, updatedContent, "utf8");
    console.log(`Text prepended to ${filePath}`);
  } catch (error) {
    console.error(`Error prepending text to ${filePath}:`, error);
  }
}

async function iterateDirectory(dir: string) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await iterateDirectory(filePath);
      } else if (stat.isFile()) {
        await prependTextToFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
}

iterateDirectory(directoryPath).then(() => {
  console.log("All files have been processed.");
});

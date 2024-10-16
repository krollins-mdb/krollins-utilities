import * as fs from "fs-extra";
import * as path from "path";

// TODO: make path and textToRemove CLI arguments
const directoryPath = path.join(
  __dirname,
  "../../docs-app-services/source/users"
);
const textToRemove = "noindex, ";

// create async function that reads a file, then finds and removes a string from it
async function removeTextFromFile(filePath: string) {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const updatedContent = fileContent.replace(textToRemove, "");

    await fs.writeFile(filePath, updatedContent, "utf8");
    console.log(`Text removed from ${filePath}`);
  } catch (error) {
    console.error(`Error removing text from ${filePath}:`, error);
  }
}

async function iterateDirectory(dir: string) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        const dirName = path.basename(filePath);
        if (
          dirName !== "includes" &&
          dirName !== "examples" &&
          dirName !== "images"
        ) {
          await iterateDirectory(filePath);
        }
      } else if (stat.isFile() && path.extname(file) === ".txt") {
        await removeTextFromFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
}

iterateDirectory(directoryPath).then(() => {
  console.log("All files have been processed.");
});

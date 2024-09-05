import * as fs from "fs-extra";
import * as path from "path";

const directoryPath = path.join(
  __dirname,
  "../../docs-realm/source/sdk/node/crud"
);
const textToAdd = `
.. meta::
   :robots: noindex, nosnippet
`;

async function addTextToFile(filePath: string) {
  try {
    await fs.appendFile(filePath, textToAdd);
    console.log(`Text added to ${filePath}`);
  } catch (error) {
    console.error(`Error adding text to ${filePath}:`, error);
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
        await addTextToFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
}

iterateDirectory(directoryPath).then(() => {
  console.log("All files have been processed.");
});

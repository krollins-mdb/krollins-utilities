import data from "./data/docs-devcenter-content-snapshot.json";
import { promises as fs, constants } from "fs";
import path from "path";

interface Page {
  _id: { $oid: string };
  sourceName: string;
  url: string;
  action: string;
  body: string;
  format: string;
  metadata: {
    tags: string[];
    productName: string;
    version: boolean;
  };
  title: string;
  updated: { $date: string };
}

// TODO: Should probably clear /dist/content at beginning of script.
const root = path.resolve("./dist/content");
const directoryRegex =
  /flutter|java|swift|dotnet|react-native|node|kotlin|cpp|web|studio/;
const content = data as Page[];
// Include only docs-realm content. Exclude Java API content.
const realmContent = content.filter(
  (page) =>
    page.sourceName == "snooty-realm" && !page.url.includes("/java/api/")
);

const writePage = async (page: Page) => {
  const sdk = page.url.match(directoryRegex);
  const parts = page.url.split("/");
  // TODO: add additional directories as needed? Need to be programmatically created.

  const filename = parts.pop()!.split("?")[0] || parts.pop();
  const directory = sdk ? path.join(root, sdk[0]) : root;
  const filepath = path.join(directory, `${filename!}.md`);

  // console.log(filepath);

  // If this is an SDK page and there isn't a directory, create one.
  if (sdk) {
    // try {
    //   fs.access(directory);
    //   console.log(directory, constants.R_OK | constants.W_OK);
    //   console.log(">>>> Directory exists");
    // } catch (error) {
    //   console.log(">>>> Directory does not exist");
    //   await fs.mkdir(directory);

    //   console.log(error);
    // }

    try {
      await fs.writeFile(filepath, page.body);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          await fs.mkdir(directory);

          writePage(page);

          // setTimeout(() => {
          //   writePage(page);
          // }, 500);
        }
      }
    }
  }

  // await fs.writeFile(filepath, page.body);
};

try {
  console.log("content length: ", content.length);
  console.log("realmContent length: ", realmContent.length);

  for (const page of realmContent) {
    writePage(page);
  }
} catch (erroror) {
  console.log(erroror);
}

import * as fs from "fs-extra";
import * as path from "path";

// Look for these rST directives:
// ..code-block
// ..io-code-block

// Output code examples to JSON. JSON objects should include the following properties:
// - code: the code example
// - language: the language of the code example
// - type: the type of code example (e.g., code-block, io-code-block)
// - id: a unique identifier for the code example
// - path: the path to the file containing the code example

// Create a typescript type for JSON code example object
interface CodeExample {
  code: string;
  language: string;
  type: string;
  id: string;
  path: string;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const inputPath = path.join(__dirname, "../../../cloud-docs/source/");
const outputPath = "./source/code-examples";
const examplesOutputPath = `${outputPath}/code-examples.json`;
const analysisOutputPath = `${outputPath}/analysis.json`;
const docsRepoPaths = []; // Implement after I have a list of repos.

async function getCodeExamples(filePath: string): Promise<CodeExample[]> {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const lines = fileContent.split("\n");
    const codeExamples: CodeExample[] = [];
    let codeBlock = "";
    let language = "";
    let type = "";
    let id = "";
    let path = filePath;
    let inCodeBlock = false;

    // TODO: define different behavior to get code example strings from
    // .. code-block and ..io-code-block. currently does not work. Need to
    // figure out how to properly parse the rST so that we programmatically know
    // when a directive starts and ends. Probably need to pull in a real
    // parser for that.
    for (const line of lines) {
      const codeBlockMatch = line.match(
        /^\s*\.\.\s*(code-block|io-code-block|literalinclude)::\s*$/
      );

      if (codeBlockMatch) {
        if (inCodeBlock && codeBlock) {
          codeExamples.push({ code: codeBlock, language, type, id, path });
          codeBlock = "";
        }
        type = codeBlockMatch[1];
        inCodeBlock = true;
        language = "";
      } else if (inCodeBlock) {
        const languageMatch = line.match(/^\s*:\s*language:\s*(\w+)\s*$/);
        if (languageMatch) {
          language = languageMatch[1];
        } else if (line.trim() === "" && codeBlock.trim() === "") {
          // End of code block
          inCodeBlock = false;
          if (codeBlock) {
            codeExamples.push({ code: codeBlock, language, type, id, path });
            codeBlock = "";
          }
        } else {
          codeBlock += line + "\n";
        }
      }
    }

    if (inCodeBlock && codeBlock) {
      codeExamples.push({ code: codeBlock, language, type, id, path });
    }

    return codeExamples;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// for every .txt or .rst file in the directory and subdirectories, get code examples
async function iterateDirectory(dir: string): Promise<CodeExample[]> {
  const codeExamples: CodeExample[] = [];

  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        const subDirExamples = await iterateDirectory(filePath);
        codeExamples.push(...subDirExamples);
      } else if (
        stat.isFile() &&
        (path.extname(file) === ".txt" || path.extname(file) === ".rst")
      ) {
        const examples = await getCodeExamples(filePath);
        codeExamples.push(...examples);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return codeExamples;
}

async function analyzeCodeExamples(codeExamples: CodeExample[]): Promise<void> {
  const analysis = {
    total: codeExamples.length,
    languages: {} as Record<string, number>,
  };

  for (const example of codeExamples) {
    if (analysis.languages[example.language]) {
      analysis.languages[example.language]++;
    } else {
      analysis.languages[example.language] = 1;
    }
  }

  await fs.writeJson(analysisOutputPath, analysis, { spaces: 2 });
  console.log(`Analysis written to ${analysisOutputPath}`);
}

async function main() {
  const examples = await iterateDirectory(inputPath);
  await fs.writeJson(examplesOutputPath, examples, { spaces: 2 });
  console.log(`Code examples written to ${outputPath}`);

  await analyzeCodeExamples(examples);
}

main();

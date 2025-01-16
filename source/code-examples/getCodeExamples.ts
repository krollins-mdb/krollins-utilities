import * as fs from "fs-extra";
import * as path from "path";
import repos from "./docs-repos.json";

interface CodeExample {
  code: string;
  language: string;
  type: string;
  id: string;
  path: string;
}

interface Stats {
  total: number;
  languages: Record<string, number>;
  repos: Record<string, number>;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const outputPath = "./source/code-examples/generated";
const docsRepoPaths: string[] = [];

// TODO: consider using the GitHub API to get repo contents instead of requiring
// the repo to be cloned locally. Alternatively, automatically clone all the repos.

// for every object in repos, get the pathName and push it to docsRepoPaths
for (const repo of repos) {
  const absolutePath = path.join(__dirname, "../../../", repo.pathName);
  docsRepoPaths.push(absolutePath);
}

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

    // TODO: handle language shorthand and standardize. For example, "js" and "javascript"
    // TODO: refactor to use a switch statement to control flow
    for (const line of lines) {
      if (
        line.includes(".. code-block::") ||
        line.includes(".. io-code-block::") ||
        line.includes(".. literalinclude::")
      ) {
        if (inCodeBlock && codeBlock) {
          codeExamples.push({ code: codeBlock, language, type, id, path });
          codeBlock = "";
        }
        type = line.includes("code-block")
          ? "code-block"
          : line.includes("io-code-block")
          ? "io-code-block"
          : "literalinclude";
        inCodeBlock = true;
        if (type === "code-block") {
          const languageMatch = line.match(
            /^\s*\.\.\s*code-block::\s*(\w+)\s*$/
          );
          if (languageMatch) {
            language = languageMatch[1];
          }
        } else {
          language = "";
        }
      } else if (inCodeBlock) {
        if (type !== "code-block") {
          const languageMatch = line.match(/^\s*:\s*language:\s*(\w+)\s*$/);
          if (languageMatch) {
            language = languageMatch[1];
          }
        }
        if (line.trim() === "" && codeBlock.trim() === "") {
          // End of code block
          inCodeBlock = false;
          if (codeBlock) {
            codeExamples.push({ code: codeBlock, language, type, id, path });
            codeBlock = "";
          }
        } else {
          codeBlock += line + "\n"; // Accumulate lines of code within the code block
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

interface AnalyzeCodeExamplesParams {
  codeExamples: CodeExample[];
  name: string;
}

async function analyzeCodeExamples({
  codeExamples,
  name,
}: AnalyzeCodeExamplesParams): Promise<Stats> {
  const analysis: Stats = {
    total: codeExamples.length,
    languages: {} as Record<string, number>,
    repos: {} as Record<string, number>,
  };

  for (const example of codeExamples) {
    if (analysis.languages[example.language]) {
      analysis.languages[example.language]++;
    } else {
      analysis.languages[example.language] = 1;
    }

    const repoName = name;
    if (analysis.repos[repoName]) {
      analysis.repos[repoName]++;
    } else {
      analysis.repos[repoName] = 1;
    }
  }

  return analysis;
}

async function main() {
  let overallStats: Stats = {
    total: 0,
    languages: {},
    repos: {},
  };

  for (const repo of repos) {
    // replace all non-alphanumeric characters with a dash in repo.name
    const safeRepoName = repo.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    try {
      const absolutePath = path.join(__dirname, "../../../", repo.pathName);
      await fs.access(absolutePath);
      console.log(`Analyzing ${repo.name} at ${absolutePath}`);

      const examples = await iterateDirectory(absolutePath);

      // If there are examples, write them to a file
      if (examples.length) {
        await fs.writeJson(
          `${outputPath}/examples/${safeRepoName}-examples.json`,
          examples,
          {
            spaces: 2,
          }
        );
      }

      const stats = await analyzeCodeExamples({
        codeExamples: examples,
        name: repo.name,
      });

      // if there is at least 1 code example, write stats to a file
      if (stats.total) {
        await fs.writeJson(
          `${outputPath}/analysis/${safeRepoName}-analysis.json`,
          stats,
          {
            spaces: 2,
          }
        );
      }

      // add stat values to overallStats
      overallStats.total += stats.total;
      for (const language in stats.languages) {
        if (overallStats.languages[language]) {
          overallStats.languages[language] += stats.languages[language];
        } else {
          overallStats.languages[language] = stats.languages[language];
        }
      }
      for (const repo in stats.repos) {
        if (overallStats.repos[repo]) {
          overallStats.repos[repo] += stats.repos[repo];
        } else {
          overallStats.repos[repo] = stats.repos[repo];
        }
      }
    } catch (error) {
      console.error(`Path does not exist: ${repo.pathName}`);
    }
  }

  await fs.writeJson(`${outputPath}/analysis.json`, overallStats, {
    spaces: 2,
  });
  console.log(`Analysis written to ${outputPath}-analysis.json`);
}

main();

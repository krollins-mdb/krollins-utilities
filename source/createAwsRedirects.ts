import * as fs from "fs-extra";
import * as path from "path";

// get urls from the source file at ./source/urls.txt
const urlsFile = path.join(__dirname, "/aws-redirects/urls.txt");
// get the redirects file at ./source/redirects.json
const redirectsFile = path.join(__dirname, "/aws-redirects/redirects.json");

// For every url in urlsFile, create a redirect object for Amazon AWS S3 static hosting and add it to redirectsFile
async function createAwsRedirects() {
  try {
    const urls = await fs.readFile(urlsFile, "utf8");
    const urlsArray = urls.split("\n");

    const redirects = urlsArray.map((url) => {
      // handle oooooold java version
      if (url.includes("android/10.0.0-beta.3")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/android/10.0.0-beta.3/javadoc/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("android/10.0.0-beta.4")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/android/10.0.0-beta.4/javadoc/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("java/10.0.0-BETA.6")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/java/10.0.0-BETA.6/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("java/10.0.0-BETA.8")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/java/10.0.0-BETA.8/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("java/10.0.1")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/java/10.0.1/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("java/10.2.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/java/10.2.0/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("java/10.3.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/java/10.3.0/",
          },
        };
      }

      // handle oooooold java version
      if (url.includes("/android/latest")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/android/latest/javadoc/",
          },
        };
      }

      // handle cpp latest version
      if (url.includes("cpp/latest/")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/cpp/latest/",
          },
        };
      }

      // handle .NET latest version
      if (url.includes("dotnet/latest")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/dotnet/latest/",
          },
        };
      }

      // handle js v10
      if (url.includes("js/10.0.0-beta.11")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/js/10.0.0-beta.11/",
          },
        };
      }

      // handle js latest
      if (url.includes("js/latest")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/js/latest/",
          },
        };
      }

      // handle kotlin 1.0
      if (url.includes("kotlin/1.0.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/kotlin/1.0.0/library-base/",
          },
        };
      }

      // handle kotlin 1.0.1
      if (url.includes("kotlin/1.0.1")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/kotlin/1.0.1/library-base/",
          },
        };
      }

      // handle kotlin 1.0.2
      if (url.includes("kotlin/1.0.2")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/kotlin/1.0.2/library-base/",
          },
        };
      }

      // handle kotlin 1.2.0
      if (url.includes("kotlin/1.2.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/kotlin/1.2.0/library-base/",
          },
        };
      }

      // handle kotlin 1.4.0
      if (url.includes("kotlin/1.4.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/kotlin/1.4.0/library-base/",
          },
        };
      }

      // handle kotlin latest
      if (url.includes("kotlin/latest")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/kotlin/latest/library-base/",
          },
        };
      }

      // handle objective-c 10.0.0-beta.2
      if (url.includes("objc/10.0.0-beta.2")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/objc/10.0.0-beta.2/",
          },
        };
      }

      // handle objective-c 10.0.0-beta.5
      if (url.includes("objc/10.0.0-beta.5")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/objc/10.0.0-beta.5/",
          },
        };
      }

      // handle objective-c 10.0.0-beta.6
      if (url.includes("objc/10.0.0-beta.6")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/objc/10.0.0-beta.6/",
          },
        };
      }

      // handle objective-c 10.2.0
      if (url.includes("objc/10.2.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/objc/10.2.0/",
          },
        };
      }

      // handle objective-c latest
      if (url.includes("objc/latest")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/objc/latest/",
          },
        };
      }

      // handle swift 10.0.0-beta.2
      if (url.includes("swift/10.0.0-beta.2")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.0.0-beta.2/",
          },
        };
      }

      // handle swift 10.0.0-beta.3
      if (url.includes("swift/10.0.0-beta.3")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.0.0-beta.3/",
          },
        };
      }

      // handle swift 10.0.0-beta.5
      if (url.includes("swift/10.0.0-beta.5")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.0.0-beta.5/",
          },
        };
      }

      // handle swift 10.0.0-beta.6
      if (url.includes("swift/10.0.0-beta.6")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.0.0-beta.6/",
          },
        };
      }

      // handle swift 10.0.0
      if (url.includes("swift/10.0.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.0.0/",
          },
        };
      }

      // handle swift 10.1.4
      if (url.includes("swift/10.1.4")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.1.4/",
          },
        };
      }

      // handle swift 10.3.0
      if (url.includes("swift/10.3.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.3.0/",
          },
        };
      }

      // handle swift 10.47.0
      if (url.includes("swift/10.47.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.47.0/",
          },
        };
      }

      // handle swift 10.7.0
      if (url.includes("swift/10.7.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.7.0/",
          },
        };
      }

      // handle swift 10.9.0
      if (url.includes("swift/10.9.0")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/10.9.0/",
          },
        };
      }

      // handle swift latest
      if (url.includes("swift/latest")) {
        return {
          Condition: {
            KeyPrefixEquals: url.split("docs/")[1],
          },
          Redirect: {
            ReplaceKeyPrefixWith: "realm-sdks/swift/latest/",
          },
        };
      }

      // handle general case
      return {
        Condition: {
          KeyPrefixEquals: url.split("docs/")[1],
        },
        Redirect: {
          ReplaceKeyPrefixWith: "",
        },
      };
    });

    await fs.writeJson(redirectsFile, redirects, { spaces: 2 });
    console.log("Redirects created.");
  } catch (error) {
    console.error("Error creating redirects:", error);
  }
}

createAwsRedirects();

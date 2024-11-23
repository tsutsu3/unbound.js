import { UnboundControlClient } from "../src/index";
import fs from "fs";
import path from "path";
import YAML from "yaml";

const baseDir = path.resolve(__dirname);
const unboundVersion = process.env.UNBOUND_VERSION || "1.22.0";
const dataDir = path.join(baseDir, "data", unboundVersion);

interface ParsedData {
  data: TestCase[];
}

interface TestCase {
  title: string;
  raw: string;
  expected: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// interface ResponseData {
//   raw: string;
//   json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
// }

describe(`Unix domain socket docker server tests. Unbound version: ${unboundVersion}`, () => {
  let client: UnboundControlClient;
  const unixSocketPath = path.join(
    baseDir,
    "../unbound-config/unix/socket/unbound.ctl",
  );

  beforeAll(() => {
    client = new UnboundControlClient(unixSocketPath);
  });

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".yaml"));

  for (const file of files) {
    const command = file.replace(".yaml", "");
    const fileContent = fs.readFileSync(path.join(dataDir, file), "utf-8");
    const contents = YAML.parse(fileContent) as ParsedData;

    // TODO: Check json schema
    for (const { title } of contents.data) {
      it(`${command} test: ${title}`, async () => {
        await expect(
          client[command as keyof UnboundControlClient](),
        ).resolves.not.toThrow();

        await client.disconnect();
      });
    }
  }
});

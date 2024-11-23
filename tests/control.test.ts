import { UnixMockServer, MockServer } from "./mockServer";
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

interface ResponseData {
  raw: string;
  json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe(`Unix domain socket mock server tests. Unbound version: ${unboundVersion}`, () => {
  let server: MockServer;
  let client: UnboundControlClient;
  const unixSocketPath = "/tmp/mock.sock";

  beforeAll(() => {
    if (fs.existsSync(unixSocketPath)) {
      fs.unlinkSync(unixSocketPath);
    }
    server = new UnixMockServer(unixSocketPath);
    client = new UnboundControlClient(unixSocketPath);
  });

  afterEach(async () => {
    await server.stop();
  });

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".yaml"));

  for (const file of files) {
    const command = file.replace(".yaml", "");
    const fileContent = fs.readFileSync(path.join(dataDir, file), "utf-8");
    const contents = YAML.parse(fileContent) as ParsedData;

    for (const { title, raw, expected } of contents.data) {
      it(`${command} test: ${title}`, async () => {
        server.start(raw);
        const result = (await client[
          command as keyof UnboundControlClient
        ]()) as ResponseData;

        expect(result.raw).toEqual(raw);
        expect(result.json).toEqual(expected);
      });
    }
  }
});

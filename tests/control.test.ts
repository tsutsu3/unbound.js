import fs from "fs";
import path from "path";
import YAML from "yaml";
import { UnixMockServer, TcpTlsMockServer, MockServer } from "./mockServer";
import { UnixUnboundClient, TcpUnboundClient } from "../src/index";
import { TlsConfig } from "../src/types";

const baseDir = path.resolve(__dirname);
const unboundVersion = process.env.UNBOUND_VERSION || "1.22.0";
const dataDir = path.join(baseDir, "data", unboundVersion);

interface ParsedData {
  data: TestCase[];
}

interface TestCase {
  title: string;
  options: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  raw: string;
  expected: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  exception: string;
}

interface Response {
  raw: string;
  json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe(`Unix domain socket mock server tests. Unbound version: ${unboundVersion}`, () => {
  let server: MockServer;
  let client: UnixUnboundClient;
  const unixSocketPath = "/tmp/mock.sock";

  beforeAll(() => {
    if (fs.existsSync(unixSocketPath)) {
      fs.unlinkSync(unixSocketPath);
    }
    server = new UnixMockServer(unixSocketPath);
    client = new UnixUnboundClient(unixSocketPath);
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

    for (const { title, options, raw, expected, exception } of contents.data) {
      it(`${command} test: ${title}`, async () => {
        server.start(raw);

        const method = client[command as keyof UnixUnboundClient].bind(
          client,
        ) as (...args: any[]) => Promise<Response>; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof method !== "function") {
          throw new Error(`Invalid command: ${command}`);
        }

        const args =
          options !== undefined
            ? Array.isArray(options)
              ? options
              : [options]
            : [];

        let result;

        if (exception) {
          await expect(method.apply(client, args)).rejects.toThrow(exception);
        } else {
          result = await method.apply(client, args);
          expect(result.raw).toEqual(raw);
          expect(result.json).toEqual(expected);
        }

        await client.disconnect();
      });
    }
  }
});

describe(`TCP socket docker server tests. Unbound version: ${unboundVersion}`, () => {
  let server: MockServer;
  let client: TcpUnboundClient;
  const keyPath = path.join(baseDir, "./key/unbound_control.key");
  const certPath = path.join(baseDir, "./key/unbound_control.pem");
  const tlsConfig: TlsConfig = {
    cert: certPath,
    key: keyPath,
  };

  const options = {
    key: fs.readFileSync(path.join(baseDir, "./key/unbound_server.key")),
    cert: fs.readFileSync(path.join(baseDir, "./key/unbound_server.pem")),
    requestCert: false,
  };

  beforeAll(() => {
    server = new TcpTlsMockServer("localhost", 8953, options);
    client = new TcpUnboundClient("localhost", 8953, tlsConfig);
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

    for (const { title, options, raw, expected, exception } of contents.data) {
      it(`${command} test: ${title}`, async () => {
        server.start(raw);

        const method = client[command as keyof UnixUnboundClient].bind(
          client,
        ) as (...args: any[]) => Promise<Response>; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof method !== "function") {
          throw new Error(`Invalid command: ${command}`);
        }

        const args =
          options !== undefined
            ? Array.isArray(options)
              ? options
              : [options]
            : [];

        let result;

        if (exception) {
          await expect(method.apply(client, args)).rejects.toThrow(exception);
        } else {
          result = await method.apply(client, args);
          expect(result.raw).toEqual(raw);
          expect(result.json).toEqual(expected);
        }

        await client.disconnect();
      });
    }
  }
});

import fs from "fs";
import path from "path";
import YAML from "yaml";
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

describe(`Unix domain socket docker server tests. Unbound version: ${unboundVersion}`, () => {
  let client: UnixUnboundClient;
  const unixSocketPath = path.join(
    baseDir,
    "../unbound-config/unix/socket/unbound.ctl",
  );

  beforeAll(() => {
    client = new UnixUnboundClient(unixSocketPath);
  });

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".yaml"));

  for (const file of files) {
    const command = file.replace(".yaml", "");
    const fileContent = fs.readFileSync(path.join(dataDir, file), "utf-8");
    const contents = YAML.parse(fileContent) as ParsedData;

    for (const { title, options } of contents.data) {
      it(`${command} test: ${title}`, async () => {
        console.log(`Running ${command} test: ${title}`);

        const method = client[command as keyof UnixUnboundClient].bind(
          client,
        ) as (...args: any[]) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof method !== "function") {
          throw new Error(`Invalid command: ${command}`);
        }

        const args =
          options !== undefined
            ? Array.isArray(options)
              ? options
              : [options]
            : [];

        try {
          const result = await method.apply(client, args); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
          expect(result).toMatchSnapshot();
        } catch (error) {
          expect((error as Error).message).toMatchSnapshot();
        } finally {
          await client.disconnect();
        }
      });
    }
  }
});

describe(`TCP socket docker server tests. Unbound version: ${unboundVersion}`, () => {
  let client: TcpUnboundClient;
  const keyPath = path.join(
    baseDir,
    "../unbound-config/tls/key/unbound_control.key",
  );
  const certPath = path.join(
    baseDir,
    "../unbound-config/tls/key/unbound_control.pem",
  );
  const tlsConfig: TlsConfig = {
    cert: certPath,
    key: keyPath,
  };

  beforeAll(() => {
    client = new TcpUnboundClient("localhost", 8953, tlsConfig);
  });

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".yaml"));

  for (const file of files) {
    const command = file.replace(".yaml", "");
    const fileContent = fs.readFileSync(path.join(dataDir, file), "utf-8");
    const contents = YAML.parse(fileContent) as ParsedData;

    for (const { title, options } of contents.data) {
      it(`${command} test: ${title}`, async () => {
        console.log(`Running ${command} test: ${title}`);

        const method = client[command as keyof UnixUnboundClient].bind(
          client,
        ) as (...args: any[]) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof method !== "function") {
          throw new Error(`Invalid command: ${command}`);
        }

        const args =
          options !== undefined
            ? Array.isArray(options)
              ? options
              : [options]
            : [];

        try {
          const result = await method.apply(client, args); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
          expect(result).toMatchSnapshot();
        } catch (error) {
          expect((error as Error).message).toMatchSnapshot();
        } finally {
          await client.disconnect();
        }
      });
    }
  }
});

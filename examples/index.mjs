import path from "path";
import { fileURLToPath } from "url";
import { UnboundControlClient, UnboundError } from "../dist/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.resolve(__dirname, "..");

const unixSocketName = path.join(
  baseDir,
  "unbound-config/unix/socket/unbound.ctl",
);

const client = new UnboundControlClient(unixSocketName);

(async () => {
  try {
    const response = await client.status();
    console.log(response.raw);
    console.log(response.json);
  } catch (error) {
    if (error instanceof UnboundError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
})();

(async () => {
  try {
    const response = await client.status();
    console.log(response.raw);
    console.log(response.json);
  } catch (error) {
    if (error instanceof UnboundError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
})();

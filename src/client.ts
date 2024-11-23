import { UnboundControl } from "./control";
import { ParseError } from "./error";

export interface Response {
  raw: string;
  json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface StatusResponse {
  version: string;
  verbosity: number;
  threads: number;
  modules: string[];
  uptime: number;
  options: string[];
  pid: number;
  status: string;
}

export interface NestedRecord {
  [key: string]: string | number | NestedRecord;
}

export class UnboundControlClient {
  private control: UnboundControl;

  constructor(
    unixSocketName: string | null = null,
    // host: string = "127.0.0.1",
    // port: number = 8953,
    // tlsConfig?: TLSConfig,
  ) {
    this.control = new UnboundControl(unixSocketName);
  }

  private parseRawToJSON(raw: string): NestedRecord {
    const lines = raw.split("\n").filter((line) => line.trim() !== "");
    const result: NestedRecord = {};

    for (const line of lines) {
      const [key, value] = line.split("=").map((str) => str.trim());

      if (!key) {
        throw new ParseError(`Invalid key-value pair: ${line}`);
      }

      const keys = key.split(".");
      let current: NestedRecord = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {}; // 中間オブジェクトを作成
        }
        current = current[k] as NestedRecord;
      }

      const finalKey = keys[keys.length - 1];
      current[finalKey] = isNaN(Number(value)) ? value : Number(value);
    }

    return result;
  }

  // ==================== Socket connection/disconnection ====================
  public async connect(): Promise<void> {
    await this.control.initSocket();
  }

  public async disconnect(): Promise<void> {
    await this.control.closeSocket();
  }

  // ==================== Unbound control commands ====================

  /**
   * Display server status
   * @returns {Promise<Response>}
   */
  public async status(): Promise<Response> {
    const raw = await this.control.sendCommand("status");

    const lines = raw.split("\n");
    const result: Partial<StatusResponse> = {};

    for (const line of lines) {
      const [key, value] = line.split(":").map((s) => s.trim());

      switch (key) {
        case "version":
          result.version = value;
          break;
        case "verbosity":
          result.verbosity = parseInt(value, 10);
          break;
        case "threads":
          result.threads = parseInt(value, 10);
          break;
        case "modules":
          result.modules =
            value
              .match(/\[([^\]]+)\]/)?.[1]
              .trim()
              .split(" ") || [];
          break;
        case "uptime":
          result.uptime = parseInt(value.trim().split(" ")[0], 10);
          break;
        case "options":
          result.options = value
            .replace(/[[\]]/g, "")
            .trim()
            .split(" ")
            .map((item) => item.trim());
          break;
        default:
          if (key && key.startsWith("unbound")) {
            const match = key.match(/\(pid (\d+)\) is (.*)\.\.\./);
            if (match) {
              result.pid = parseInt(match[1], 10);
              result.status = match[2];
            }
          }
      }
    }

    return {
      raw: raw,
      json: result,
    };
  }

  public async stats(): Promise<Response> {
    const raw = await this.control.sendCommand("stats");
    return {
      raw: raw,
      json: this.parseRawToJSON(raw),
    };
  }

  public async reload(): Promise<string> {
    return this.control.sendCommand("reload");
  }

  public async stop(): Promise<string> {
    return this.control.sendCommand("stop");
  }
}

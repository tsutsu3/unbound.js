import { UnboundControl } from "./control";
import { ParseError } from "./error";

/**
 * A list of valid configuration options for the `set_option` command.
 */
export type ValidOption =
  | "statistics-interval"
  | "statistics-cumulative"
  | "do-not-query-localhost"
  | "harden-short-bufsize"
  | "harden-large-queries"
  | "harden-glue"
  | "harden-dnssec-stripped"
  | "harden-below-nxdomain"
  | "harden-referral-path"
  | "prefetch"
  | "prefetch-key"
  | "log-queries"
  | "hide-identity"
  | "hide-version"
  | "identity"
  | "version"
  | "val-log-level"
  | "val-log-squelch"
  | "ignore-cd-flag"
  | "add-holddown"
  | "del-holddown"
  | "keep-missing"
  | "tcp-upstream"
  | "ssl-upstream"
  | "max-udp-size"
  | "ratelimit"
  | "ip-ratelimit"
  | "cache-max-ttl"
  | "cache-min-ttl"
  | "cache-max-negative-ttl";

export interface Response {
  raw: string;
  json: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// export interface StatusResponse {
//   version: string;
//   verbosity: number;
//   threads: number;
//   modules: string[];
//   uptime: number;
//   options: string[];
//   pid: number;
//   status: string;
// }

// export interface StasResponse {
//   total: {
//     num: {
//       queries: number;
//       queries_ip_ratelimited: number;
//       queries_cookie_valid: number;
//       queries_cookie_client: number;
//       queries_cookie_invalid: number;
//       cachehits: number;
//       cachemiss: number;
//       prefetch: number;
//       queries_timed_out: number;
//       expired: number;
//       recursivereplies: number;
//     };
//     query: {
//       queue_time_us: {
//         max: number;
//       };
//     };
//     requestlist: {
//       avg: number;
//       max: number;
//       overwritten: number;
//       exceeded: number;
//       current: {
//         all: number;
//         user: number;
//       };
//     };
//     recursion: {
//       time: {
//         avg: number;
//         median: number;
//       };
//     };
//     tcpusage: number;
//   };
//   time: {
//     now: number;
//     up: number;
//     elapsed: number;
//   };
// }

export interface NestedRecord {
  [key: string]: string | number | string[] | NestedRecord;
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

  /**
   * Checks if the provided command is valid.
   *
   * This function parses the response from the `unbound-control` command to identify
   * whether the command is unsupported or invalid in the current version of the software.
   *
   * @param response - The response received from the `unbound-control` command.
   * @returns `true` if the command is valid.
   * @throws {CommandError} - Throws an error if the command is invalid or not supported.
   */
  // private checkValidCommand(response: string): boolean {
  //   const match = response.match(/error unknown command '(.+)'/);
  //   if (match) {
  //     throw new UnsupportedCommandError(`Unknown command: ${match[1]}`);
  //   }

  //   return true;
  // }

  /**
   * Checks if the provided IP address is valid.
   * @param address - The IP address to check.
   * @returns `true` if the IP address is valid.
   * @throws {ParseError} - Throws an error if the IP address is invalid.
   */
  private checkValidIp(address: string): boolean {
    if (address === "all") {
      return true;
    }

    if (address === "off") {
      return true;
    }

    if (!address.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      throw new ParseError(`Invalid IP address: ${address}`);
    }

    return true;
  }

  private parseRawToJSON(raw: string): NestedRecord {
    const lines = raw.split("\n").filter((line) => line.trim() !== "");
    const result: NestedRecord = {};

    for (const line of lines) {
      const [key, value] = line.split("=").map((str) => str.trim());

      if (!key) {
        throw new ParseError(`Invalid key-value pair: ${line}`);
      }

      // Check if the key starts with "histogram"
      if (key.startsWith("histogram")) {
        if (!result["histogram"]) {
          result["histogram"] = {};
        }

        const histogram = result["histogram"] as NestedRecord;
        const histogramKey = key.replace("histogram.", "");
        histogram[histogramKey] = isNaN(Number(value)) ? value : Number(value);
        continue;
      }

      const keys = key.split(".");
      let current: NestedRecord = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
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
   * Start the server.
   */
  public async start(): Promise<string> {
    return this.control.sendCommand("start");
  }

  /**
   * Stop the server. The server daemon exits.
   */
  public async stop(): Promise<string> {
    return this.control.sendCommand("stop");
  }

  /**
   * Reload the server. This flushes the cache and reads the config file fresh.
   */
  public async reload(): Promise<string> {
    return this.control.sendCommand("reload");
  }

  /**
   * Reload the server but try to keep the RRset and message cache if (re)configuration allows for it.
   */
  public async reload_keep_cache(): Promise<string> {
    return this.control.sendCommand("reload_keep_cache");
  }

  /**
   * Change verbosity value for logging.
   *
   * @param level - The verbosity level to set. Valid values are 0 to 5:
   *   - 0: No verbosity, only errors.
   *   - 1: Operational information.
   *   - 2: Detailed operational information.
   *   - 3: Query-level information.
   *   - 4: Algorithm-level information.
   *   - 5: Logs client identification for cache misses.
   *
   */
  public async verbosity(level: number): Promise<Response> {
    const raw = await this.control.sendCommand(`verbosity ${level.toString()}`);
    const lines = raw.split("\n");

    if (level < 0 || level >= 6 || level % 1 !== 0) {
      throw new ParseError(`Invalid verbosity level: ${level.toString()}`);
    }

    if (lines[0].startsWith("error")) {
      throw new ParseError(`Invalid verbosity level: ${level.toString()}`);
    }

    if (lines.length === 0) {
      throw new ParseError("No response received.");
    }

    if (lines[0] === "ok") {
      return {
        raw: raw,
        json: { status: "ok" },
      };
    }

    throw new ParseError(`Invalid response: ${raw}`);
  }

  /**
   * Reopen the logfile, close and open it.
   */
  public async log_reopen(): Promise<string> {
    return this.control.sendCommand("log_reopen");
  }

  /**
   * Print statistics.
   */
  public async stats(): Promise<Response> {
    const raw = await this.control.sendCommand("stats");
    const fixRaw = raw.replace(/num.query.tls=/g, "num.query.tls.num=");
    return {
      raw: raw,
      json: this.parseRawToJSON(fixRaw),
    };
  }

  /**
   * Peek at statistics. Prints them like the stats command does, but does not reset the internal counters to zero.
   */
  public async stats_noreset(): Promise<Response> {
    const raw = await this.control.sendCommand("stats_noreset");
    return {
      raw: raw,
      json: this.parseRawToJSON(raw),
    };
  }

  /**
   * Display server status. Exit code 3 if not running (the connection to the port is refused), 1 on error, 0 if running.
   */
  public async status(): Promise<Response> {
    const raw = await this.control.sendCommand("status");

    const lines = raw.split("\n");
    const result: Partial<NestedRecord> = {};

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

  // public async local_zone(name: string, type: string): Promise<string> {}

  // public async local_zone_remove(name: string): Promise<string> {}

  // public async local_data(rr: string, data: unknown): Promise<string> {}

  public async local_data_remove(name: string): Promise<string> {
    return this.control.sendCommand(`local_data_remove ${name}`);
  }

  /**
   * Add local zones read from stdin of unbound-control.
   */
  public async local_zones(): Promise<string> {
    return this.control.sendCommand("local_zones");
  }

  /**
   * Remove local zones read from stdin of unbound-control. Input is one name per line. For bulk removals.
   */
  public async local_zones_remove(): Promise<string> {
    return this.control.sendCommand("local_zones_remove");
  }

  public async dump_cache(): Promise<string> {
    return this.control.sendCommand("dump_cache");
  }

  public async load_cache(): Promise<string> {
    return this.control.sendCommand("load_cache");
  }

  public async lookup(name: string): Promise<string> {
    return this.control.sendCommand(`lookup ${name}`);
  }

  /**
   * Remove the name from the cache.
   *
   * @param name - The name to remove from the cache.
   * @param useCachedb - Whether to also flush the name from `cachedb` cache. Defaults to `false`.
   */
  public async flush(
    name: string,
    useCachedb: boolean = false,
  ): Promise<string> {
    const command = useCachedb ? `flush +c ${name}` : `flush ${name}`;
    return this.control.sendCommand(command);
  }

  /**
   * Remove the name, type information from the cache.
   * @param name - The name to remove from the cache.
   * @param type - The type of the record to remove.
   * @param useCachedb - Whether to also flush the name from `cachedb` cache. Defaults to `false`.
   */
  public async flush_type(
    name: string,
    type: string,
    useCachedb: boolean = false,
  ): Promise<string> {
    const command = useCachedb
      ? `flush_type +c ${name} ${type}`
      : `flush_type ${name} ${type}`;
    return this.control.sendCommand(command);
  }

  /**
   * Remove all information at or below the name from the cache.
   * @param name
   * @param useCachedb
   */
  public async flush_zone(
    name: string,
    useCachedb: boolean = false,
  ): Promise<string> {
    const command = useCachedb ? `flush_zone +c ${name}` : `flush_zone ${name}`;
    return this.control.sendCommand(command);
  }

  public async flush_bogus(useCachedb: boolean = false): Promise<string> {
    const command = useCachedb ? "flush_bogus +c" : "flush_bogus";
    return this.control.sendCommand(command);
  }

  public async flush_negative(useCachedb: boolean = false): Promise<string> {
    const command = useCachedb ? "flush_negative +c" : "flush_negative";
    return this.control.sendCommand(command);
  }

  public async flush_stats(): Promise<string> {
    return this.control.sendCommand("flush_stats");
  }

  public async flush_requestlist(): Promise<string> {
    return this.control.sendCommand("flush_requestlist");
  }

  public async dump_requestlist(): Promise<string> {
    return this.control.sendCommand("dump_requestlist");
  }

  public async flush_infra(address: string): Promise<string> {
    this.checkValidIp(address);
    return this.control.sendCommand(`flush_infra ${address}`);
  }

  /**
   * Show the contents of the infra cache.
   */
  public async dump_infra(): Promise<string> {
    return this.control.sendCommand("dump_infra");
  }

  /**
   * Set the option to the given value without a reload.
   * @param option - The configuration option to set. Must be one of the predefined valid options.
   * @param value - The value to assign to the option. The type and range depend on the option.
   */
  public async set_option(option: ValidOption, value: string): Promise<string> {
    return this.control.sendCommand(`set_option ${option}: ${value}`);
  }

  /**
   * Get the value of the option.
   * @param option
   * @returns
   */
  public async get_option(option: ValidOption): Promise<string> {
    return this.control.sendCommand(`get_option ${option}`);
  }

  public async list_stubs(): Promise<string> {
    return this.control.sendCommand("list_stubs");
  }

  public async list_forwards(): Promise<string> {
    return this.control.sendCommand("list_forwards");
  }

  public async list_insecure(): Promise<string> {
    return this.control.sendCommand("list_insecure");
  }

  public async list_local_zones(): Promise<string> {
    return this.control.sendCommand("list_local_zones");
  }

  public async list_local_data(): Promise<string> {
    return this.control.sendCommand("list_local_data");
  }

  public async insecure_add(zone: string): Promise<string> {
    return this.control.sendCommand(`insecure_add ${zone}`);
  }

  public async insecure_remove(zone: string): Promise<string> {
    return this.control.sendCommand(`insecure_remove ${zone}`);
  }

  /**
   * Add a new forward zone to running Unbound.
   *
   * @param zone - The zone name to forward (e.g., "example.com").
   * @param addresses - A list of forward addresses. These can be IPv4, IPv6, or nameserver names.
   * @param insecure - Whether to mark the zone as domain-insecure. Defaults to `false`.
   * @param useTLS - Whether to use TLS for upstream communication. Defaults to `false`.
   * @returns A promise that resolves with the server's response.
   * @throws {Error} - If the command fails or invalid parameters are provided.
   */
  public async forward_add(
    zone: string,
    addresses: string[],
    insecure: boolean = false,
    useTLS: boolean = false,
  ): Promise<string> {
    if (addresses.length === 0) {
      throw new ParseError("At least one address must be provided.");
    }

    for (const address of addresses) {
      this.checkValidIp(address);
    }

    // Build the command string with optional flags
    const flags = `${insecure ? "+i" : ""}${useTLS ? "+t" : ""}`;
    const command =
      `forward_add ${flags} ${zone} ${addresses.join(" ")}`.trim();

    return this.control.sendCommand(command);
  }

  public async forward_remove(
    zone: string,
    insecure: boolean = false,
  ): Promise<string> {
    const flags = insecure ? "+i" : "";
    return this.control.sendCommand(`forward_remove ${flags} ${zone}`);
  }

  /**
   * Add a new stub zone to running Unbound.
   *
   * @param zone - The stub zone name (e.g., "example.com").
   * @param addresses - A list of stub zone addresses. These can be IPv4, IPv6, or nameserver names.
   * @param insecure - Whether to mark the zone as domain-insecure. Defaults to `false`.
   * @param prime - Whether to set the stub zone as prime. Defaults to `false`.
   * @param useTLS - Whether to use TLS for upstream communication. Defaults to `false`.
   */
  public async stub_add(
    zone: string,
    addresses: string[],
    insecure: boolean = false,
    prime: boolean = false,
    useTLS: boolean = false,
  ): Promise<string> {
    if (addresses.length === 0) {
      throw new ParseError("At least one address must be provided.");
    }

    for (const address of addresses) {
      this.checkValidIp(address);
    }

    // Build the command string with optional flags
    const flags = `${insecure ? "+i" : ""}${prime ? "+p" : ""}${useTLS ? "+t" : ""}`;
    const command = `stub_add ${flags} ${zone} ${addresses.join(" ")}`.trim();

    return this.control.sendCommand(command);
  }

  public async stub_remove(
    zone: string,
    insecure: boolean = false,
  ): Promise<string> {
    const flags = insecure ? "+i" : "";
    return this.control.sendCommand(`stub_remove ${flags} ${zone}`);
  }

  /**
   * Setup forwarding mode.
   */
  public async forward(addresses: string | string[]): Promise<string> {
    if (typeof addresses === "string") {
      this.checkValidIp(addresses);
      return this.control.sendCommand(`forward ${addresses}`);
    }

    for (const address of addresses) {
      this.checkValidIp(address);
    }

    return this.control.sendCommand(`forward ${addresses.join(" ")}`);
  }

  /**
   * List the domains that are ratelimited.
   *
   * @param allDomains - Whether to include all domains (not just rate-limited ones). Defaults to `false`.
   */
  public async ratelimit_list(allDomains: boolean = false): Promise<string> {
    const command = `ratelimit_list ${allDomains ? "+a" : ""}`.trim();
    return this.control.sendCommand(command);
  }

  public async ip_ratelimit_list(allDomains: boolean = false): Promise<string> {
    const command = `ip_ratelimit_list ${allDomains ? "+a" : ""}`.trim();
    return this.control.sendCommand(command);
  }

  public async list_auth_zones(): Promise<string> {
    return this.control.sendCommand("list_auth_zones");
  }

  public async auth_zone_reload(zone: string): Promise<string> {
    return this.control.sendCommand(`auth_zone_reload ${zone}`);
  }

  public async auth_zone_transfer(zone: string): Promise<string> {
    return this.control.sendCommand(`auth_zone_transfer ${zone}`);
  }

  public async rpz_enable(zone: string): Promise<string> {
    return this.control.sendCommand(`rpz_enable ${zone}`);
  }

  public async rpz_disable(zone: string): Promise<string> {
    return this.control.sendCommand(`rpz_disable ${zone}`);
  }

  public async view_list_local_zones(view: string): Promise<string> {
    return this.control.sendCommand(`view_list_local_zones ${view}`);
  }

  public async view_local_zone(
    view: string,
    name: string,
    type: string,
  ): Promise<string> {
    return this.control.sendCommand(`view_local_zone ${view} ${name} ${type}`);
  }

  public async view_local_zone_remove(
    view: string,
    name: string,
  ): Promise<string> {
    return this.control.sendCommand(`view_local_zone_remove ${view} ${name}`);
  }

  public async view_list_local_data(view: string): Promise<string> {
    return this.control.sendCommand(`view_list_local_data ${view}`);
  }

  public async view_local_data(
    view: string,
    rr: string,
    data: string[],
  ): Promise<string> {
    return this.control.sendCommand(
      `view_local_data ${view} ${rr} ${data.join(" ")}`.trim(),
    );
  }

  public async view_local_data_remove(
    view: string,
    name: string,
  ): Promise<string> {
    return this.control.sendCommand(`view_local_data_remove ${view} ${name}`);
  }

  public async view_local_datas_remove(view: string): Promise<string> {
    return this.control.sendCommand(`view_local_datas_remove ${view}`);
  }

  public async view_local_datas(view: string): Promise<string> {
    return this.control.sendCommand(`view_local_datas ${view}`);
  }

  public async add_cookie_secret(secret: string): Promise<string> {
    return this.control.sendCommand(`add_cookie_secret ${secret}`);
  }

  public async drop_cookie_secret(): Promise<string> {
    return this.control.sendCommand("drop_cookie_secret");
  }

  public async activate_cookie_secret(): Promise<string> {
    return this.control.sendCommand("activate_cookie_secret");
  }

  public async print_cookie_secrets(): Promise<string> {
    return this.control.sendCommand("print_cookie_secrets");
  }
}

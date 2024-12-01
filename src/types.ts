/**
 * Configuration for the TLS connection.
 */
export interface TlsConfig {
  /** Certificate file. */
  cert: string;

  /** Key file. */
  key: string;

  /** CA certificate file. */
  ca?: string;
}

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

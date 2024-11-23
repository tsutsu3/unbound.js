import net from "net";
import { ConnectionError, CommandError } from "./error";
// import tls from "tls";

/**
 * Configuration for the TLS connection.
 */
// export interface TLSConfig {
//   /** Certificate file. */
//   cert: string;

//   /** Key file. */
//   key: string;

//   /** CA certificate file. */
//   ca?: string;

//   /** Reject unauthorized connections. If set to false, the server certificate is not verified. */
//   rejectUnauthorized: boolean;
// }

/**
 * A class to interact with an Unbound control interface via TCP or Unix socket.
 * Provides methods to establish connections and send commands to the Unbound DNS resolver.
 */
export class UnboundControl {
  /** The host address for TCP connections. */
  // private readonly host: string;

  /** The port number for TCP connections. */
  // private readonly port: number;

  /** The path to the Unix domain socket (if applicable). */
  private readonly unixSocketName: string | null;

  /** The underlying network socket for communication. */
  private socket: net.Socket | null = null;

  /** Optional TLS configuration for secure connections. */
  // private readonly tlsConfig: TLSConfig | null = null;

  /**
   * Creates a new instance of the UnboundControl class.
   *
   * @param unixSocketName - Path to the Unix domain socket. If specified, `host` and `port` are ignored.
   * @param host - The host address for TCP connections. Defaults to `127.0.0.1`.
   * @param port - The port number for TCP connections. Defaults to `8953`.
   * @param tlsConfig - Optional TLS configuration for secure connections.
   */
  constructor(
    unixSocketName: string | null = null,
    // host: string = "127.0.0.1",
    // port: number = 8953,
    // tlsConfig?: TLSConfig,
  ) {
    this.unixSocketName = unixSocketName;
    // this.host = host;
    // this.port = port;
    // this.tlsConfig = tlsConfig || null;
  }

  /**
   * Connects to the Unbound control interface.
   *
   * - If `unixSocketName` is provided, connects via a Unix domain socket.
   * - Otherwise, connects to the specified `host` and `port`.
   *
   * @returns A promise that resolves when the connection is established.
   * @throws An error if the connection fails.
   */
  public async initSocket(): Promise<net.Socket> {
    if (this.socket) {
      return this.socket;
    }

    return new Promise((resolve, reject) => {
      let socket: net.Socket;

      if (this.unixSocketName !== null) {
        socket = net.createConnection(this.unixSocketName);
      } else {
        throw new Error("Not implemented");
      }
      // else {
      //   socket = tls.createConnection({
      //     host: this.host,
      //     port: this.port,
      //     ...this.tlsConfig,
      //   });
      // }

      socket.once("connect", () => {
        this.socket = socket;
        resolve(socket);
      });

      socket.once("error", (err) => {
        socket.destroy();
        reject(new ConnectionError(err.message));
      });

      socket.once("close", () => {
        this.socket = null;
      });
    });
  }

  /**
   * Sends a command to the Unbound control interface and retrieves the raw response.
   *
   * @param command - The command to send.
   * @returns A promise that resolves with the raw response as a string.
   * @throws An error if the command cannot be sent or the response cannot be received.
   */
  public async sendCommand(command: string): Promise<string> {
    const socket = await this.initSocket();

    return new Promise((resolve, reject) => {
      let response = "";

      socket.write(`UBCT1 ${command}\n`, (err) => {
        if (err) {
          reject(new CommandError(err.message));
          return;
        }
      });

      socket.on("data", (data) => {
        response += data.toString();
      });

      socket.once("end", () => {
        socket.end();
        resolve(response);
      });

      socket.once("error", (err) => {
        socket.destroy();
        reject(new CommandError(err.message));
      });
    });
  }

  /**
   * Disconnects from the Unbound control interface.
   * Safely closes the socket if it is currently connected.
   *
   * @returns A promise that resolves when the socket is successfully closed.
   */
  public async closeSocket(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.end();
        this.socket = null;
        resolve();
      } else {
        resolve();
      }
    });
  }
}

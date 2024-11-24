import tls from "tls";
import fs from "fs";
import net from "net";

export interface MockServer {
  start(response: string, options?: tls.TlsOptions): void;
  stop(): Promise<void>;
}

export class UnixMockServer implements MockServer {
  private server: net.Server | null = null;
  private readonly socketPath: string;

  constructor(socketPath: string = "/tmp/mock.sock") {
    this.socketPath = socketPath;
  }

  start(response: string): void {
    if (fs.existsSync(this.socketPath)) {
      fs.unlinkSync(this.socketPath);
    }

    this.server = net.createServer((socket) => {
      socket.on("data", () => {
        socket.write(response);
        socket.end();
      });

      socket.on("end", () => {
        socket.destroy();
      });

      socket.on("error", () => {
        socket.destroy();
      });
    });

    this.server.listen(this.socketPath, () => {});
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          this.server = null;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export class TcpTlsMockServer implements MockServer {
  private server: tls.Server | null = null;
  private readonly port: number;
  private readonly host: string;
  private readonly tlsOptions: tls.TlsOptions;

  constructor(
    host: string = "localhost",
    port: number = 8080,
    tlsOptions: tls.TlsOptions,
  ) {
    this.host = host;
    this.port = port;
    this.tlsOptions = tlsOptions;
  }

  start(response: string): void {
    this.server = tls.createServer(this.tlsOptions, (socket) => {
      socket.on("data", () => {
        socket.write(response);
        socket.end();
      });

      socket.on("error", () => {});

      socket.on("end", () => {});
    });

    this.server.listen(this.port, this.host, () => {});
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

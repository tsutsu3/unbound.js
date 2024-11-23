/**
 * Base error class for all errors
 */
export class UnboundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnboundError";
  }
}

/**
 * Error class for connection errors
 */
export class ConnectionError extends UnboundError {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionError";
  }
}

/**
 * Error class for command errors
 */
export class CommandError extends UnboundError {
  constructor(message: string) {
    super(message);
    this.name = "CommandError";
  }
}

/**
 * Error class for parsing errors
 */
export class ParseError extends UnboundError {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Unsupported command error
 */
export class UnsupportedCommandError extends UnboundError {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedCommandError";
  }
}

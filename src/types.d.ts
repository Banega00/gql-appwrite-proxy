/**
 * Type definitions for Appwrite Functions.
 *
 * **Compatible with Appwrite `1.5.x` & `1.6.x`.**
 *
 * Provides typed interfaces for the request handling context in Appwrite cloud functions.
 */

/**
 * Represents the `Context` of the function including `Request` and `Response` handlers,
 * along with logging capabilities.
 */
export type Context = {
  /** The incoming request object. */
  req: Request;

  /** The response object providing methods to end the request. */
  res: Response;

  /**
   * Log messages during function execution.
   *
   * @param messages - The messages or object to log. Objects are converted to strings.
   */
  log: (...messages: any) => void;

  /**
   * Log error messages or object during function execution.
   *
   * @param messages - The error messages or object to log. Objects are converted to strings.
   */
  error: (...messages: any) => void;
};

/**
 * Represents an HTTP request received by the function.
 */
export type Request = {
  /** The parsed body of the request, which is a JSON object. */
  body: Record<string, any>;

  /**
   * The raw body of the request as a string.
   * @deprecated Use `bodyText` on `1.6.x`.
   */
  bodyRaw: string;

  /** The raw body of the request as a string. */
  bodyText: string;

  /** The parsed body of the request, which is a JSON object. */
  bodyJson: Record<string, any>;

  /** The binary body of the request. */
  bodyBinary: any;

  /** A dictionary of the headers included in the request. */
  headers: Record<string, any>;

  /** The HTTP method of the request (e.g., GET, POST). */
  method: string;

  /** The function domain host. */
  host: string;

  /** The scheme of the request (e.g., http, https). */
  scheme: string;

  /** A dictionary representing the query parameters of the request. */
  query: Record<string, any>;

  /** The raw query string part of the URL of the request. */
  queryString: string;

  /**
   * The port number as a string.
   * Should be a number but server.js uses quotes around port so, it is a string.
   */
  port: string;

  /** The full URL of the request. */
  url: string;

  /** The path component of the URL (excluding query string). */
  path: string;
};

/**
 * Represents the response to be sent back to the client.
 */
export type Response = {
  /**
   * Sends an empty response.
   */
  empty: () => void;

  /**
   * Sends a response with a specified body, status code, and headers.
   *
   * @param body - The body of the response.
   * @param statusCode - The HTTP status code (default 200).
   * @param headers - A dictionary of response headers (default empty).
   */
  send: (body: any, statusCode?: number, headers?: Record<string, any>) => void;

  /**
   * Sends a response with a specified body, status code, and headers.
   *
   * @param body - The body of the response.
   * @param statusCode - The HTTP status code (default 200).
   * @param headers - A dictionary of response headers (default empty).
   */
  text: (body: any, statusCode?: number, headers?: Record<string, any>) => void;

  /**
   * Sends a JSON response with a specified object, status code, and headers.
   *
   * @param object - The JSON object to send.
   * @param statusCode - The HTTP status code (default 200).
   * @param headers - A dictionary of response headers (default empty).
   */
  json: (
    object: any,
    statusCode?: number,
    headers?: Record<string, any>
  ) => void;

  binary: (
    bytes: any,
    statusCode?: number,
    headers?: Record<string, any>
  ) => void;

  /**
   * Redirects the client to a specified URL with a status code and headers.
   *
   * @param url - The URL to redirect to.
   * @param statusCode - The HTTP status code for redirection (default 301).
   * @param headers - A dictionary of response headers (default empty).
   */
  redirect: (
    url: string,
    statusCode?: number,
    headers?: Record<string, any>
  ) => void;
};

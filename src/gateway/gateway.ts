/**
 * Argument of `Gateway.paginate().next()`.
 * When reset = true specified, other params won't be accepted
 */
export type PaginateNext<Params> =
  | {
      reset: boolean;
      url?: undefined;
      params?: undefined;
    }
  | {
      reset?: undefined;
      url?: string;
      params?: Params;
    };

export interface Gateway {
  uri: string;
  streamingApiUrl: string;
  version?: string;
  accessToken?: string;
  get<T>(path: string, params: unknown, options?: Request): Promise<T>;
  post<T>(path: string, data: unknown, options?: Request): Promise<T>;
  put<T>(path: string, data: unknown, options?: Request): Promise<T>;
  patch<T>(path: string, data: unknown, options?: Request): Promise<T>;
  delete<T>(path: string, data: unknown, options?: Request): Promise<T>;
  stream<T>(path: string, params: URLSearchParams): AsyncIterableIterator<T>;
  paginate<T, U>(url: string, params?: U): AsyncGenerator<T, void, PaginateNext<U>>;
}

export interface GatewayConstructorParams {
  /** URI of the instance */
  uri: URL;
  /** Streaming API URL */
  streamingApiUrl?: URL;
  /** Access token of the user */
  accessToken?: string;
  /** Default request object */
  defaultOptions?: Request;
}

export type LoginParams = Omit<GatewayConstructorParams, "streamingApiUrl">;

export interface GatewayConstructor {
  new (params: GatewayConstructorParams): Gateway;
  login(params: LoginParams): Promise<Gateway>;
}

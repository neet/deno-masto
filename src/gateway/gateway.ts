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
  get<T>(path: string, data: unknown, options?: RequestInit): Promise<T>;
  post<T>(path: string, data: unknown, options?: RequestInit): Promise<T>;
  put<T>(path: string, data: unknown, options?: RequestInit): Promise<T>;
  patch<T>(path: string, data: unknown, options?: RequestInit): Promise<T>;
  delete<T>(path: string, data: unknown, options?: RequestInit): Promise<T>;
  paginate<T, U>(
    url: string,
    data?: U,
    options?: RequestInit
  ): AsyncGenerator<T, void, PaginateNext<U>>;
  stream<T>(
    path: string,
    data: unknown
  ): Promise<AsyncGenerator<T, void, void>>;
}

export interface GatewayConstructorParams {
  /** URI of the instance */
  uri: string;
  /** Streaming API URL */
  streamingApiUrl?: string;
  /** Access token of the user */
  accessToken?: string;
  /** Version of the instance */
  version?: string;
  /** Default request object */
  defaultOptions?: RequestInit;
}

export type LoginParams = Omit<
  GatewayConstructorParams,
  "streamingApiUrl" | "version"
>;

export interface GatewayConstructor {
  new (params: GatewayConstructorParams): Gateway;
  login(params: LoginParams): Promise<Gateway>;
}

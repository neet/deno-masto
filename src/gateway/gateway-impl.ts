import { camelCase, snakeCase } from "case/mod.ts";
import { connectWebSocket } from "ws/mod.ts";

import {
  Gateway,
  PaginateNext,
  GatewayConstructorParams,
  LoginParams,
} from "./gateway.ts";
import { Instance } from "../entities.ts";
import { transformKeys } from "./transform-keys.ts";
import { flattenData } from "./flatten-data.ts";
import {
  MastoConflictError,
  MastoForbiddenError,
  MastoGoneError,
  MastoNotFoundError,
  MastoRateLimitError,
  MastoUnauthorizedError,
  MastoUnprocessableEntityError,
} from "../errors.ts";

const MIME = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
};

export class GatewayImpl implements Gateway {
  uri: string;
  streamingApiUrl: string;
  accessToken: string;
  version: string;
  defaultOptions: RequestInit;

  constructor(params: GatewayConstructorParams) {
    this.uri = params.uri;
    this.streamingApiUrl = params.streamingApiUrl;
    this.accessToken = params.accessToken;
    this.version = params.version;
    this.defaultOptions = params.defaultOptions;
  }

  static async login<T extends typeof GatewayImpl>(
    this: T,
    params: LoginParams
  ) {
    const gateway = new this(params) as InstanceType<T>;
    const instance = await gateway.get<Instance>("/api/v1/instance");
    gateway.streamingApiUrl = instance.urls.streamingApi;
    return gateway;
  }

  private composeHeaders(init: HeadersInit) {
    const headers = new Headers(init);

    if (this.accessToken) {
      headers.append("Authorization", `Bearer ${this.accessToken}`);
    }

    if (headers.get("Content-Type") == null) {
      headers.set("Content-Type", MIME.JSON);
    }

    return headers;
  }

  private composeBody(data: unknown, contentType: string) {
    switch (contentType) {
      case MIME.JSON:
        return JSON.stringify(data);
      case MIME.FORM_DATA:
        return new FormData(flattenData(data));
      default:
        return;
    }
  }

  private handleError(error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.error ?? "Unexpected error occurred";

    switch (status) {
      case 401:
        throw new MastoUnauthorizedError(message);
      case 403:
        throw new MastoForbiddenError(message);
      case 404:
        throw new MastoNotFoundError(message);
      case 409:
        throw new MastoConflictError(message);
      case 410:
        throw new MastoGoneError(message);
      case 422:
        throw new MastoUnprocessableEntityError(message);
      case 429:
        throw new MastoRateLimitError(message);
      default:
        throw error;
    }
  }

  private async request<T>(
    rawUrl: string,
    rawData: unknown,
    rawInit: RequestInit
  ) {
    const url = new URL(rawUrl, this.uri);
    const data = transformKeys(rawData, snakeCase);
    const init = { ...rawInit, ...this.defaultOptions };

    if (init.method === "GET") {
      url.search = `?${new URLSearchParams(data)}`;
    }

    const headers = this.composeHeaders(init.headers);
    const body = this.composeBody(data, headers.get("Content-Type"));

    const response = await fetch(url.toString(), {
      ...init,
      headers,
      body,
    });

    const json = response.json();
    if (!response.ok) this.handleError(json);

    return transformKeys<T>(json, camelCase);
  }

  async get<T>(path: string, data?: unknown, init?: RequestInit) {
    const response = await this.request<T>(path, data, {
      method: "GET",
      ...init,
    });
    return response.data;
  }

  async post<T>(path: string, data?: unknown, init?: RequestInit) {
    const response = await this.request<T>(path, data, {
      method: "POST",
      ...init,
    });
    return response.data;
  }

  async delete<T>(path: string, data?: unknown, init?: RequestInit) {
    const response = await this.request<T>(path, data, {
      method: "DELETE",
      ...init,
    });
    return response.data;
  }

  async patch<T>(path: string, data?: unknown, init?: RequestInit) {
    const response = await this.request<T>(path, data, {
      method: "PATCH",
      ...init,
    });
    return response.data;
  }

  async put<T>(path: string, data?: unknown, init?: RequestInit) {
    const response = await this.request<T>(path, data, {
      method: "PUT",
      ...init,
    });
    return response.data;
  }

  async *stream<T>(path: string, params = {}) {
    const url = new URL(path, this.streamingApiUrl);
    url.search = `?${new URLSearchParams(params)}`;

    const headers = new Headers();
    headers.append("Sec-Websocket-Protocol", this.accessToken);

    const socket = await connectWebSocket(url, headers);

    for await (const message of socket) {
      if (typeof message === "string") {
        const json = JSON.parse(message);
        const data = transformKeys(json, camelCase);
        yield data as T;
      }
    }
  }

  async *paginate<T, U>(
    initialUrl: string,
    initialParams?: U,
    init?: RequestInit
  ): AsyncGenerator<T, void, PaginateNext<U> | undefined> {
    let nextUrl: string | undefined = initialUrl;
    let nextParams = initialParams;

    while (nextUrl) {
      const response = await this.request<T>(nextUrl, nextParams, {
        method: "GET",
        ...init,
      });

      const options = yield response.data;
      const linkHeaderNext = response.headers?.link?.match(
        /<(.+?)>; rel="next"/
      )?.[1];

      if (options?.reset) {
        nextUrl = initialUrl;
        nextParams = initialParams;
      } else {
        nextUrl = options?.url ?? linkHeaderNext;
        nextParams = options?.params;
      }
    }
  }
}

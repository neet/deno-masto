/* eslint-disable */
import axios from 'axios';
import { GatewayImpl } from '../gateway-impl';
// @ts-ignore
import { EventHandlerImpl, mockConnect } from '../event-handler-impl';
import {
  MastoGoneError,
  MastoConflictError,
  MastoNotFoundError,
  MastoRateLimitError,
  MastoUnauthorizedError,
  MastoForbiddenError,
  MastoUnprocessableEntityError,
} from '../../errors';
import 'isomorphic-form-data';

jest.mock('../event-handler-impl');

// Mock `axios.create`. We don't use any functions from axios
// but from `axios.create`
jest.mock('axios');
const mockAxios = jest.genMockFromModule<typeof axios>('axios');
(axios.create as jest.Mock).mockImplementation(() => mockAxios);

describe('GatewayImpl', () => {
  const gateway = new GatewayImpl({
    uri: 'https://example.com',
    version: '99.9.9',
    streamingApiUrl: 'wss://example.com',
  });

  beforeEach(() => {
    ((axios as any) as jest.Mock).mockClear();
    ((mockAxios as any) as jest.Mock).mockClear();
    ((mockAxios.request as any) as jest.Mock).mockClear();
    ((mockAxios.request as any) as jest.Mock).mockResolvedValue({
      data: undefined,
    });
  });

  test('login', async () => {
    ((mockAxios.request as any) as jest.Mock).mockResolvedValueOnce({
      data: {
        version: '2.8.0',
        urls: {
          streamingApi: 'wss://example.com/stream',
        },
      },
    });

    const params = {
      uri: 'https://example.com',
      accessToken: 'some token',
    };
    const gateway = await GatewayImpl.login(params);

    expect(gateway.version).toBe('2.8.0');
    expect(gateway.streamingApiUrl).toBe('wss://example.com/stream');
  });

  test('streamingApiUrl has been set if construct with streamingApiUrl', () => {
    const customGateway = new GatewayImpl({
      uri: 'https://example.com',
      streamingApiUrl: 'wss://example.com',
      version: '0.0.0',
    });
    expect(customGateway.streamingApiUrl).toBe('wss://example.com');
  });

  test('version has been set if construct with version ', () => {
    const customGateway = new GatewayImpl({
      uri: 'https://example.com',
      version: '1.2.3',
    });
    expect(customGateway.version).toBe('1.2.3');
  });

  test('accessToken has been set if construct with accessToken', () => {
    const customGateway = new GatewayImpl({
      uri: 'https://example.com',
      accessToken: 'token token',
      version: '0.0.0',
    });
    expect(customGateway.accessToken).toBe('token token');
  });

  test('this._uri accessor works', () => {
    const customGateway = new GatewayImpl({
      uri: 'https://example.com/aaa',
      version: '0.0.0',
    });
    customGateway.uri = 'https://example.com/bbb';
    expect(customGateway.uri).toEqual('https://example.com/bbb');
  });

  test('this._streamingApiUrl accessor works', () => {
    const customGateway = new GatewayImpl({
      uri: 'wss://example.com/aaa',
      version: '0.0.0',
    });
    customGateway.streamingApiUrl = 'wss://example.com/bbb';
    expect(customGateway.streamingApiUrl).toEqual('wss://example.com/bbb');
  });

  test('transform params', () => {
    const config = {
      params: { keyKey: 'value' },
      headers: { 'Content-Type': 'application/json' },
    };

    // @ts-ignore
    expect(gateway.transformConfig(config).params).toEqual({
      key_key: 'value',
    });
  });

  test('transform JSON to JS object', () => {
    const obj = { a: { b: { c: 'd' } } };
    const json = JSON.stringify(obj);
    // @ts-ignore
    const result = gateway.transformResponse(json);
    expect(result).toEqual(obj);
  });

  test('return raw data when response cannot parse as a JSON', () => {
    // @ts-ignore
    const result = gateway.transformResponse('aaa');
    expect(result).toEqual('aaa');
  });

  test('transform Object to JSON when `application/json`', () => {
    const config = {
      data: { a: 'foo' },
      headers: { 'Content-Type': 'application/json' },
    };
    // @ts-ignore
    const result = gateway.transformConfig(config);
    expect(result.data).toEqual(JSON.stringify(config.data));
  });

  test('transform Object to FormData when `multipart/form-data`', () => {
    const config = {
      data: { a: 'foo' },
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    // @ts-ignore
    const result = gateway.transformConfig(config);
    expect(result.data).toBeInstanceOf(FormData);
  });

  test('not transform data when unknown MIME given', () => {
    const config = {
      data: { a: 'foo' },
      headers: { 'Content-Type': 'image/png' },
    };
    // @ts-ignore
    const result = gateway.transformConfig(config);
    expect(result.data).toEqual({ a: 'foo' });
  });

  test('call mockAxios.request with given options', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };
    // @ts-ignore
    await gateway.request(options);
    expect((mockAxios.request as any) as jest.Mock).toBeCalledWith(options);
  });

  test('throw MastoUnauthorizedError when 401 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          error: 'Unauthorized',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoUnauthorizedError('Unauthorized'),
    );
  });

  test('throw MastoNotFoundError when 404 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          error: 'NotFound',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoNotFoundError('NotFound'),
    );
  });

  test('throw MastoRateLimitError when 429 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: {
          error: 'RateLimit',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoRateLimitError('RateLimit'),
    );
  });

  test('throw MastoForbiddenError when 403 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          error: 'Forbidden',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoForbiddenError('Forbidden'),
    );
  });

  test('throw MastoUnprocessableEntityError when 422 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          error: 'UnprocessableEntity',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoUnprocessableEntityError('UnprocessableEntity'),
    );
  });

  test('throw MastoGoneError when 401 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 410,
        data: {
          error: 'Gone',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoGoneError('Gone'),
    );
  });

  test('throw MastoConflictError when 409 responded', async () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          error: 'Conflict',
        },
      },
    });

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(
      new MastoConflictError('Conflict'),
    );
  });

  test('AxiosError: throw given error directly if non of prepared statuses matched', () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    const error = {
      isAxiosError: true,
      response: {
        status: 418,
      },
    };

    ((mockAxios.request as any) as jest.Mock).mockRejectedValue(error);
    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(error);
  });

  test('Error: throw given error directly if non of prepared statuses matched', () => {
    const options = {
      method: 'POST',
      url: '/',
    };

    const rejectedValue = new Error('qwerty');
    ((mockAxios.request as any) as jest.Mock).mockRejectedValue(rejectedValue);

    // @ts-ignore
    expect(gateway.request(options)).rejects.toThrow(rejectedValue);
  });

  test('call axios.request with GET param', async () => {
    const params = { a: 'a', b: 'b' };
    await gateway.get('/', params);

    expect((mockAxios.request as any) as jest.Mock).toBeCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/',
        params,
      }),
    );
  });

  test('call axios.request with POST param', async () => {
    await gateway.post('/');

    expect((mockAxios.request as any) as jest.Mock).toBeCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/',
      }),
    );
  });

  test('call axios.request with PUT param', async () => {
    await gateway.put('/');

    expect((mockAxios.request as any) as jest.Mock).toBeCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: '/',
      }),
    );
  });

  test('call axios.request with DELETE param', async () => {
    await gateway.delete('/');

    expect((mockAxios.request as any) as jest.Mock).toBeCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: '/',
      }),
    );
  });

  test('call axios.request with PATCH param', async () => {
    await gateway.patch('/');

    expect((mockAxios.request as any) as jest.Mock).toBeCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        url: '/',
      }),
    );
  });

  test('initialize WebSocketEvents and call connect with given params', async () => {
    const params = { a: 'a', b: 'b' };
    await gateway.stream('/', params);
    expect(mockConnect).toBeCalledWith('wss://example.com/?a=a&b=b', []);
  });

  test('initialize WebSocketEvents and call connect with access token', async () => {
    gateway.accessToken = 'token';
    await gateway.stream('/');
    expect(mockConnect).toBeCalledWith('wss://example.com/', ['token']);
  });

  test('initialize WebSocketEvents and call connect with access token as a param for Mastodon < v2.8.4', async () => {
    gateway.version = '2.8.3';
    gateway.accessToken = 'token';
    await gateway.stream('/');

    expect(mockConnect).toBeCalledWith(
      'wss://example.com/?access_token=token',
      [],
    );
  });

  test('call next to paginate, finish if nothing in link header', async () => {
    const iterable = gateway.paginate('/', {
      sinceId: '123',
    });

    const firstResponse = {
      headers: {
        // Pretend `/page1` the next url
        link: '<https://example.com/page1>; rel="next"',
      },
      data: {
        a: 'a',
      },
    };

    ((mockAxios.request as any) as jest.Mock).mockResolvedValueOnce(
      firstResponse,
    );

    const firstResult = await iterable.next();

    expect(mockAxios.request).toBeCalledTimes(1);
    expect((mockAxios.request as any) as jest.Mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/',
        params: {
          sinceId: '123',
        },
      }),
    );
    expect(firstResult.done).toBe(false);
    expect(firstResult.value).toBe(firstResponse.data);

    const secondResponse = {
      headers: {
        // Next url is null
        link: '',
      },
      data: {
        b: 'b',
      },
    };

    ((mockAxios.request as any) as jest.Mock).mockResolvedValueOnce(
      secondResponse,
    );

    const secondResult = await iterable.next();

    expect(mockAxios.request).toBeCalledTimes(2);
    expect((mockAxios.request as any) as jest.Mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://example.com/page1',
      }),
    );
    expect(secondResult.done).toBe(false);
    expect(secondResult.value).toBe(secondResponse.data);

    ((mockAxios.request as any) as jest.Mock).mockResolvedValueOnce({
      data: undefined,
    });
    const thirdResult = await iterable.next();

    expect(mockAxios.request).toBeCalledTimes(2);
    expect(thirdResult.done).toBe(true);
    expect(thirdResult.value).toBe(undefined);
  });

  test('reset iterable when option.reset passed', async () => {
    const initialPath = '/foo';
    const initialParams = { a: { b: 'c' } };

    const iterable = gateway.paginate(initialPath, initialParams);
    const response = {
      headers: {
        link: '<https://example.com/next>; rel="next"',
      },
      response: {},
    };

    ((mockAxios.request as any) as jest.Mock).mockResolvedValue(response);
    await iterable.next();
    await iterable.next({ reset: true });

    expect(mockAxios.request).toBeCalledTimes(2);
    expect(mockAxios.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: initialPath,
        params: initialParams,
      }),
    );
  });

  test('set next url and next params by calling next with params', async () => {
    const initialPath = '/foo';
    const initialParams = { page: '1' };

    const iterable = gateway.paginate(initialPath, initialParams);
    const response = {
      headers: {
        link: '<https://example.com/foo2>; rel="next"',
      },
      data: {},
    };
    ((mockAxios.request as any) as jest.Mock).mockResolvedValue(response);

    await iterable.next();
    expect(mockAxios.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: initialPath,
        params: initialParams,
      }),
    );

    const customNextUrl = '/bar';
    const customNextParams = { page: '777' };

    await iterable.next({ url: customNextUrl, params: customNextParams });
    expect(mockAxios.request).toBeCalledTimes(2);
    expect(mockAxios.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: customNextUrl,
        params: customNextParams,
      }),
    );
  });
});

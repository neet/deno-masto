import { Gateway } from '../gateway';
import { available } from '../decorators';

describe('available', () => {
  test('throw an error when this.version and param.since is incompatible', () => {
    class Context {
      version = '2.0.0';

      // @ts-ignore
      @available({ since: '2.1.0' })
      method() {
        // noop
      }
    }

    const context = new Context();

    expect(() => {
      context.method();
    }).toThrow();
  });

  test('throw an error when this.version and param.until is incompatible', () => {
    class Context {
      version = '2.0.0';

      // @ts-ignore
      @available({ until: '1.9.0' })
      method() {
        // noop
      }
    }

    const context = new Context();

    expect(() => {
      context.method();
    }).toThrow();
  });

  test('not throw an error when this.version and params are compatible', () => {
    class Context {
      version = '2.0.0';

      // @ts-ignore
      @available({ since: '1.9.0', until: '2.1.0' })
      method() {
        // noop
      }
    }

    const context = new Context();

    expect(() => {
      context.method();
    }).not.toThrow();
  });

  test('throw an error if available applied to a member of class', () => {
    expect(() => {
      class Context {
        // @ts-ignore
        @available({})
        prop = 'prop';
      }
      new Context();
    }).toThrow();
  });

  test('throw an error if evaluated not as a decorator', () => {
    expect(() => {
      available({})({} as Gateway, 'foo', { value: undefined });
    }).toThrow();
  });
});

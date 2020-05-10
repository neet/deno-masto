import { Gateway } from "./gateway.ts";

export interface AvailableParams {
  since?: string;
  until?: string;
}

/**
 * Decorator that verifies the version of the Mastodon instance
 * @param parameters Optional params
 */
export const available = (_params: AvailableParams) =>
  (
    _gateway: Gateway,
    _name: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => unknown>,
  ) => {
    const original = descriptor.value;

    if (!original) {
      throw new Error("available can only apply to a method of a class");
    }

    descriptor.value = function (
      this: Gateway,
      ...args: Parameters<typeof original>
    ) {
      return original.apply(this, args);
    };
  };

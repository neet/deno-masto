import { coerce, gt, lt } from "semver/mod.ts";

import { MastoNotFoundError } from "../errors.ts";
import { Gateway } from "./gateway.ts";

export interface AvailableParams {
  since?: string;
  until?: string;
}

/**
 * Decorator that verifies the version of the Mastodon instance
 * @param parameters Optional params
 */
export const available = ({ since, until }: AvailableParams) => (
  _gateway: Gateway,
  name: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => unknown>
) => {
  const original = descriptor.value;

  if (!original) {
    throw new Error("available can only apply to a method of a class");
  }

  descriptor.value = function (
    this: Gateway,
    ...args: Parameters<typeof original>
  ) {
    if (since && this.version && lt(coerce(this.version), since)) {
      throw new MastoNotFoundError(
        `${String(name)} is not available with the current ` +
          `Mastodon version ${this.version}. ` +
          `It requires greater than or equal to version ${since}.`
      );
    }

    if (until && this.version && gt(coerce(this.version), until)) {
      throw new MastoNotFoundError(
        `${String(name)} is not available with the current ` +
          `Mastodon version ${this.version}. ` +
          `It was removed on version ${until}.`
      );
    }

    return original.apply(this, args);
  };
};

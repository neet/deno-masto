import { isObject } from "./is-object.ts";

export const transformKeys = <T>(
  data: unknown,
  transform: (key: string) => string
): T =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      transform(key),
      isObject(value) ? transformKeys(value, transform) : value,
    ])
  );

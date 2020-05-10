import { isObject } from "./is-object.ts";

export const flattenData = (
  data: unknown,
  parentKey: string = ""
): Record<string, unknown> => {
  if (isObject(data)) {
    return Object.entries(data).reduce(
      (acc, [key, value]) =>
        Object.assign(acc, flattenData(value, `${parentKey}[${key}]`)),
      {}
    );
  }

  if (Array.isArray(data)) {
    return data.reduce(
      (acc, value, i) =>
        Object.assign(acc, flattenData(value, `${parentKey}[${i}]`)),
      {}
    );
  }

  return { [parentKey]: data };
};

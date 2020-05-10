import { expect } from "expect/mod.ts";
import { flattenData } from "./fallen-data.ts";

Deno.test("flat value", () => {
  const result = flattenData({
    apple: "red",
    mandarin: "orange",
    grapes: "purple",
  });

  expect(result.apple).toBe("red");
  expect(result.mandarin).toBe("orange");
  expect(result.grapes).toBe("purple");
});

Deno.test("array", () => {
  const result = flattenData({
    animals: ["lion", "giraffe", "elephant"],
  });

  expect(result["animals[0]"]).toBe("lion");
  expect(result["animals[1]"]).toBe("giraffe");
  expect(result["animals[2]"]).toBe("elephant");
});

Deno.test("nested object", () => {
  const result = createFormData({
    a: "string",
    b: 123,
    c: [1, 2, 3],
    e: {
      e1: "string",
      e2: {
        e21: {
          e211: "string",
        },
        e22: [{ value: 1 }, { value: 2 }, { value: 3 }],
      },
    },
  });

  expect(result["a"]).toBe("string");
  expect(result["b"]).toBe("123");
  expect(result["c[0]"]).toBe("1");
  expect(result["c[1]"]).toBe("2");
  expect(result["c[2]"]).toBe("3");
  expect(result["e[e1]"]).toBe("string");
  expect(result["e[e2][e21][e211]"]).toBe("string");
  expect(result["e[e2][e22][0][value]"]).toBe("1");
  expect(result["e[e2][e22][1][value]"]).toBe("2");
  expect(result["e[e2][e22][2][value]"]).toBe("3");
});

import { describe, expect, test } from "@jest/globals";
import { hello } from "../src/index";

describe("hello", () => {
  test("returns 'Hello, World!'", () => {
    expect(hello()).toBe("Hello, World!");
  });
});

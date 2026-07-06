import { afterEach, describe, expect, it } from "vitest";
import { isHoldamBypassEnabled } from "@/lib/holdam/config";

describe("isHoldamBypassEnabled", () => {
  const originalBypass = process.env.BYPASS_HOLDAM;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalBypass === undefined) {
      delete process.env.BYPASS_HOLDAM;
    } else {
      process.env.BYPASS_HOLDAM = originalBypass;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns true when BYPASS_HOLDAM is true", () => {
    process.env.BYPASS_HOLDAM = "true";
    expect(isHoldamBypassEnabled()).toBe(true);
  });

  it("returns false when BYPASS_HOLDAM is false", () => {
    process.env.BYPASS_HOLDAM = "false";
    expect(isHoldamBypassEnabled()).toBe(false);
  });

  it("defaults to true in development when unset", () => {
    delete process.env.BYPASS_HOLDAM;
    process.env.NODE_ENV = "development";
    expect(isHoldamBypassEnabled()).toBe(true);
  });

  it("defaults to false in production when unset", () => {
    delete process.env.BYPASS_HOLDAM;
    process.env.NODE_ENV = "production";
    expect(isHoldamBypassEnabled()).toBe(false);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { isHoldamBypassEnabled } from "@/lib/holdam/config";

function setNodeEnv(value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
}

describe("isHoldamBypassEnabled", () => {
  const originalBypass = process.env.BYPASS_HOLDAM;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalBypass === undefined) {
      delete process.env.BYPASS_HOLDAM;
    } else {
      process.env.BYPASS_HOLDAM = originalBypass;
    }

    setNodeEnv(originalNodeEnv);
  });

  it("returns true in development when BYPASS_HOLDAM is true", () => {
    setNodeEnv("development");
    process.env.BYPASS_HOLDAM = "true";
    expect(isHoldamBypassEnabled()).toBe(true);
  });

  it("returns false when BYPASS_HOLDAM is false", () => {
    setNodeEnv("development");
    process.env.BYPASS_HOLDAM = "false";
    expect(isHoldamBypassEnabled()).toBe(false);
  });

  it("defaults to false in development when unset", () => {
    delete process.env.BYPASS_HOLDAM;
    setNodeEnv("development");
    expect(isHoldamBypassEnabled()).toBe(false);
  });

  it("defaults to false in production when unset", () => {
    delete process.env.BYPASS_HOLDAM;
    setNodeEnv("production");
    expect(isHoldamBypassEnabled()).toBe(false);
  });

  it("ignores BYPASS_HOLDAM=true in production (fail closed)", () => {
    setNodeEnv("production");
    process.env.BYPASS_HOLDAM = "true";
    expect(isHoldamBypassEnabled()).toBe(false);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { getMobileMoneyMode } from "@/infrastructure/payment/payment-mode";
import { getPayDunyaApiBase } from "@/infrastructure/payment/paydunya.adapter";

const prevMode = process.env.MOBILE_MONEY_MODE;
const prevBase = process.env.PAYDUNYA_API_BASE;

afterEach(() => {
  if (prevMode === undefined) delete process.env.MOBILE_MONEY_MODE;
  else process.env.MOBILE_MONEY_MODE = prevMode;
  if (prevBase === undefined) delete process.env.PAYDUNYA_API_BASE;
  else process.env.PAYDUNYA_API_BASE = prevBase;
});

describe("getMobileMoneyMode", () => {
  it("defaults to demo when unset", () => {
    delete process.env.MOBILE_MONEY_MODE;
    expect(getMobileMoneyMode()).toBe("demo");
  });

  it("falls back to demo on unknown value", () => {
    process.env.MOBILE_MONEY_MODE = "staging";
    expect(getMobileMoneyMode()).toBe("demo");
  });

  it("recognizes sandbox and production (case/space tolerant)", () => {
    process.env.MOBILE_MONEY_MODE = " Sandbox ";
    expect(getMobileMoneyMode()).toBe("sandbox");
    process.env.MOBILE_MONEY_MODE = "PRODUCTION";
    expect(getMobileMoneyMode()).toBe("production");
  });
});

describe("getPayDunyaApiBase", () => {
  it("uses the live endpoint in production mode", () => {
    delete process.env.PAYDUNYA_API_BASE;
    process.env.MOBILE_MONEY_MODE = "production";
    expect(getPayDunyaApiBase()).toBe("https://app.paydunya.com/api/v1");
  });

  it("uses the sandbox endpoint in sandbox mode", () => {
    delete process.env.PAYDUNYA_API_BASE;
    process.env.MOBILE_MONEY_MODE = "sandbox";
    expect(getPayDunyaApiBase()).toBe("https://app.paydunya.com/sandbox-api/v1");
  });

  it("lets PAYDUNYA_API_BASE override the mode and strips trailing slashes", () => {
    process.env.MOBILE_MONEY_MODE = "production";
    process.env.PAYDUNYA_API_BASE = "http://localhost:4010/paydunya/";
    expect(getPayDunyaApiBase()).toBe("http://localhost:4010/paydunya");
  });
});

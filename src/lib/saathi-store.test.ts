import { describe, expect, it } from "vitest";
import { nextStatus } from "./saathi-store";

describe("request status rules", () => {
  it("pending can be accepted", () => expect(nextStatus("pending", "accept")).toBe("accepted"));
  it("accepted can be completed", () => expect(nextStatus("accepted", "complete")).toBe("completed"));
  it("pending cannot be completed directly", () => expect(nextStatus("pending", "complete")).toBeNull());
  it("completed cannot be re-accepted", () => expect(nextStatus("completed", "accept")).toBeNull());
});

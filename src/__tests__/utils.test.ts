import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  slugify,
  getStatusColor,
  generateId,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats a whole dollar amount", () => {
    expect(formatCurrency(5000)).toBe("$5,000.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats cents", () => {
    expect(formatCurrency(49.99)).toBe("$49.99");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234567)).toBe("$1,234,567.00");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    const result = formatDate("2026-03-15T12:00:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
    // The exact day depends on timezone, so just check format is reasonable
    expect(result).toMatch(/\w+ \d{1,2}, \d{4}/);
  });
});

describe("slugify", () => {
  it("converts to lowercase and replaces spaces with hyphens", () => {
    expect(slugify("Acme Corp")).toBe("acme-corp");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--test--")).toBe("test");
  });

  it("handles multiple consecutive special characters", () => {
    expect(slugify("a   b   c")).toBe("a-b-c");
  });
});

describe("getStatusColor", () => {
  it("returns correct color for known statuses", () => {
    expect(getStatusColor("draft")).toContain("gray");
    expect(getStatusColor("sent")).toContain("blue");
    expect(getStatusColor("approved")).toContain("green");
    expect(getStatusColor("declined")).toContain("red");
    expect(getStatusColor("paid")).toContain("green");
    expect(getStatusColor("overdue")).toContain("red");
  });

  it("returns default color for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("gray");
  });
});

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

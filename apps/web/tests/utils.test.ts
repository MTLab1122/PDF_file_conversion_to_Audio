import { describe, it, expect } from "vitest";
import { formatBytes, formatDuration, cn } from "../lib/utils";

describe("Frontend Utilities", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(52428800)).toBe("50 MB");
  });

  it("formats duration correctly in MM:SS and HH:MM:SS format", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(45)).toBe("00:45");
    expect(formatDuration(75)).toBe("01:15");
    expect(formatDuration(3665)).toBe("01:01:05");
  });

  it("merges class names correctly with cn()", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    expect(cn("px-2", { "text-red-500": true, "bg-blue-500": false })).toBe(
      "px-2 text-red-500"
    );
  });
});


import { describe, expect, it } from "vitest";
import { FEEDBACK_LIMITS, parseFeedback } from "./feedback";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("parseFeedback", () => {
  it("accepts a message with its context, trimmed", () => {
    const result = parseFeedback(
      form({
        kind: "mistake",
        message: "  Wrong key listed  ",
        email: " me@example.com ",
        tuneSlug: "sally-goodin",
        recordingUrl: "https://www.slippery-hill.com/content/sally-goodin-0",
      }),
    );
    expect(result).toEqual({
      status: "valid",
      feedback: {
        kind: "mistake",
        message: "Wrong key listed",
        email: "me@example.com",
        tune_slug: "sally-goodin",
        recording_url: "https://www.slippery-hill.com/content/sally-goodin-0",
      },
    });
  });

  it("stores missing optional fields as null", () => {
    expect(parseFeedback(form({ kind: "idea", message: "Add tunings" }))).toEqual({
      status: "valid",
      feedback: { kind: "idea", message: "Add tunings", email: null, tune_slug: null, recording_url: null },
    });
  });

  it("rejects an empty message", () => {
    expect(parseFeedback(form({ kind: "other", message: "   " }))).toEqual({ status: "invalid", error: "Please write a message." });
  });

  it("rejects a message over the limit", () => {
    const message = "x".repeat(FEEDBACK_LIMITS.message + 1);
    expect(parseFeedback(form({ kind: "other", message }))).toMatchObject({ status: "invalid" });
  });

  it("rejects an unknown kind", () => {
    expect(parseFeedback(form({ kind: "spam", message: "hi" }))).toMatchObject({ status: "invalid" });
  });

  it("rejects a malformed email", () => {
    expect(parseFeedback(form({ kind: "other", message: "hi", email: "nope" }))).toEqual({
      status: "invalid",
      error: "That email address doesn't look right.",
    });
  });

  it("rejects a recording link that is not https", () => {
    expect(parseFeedback(form({ kind: "other", message: "hi", recordingUrl: "javascript:alert(1)" }))).toMatchObject({ status: "invalid" });
  });

  it("flags a filled honeypot as spam", () => {
    expect(parseFeedback(form({ kind: "other", message: "hi", website: "http://spam.example" }))).toEqual({ status: "spam" });
  });
});

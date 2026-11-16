import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  levelStates,
  localDay,
  parseProgress,
  streakDays,
  totalXp,
  withCompletion,
  xpForConversation,
} from "./rules";

const done = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, { completedAt: "x", xp: 10 }]));

describe("levelStates", () => {
  const keys = ["t/a", "t/b", "t/c"];

  it("only level 1 is open at the start", () => {
    expect(levelStates(keys, {})).toEqual(["available", "locked", "locked"]);
  });

  it("finishing a level unlocks the next one only", () => {
    expect(levelStates(keys, done("t/a"))).toEqual(["completed", "available", "locked"]);
    expect(levelStates(keys, done("t/a", "t/b", "t/c"))).toEqual(["completed", "completed", "completed"]);
  });

  it("progress in another topic never unlocks this one", () => {
    expect(levelStates(keys, done("other/a", "other/b"))).toEqual(["available", "locked", "locked"]);
  });

  it("a later level stays locked until every earlier level is done", () => {
    expect(levelStates(keys, done("t/b"))).toEqual(["available", "completed", "locked"]);
  });
});

describe("XP", () => {
  it("rewards longer conversations a little more", () => {
    expect(xpForConversation(7)).toBe(55);
    expect(xpForConversation(6)).toBeLessThan(xpForConversation(7));
  });

  it("totals XP across completions", () => {
    expect(totalXp({ version: 1, completed: { a: { completedAt: "", xp: 50 }, b: { completedAt: "", xp: 55 } }, activeDays: [] })).toBe(105);
  });
});

describe("withCompletion", () => {
  const now = new Date(2026, 10, 17, 9, 30);

  it("records completion, XP and the active day", () => {
    const p = withCompletion(EMPTY_PROGRESS, "t/a", 55, now);
    expect(p.completed["t/a"].xp).toBe(55);
    expect(p.activeDays).toEqual(["2026-11-17"]);
  });

  it("never awards XP twice for the same level", () => {
    const once = withCompletion(EMPTY_PROGRESS, "t/a", 55, now);
    expect(withCompletion(once, "t/a", 55, now)).toBe(once);
  });
});

describe("streakDays", () => {
  const today = new Date(2026, 10, 17, 20, 0);
  const day = (offset: number) => localDay(new Date(2026, 10, 17 + offset));

  it("counts consecutive days ending today", () => {
    expect(streakDays([day(0), day(-1), day(-2)], today)).toBe(3);
  });

  it("isn't broken yet if today hasn't been practised", () => {
    expect(streakDays([day(-1), day(-2)], today)).toBe(2);
  });

  it("resets after a missed day", () => {
    expect(streakDays([day(-2), day(-3)], today)).toBe(0);
  });

  it("works across month boundaries", () => {
    const first = new Date(2026, 11, 1, 10);
    expect(streakDays(["2026-11-30", "2026-12-01"], first)).toBe(2);
  });
});

describe("parseProgress", () => {
  it("returns empty progress for missing or corrupt data", () => {
    expect(parseProgress(null)).toBe(EMPTY_PROGRESS);
    expect(parseProgress("not json")).toBe(EMPTY_PROGRESS);
    expect(parseProgress('{"version":2}')).toBe(EMPTY_PROGRESS);
  });

  it("drops malformed entries but keeps good ones", () => {
    const p = parseProgress(
      JSON.stringify({ version: 1, completed: { good: { completedAt: "2026-11-17T00:00:00Z", xp: 50 }, bad: { xp: "lots" } }, activeDays: ["2026-11-17", "nope"] }),
    );
    expect(Object.keys(p.completed)).toEqual(["good"]);
    expect(p.activeDays).toEqual(["2026-11-17"]);
  });
});

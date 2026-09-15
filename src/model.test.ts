import { describe, expect, it } from "vitest";
import {
  defaultPlan,
  project,
  requiredMonthly,
  targetAt,
  totals,
  validPlan,
  validReview,
  yearsUntilStart,
  type Plan,
  type Review,
} from "./model";

const startDay = new Date("2027-06-01T00:00:00Z");
const plan = (changes: Partial<Plan> = {}): Plan => ({
  ...defaultPlan,
  start: "2027-06",
  initial: 0,
  reserve: 0,
  monthly: 0,
  contributionYears: 1,
  horizon: 1,
  goalCrore: 0.01,
  goalToday: false,
  inflation: 0,
  fx: 100,
  fxChange: 0,
  baseReturn: 0,
  equity: 50,
  tilt: 0,
  phaseMonths: 1,
  ...changes,
});

const review = (changes: Partial<Review> = {}): Review => ({
  id: "review-1",
  date: "2027-06-01",
  mode: "actual",
  cash: 0,
  taxable: 0,
  retirement: 0,
  india: 0,
  debt: 0,
  fx: 100,
  contribution: 0,
  followed: true,
  mood: "Calm",
  note: "",
  ...changes,
});

describe("default scenario", () => {
  it("starts in June 2027 with a distinct reserve, contribution window, and FI horizon", () => {
    expect(defaultPlan).toMatchObject({
      start: "2027-06",
      initial: 100_000,
      reserve: 25_000,
      monthly: 3_000,
      contributionYears: 5,
      horizon: 5,
      goalCrore: 5,
      goalToday: true,
    });
    expect(validPlan(defaultPlan)).toBe(true);
  });
});

describe("projection", () => {
  it("counts only investable initial capital and contributions with zero returns", () => {
    const points = project(
      plan({
        initial: 10_000,
        reserve: 2_500,
        monthly: 100,
        contributionYears: 1,
        horizon: 3,
      }),
      0,
      false,
      startDay,
    );
    expect(points).toHaveLength(37);
    expect(points[0]).toMatchObject({
      month: 0,
      balance: 7_500,
      contributed: 7_500,
    });
    expect(points[12]).toMatchObject({
      month: 12,
      balance: 8_700,
      contributed: 8_700,
    });
    expect(points[36]).toMatchObject({
      month: 36,
      balance: 8_700,
      contributed: 8_700,
    });
  });

  it("compounds an annual return monthly and adds each payment after that month’s growth", () => {
    const annual = 12;
    const monthlyRate = 1.12 ** (1 / 12) - 1;
    const points = project(
      plan({ initial: 1_000, monthly: 100, baseReturn: annual }),
      annual,
      false,
      startDay,
    );
    const annuity = (100 * ((1 + monthlyRate) ** 12 - 1)) / monthlyRate;
    expect(points[12].balance).toBeCloseTo(1_120 + annuity, 8);
    expect(points[12].contributed).toBe(2_200);
  });

  it("includes staged cash in total capital without giving it a market return", () => {
    const annual = 1.01 ** 12 * 100 - 100; // exactly 1% effective monthly growth
    const points = project(
      plan({ initial: 1_200, phaseMonths: 3, baseReturn: annual }),
      annual,
      false,
      startDay,
    );
    expect(points[0]).toMatchObject({ balance: 1_200, contributed: 1_200 });
    expect(points[1].balance).toBeCloseTo(1_204, 8);
    expect(points[2].balance).toBeCloseTo(1_212.04, 8);
    expect(points[2].contributed).toBe(1_200);
  });

  it("applies the severe stock/bond shock once at the endpoint", () => {
    const points = project(
      plan({ initial: 1_000, equity: 60 }),
      0,
      true,
      startDay,
    );
    expect(points[11].balance).toBe(1_000);
    expect(points[12].balance).toBeCloseTo(740, 8); // 60% × -40% plus 40% × -5%
    expect(points[12].contributed).toBe(1_000);
  });
});

describe("goal and required saving", () => {
  it("inflates a today-value rupee goal through the start date and whole FI horizon", () => {
    const today = new Date("2026-06-01T00:00:00Z");
    const p = plan({ goalCrore: 1, goalToday: true, inflation: 5, horizon: 2 });
    const beforeStart = yearsUntilStart(p, today);
    expect(beforeStart).toBeGreaterThan(0.99);
    expect(targetAt(p, 0, today)).toBeCloseTo(
      (10_000_000 * 1.05 ** beforeStart) / 100,
      8,
    );
    expect(targetAt(p, 2, today)).toBeCloseTo(
      (10_000_000 * 1.05 ** (beforeStart + 2)) / 100,
      8,
    );
    expect(targetAt({ ...p, goalToday: false }, 2, today)).toBe(100_000);
  });

  it("decreases the USD goal when INR per USD rises", () => {
    const p = plan({ goalCrore: 1, fxChange: 10 });
    expect(targetAt(p, 0, startDay)).toBe(100_000);
    expect(targetAt(p, 1, startDay)).toBeCloseTo(10_000_000 / 110, 8);
    expect(targetAt({ ...p, fxChange: -10 }, 1, startDay)).toBeCloseTo(
      10_000_000 / 90,
      8,
    );
  });

  it("inverts the no-return projection into a monthly saving requirement", () => {
    const p = plan({ initial: 250, monthly: 0 }); // $1,000 target, $250 invested
    expect(requiredMonthly(p, startDay)).toBeCloseTo(62.5, 8);
    const check = project(
      { ...p, monthly: requiredMonthly(p, startDay)! },
      0,
      false,
      startDay,
    ).at(-1)!;
    expect(check.balance).toBeCloseTo(check.target, 8);
    expect(requiredMonthly({ ...p, initial: 1_000 }, startDay)).toBe(0);
  });

  it("uses only active contribution months when solving beyond the saving window", () => {
    const p = plan({ horizon: 3, contributionYears: 1 });
    expect(requiredMonthly(p, startDay)).toBeCloseTo(1_000 / 12, 8);
  });
});

describe("recorded holdings and validation", () => {
  it("keeps retirement assets out of accessible capital and subtracts debt once", () => {
    const r = review({
      cash: 1_000,
      taxable: 2_000,
      retirement: 5_000,
      india: 100_000,
      fx: 100,
      debt: 500,
    });
    expect(totals(r)).toEqual({ accessible: 3_500, net: 8_500 });
    expect(validReview(r)).toBe(true);
  });

  it("rejects malformed plans including nonfinite values, invalid dates, and impossible reserve/tilt", () => {
    expect(validPlan(null)).toBe(false);
    expect(validPlan({ ...defaultPlan, monthly: Number.NaN })).toBe(false);
    expect(validPlan({ ...defaultPlan, start: "2027-13" })).toBe(false);
    expect(validPlan({ ...defaultPlan, horizon: 2.5 })).toBe(false);
    expect(
      validPlan({ ...defaultPlan, reserve: defaultPlan.initial + 1 }),
    ).toBe(false);
    expect(validPlan({ ...defaultPlan, equity: 10, tilt: 10 })).toBe(false);
    expect(validPlan({ ...defaultPlan, goalToday: "yes" })).toBe(false);
  });

  it("rejects invalid record dates, negative holdings, and unrecognized moods", () => {
    expect(validReview({ ...review(), date: "2027-02-30" })).toBe(false);
    expect(validReview({ ...review(), cash: -1 })).toBe(false);
    expect(validReview({ ...review(), fx: 0 })).toBe(false);
    expect(validReview({ ...review(), mood: "Elated" })).toBe(false);
  });
});

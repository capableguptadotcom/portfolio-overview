export type Plan = {
  start: string;
  initial: number;
  reserve: number;
  monthly: number;
  contributionYears: number;
  horizon: number;
  goalCrore: number;
  goalToday: boolean;
  inflation: number;
  fx: number;
  fxChange: number;
  baseReturn: number;
  equity: number;
  tilt: number;
  phaseMonths: number;
  deadline: boolean;
  monthlySpendInr: number;
  withdrawalRate: number;
};

// Illustrations only. Actual account balances are recorded separately.
export const defaultPlan: Plan = {
  start: "2027-06",
  initial: 100000,
  reserve: 25000,
  monthly: 3000,
  contributionYears: 5,
  horizon: 5,
  goalCrore: 5,
  goalToday: true,
  inflation: 5,
  fx: 85,
  fxChange: 0,
  baseReturn: 6,
  equity: 60,
  tilt: 0,
  phaseMonths: 1,
  deadline: false,
  monthlySpendInr: 100000,
  withdrawalRate: 3.5,
};

export type Review = {
  id: string;
  date: string;
  mode: "paper" | "actual";
  cash: number;
  taxable: number;
  retirement: number;
  india: number;
  debt: number;
  fx: number;
  contribution: number;
  followed: boolean;
  mood: string;
  note: string;
};

export type Point = {
  month: number;
  balance: number;
  contributed: number;
  target: number;
};
export type MarketAsset = {
  symbol: string;
  name: string;
  asOf: string;
  price: number;
  weekChange: number | null;
  drawdown: number | null;
  source: string;
};
export type Market = {
  fetchedAt: string | null;
  assets: MarketAsset[];
  errors: string[];
};

export function validPlan(raw: unknown): raw is Plan {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Plan;
  const ranges: [keyof Plan, number, number][] = [
    ["initial", 0, 1e8],
    ["reserve", 0, 1e8],
    ["monthly", 0, 1e6],
    ["contributionYears", 0, 40],
    ["horizon", 1, 40],
    ["goalCrore", 0.01, 1000],
    ["inflation", 0, 20],
    ["fx", 1, 500],
    ["fxChange", -10, 10],
    ["baseReturn", -20, 20],
    ["equity", 0, 100],
    ["tilt", 0, 10],
    ["phaseMonths", 1, 12],
    ["monthlySpendInr", 0, 1e8],
    ["withdrawalRate", 1, 10],
  ];
  return (
    ranges.every(
      ([k, lo, hi]) =>
        typeof p[k] === "number" &&
        Number.isFinite(p[k]) &&
        Number(p[k]) >= lo &&
        Number(p[k]) <= hi,
    ) &&
    /^20\d\d-(0[1-9]|1[0-2])$/.test(p.start) &&
    p.reserve <= p.initial &&
    p.tilt <= p.equity * 0.75 &&
    Number.isInteger(p.horizon) &&
    Number.isInteger(p.contributionYears) &&
    Number.isInteger(p.phaseMonths) &&
    typeof p.goalToday === "boolean" &&
    typeof p.deadline === "boolean"
  );
}

export function validReview(raw: unknown): raw is Review {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Review;
  const numbers = [
    r.cash,
    r.taxable,
    r.retirement,
    r.india,
    r.debt,
    r.contribution,
  ];
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    r.id.length <= 100 &&
    typeof r.date === "string" &&
    /^20\d\d-\d\d-\d\d$/.test(r.date) &&
    Number.isFinite(Date.parse(`${r.date}T12:00:00Z`)) &&
    new Date(`${r.date}T12:00:00Z`).toISOString().slice(0, 10) === r.date &&
    ["paper", "actual"].includes(r.mode) &&
    numbers.every((n) => Number.isFinite(n) && n >= 0 && n <= 1e10) &&
    Number.isFinite(r.fx) &&
    r.fx >= 1 &&
    r.fx <= 500 &&
    typeof r.followed === "boolean" &&
    typeof r.note === "string" &&
    r.note.length <= 2000 &&
    ["Calm", "Uncertain", "Anxious"].includes(r.mood)
  );
}

export function yearsUntilStart(p: Plan, today = new Date()): number {
  return Math.max(
    0,
    (new Date(`${p.start}-01T00:00:00Z`).getTime() - today.getTime()) /
      (365.25 * 86400000),
  );
}

export function targetAt(p: Plan, years: number, today = new Date()): number {
  const inflationYears = p.goalToday ? yearsUntilStart(p, today) + years : 0;
  const inr = p.goalCrore * 1e7 * (1 + p.inflation / 100) ** inflationYears;
  const fx = p.fx * (1 + p.fxChange / 100) ** years;
  return inr / fx;
}

export function project(
  p: Plan,
  rate = p.baseReturn,
  shock = false,
  today = new Date(),
): Point[] {
  const principal = Math.max(0, p.initial - p.reserve);
  const r = (1 + rate / 100) ** (1 / 12) - 1;
  const slice = principal / p.phaseMonths;
  let invested = p.phaseMonths === 1 ? principal : slice;
  let waiting = principal - invested;
  let contributed = principal;
  const points: Point[] = [
    {
      month: 0,
      balance: principal,
      contributed,
      target: targetAt(p, 0, today),
    },
  ];
  for (let month = 1; month <= p.horizon * 12; month++) {
    invested *= 1 + r;
    // Severe illustrative shock at the endpoint: stocks -40%, defensive assets -5%.
    if (shock && month === p.horizon * 12)
      invested *= 1 - ((p.equity / 100) * 0.4 + (1 - p.equity / 100) * 0.05);
    if (month < p.phaseMonths) {
      invested += slice;
      waiting -= slice;
    }
    const contribution = month <= p.contributionYears * 12 ? p.monthly : 0;
    invested += contribution;
    contributed += contribution;
    points.push({
      month,
      balance: invested + Math.max(0, waiting),
      contributed,
      target: targetAt(p, month / 12, today),
    });
  }
  return points;
}

export function requiredMonthly(p: Plan, today = new Date()): number | null {
  const base = project({ ...p, monthly: 0 }, p.baseReturn, false, today).at(
    -1,
  )!;
  const unit =
    project({ ...p, monthly: 1 }, p.baseReturn, false, today).at(-1)!.balance -
    base.balance;
  const gap = base.target - base.balance;
  return gap <= 0 ? 0 : unit > 0 ? gap / unit : null;
}

export function totals(r: Review) {
  const accessible = r.cash + r.taxable + r.india / r.fx - r.debt;
  return { accessible, net: accessible + r.retirement };
}

export const usd = (n: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...(compact
      ? { notation: "compact" as const, maximumFractionDigits: 1 }
      : {}),
  }).format(n);
export const crore = (n: number) => `₹${(n / 1e7).toFixed(2)} cr`;
export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

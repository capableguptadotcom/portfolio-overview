import { useState, type FormEvent } from "react";
import { Check, RotateCcw, ArrowRight, Info } from "lucide-react";
import {
  defaultPlan,
  project,
  requiredMonthly,
  validPlan,
  usd,
  crore,
  type Plan,
} from "./model";
import Chart from "./Chart";
import { Allocation, monthLabel, NumberField } from "./ui";

export default function PlanEditor({
  plan,
  onSave,
}: {
  plan: Plan;
  onSave: (plan: Plan) => Promise<void>;
}) {
  const [draft, setDraft] = useState(plan);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  function set<K extends keyof Plan>(k: K, v: Plan[K]) {
    setDraft((p) => ({ ...p, [k]: v }));
    setSaved(false);
    setError("");
  }
  const valid = validPlan(draft);
  const p = valid ? draft : plan;
  const end = project(p).at(-1)!;
  const monthly = requiredMonthly(p);
  const futureFx = p.fx * (1 + p.fxChange / 100) ** p.horizon;
  const phaseDifference =
    project({ ...p, phaseMonths: 1 }).at(-1)!.balance - end.balance;
  const spendSupported = (p.goalCrore * 1e7 * p.withdrawalRate) / 100 / 12;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError(
        "Check the values. Protected cash cannot exceed savings; the tilt must fit the U.S. allocation.",
      );
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">MAKE THE ASSUMPTIONS YOURS</div>
        <h1>
          Build a plan you can hold<span>.</span>
        </h1>
        <p>
          Change the numbers. See the trade-offs. Save when the plan makes
          sense.
        </p>
      </div>
      <form onSubmit={submit} className="planner-layout section-gap">
        <div className="planner-inputs">
          <section className="panel">
            <div className="step-heading">
              <span>01</span>
              <h2>Start with the money and the dates.</h2>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Investing starts</span>
                <input
                  type="month"
                  min="2000-01"
                  max="2099-12"
                  required
                  value={draft.start}
                  onChange={(e) => set("start", e.target.value)}
                />
              </label>
              <NumberField
                label="Starting savings · USD"
                value={draft.initial}
                onChange={(v) => set("initial", v)}
                max={1e8}
                step={1000}
              />
              <NumberField
                label="Protected cash · USD"
                value={draft.reserve}
                onChange={(v) => set("reserve", v)}
                max={draft.initial}
                step={1000}
                help="Emergency + house/car + other near-term needs. Excluded from projections."
              />
              <NumberField
                label="Monthly contribution · USD"
                value={draft.monthly}
                onChange={(v) => set("monthly", v)}
                max={1e6}
                step={100}
              />
              <NumberField
                label="Years you will contribute"
                value={draft.contributionYears}
                onChange={(v) => set("contributionYears", v)}
                max={40}
              />
              <NumberField
                label="Years the money stays invested"
                value={draft.horizon}
                onChange={(v) => set("horizon", v)}
                min={1}
                max={40}
              />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={draft.deadline}
                onChange={(e) => set("deadline", e.target.checked)}
              />
              <span>
                I must start using this money at the end of this period.
              </span>
            </label>
            <p className="micro">
              The portfolio can keep compounding after contributions stop. This
              calculator does not model withdrawals.
            </p>
          </section>
          <section className="panel">
            <div className="step-heading">
              <span>02</span>
              <h2>Define financial independence.</h2>
            </div>
            <div className="form-grid">
              <NumberField
                label="FI target · INR crore"
                value={draft.goalCrore}
                onChange={(v) => set("goalCrore", v)}
                min={0.01}
                max={1000}
                step={0.01}
              />
              <label className="field">
                <span>What does this target mean?</span>
                <select
                  value={draft.goalToday ? "today" : "nominal"}
                  onChange={(e) => set("goalToday", e.target.value === "today")}
                >
                  <option value="today">Today’s purchasing power</option>
                  <option value="nominal">Future nominal rupees</option>
                </select>
              </label>
              <NumberField
                label="Indian inflation · % / year"
                value={draft.inflation}
                onChange={(v) => set("inflation", v)}
                max={20}
                step={0.5}
              />
              <NumberField
                label="USD/INR at investing start"
                value={draft.fx}
                onChange={(v) => set("fx", v)}
                min={1}
                max={500}
                step={0.5}
                help="A planning assumption, not a live exchange rate."
              />
              <NumberField
                label="USD/INR change · % / year"
                value={draft.fxChange}
                onChange={(v) => set("fxChange", v)}
                min={-10}
                max={10}
                step={0.5}
                help="Positive = more rupees per dollar; negative = stronger rupee."
              />
              <NumberField
                label="Monthly spending today · INR"
                value={draft.monthlySpendInr}
                onChange={(v) => set("monthlySpendInr", v)}
                max={1e8}
                step={5000}
              />
              <NumberField
                label="Illustrative withdrawal · % / year"
                value={draft.withdrawalRate}
                onChange={(v) => set("withdrawalRate", v)}
                min={1}
                max={10}
                step={0.1}
                help="Arithmetic only. No rate is guaranteed safe."
              />
            </div>
            <p className="micro">
              House and car sit outside the FI target. Add their purchase costs
              to protected cash if due soon. Taxes, health costs and emergencies
              must fit your spending estimate.
            </p>
          </section>
          <section className="panel">
            <div className="step-heading">
              <span>03</span>
              <h2>Choose risk before choosing funds.</h2>
            </div>
            <div className="range-label">
              <label htmlFor="stock-allocation">
                Stocks in the long-term pot
              </label>
              <strong>{draft.equity}%</strong>
            </div>
            <input
              className="range"
              id="stock-allocation"
              type="range"
              min="0"
              max="100"
              step="5"
              value={draft.equity}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d) => ({
                  ...d,
                  equity: v,
                  tilt: Math.min(d.tilt, v * 0.75),
                }));
                setSaved(false);
              }}
            />
            <div className="range-ends">
              <span>Lower stock risk</span>
              <span>Higher stock risk</span>
            </div>
            <Allocation plan={p} />
            <div className="form-grid section-gap">
              <NumberField
                label="Optional Nasdaq-100 tilt · %"
                value={draft.tilt}
                onChange={(v) => set("tilt", v)}
                max={Math.min(10, draft.equity * 0.75)}
                step={0.25}
                help="0 is a complete plan. Replaces U.S. stocks; not extra diversification."
              />
              <NumberField
                label="Whole-portfolio return · % / year"
                value={draft.baseReturn}
                onChange={(v) => set("baseReturn", v)}
                min={-20}
                max={20}
                step={0.5}
                help="Independent scenario input; not inferred from stock mix or past returns."
              />
            </div>
            <p className="micro">
              Stocks split 75% U.S. / 25% international before the tilt. This is
              an editable illustration, not an optimized recommendation.
              Defensive assets can include high-quality bonds and cash; bond
              funds can lose value.
            </p>
          </section>
          <section className="panel">
            <div className="step-heading">
              <span>04</span>
              <h2>Pick a schedule, not a market level.</h2>
            </div>
            <label className="field">
              <span>Deploy the initial investable amount</span>
              <select
                value={draft.phaseMonths}
                onChange={(e) => set("phaseMonths", Number(e.target.value))}
              >
                <option value={1}>All at the start</option>
                <option value={3}>3 equal monthly installments</option>
                <option value={6}>6 equal monthly installments</option>
                <option value={12}>12 equal monthly installments</option>
              </select>
            </label>
            <div className="callout neutral">
              <div>
                <strong>
                  {usd((p.initial - p.reserve) / p.phaseMonths)}
                  {p.phaseMonths > 1 ? " per installment" : " at the start"}
                </strong>
                <p>
                  First installment in {monthLabel(p.start)}
                  {p.phaseMonths > 1
                    ? `, followed by ${p.phaseMonths - 1} monthly installments`
                    : ""}
                  . New monthly savings enter at month-end.
                </p>
              </div>
            </div>
            <p className="micro">
              Undeployed installments earn 0% here. Protected cash and its
              interest are excluded. Staging changes the ending value by{" "}
              {usd(-phaseDifference)} versus investing at once, at the chosen
              return. This does not predict the next market move.
            </p>
          </section>
          <div className="save-row">
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {!valid && (
              <p className="error" role="alert">
                Some inputs are invalid. Results show the saved plan until
                values are valid.
              </p>
            )}
            <button
              className="button"
              type="submit"
              disabled={saving || !valid}
            >
              {saved ? <Check size={17} /> : <ArrowRight size={17} />}{" "}
              {saved
                ? "Saved on this device"
                : saving
                  ? "Saving…"
                  : "Save this plan"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setDraft({ ...defaultPlan });
                setSaved(false);
                setError("");
              }}
            >
              <RotateCcw size={14} />
              Reset draft to example
            </button>
          </div>
        </div>
        <div className="planner-results">
          <section className="panel sticky-result">
            <div className="eyebrow">YOUR PLAN, AT A GLANCE</div>
            <h2>
              {usd(end.balance)} after {p.horizon} years
            </h2>
            <p className="panel-description">
              {crore(end.balance * futureFx)} projected against a{" "}
              {crore(end.target * futureFx)} future target.
            </p>
            <Chart plan={p} showTarget />
            <div className="result-lines">
              <div>
                <span>Your total contributions</span>
                <strong>{usd(end.contributed)}</strong>
              </div>
              <div>
                <span>Modeled growth / loss</span>
                <strong>{usd(end.balance - end.contributed)}</strong>
              </div>
              <div>
                <span>Still needed at the end</span>
                <strong>{usd(Math.max(0, end.target - end.balance))}</strong>
              </div>
              <div>
                <span>Monthly saving to meet target</span>
                <strong>
                  {monthly === null ? "No contribution window" : usd(monthly)}
                </strong>
              </div>
            </div>
            {p.deadline && (
              <div className="callout warning">
                <strong>Match required spending to safer assets.</strong>
                <p>
                  A firm deadline can force you to sell after a fall. This
                  allocation is not a recommendation for that liability.
                </p>
              </div>
            )}
            <div className="callout neutral">
              <Info size={18} />
              <p>
                {p.horizon <= 5
                  ? "Three to five years can be a short stock-market horizon. A paper trial builds familiarity, but cannot prove an allocation is safe."
                  : "More time gives compounding room; it does not remove market risk. Plan the cash you will need before withdrawals begin."}
              </p>
            </div>
          </section>
        </div>
      </form>
      <section className="panel section-gap">
        <div className="eyebrow">PRESSURE-TEST THE PLAN</div>
        <h2>What if the next few years are different?</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Ending USD</th>
                <th>Ending INR</th>
                <th>Goal funded</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "No growth · 0% annual", rate: 0 },
                {
                  label: `Your assumption · ${p.baseReturn}% annual`,
                  rate: p.baseReturn,
                },
                { label: "Stronger growth · 9% annual", rate: 9 },
                {
                  label: "Late shock · stocks −40%, defensive −5%",
                  rate: p.baseReturn,
                  shock: true,
                },
              ].map((s) => {
                const last = project(p, s.rate, s.shock).at(-1)!;
                return (
                  <tr key={s.label}>
                    <td>{s.label}</td>
                    <td>{usd(last.balance)}</td>
                    <td>{crore(last.balance * futureFx)}</td>
                    <td>{((last.balance / last.target) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="micro">
          Same contributions, inflation and FX assumptions. The shock hits
          invested assets just before the final monthly contribution; undeployed
          cash is unchanged. Losses can exceed this illustration.
        </p>
      </section>
      <div className="two-grid section-gap">
        <section className="panel">
          <div className="eyebrow">
            DOES ₹{p.goalCrore.toFixed(1)} CRORE MATCH YOUR LIFE?
          </div>
          <h2>Corpus and spending are different.</h2>
          <strong className="feature-number">
            ₹{Math.round(spendSupported).toLocaleString("en-IN")}
            <small> / month</small>
          </strong>
          <p className="panel-description">
            First-year spending arithmetic at {p.withdrawalRate}%, before tax.{" "}
            {p.goalToday
              ? "In today’s rupees."
              : "In future nominal rupees; not directly comparable with today’s expenses."}
          </p>
          <p className="micro">
            Your ₹{p.monthlySpendInr.toLocaleString("en-IN")} monthly expense
            estimate implies{" "}
            {crore((p.monthlySpendInr * 12) / (p.withdrawalRate / 100))} in
            today’s purchasing power at the same rate. Sequence of returns,
            lifespan, taxes and future costs still need a withdrawal plan.
          </p>
        </section>
        <section className="panel">
          <div className="eyebrow">MODEL NOTES</div>
          <h2>What the numbers include.</h2>
          <ul className="plain-list">
            <li>
              Annual returns converted to monthly rates; month-end
              contributions.
            </li>
            <li>
              Inflation runs from today through the start date and holding
              period for today’s purchasing-power targets.
            </li>
            <li>
              FX drift starts at the investing date; starting FX is separate.
            </li>
            <li>
              No withdrawals, personal taxes, trading costs or separate fee
              drag. Treat returns as after fund expenses.
            </li>
            <li>Actual balances and 401(k) are not added automatically.</li>
          </ul>
        </section>
      </div>
    </>
  );
}

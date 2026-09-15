import { useState, type FormEvent } from "react";
import { Check, Pencil, Trash2, NotebookPen, ShieldCheck } from "lucide-react";
import { localDate, totals, usd, validReview, type Review } from "./model";
import { NumberField } from "./ui";

export default function Weekly({
  reviews,
  onSave,
  onDelete,
  defaultFx,
}: {
  reviews: Review[];
  onSave: (r: Review) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  defaultFx: number;
}) {
  const [mode, setMode] = useState<"paper" | "actual">("paper");
  const empty = (kind: "paper" | "actual"): Review => ({
    id: crypto.randomUUID(),
    date: localDate(),
    mode: kind,
    cash: 0,
    taxable: 0,
    retirement: 0,
    india: 0,
    debt: 0,
    fx: defaultFx,
    contribution: 0,
    followed: true,
    mood: "Calm",
    note: "",
  });
  const [draft, setDraft] = useState<Review>(() => empty("paper"));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const records = reviews.filter((r) => r.mode === mode);
  const latest = records[0],
    previous = records[1];
  const delta =
    latest && previous ? totals(latest).net - totals(previous).net : null;
  function set<K extends keyof Review>(k: K, v: Review[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setError("");
  }
  function switchMode(kind: "paper" | "actual") {
    setMode(kind);
    setDraft(empty(kind));
    setEditing(false);
    setError("");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validReview(draft) || draft.date > localDate()) {
      setError("Enter valid amounts and a date no later than today.");
      return;
    }
    const duplicate = records.find(
      (r) => r.date === draft.date && r.id !== draft.id,
    );
    if (
      duplicate &&
      !window.confirm(
        "A check-in already exists for this date and mode. Replace it?",
      )
    )
      return;
    setBusy(true);
    try {
      await onSave(draft);
      setDraft(empty(mode));
      setEditing(false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Remove this check-in from this device?")) return;
    setBusy(true);
    try {
      await onDelete(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title title-row">
        <div>
          <div className="eyebrow">A SMALL HABIT, A LONG VIEW</div>
          <h1>
            Your weekly check-in<span>.</span>
          </h1>
          <p>
            Log the facts. Notice the feeling. Keep decisions connected to your
            plan.
          </p>
        </div>
        <div className="segmented" aria-label="Review mode">
          <button
            aria-pressed={mode === "paper"}
            className={mode === "paper" ? "selected" : ""}
            onClick={() => switchMode("paper")}
          >
            Paper practice
          </button>
          <button
            aria-pressed={mode === "actual"}
            className={mode === "actual" ? "selected" : ""}
            onClick={() => switchMode("actual")}
          >
            Actual balances
          </button>
        </div>
      </div>
      <div className="callout neutral section-gap">
        <ShieldCheck size={20} />
        <p>
          {mode === "paper"
            ? "Practice records use hypothetical balances that you enter. They are not automatic trades or a backtest, and never change your actual net worth."
            : "Enter balances from your statements, not account numbers. Your vested retirement savings count toward net worth but remain separate from money outside retirement."}{" "}
          Values stay in this browser. Export a backup before changing devices
          or clearing browser data.
        </p>
      </div>
      <div className="three-grid section-gap">
        <section className="panel mini-stat">
          <span>
            {mode === "paper" ? "Paper net worth" : "Recorded net worth"}
          </span>
          <strong>{latest ? usd(totals(latest).net) : "—"}</strong>
          <p>{latest ? `As of ${latest.date}` : "No check-ins yet"}</p>
        </section>
        <section className="panel mini-stat">
          <span>Change since previous check-in</span>
          <strong>{delta === null ? "—" : usd(delta)}</strong>
          <p>Includes deposits, FX, debt changes and market moves.</p>
        </section>
        <section className="panel mini-stat">
          <span>Check-ins following your plan</span>
          <strong>
            {records.filter((r) => r.followed).length}
            <small> / {records.length}</small>
          </strong>
          <p>Consistency is the part you can control.</p>
        </section>
      </div>
      <div className="weekly-layout section-gap">
        <form className="panel" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <div className="eyebrow">
                {mode === "paper" ? "PAPER PRACTICE" : "ACTUAL MONEY"}
              </div>
              <h2>{editing ? "Edit this check-in" : "Record this week"}</h2>
            </div>
            <NotebookPen size={21} className="muted" />
          </div>
          <div className="form-grid section-gap">
            <label className="field">
              <span>Snapshot date</span>
              <input
                type="date"
                min="2000-01-01"
                max={localDate()}
                required
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </label>
            <NumberField
              label="Snapshot USD/INR"
              value={draft.fx}
              min={1}
              max={500}
              step={0.01}
              onChange={(v) => set("fx", v)}
              help="Enter the rate used for your statement snapshot."
            />
            <NumberField
              label="Cash / savings · USD"
              value={draft.cash}
              max={1e10}
              step={0.01}
              onChange={(v) => set("cash", v)}
            />
            <NumberField
              label="U.S. taxable investments · USD"
              value={draft.taxable}
              max={1e10}
              step={0.01}
              onChange={(v) => set("taxable", v)}
            />
            <NumberField
              label="Vested 401(k) / retirement · USD"
              value={draft.retirement}
              max={1e10}
              step={0.01}
              onChange={(v) => set("retirement", v)}
            />
            <NumberField
              label="India financial assets · INR"
              value={draft.india}
              max={1e10}
              step={0.01}
              onChange={(v) => set("india", v)}
            />
            <NumberField
              label="Outstanding debt · USD equivalent"
              value={draft.debt}
              max={1e10}
              step={0.01}
              onChange={(v) => set("debt", v)}
            />
            <NumberField
              label="New money invested since last entry · USD"
              value={draft.contribution}
              max={1e10}
              step={0.01}
              onChange={(v) => set("contribution", v)}
              help="Included in balances above; never added twice. Transfers are not new money."
            />
          </div>
          <p className="micro">
            Exclude your house and car. Include each asset once; India assets
            are converted using this snapshot’s FX rate. New money is a journal
            field, not a calculated investment return.
          </p>
          <div className="section-gap">
            <label className="field">
              <span>How did this week feel?</span>
              <select
                value={draft.mood}
                onChange={(e) => set("mood", e.target.value)}
              >
                <option>Calm</option>
                <option>Uncertain</option>
                <option>Anxious</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={draft.followed}
                onChange={(e) => set("followed", e.target.checked)}
              />
              <span>I followed my contribution and allocation plan.</span>
            </label>
            <label className="field">
              <span>One note for your future self</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={draft.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="What changed in your life or plan? What tempted you to act?"
              />
            </label>
          </div>
          {draft.mood === "Anxious" && (
            <div className="callout warning">
              <strong>Review your cash needs before the chart.</strong>
              <p>
                If your job, spending date or capacity for loss changed, revisit
                the plan. If only prices changed, use your written rules before
                making a discretionary trade.
              </p>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="save-row">
            <button type="submit" className="button" disabled={busy}>
              <Check size={16} />
              {busy ? "Saving…" : "Save check-in"}
            </button>
            {editing && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setDraft(empty(mode));
                  setEditing(false);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
        <aside className="weekly-guide">
          <section className="decision-card">
            <div className="eyebrow">YOUR TEN-MINUTE ROUTINE</div>
            <h2>Observe more. React less.</h2>
            <ol>
              <li>
                <strong>Check the cash buffer.</strong>
                <p>Any change in work, expenses or the moving date?</p>
              </li>
              <li>
                <strong>Check the contribution.</strong>
                <p>Was money invested as planned, or is it waiting in cash?</p>
              </li>
              <li>
                <strong>Record the balances.</strong>
                <p>
                  Compare like-for-like dates. A deposit is not a market gain.
                </p>
              </li>
              <li>
                <strong>Close the dashboard.</strong>
                <p>
                  Review allocation on your scheduled review date, not after
                  every headline.
                </p>
              </li>
            </ol>
          </section>
          <section className="panel section-gap">
            <div className="eyebrow">WHAT A PAPER TRIAL CAN TEACH</div>
            <h2>Learn the routine, not the next return.</h2>
            <p className="panel-description">
              Use the same hypothetical portfolio and record its value each
              week. A calm trial does not reproduce the stress of real losses,
              and a good year does not prove the plan is safe.
            </p>
          </section>
        </aside>
      </div>
      <section className="panel section-gap">
        <div className="eyebrow">
          {mode === "paper" ? "PAPER" : "ACTUAL"} HISTORY
        </div>
        <h2>Your record, week by week.</h2>
        {records.length === 0 ? (
          <div className="empty-inline">
            <NotebookPen size={24} />
            <p>
              No check-ins in this mode yet. Your first entry establishes the
              baseline.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Net worth</th>
                  <th>New money</th>
                  <th>Feeling / plan</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{usd(totals(r).net)}</td>
                    <td>{usd(r.contribution)}</td>
                    <td>
                      {r.mood}
                      <br />
                      <span className="micro">
                        {r.followed ? "Followed plan" : "Plan not followed"}
                      </span>
                    </td>
                    <td className="note-cell">{r.note || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${r.date}`}
                          onClick={() => {
                            setDraft(r);
                            setEditing(true);
                            setError("");
                            window.scrollTo({ top: 300, behavior: "smooth" });
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label={`Delete ${r.date}`}
                          onClick={() => void remove(r.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

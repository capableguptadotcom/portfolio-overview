import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Compass,
  LayoutDashboard,
  SlidersHorizontal,
  NotebookPen,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Download,
  Upload,
  ExternalLink,
  X,
  CircleHelp,
} from "lucide-react";
import {
  defaultPlan,
  project,
  usd,
  crore,
  requiredMonthly,
  totals,
  type Plan,
  type Review,
  type Market,
} from "./model";
import {
  loadData,
  savePlan,
  saveReview,
  removeReview,
  exportBackup,
  importBackup,
} from "./database";
import Chart from "./Chart";
import PlanEditor from "./PlanEditor";
import Weekly from "./Weekly";
import Playbook from "./Playbook";
import { funds } from "./content";
import { Allocation, monthLabel } from "./ui";

type Page = "Overview" | "Build your plan" | "Weekly review" | "The playbook";
const navigation = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: SlidersHorizontal, label: "Build your plan" },
  { icon: NotebookPen, label: "Weekly review" },
  { icon: BookOpen, label: "The playbook" },
] as const;

export default function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [market, setMarket] = useState<Market>({
    fetchedAt: null,
    assets: [],
    errors: [],
  });
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    loadData()
      .then((data) => {
        setPlan(data.plan);
        setReviews(data.reviews);
        setReady(true);
      })
      .catch((e) => setLoadError(String(e.message)));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}market.json`)
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data.assets)) setMarket(data);
      })
      .catch(() =>
        setMarket({
          fetchedAt: null,
          assets: [],
          errors: ["The public market snapshot could not be loaded."],
        }),
      );
  }, []);
  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function changePlan(next: Plan) {
    await savePlan(next);
    setPlan(next);
    setNotice("Plan saved on this device.");
  }
  async function storeReview(review: Review) {
    setReviews(await saveReview(review));
    setNotice("Weekly check-in saved on this device.");
  }
  async function deleteReview(id: string) {
    setReviews(await removeReview(id));
    setNotice("Check-in removed.");
  }
  async function restore(file: File) {
    if (
      !window.confirm(
        "Replace this device’s plan and all check-ins with this backup? Export your current data first if you want to keep it.",
      )
    )
      return;
    setBusy(true);
    try {
      const data = await importBackup(file);
      setPlan(data.plan);
      setReviews(data.reviews);
      setPage("Overview");
      setNotice("Backup restored.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Overview");
          }}
        >
          <Compass size={29} />
          <span>
            northstar<span className="brand-caption">PERSONAL FINANCE</span>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className={page === label ? "nav-item active" : "nav-item"}
              onClick={() => navigate(label)}
              aria-current={page === label ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={21} />
          <strong>Built for the long run.</strong>
          <p>
            A weekly check-in.
            <br />A plan you can stay with.
          </p>
          <button
            className="text-button"
            onClick={() => navigate("The playbook")}
          >
            Read your investing rules <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="local-status">
          <span className="status-dot" /> Device-only records · back up
          regularly
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Your investing workspace{" "}
            <span className="breadcrumb">/ {page}</span>
          </span>
          <div className="topbar-actions">
            <span className="pill">PLANNING & PAPER TRACKING</span>
            <button
              className="icon-button"
              disabled={!ready}
              title="Export private SQLite backup"
              aria-label="Export private SQLite backup"
              onClick={() => {
                exportBackup();
                setNotice(
                  "Backup downloaded. Keep it private; it contains your financial records.",
                );
              }}
            >
              <Download size={18} />
            </button>
            <button
              className="icon-button"
              disabled={!ready || busy}
              title="Import SQLite backup"
              aria-label="Import SQLite backup"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={18} />
            </button>
            <input
              hidden
              ref={fileInput}
              type="file"
              accept=".sqlite,.sqlite3,.db"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void restore(f);
                e.target.value = "";
              }}
            />
          </div>
        </header>
        {notice && (
          <div className="toast" role="status">
            <span>{notice}</span>
            <button aria-label="Dismiss message" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className="content">
          {loadError ? (
            <div className="callout warning">
              <h2>Your saved data could not be opened.</h2>
              <p>
                {loadError} Your existing records have not been replaced. Try
                this page in a browser with device storage enabled.
              </p>
            </div>
          ) : !ready ? (
            <div className="loading">
              <Compass size={32} />
              <h2>Opening your workspace…</h2>
              <p>Loading your private plan from this device.</p>
            </div>
          ) : (
            <>
              {page === "Overview" && (
                <Overview
                  plan={plan}
                  reviews={reviews}
                  market={market}
                  navigate={navigate}
                />
              )}
              {page === "Build your plan" && (
                <PlanEditor plan={plan} onSave={changePlan} />
              )}
              {page === "Weekly review" && (
                <Weekly
                  reviews={reviews}
                  onSave={storeReview}
                  onDelete={deleteReview}
                  defaultFx={plan.fx}
                />
              )}
              {page === "The playbook" && <Playbook plan={plan} />}
            </>
          )}
          <footer>
            <span>Northstar · A plan, not a prediction.</span>
            <span>
              Educational scenarios. Values before personal taxes and trading
              costs.
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Overview({
  plan: p,
  reviews,
  market,
  navigate,
}: {
  plan: Plan;
  reviews: Review[];
  market: Market;
  navigate: (p: Page) => void;
}) {
  const end = project(p).at(-1)!;
  const required = requiredMonthly(p);
  const actual = reviews.find((r) => r.mode === "actual");
  const paperCount = reviews.filter((r) => r.mode === "paper").length;
  const futureFx = p.fx * (1 + p.fxChange / 100) ** p.horizon;
  const stress = project(p, p.baseReturn, true).at(-1)!.balance;
  const start = monthLabel(p.start);
  const daysToStart = Math.ceil(
    (new Date(`${p.start}-01T00:00:00`).getTime() - Date.now()) / 86400000,
  );
  return (
    <>
      <div className="page-title title-row">
        <div>
          <div className="eyebrow">THE BIG PICTURE</div>
          <h1>
            Your path to independence<span>.</span>
          </h1>
          <p>
            {daysToStart > 0
              ? `Build the habit now. Your planned investing start is ${start}.`
              : `Your planned investing start: ${start}. Review the plan before putting it to work.`}
          </p>
        </div>
        <button
          className="button outline"
          onClick={() => navigate("Build your plan")}
        >
          <SlidersHorizontal size={16} />
          Edit plan
        </button>
      </div>
      <div className="assumption-banner">
        <span className="pill subtle">PLANNING SCENARIO</span>
        <span>
          {usd(p.initial, true)} savings · {usd(p.monthly, true)} / month · ₹
          {p.fx} / $ at start · separate from actual balances
        </span>
      </div>
      {p.deadline && (
        <div className="callout warning">
          <strong>A firm withdrawal deadline changes the plan.</strong>
          <p>
            Protect the amount you must spend by the deadline. The stock
            scenarios below are comparisons, not a suitable allocation for money
            you must recover on time.
          </p>
        </div>
      )}
      <div className="stats">
        <section>
          <div className="stat-label">
            Independence goal <ArrowUpRight size={16} />
          </div>
          <strong>
            ₹{p.goalCrore.toFixed(2)}
            <span>crore</span>
          </strong>
          <p>
            {p.goalToday ? "Today’s purchasing power" : "Nominal rupee target"}{" "}
            · house excluded
          </p>
        </section>
        <section>
          <div className="stat-label">Starting investments</div>
          <strong>
            {usd(p.initial - p.reserve)}
            <span>USD</span>
          </strong>
          <p>{usd(p.reserve)} protected outside this pot</p>
        </section>
        <section>
          <div className="stat-label">Projected after {p.horizon} years</div>
          <strong>
            {usd(end.balance, true)}
            <span>USD</span>
          </strong>
          <p>{p.baseReturn}% annual scenario · before tax</p>
        </section>
        <section>
          <div className="stat-label">Goal funded in this scenario</div>
          <strong>
            {((end.balance / end.target) * 100).toFixed(0)}
            <span>%</span>
          </strong>
          <p>
            {crore(end.balance * futureFx)} against{" "}
            {crore(end.target * futureFx)} future goal
          </p>
        </section>
      </div>
      <div className="overview-grid">
        <section className="panel projection">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">YOUR TRAJECTORY</div>
              <h2>Contributions first. Compounding next.</h2>
            </div>
            <span className="pill subtle">{p.horizon} YEARS</span>
          </div>
          <div className="chart-summary">
            <strong>{usd(end.balance)}</strong>
            <span>
              {usd(end.contributed)} contributed ·{" "}
              {usd(end.balance - end.contributed)} modeled growth
            </span>
          </div>
          <Chart plan={p} />
          <div className="chart-foot">
            Hypothetical paths, not probabilities or historical performance. The
            shaded area is not a confidence interval; actual results can fall
            below it.
          </div>
        </section>
        <section className="decision-card">
          <div className="eyebrow">YOUR NEXT MOVE</div>
          <h2>
            {required !== null && required > p.monthly
              ? "Make the savings goal realistic."
              : "Protect the plan before investing."}
          </h2>
          <p>
            {required !== null && required > p.monthly
              ? "At these assumptions, your contributions leave a gap. Explore more saving or more time before taking more risk."
              : "Set aside emergency and dated-purchase money. Agree on a mix you can hold through a serious decline."}
          </p>
          <div className="decision-divider" />
          <span className="eyebrow">CONTRIBUTION NEEDED FOR THIS GOAL</span>
          <strong>
            {required === null ? "No contribution window" : usd(required)}
            {required !== null && <small>/ month</small>}
          </strong>
          <p>
            Over {p.contributionYears} contribution years, reaching the goal in{" "}
            {p.horizon} years at {p.baseReturn}%. A calculation, not a promise.
          </p>
          <button
            className="button light"
            onClick={() => navigate("Build your plan")}
          >
            Explore the assumptions <ArrowRight size={17} />
          </button>
        </section>
      </div>
      <div className="three-grid section-gap">
        <section className="panel">
          <div className="panel-heading">
            <div className="eyebrow">A SIMPLE STARTING MIX</div>
            <ShieldCheck size={17} className="muted" />
          </div>
          <h2>
            {p.equity}% growth / {100 - p.equity}% defensive
          </h2>
          <p className="panel-description">
            Illustrative long-term mix. Safety reserves sit outside it.
          </p>
          <Allocation plan={p} small />
          <button
            className="text-button"
            onClick={() => navigate("Build your plan")}
          >
            Understand the trade-offs <ArrowRight size={14} />
          </button>
        </section>
        <section className="panel">
          <div className="eyebrow">BEFORE YOU COMMIT</div>
          <h2>Could you hold through this?</h2>
          <strong className="feature-number negative">
            −{(p.equity * 0.4 + (100 - p.equity) * 0.05).toFixed(0)}%
          </strong>
          <p className="panel-description">
            Stocks fall 40%, defensive assets fall 5%. The ending value is{" "}
            <strong>{usd(stress, true)}</strong> when this shock hits just
            before the last contribution.
          </p>
          <p className="micro">
            Not a worst case or a recovery guarantee. Lower risk if this loss
            would force a sale.
          </p>
        </section>
        <section className="panel">
          <div className="eyebrow">THE WEEKLY HABIT</div>
          <h2>Ten minutes. Once a week.</h2>
          <div className="habit-number">
            {paperCount.toString().padStart(2, "0")}
            <span>paper check-ins recorded</span>
          </div>
          <p className="panel-description">
            Record balances, contributions and how you felt. Keep actual money
            and paper practice separate.
          </p>
          <button
            className="button outline full"
            onClick={() => navigate("Weekly review")}
          >
            Log a check-in <ArrowRight size={15} />
          </button>
        </section>
      </div>
      <section className="panel section-gap">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">YOUR REAL-WORLD POSITION</div>
            <h2>
              {actual
                ? "Actual balances, kept separate."
                : "Your actual balances start here."}
            </h2>
          </div>
          <button
            className="text-button"
            onClick={() => navigate("Weekly review")}
          >
            {actual ? "Update balances" : "Record first balances"}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
        {actual ? (
          <div className="actual-grid">
            <div>
              <span>Total net worth</span>
              <strong>{usd(totals(actual).net)}</strong>
            </div>
            <div>
              <span>Outside retirement, less debt</span>
              <strong>{usd(totals(actual).accessible)}</strong>
            </div>
            <div>
              <span>Vested 401(k) / retirement</span>
              <strong>{usd(actual.retirement)}</strong>
            </div>
            <p>
              Snapshot: {actual.date}. Includes cash reserves; these totals are
              not the spendable FI pot. House and car are excluded.
            </p>
          </div>
        ) : (
          <div className="empty-inline">
            <NotebookPen size={24} />
            <p>
              The $100k above is an example, not an account balance. Add a real
              snapshot to track net worth, retirement assets and money outside
              retirement.
            </p>
          </div>
        )}
      </section>
      <section className="panel section-gap">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">MARKET CONTEXT</div>
            <h2>Watch the market. Follow the plan.</h2>
          </div>
          <span className="pill subtle">WEEKLY SNAPSHOT</span>
        </div>
        <p className="panel-description">
          Reference funds, not a shopping list. Price moves do not change your
          contribution schedule.
        </p>
        <div className="market-grid">
          {funds.map((f) => {
            const m = market.assets.find((a) => a.symbol === f.symbol);
            const age = m
              ? Math.floor(
                  (Date.now() - Date.parse(`${m.asOf}T00:00:00Z`)) / 86400000,
                )
              : null;
            return (
              <div className="market-card" key={f.symbol}>
                <a href={f.url} target="_blank" rel="noreferrer">
                  <span className="ticker" style={{ color: f.color }}>
                    {f.symbol}
                  </span>
                  <ExternalLink size={13} />
                </a>
                <span className="market-name">{f.name}</span>
                <strong>
                  {m
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(m.price)
                    : "Not available"}
                </strong>
                <span
                  className={
                    m && m.weekChange !== null && m.weekChange < 0
                      ? "negative"
                      : "muted"
                  }
                >
                  {m?.weekChange != null
                    ? `${m.weekChange > 0 ? "+" : ""}${m.weekChange.toFixed(2)}% over ~1 week`
                    : "Weekly change unavailable"}
                </span>
                <div className="micro">
                  {m
                    ? `${m.asOf}${age !== null && age > 10 ? " · STALE" : ""}`
                    : "Awaiting a successful refresh"}
                  {m?.drawdown != null && (
                    <>
                      <br />
                      {m.drawdown.toFixed(1)}% from available 1-year high
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-foot">
          Prices: Yahoo Finance public chart feed (unofficial; may be delayed or
          provisional intraday). ETF changes use adjusted closes; distributions
          and splits may alter history. Drawdown is from the available
          rolling-year high, not the all-time high.{" "}
          {market.fetchedAt &&
            `Retrieved ${new Date(market.fetchedAt).toLocaleString()}. `}
          {market.errors.length > 0 && (
            <strong>Some refreshes failed; old dates are retained. </strong>
          )}
          <a href="https://finance.yahoo.com" target="_blank" rel="noreferrer">
            Verify with your broker before trading.
          </a>
        </div>
      </section>
      <div className="bottom-note">
        <CircleHelp size={17} />
        <p>
          U.S. access is useful. U.S. outperformance and a stronger dollar are
          not guaranteed. Your plan should survive a different future.
        </p>
        <button
          className="text-button"
          onClick={() => navigate("The playbook")}
        >
          Read the research <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}

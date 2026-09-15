import { ArrowUpRight, BookOpen, Check, ShieldCheck } from "lucide-react";
import { sources, funds } from "./content";
import { usd, type Plan } from "./model";
import { monthLabel } from "./ui";

export default function Playbook({ plan: p }: { plan: Plan }) {
  const steps = [
    {
      title: "Protect the money with a date attached.",
      text: `Your scenario reserves ${usd(p.reserve)} outside investments. Replace that example with emergency expenses, moving costs and house/car money you may need soon. Size it from your actual needs. If spending is in India, consider the currency of that liability too.`,
    },
    {
      title: "Give each account a job.",
      text: "Check the employer match and vesting rules in your 401(k). Money contributed still needs an investment choice. Count vested retirement assets in net worth, then keep them separate from the money available for early independence and a home.",
    },
    {
      title: "Use a broad core you can leave alone.",
      text: "Broad U.S. and international stock funds are candidates for long-term growth. Cash and suitable high-quality bonds reduce reliance on stocks. An S&P 500 fund is an alternative U.S. large-cap core; owning it alongside total U.S. stocks mostly adds overlap.",
    },
    {
      title: "Decide the entry schedule in advance.",
      text: `Your saved plan starts in ${monthLabel(p.start)} with ${p.phaseMonths === 1 ? "one initial investment" : `${p.phaseMonths} equal monthly installments`}, then ${usd(p.monthly)} each month. Reconfirm circumstances before starting. Do not postpone each installment until a correction you cannot reliably predict.`,
    },
    {
      title: "Review the plan when your life changes.",
      text: "Check records weekly. Review allocation at least annually and when work, tax residence, spending dates or your capacity for loss changes. Rebalance toward written targets, considering taxes and using new contributions where practical.",
    },
  ];
  return (
    <>
      <div className="page-title">
        <div className="eyebrow">THE REASONING BEHIND THE NUMBERS</div>
        <h1>
          Your investing playbook<span>.</span>
        </h1>
        <p>
          A direction you can follow, with sources you can question. Research
          checked September 15, 2026.
        </p>
      </div>
      <div className="playbook-intro section-gap">
        <div className="decision-card">
          <div className="eyebrow">THE WORKING DIRECTION</div>
          <h2>
            Save aggressively.
            <br />
            Take risk deliberately.
          </h2>
          <p>
            Build a diversified long-term portfolio with regular contributions.
            Keep emergency and dated spending money safe. Treat Nasdaq exposure
            as optional concentration, and choose a risk level you can live with
            before committing real money.
          </p>
          <div className="decision-divider" />
          <p>
            If you must use the money in five years, build around that spending
            requirement first. “I can contribute for five years” is a different
            statement.
          </p>
        </div>
        <section className="panel">
          <div className="eyebrow">THREE IDEAS TO REFRAME</div>
          <div className="belief">
            <span>01</span>
            <div>
              <h3>“A 1% day earns my salary.”</h3>
              <p>
                ₹1 crore × 1% = ₹1 lakh in a day, in either direction. An
                unrealized price change is not dependable income. FI needs a
                spending and withdrawal plan.
              </p>
            </div>
          </div>
          <div className="belief">
            <span>02</span>
            <div>
              <h3>“U.S. investing is obviously better.”</h3>
              <p>
                Access and account convenience matter. Future returns, valuation
                and USD/INR can still disappoint. Diversification makes the plan
                less dependent on one winning story.
              </p>
            </div>
          </div>
          <div className="belief">
            <span>03</span>
            <div>
              <h3>“I will invest when prices are low.”</h3>
              <p>
                Markets can look expensive for years. Choose an affordable
                allocation and a fixed schedule. A falling price alone does not
                tell you a stock is cheap.
              </p>
            </div>
          </div>
        </section>
      </div>
      <section className="panel section-gap">
        <div className="eyebrow">FROM NOW TO YOUR FIRST CONTRIBUTION</div>
        <h2>Five decisions. In this order.</h2>
        <div className="steps">
          {steps.map((step, i) => (
            <div key={step.title}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="panel section-gap">
        <div className="eyebrow">KNOW WHAT YOU OWN</div>
        <h2>A fund shortlist to understand, not a trade instruction.</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Example</th>
                <th>Role</th>
                <th>What to check</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f.symbol}>
                  <td>
                    <a
                      className="source-link"
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.symbol}
                      <ArrowUpRight size={14} />
                    </a>
                    <span className="micro">{f.name}</span>
                  </td>
                  <td>{f.role}</td>
                  <td>
                    {f.symbol === "QQQM"
                      ? "Optional tilt, capped at 10% in this planner. Overlaps the U.S. core; 0% is fine."
                      : f.symbol === "BND"
                        ? "Broad bond fund, not a guaranteed-value reserve. Check duration and interest-rate risk."
                        : f.symbol === "VXUS"
                          ? "Non-U.S. stock exposure through a U.S.-domiciled fund; still exposed to equity and currency risk."
                          : "Broad U.S. equities, including large technology companies; it can still suffer deep losses."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="micro">
          Review current expense ratios, prospectuses, taxes and broker
          eligibility using the issuer links. These are examples, not
          endorsements or a model portfolio to execute automatically. Insured
          deposits and maturity-matched Treasury bills are different from bond
          funds.
        </p>
      </section>
      <div className="two-grid section-gap">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">U.S. TO INDIA</div>
              <h2>Plan the move before moving the money.</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          <ul className="check-list">
            <li>
              <Check size={16} />
              <span>
                <strong>Broker access:</strong> confirm your exact account can
                be retained from India, which purchases remain permitted, and
                withdrawal/transfer arrangements. Do not assume every Schwab
                account works the same way.
              </span>
            </li>
            <li>
              <Check size={16} />
              <span>
                <strong>Tax status:</strong> citizenship, green-card history,
                U.S. residence, Indian RNOR/ROR and estate domicile answer
                different questions.
              </span>
            </li>
            <li>
              <Check size={16} />
              <span>
                <strong>Tax forms:</strong> W-9 vs W-8BEN follows U.S. tax
                status, not simply your new address.
              </span>
            </li>
            <li>
              <Check size={16} />
              <span>
                <strong>Indian holdings:</strong> review foreign funds for PFIC
                rules while a U.S. person. Review FBAR/Form 8938 reporting for
                foreign accounts.
              </span>
            </li>
            <li>
              <Check size={16} />
              <span>
                <strong>Retirement and estate:</strong> review distributions,
                treaty treatment and U.S.-situated assets before the move. The
                $60k estate filing threshold is not a universal tax-free
                allowance.
              </span>
            </li>
          </ul>
          <p className="micro">
            Get account-specific answers from the broker and coordinated
            U.S.–India tax advice before changing residence or selling
            substantial positions. Public guidance cannot settle those facts for
            your household.
          </p>
        </section>
        <section className="panel book-panel">
          <BookOpen size={29} />
          <div className="eyebrow">FROM YOUR BOOK</div>
          <h2>Why Does the Stock Market Go Up?</h2>
          <p className="book-author">Brian Feroldi</p>
          <p className="panel-description">
            The useful lesson is a repeatable process: understand ownership,
            diversify, keep costs low, invest regularly, and give compounding
            time. A good explanation of long-run business growth is not a
            guarantee of a good next five years.
          </p>
          <div className="reading-list">
            <div>
              <strong>Behavior & uncertainty</strong>
              <span>Ch. 16, 20–21 · PDF pp. 78–80, 94–104</span>
            </div>
            <div>
              <strong>Compounding & index funds</strong>
              <span>Ch. 30–32, 36–39 · PDF pp. 131–145, 160–172</span>
            </div>
            <div>
              <strong>Timing, risk & the routine</strong>
              <span>
                Ch. 45–46, 50–52, 55 · PDF pp. 192–198, 207–214, 220–221
              </span>
            </div>
          </div>
          <p className="micro">
            Original synthesis from your supplied PDF. Historical examples are
            not used as forecasts. The book itself is not uploaded or
            distributed with this website.
          </p>
        </section>
      </div>
      <section className="panel section-gap">
        <div className="eyebrow">PRIMARY SOURCES</div>
        <h2>Follow the reasoning to its source.</h2>
        <div className="source-grid">
          {sources.map((s) => (
            <article key={s.title}>
              <span className="source-publisher">{s.publisher}</span>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
                <ArrowUpRight size={15} />
              </a>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

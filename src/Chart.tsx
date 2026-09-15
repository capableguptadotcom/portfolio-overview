import { project, targetAt, usd, type Plan } from "./model";

export default function Chart({
  plan,
  showTarget = false,
}: {
  plan: Plan;
  showTarget?: boolean;
}) {
  const low = project(plan, 0),
    base = project(plan),
    high = project(plan, 9);
  const total = plan.horizon * 12;
  const ceiling =
    Math.max(
      ...high.map((p) => p.balance),
      ...base.map((p) => p.balance),
      ...(showTarget ? [targetAt(plan, plan.horizon)] : []),
      1,
    ) * 1.12;
  const y = (n: number) => 224 - (n / ceiling) * 190;
  const x = (month: number) => 58 + (month / total) * 594;
  const path = (
    points: ReturnType<typeof project>,
    field: "balance" | "contributed" | "target" = "balance",
  ) =>
    points
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${x(p.month).toFixed(2)},${y(p[field]).toFixed(2)}`,
      )
      .join(" ");
  const fill = `${path(high)} ${[...low]
    .reverse()
    .map((p) => `L${x(p.month)},${y(p.balance)}`)
    .join(" ")} Z`;
  return (
    <>
      <svg
        className="chart"
        viewBox="0 0 700 270"
        role="img"
        aria-label={`Hypothetical portfolio scenarios over ${plan.horizon} years, from 0 percent to 9 percent annual return. The chosen ${plan.baseReturn} percent scenario ends at ${usd(base.at(-1)!.balance)}.`}
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="58"
              x2="652"
              y1={y((ceiling * i) / 3)}
              y2={y((ceiling * i) / 3)}
              stroke="#e8eee8"
              strokeDasharray="3 5"
            />
            <text
              x="47"
              y={y((ceiling * i) / 3) + 4}
              textAnchor="end"
              fill="#829086"
              fontSize="11"
            >
              {usd((ceiling * i) / 3, true)}
            </text>
          </g>
        ))}
        <path d={fill} fill="#e9f1e4" />
        <path d={path(high)} fill="none" stroke="#a4b981" strokeWidth="1.5" />
        <path d={path(low)} fill="none" stroke="#a4b981" strokeWidth="1.5" />
        <path
          d={path(base, "contributed")}
          fill="none"
          stroke="#98a8a0"
          strokeDasharray="4 5"
          strokeWidth="1.5"
        />
        {showTarget && (
          <path
            d={path(base, "target")}
            fill="none"
            stroke="#b8863f"
            strokeDasharray="6 4"
            strokeWidth="2"
          />
        )}
        <path d={path(base)} fill="none" stroke="#28745d" strokeWidth="3" />
        <circle
          cx={x(total)}
          cy={y(base.at(-1)!.balance)}
          r="4.5"
          fill="#28745d"
          stroke="white"
          strokeWidth="2"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <text
            key={i}
            x={x((total * i) / 5)}
            y="251"
            fontSize="12"
            textAnchor="middle"
            fill="#7c8980"
          >
            Year {Math.round((plan.horizon * i) / 5)}
          </text>
        ))}
      </svg>
      <div className="legend">
        <span>
          <i style={{ background: "#28745d" }} />
          {plan.baseReturn}% scenario
        </span>
        <span>
          <i style={{ background: "#dce7cd" }} />
          0–9% illustrations
        </span>
        <span>
          <i style={{ background: "#98a8a0" }} />
          Your contributions
        </span>
        {showTarget && (
          <span>
            <i style={{ background: "#b8863f" }} />
            Goal in future USD
          </span>
        )}
      </div>
    </>
  );
}

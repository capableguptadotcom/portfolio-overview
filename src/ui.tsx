import type { Plan } from "./model";

export const monthLabel = (month: string) =>
  new Date(`${month}-02T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

export function Allocation({
  plan,
  small = false,
}: {
  plan: Plan;
  small?: boolean;
}) {
  const weights = [
    plan.equity * 0.75 - plan.tilt,
    plan.equity * 0.25,
    plan.tilt,
    100 - plan.equity,
  ];
  const labels = [
    "Broad U.S. stocks",
    "International stocks",
    "Nasdaq-100 tilt",
    "Defensive assets",
  ];
  const colors = ["#2f6b58", "#8aab76", "#c3a162", "#d7dfd3"];
  return (
    <div className={small ? "allocation compact" : "allocation"}>
      <div className="allocation-bar">
        {weights.map(
          (w, i) =>
            w > 0 && (
              <span
                key={i}
                style={{ width: `${w}%`, background: colors[i] }}
                title={`${labels[i]} ${w}%`}
              />
            ),
        )}
      </div>
      <div className="allocation-key">
        {weights.map(
          (w, i) =>
            w > 0 && (
              <div key={i}>
                <span>
                  <i style={{ background: colors[i] }} />
                  {labels[i]}
                </span>
                <strong>{w.toFixed(w % 1 ? 1 : 0)}%</strong>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
};
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  help,
}: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        required
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {help && <small>{help}</small>}
    </label>
  );
}

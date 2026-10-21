import type { SeriesPair } from "../lib/api";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 360;
const MARGIN = { top: 24, right: 28, bottom: 64, left: 76 };
const INNER_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;
const AXIS_Y = MARGIN.top + INNER_HEIGHT;
const MIN_TICKS = 4;
const MAX_TICKS = 6;
const PADDING_RATIO = 0.05;
const POINT_COLOR = "#0e7490";

type Domain = { min: number; max: number };
type Ticks = { values: number[]; step: number; domain: Domain };

function axisLabel(column: string, unit?: string | null): string {
  const trimmed = unit?.trim();
  return trimmed ? `${column} (${trimmed})` : column;
}

function finitePairs(pairs: SeriesPair[]): SeriesPair[] {
  return pairs.filter(
    (pair) => Number.isFinite(pair.x) && Number.isFinite(pair.y),
  );
}

function clampToFinite(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

function computeDomain(values: number[]): Domain {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    const delta = min === 0 ? 1 : Math.abs(min) * PADDING_RATIO;
    const low = clampToFinite(min - delta, -Number.MAX_VALUE);
    const high = clampToFinite(min + delta, Number.MAX_VALUE);
    if (low < high) {
      return { min: low, max: high };
    }
    return min > 0
      ? { min: clampToFinite(min - delta, -Number.MAX_VALUE), max: min }
      : { min: min, max: clampToFinite(min + delta, Number.MAX_VALUE) };
  }
  const span = max - min;
  if (!Number.isFinite(span)) {
    return {
      min: clampToFinite(min, -Number.MAX_VALUE),
      max: clampToFinite(max, Number.MAX_VALUE),
    };
  }
  const padding = span * PADDING_RATIO;
  const low = clampToFinite(min - padding, min);
  const high = clampToFinite(max + padding, max);
  if (!Number.isFinite(high - low) || high <= low) {
    return { min, max };
  }
  return { min: low, max: high };
}

function normalize(value: number, step: number): number {
  if (Math.abs(value) < step * 1e-9) {
    return 0;
  }
  return value;
}

function candidateSteps(span: number): number[] {
  const raw = span / 4;
  if (!Number.isFinite(raw) || raw <= 0) {
    return [];
  }
  const exponent = Math.floor(Math.log10(raw));
  const steps: number[] = [];
  for (let power = exponent + 2; power >= exponent - 5; power -= 1) {
    for (const multiplier of [5, 2.5, 2, 1]) {
      const step = multiplier * 10 ** power;
      if (Number.isFinite(step) && step > 0) {
        steps.push(step);
      }
    }
  }
  return steps;
}

function ticksFor(domain: Domain, step: number): number[] {
  if (!Number.isFinite(step) || step <= 0) {
    return [];
  }
  const firstIndex = Math.ceil(domain.min / step - 1e-9);
  const lastIndex = Math.floor(domain.max / step + 1e-9);
  const values: number[] = [];
  for (let index = firstIndex; index <= lastIndex && values.length < 30; index += 1) {
    values.push(normalize(index * step, step));
  }
  return values;
}

function generateTicks(domain: Domain): Ticks {
  const span = domain.max - domain.min;
  if (!Number.isFinite(span) || span <= 0) {
    const fractions = [0, 0.25, 0.5, 0.75, 1];
    const values = fractions
      .map((fraction) => domain.min * (1 - fraction) + domain.max * fraction)
      .filter((value) => Number.isFinite(value));
    const halfSpan = Math.abs(domain.max / 2 - domain.min / 2);
    return {
      values: values.length > 0 ? values : [domain.min, domain.max],
      step: halfSpan > 0 ? halfSpan : 1,
      domain,
    };
  }

  const steps = candidateSteps(span);
  let best: { values: number[]; step: number; domain: Domain; growth: number } | null =
    null;

  for (const step of steps) {
    const inside = ticksFor(domain, step);
    if (inside.length >= MIN_TICKS && inside.length <= MAX_TICKS) {
      return { values: inside, step, domain };
    }

    const firstIndex = Math.floor(domain.min / step + 1e-9);
    const lastIndex = Math.ceil(domain.max / step - 1e-9);
    const count = lastIndex - firstIndex + 1;
    if (count < MIN_TICKS || count > MAX_TICKS) {
      continue;
    }
    const low = firstIndex * step;
    const high = lastIndex * step;
    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
      continue;
    }
    const growth = (high - low) / span - 1;
    const values: number[] = [];
    for (let index = firstIndex; index <= lastIndex; index += 1) {
      values.push(normalize(index * step, step));
    }
    const candidate = {
      values,
      step,
      domain: { min: low, max: high },
      growth,
    };
    if (
      !best ||
      growth < best.growth - 1e-9 ||
      (Math.abs(growth - best.growth) <= 1e-9 &&
        Math.abs(values.length - 5) < Math.abs(best.values.length - 5))
    ) {
      best = candidate;
    }
  }

  if (best) {
    return { values: best.values, step: best.step, domain: best.domain };
  }

  const fractions = [0, 0.25, 0.5, 0.75, 1];
  return {
    values: fractions.map(
      (fraction) => domain.min * (1 - fraction) + domain.max * fraction,
    ),
    step: span / 4,
    domain,
  };
}

function buildAxis(values: number[]): Ticks {
  return generateTicks(computeDomain(values));
}

function formatTick(value: number, step: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value === 0) {
    return "0";
  }
  const abs = Math.abs(value);
  if (abs >= 1e5 || abs < 1e-3) {
    return value
      .toExponential(2)
      .replace(/\.?0+e/, "e")
      .replace("e+", "e");
  }
  const decimals = Math.min(8, Math.max(0, Math.ceil(-Math.log10(step)) + 1));
  return String(Number(value.toFixed(decimals)));
}

function axisRatio(value: number, domain: Domain): number {
  const span = domain.max - domain.min;
  if (Number.isFinite(span) && span > 0) {
    return (value - domain.min) / span;
  }
  const halfSpan = domain.max / 2 - domain.min / 2;
  if (Number.isFinite(halfSpan) && halfSpan > 0) {
    return (value / 2 - domain.min / 2) / halfSpan;
  }
  return 0.5;
}

function scaleX(value: number, domain: Domain): number {
  return MARGIN.left + axisRatio(value, domain) * INNER_WIDTH;
}

function scaleY(value: number, domain: Domain): number {
  return AXIS_Y - axisRatio(value, domain) * INNER_HEIGHT;
}

export function ScatterPlot({
  pairs,
  xColumn,
  yColumn,
  xUnit,
  yUnit,
}: {
  pairs: SeriesPair[];
  xColumn: string;
  yColumn: string;
  xUnit?: string | null;
  yUnit?: string | null;
}) {
  const points = finitePairs(pairs);
  const pointCount = points.length;
  const hasPoints = pointCount > 0;
  const xLabel = axisLabel(xColumn, xUnit);
  const yLabel = axisLabel(yColumn, yUnit);

  const xAxis = hasPoints ? buildAxis(points.map((pair) => pair.x)) : null;
  const yAxis = hasPoints ? buildAxis(points.map((pair) => pair.y)) : null;
  const xDomain = xAxis?.domain ?? null;
  const yDomain = yAxis?.domain ?? null;
  const xTicks = xAxis;
  const yTicks = yAxis;

  const domainAttributes = xDomain && yDomain
    ? {
        "data-domain-x-min": String(xDomain.min),
        "data-domain-x-max": String(xDomain.max),
        "data-domain-y-min": String(yDomain.min),
        "data-domain-y-max": String(yDomain.max),
      }
    : {};

  const ariaLabel = hasPoints
    ? `${xLabel} 对 ${yLabel} 的散点图，共 ${pointCount} 个数据点`
    : `${xLabel} 对 ${yLabel} 的散点图，暂无可绘制的数据点`;

  return (
    <figure
      className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
      data-testid="scatter-section"
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-ink">散点图</span>
        <span className="text-xs text-slate-500" data-testid="scatter-summary">
          {xLabel} · {yLabel} · {pointCount} 个数据点
        </span>
      </figcaption>

      <svg
        data-testid="scatter-plot"
        role="img"
        aria-label={ariaLabel}
        data-point-count={pointCount}
        {...domainAttributes}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="mt-3 h-auto w-full"
      >
        {hasPoints && xDomain && yDomain && xTicks && yTicks ? (
          <>
            <g aria-hidden="true">
              {xTicks.values.map((value) => {
                const x = scaleX(value, xDomain);
                return (
                  <line
                    key={`grid-x-${value}`}
                    x1={x}
                    y1={MARGIN.top}
                    x2={x}
                    y2={AXIS_Y}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                );
              })}
              {yTicks.values.map((value) => {
                const y = scaleY(value, yDomain);
                return (
                  <line
                    key={`grid-y-${value}`}
                    x1={MARGIN.left}
                    y1={y}
                    x2={MARGIN.left + INNER_WIDTH}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                );
              })}
            </g>

            <line
              x1={MARGIN.left}
              y1={AXIS_Y}
              x2={MARGIN.left + INNER_WIDTH}
              y2={AXIS_Y}
              stroke="#94a3b8"
              strokeWidth={1}
            />
            <line
              x1={MARGIN.left}
              y1={MARGIN.top}
              x2={MARGIN.left}
              y2={AXIS_Y}
              stroke="#94a3b8"
              strokeWidth={1}
            />

            {xTicks.values.map((value) => {
              const x = scaleX(value, xDomain);
              return (
                <g key={`tick-x-${value}`}>
                  <line
                    x1={x}
                    y1={AXIS_Y}
                    x2={x}
                    y2={AXIS_Y + 5}
                    stroke="#94a3b8"
                    strokeWidth={1}
                  />
                  <text
                    data-testid="scatter-x-tick"
                    x={x}
                    y={AXIS_Y + 20}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={11}
                  >
                    {formatTick(value, xTicks.step)}
                  </text>
                </g>
              );
            })}

            {yTicks.values.map((value) => {
              const y = scaleY(value, yDomain);
              return (
                <g key={`tick-y-${value}`}>
                  <line
                    x1={MARGIN.left - 5}
                    y1={y}
                    x2={MARGIN.left}
                    y2={y}
                    stroke="#94a3b8"
                    strokeWidth={1}
                  />
                  <text
                    data-testid="scatter-y-tick"
                    x={MARGIN.left - 9}
                    y={y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize={11}
                  >
                    {formatTick(value, yTicks.step)}
                  </text>
                </g>
              );
            })}

            <text
              data-testid="scatter-x-label"
              x={MARGIN.left + INNER_WIDTH / 2}
              y={VIEW_HEIGHT - 14}
              textAnchor="middle"
              fill="#334155"
              fontSize={12}
              fontWeight={600}
            >
              {xLabel}
            </text>
            <text
              data-testid="scatter-y-label"
              x={16}
              y={MARGIN.top + INNER_HEIGHT / 2}
              textAnchor="middle"
              fill="#334155"
              fontSize={12}
              fontWeight={600}
              transform={`rotate(-90 16 ${MARGIN.top + INNER_HEIGHT / 2})`}
            >
              {yLabel}
            </text>

            {points.map((pair, index) => (
              <circle
                key={`point-${index}`}
                data-testid="scatter-point"
                data-x={String(pair.x)}
                data-y={String(pair.y)}
                cx={scaleX(pair.x, xDomain)}
                cy={scaleY(pair.y, yDomain)}
                r={4}
                fill={POINT_COLOR}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            ))}
          </>
        ) : (
          <text
            data-testid="scatter-empty"
            x={VIEW_WIDTH / 2}
            y={VIEW_HEIGHT / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize={14}
          >
            暂无可绘制的数据点
          </text>
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2" data-testid="scatter-legend">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: POINT_COLOR }}
          />
          圆点表示一个数据点（{pointCount} 个）
        </span>
        <span>自动坐标范围，含约 5% 边距</span>
      </div>

      {pointCount === 1 ? (
        <p className="mt-2 text-xs text-amber-700" data-testid="scatter-single-hint">
          仅 1 个数据点，无法判断趋势
        </p>
      ) : null}
    </figure>
  );
}

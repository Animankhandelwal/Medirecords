export function Sparkline({
  values,
  width = 96,
  height = 28,
  abnormal = false,
}: {
  values: number[];
  width?: number;
  height?: number;
  abnormal?: boolean;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return [x, y];
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];
  const stroke = abnormal ? "#dc2626" : "#16a34a";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} />
    </svg>
  );
}
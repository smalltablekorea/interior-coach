interface GaugeChartProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

export default function GaugeChart({ score, size = 120, label }: GaugeChartProps) {
  const radius = (size - 16) / 2;
  const center = size / 2;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "var(--green)" : score >= 60 ? "var(--orange)" : "var(--red)";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* Background arc */}
        <path
          d={`M 8 ${center} A ${radius} ${radius} 0 0 1 ${size - 8} ${center}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 8 ${center} A ${radius} ${radius} 0 0 1 ${size - 8} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fill="white"
          fontSize={size * 0.22}
          fontWeight="bold"
        >
          {score}
        </text>
        <text
          x={center}
          y={center + size * 0.1}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={size * 0.1}
        >
          / 100
        </text>
      </svg>
      {label && (
        <p className="text-xs text-[var(--muted)] mt-1">{label}</p>
      )}
    </div>
  );
}

import { CandidateResult } from "@/types";
import { useEffect, useRef, useState } from "react";

interface NineBoxChartProps {
  candidates: CandidateResult[];
}

const COLORS = [
  "#22C55E", // green - top candidate
  "#F97316", // orange
  "#EF4444", // red
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export function NineBoxChart({ candidates }: NineBoxChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(900);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 100;
        setChartWidth(Math.max(700, Math.min(width, 1200)));
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const chartHeight = Math.min(chartWidth * 0.55, 550);
  const padding = { top: 50, right: 50, bottom: 70, left: 80 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (value: number): number => padding.left + (value / 100) * innerWidth;
  const getY = (value: number): number => padding.top + innerHeight - (value / 100) * innerHeight;

  const zones = [
    { x1: 0, y1: 70, x2: 40, y2: 100, color: "hsl(48 96% 53% / 0.12)" },
    { x1: 40, y1: 70, x2: 70, y2: 100, color: "hsl(142 76% 36% / 0.1)" },
    { x1: 70, y1: 70, x2: 100, y2: 100, color: "hsl(142 76% 36% / 0.25)", highlight: true },
    { x1: 0, y1: 40, x2: 40, y2: 70, color: "hsl(0 84% 60% / 0.08)" },
    { x1: 40, y1: 40, x2: 70, y2: 70, color: "hsl(48 96% 53% / 0.12)" },
    { x1: 70, y1: 40, x2: 100, y2: 70, color: "hsl(142 76% 36% / 0.1)" },
    { x1: 0, y1: 0, x2: 40, y2: 40, color: "hsl(0 84% 60% / 0.15)" },
    { x1: 40, y1: 0, x2: 70, y2: 40, color: "hsl(0 84% 60% / 0.08)" },
    { x1: 70, y1: 0, x2: 100, y2: 40, color: "hsl(48 96% 53% / 0.12)" },
  ];

  return (
    <div ref={containerRef} className="bg-card rounded-xl border border-border p-6 w-full">
      <h3 className="text-lg font-semibold text-foreground text-center mb-6">
        Matriz de Adequação (9-Box)
      </h3>

      <div className="flex justify-center w-full">
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Background zones */}
          {zones.map((zone, i) => (
            <rect
              key={i}
              x={getX(zone.x1)}
              y={getY(zone.y2)}
              width={getX(zone.x2) - getX(zone.x1)}
              height={getY(zone.y1) - getY(zone.y2)}
              fill={zone.color}
              stroke={zone.highlight ? "hsl(142 76% 36%)" : "none"}
              strokeWidth={zone.highlight ? 2 : 0}
            />
          ))}

          {/* Grid lines */}
          {[40, 70].map((val) => (
            <g key={`grid-${val}`}>
              <line
                x1={getX(val)}
                y1={getY(100)}
                x2={getX(val)}
                y2={getY(0)}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={getX(0)}
                y1={getY(val)}
                x2={getX(100)}
                y2={getY(val)}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          ))}

          {/* Zona de Recomendação label */}
          <text
            x={getX(85)}
            y={getY(95)}
            textAnchor="middle"
            className="fill-green-600 text-xs font-semibold"
          >
            Zona de Recomendação
          </text>

          {/* X-axis */}
          <line
            x1={getX(0)}
            y1={getY(0)}
            x2={getX(100) + 15}
            y2={getY(0)}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <polygon
            points={`${getX(100) + 15},${getY(0)} ${getX(100) + 8},${getY(0) - 5} ${getX(100) + 8},${getY(0) + 5}`}
            fill="hsl(var(--foreground))"
          />

          {/* Y-axis */}
          <line
            x1={getX(0)}
            y1={getY(0)}
            x2={getX(0)}
            y2={getY(100) - 15}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <polygon
            points={`${getX(0)},${getY(100) - 15} ${getX(0) - 5},${getY(100) - 8} ${getX(0) + 5},${getY(100) - 8}`}
            fill="hsl(var(--foreground))"
          />

          {/* X-axis labels */}
          {[0, 40, 70, 100].map((val) => (
            <text
              key={`x-${val}`}
              x={getX(val)}
              y={getY(0) + 20}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {val}%
            </text>
          ))}

          {/* X-axis zone labels */}
          <text x={getX(20)} y={getY(0) + 38} textAnchor="middle" className="fill-muted-foreground text-xs font-medium">Baixo</text>
          <text x={getX(55)} y={getY(0) + 38} textAnchor="middle" className="fill-muted-foreground text-xs font-medium">Médio</text>
          <text x={getX(85)} y={getY(0) + 38} textAnchor="middle" className="fill-muted-foreground text-xs font-medium">Alto</text>

          {/* Y-axis labels */}
          {[0, 40, 70, 100].map((val) => (
            <text
              key={`y-${val}`}
              x={getX(0) - 12}
              y={getY(val) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-xs"
            >
              {val}%
            </text>
          ))}

          {/* Y-axis zone labels */}
          <text
            x={getX(0) - 40}
            y={getY(20)}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-medium"
            transform={`rotate(-90 ${getX(0) - 40} ${getY(20)})`}
          >
            Baixo
          </text>
          <text
            x={getX(0) - 40}
            y={getY(55)}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-medium"
            transform={`rotate(-90 ${getX(0) - 40} ${getY(55)})`}
          >
            Médio
          </text>
          <text
            x={getX(0) - 40}
            y={getY(85)}
            textAnchor="middle"
            className="fill-muted-foreground text-xs font-medium"
            transform={`rotate(-90 ${getX(0) - 40} ${getY(85)})`}
          >
            Alto
          </text>

          {/* Axis titles */}
          <text
            x={getX(50)}
            y={getY(0) + 55}
            textAnchor="middle"
            className="fill-foreground text-sm font-semibold"
          >
            Técnico / Hard Skills
          </text>
          <text
            x={getX(0) - 60}
            y={getY(50)}
            textAnchor="middle"
            className="fill-foreground text-sm font-semibold"
            transform={`rotate(-90 ${getX(0) - 60} ${getY(50)})`}
          >
            Potencial / Soft Skills
          </text>

          {/* Candidate pins with names above */}
          {candidates.map((candidate, index) => {
            const x = getX(candidate.technical_fit);
            const y = getY(candidate.potential_fit);
            const color = COLORS[index % COLORS.length];
            const isTopCandidate = index === 0;
            const displayName = candidate.candidate_name.split(" ").slice(0, 2).join(" ");

            return (
              <g key={candidate.candidate_name}>
                {/* Glow effect for top candidate */}
                {isTopCandidate && (
                  <circle cx={x} cy={y} r="20" fill={color} opacity="0.2" />
                )}
                {/* Shadow */}
                <circle cx={x + 2} cy={y + 2} r={isTopCandidate ? 14 : 11} fill="rgba(0,0,0,0.15)" />
                {/* Main dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isTopCandidate ? 14 : 11}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Candidate name above pin */}
                <text
                  x={x}
                  y={y - (isTopCandidate ? 22 : 18)}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-semibold pointer-events-none"
                  style={{
                    textShadow: "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white",
                  }}
                >
                  {displayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {candidates.map((candidate, index) => (
          <div key={candidate.candidate_name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground">
              {candidate.candidate_name.split(" ").slice(0, 2).join(" ")} — {candidate.match_score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
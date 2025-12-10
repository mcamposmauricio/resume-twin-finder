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
        const width = containerRef.current.offsetWidth - 40;
        setChartWidth(Math.max(320, Math.min(width, 1200)));
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const isMobile = chartWidth < 500;
  const chartHeight = isMobile ? chartWidth * 0.8 : Math.min(chartWidth * 0.55, 550);
  const padding = isMobile 
    ? { top: 40, right: 20, bottom: 55, left: 50 }
    : { top: 50, right: 50, bottom: 70, left: 80 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (value: number): number => padding.left + (value / 100) * innerWidth;
  const getY = (value: number): number => padding.top + innerHeight - (value / 100) * innerHeight;

  const zones = [
    { x1: 0, y1: 70, x2: 40, y2: 100, color: "hsl(220 14% 96% / 0.8)" },
    { x1: 40, y1: 70, x2: 70, y2: 100, color: "hsl(220 14% 94% / 0.6)" },
    { x1: 70, y1: 70, x2: 100, y2: 100, color: "hsl(142 40% 90% / 0.9)", highlight: true },
    { x1: 0, y1: 40, x2: 40, y2: 70, color: "hsl(220 14% 96% / 0.6)" },
    { x1: 40, y1: 40, x2: 70, y2: 70, color: "hsl(220 14% 96% / 0.8)" },
    { x1: 70, y1: 40, x2: 100, y2: 70, color: "hsl(220 14% 94% / 0.6)" },
    { x1: 0, y1: 0, x2: 40, y2: 40, color: "hsl(220 14% 94% / 0.5)" },
    { x1: 40, y1: 0, x2: 70, y2: 40, color: "hsl(220 14% 96% / 0.6)" },
    { x1: 70, y1: 0, x2: 100, y2: 40, color: "hsl(220 14% 96% / 0.8)" },
  ];

  const fontSize = {
    axis: isMobile ? "text-[9px]" : "text-xs",
    zone: isMobile ? "text-[8px]" : "text-xs",
    title: isMobile ? "text-xs" : "text-sm",
    name: isMobile ? "text-[9px]" : "text-[11px]",
  };

  return (
    <div ref={containerRef} className="bg-card rounded-xl border border-border p-3 sm:p-6 w-full">
      <h3 className="text-base sm:text-lg font-semibold text-foreground text-center mb-4 sm:mb-6">
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
              stroke={zone.highlight ? "hsl(142 50% 45%)" : "none"}
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
          {!isMobile && (
            <text
              x={getX(85)}
              y={getY(95)}
              textAnchor="middle"
              className="fill-emerald-600 text-xs font-semibold"
            >
              Zona de Recomendação
            </text>
          )}

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
              y={getY(0) + (isMobile ? 14 : 20)}
              textAnchor="middle"
              className={`fill-muted-foreground ${fontSize.axis}`}
            >
              {val}%
            </text>
          ))}

          {/* X-axis zone labels */}
          <text x={getX(20)} y={getY(0) + (isMobile ? 28 : 38)} textAnchor="middle" className={`fill-muted-foreground ${fontSize.zone} font-medium`}>Baixo</text>
          <text x={getX(55)} y={getY(0) + (isMobile ? 28 : 38)} textAnchor="middle" className={`fill-muted-foreground ${fontSize.zone} font-medium`}>Médio</text>
          <text x={getX(85)} y={getY(0) + (isMobile ? 28 : 38)} textAnchor="middle" className={`fill-muted-foreground ${fontSize.zone} font-medium`}>Alto</text>

          {/* Y-axis labels */}
          {[0, 40, 70, 100].map((val) => (
            <text
              key={`y-${val}`}
              x={getX(0) - (isMobile ? 8 : 12)}
              y={getY(val) + 4}
              textAnchor="end"
              className={`fill-muted-foreground ${fontSize.axis}`}
            >
              {val}%
            </text>
          ))}

          {/* Y-axis zone labels - hide on very small screens */}
          {!isMobile && (
            <>
              <text
                x={getX(0) - 40}
                y={getY(20)}
                textAnchor="middle"
                className={`fill-muted-foreground ${fontSize.zone} font-medium`}
                transform={`rotate(-90 ${getX(0) - 40} ${getY(20)})`}
              >
                Baixo
              </text>
              <text
                x={getX(0) - 40}
                y={getY(55)}
                textAnchor="middle"
                className={`fill-muted-foreground ${fontSize.zone} font-medium`}
                transform={`rotate(-90 ${getX(0) - 40} ${getY(55)})`}
              >
                Médio
              </text>
              <text
                x={getX(0) - 40}
                y={getY(85)}
                textAnchor="middle"
                className={`fill-muted-foreground ${fontSize.zone} font-medium`}
                transform={`rotate(-90 ${getX(0) - 40} ${getY(85)})`}
              >
                Alto
              </text>
            </>
          )}

          {/* Axis titles */}
          <text
            x={getX(50)}
            y={getY(0) + (isMobile ? 45 : 55)}
            textAnchor="middle"
            className={`fill-foreground ${fontSize.title} font-semibold`}
          >
            Técnico / Hard Skills
          </text>
          <text
            x={getX(0) - (isMobile ? 35 : 60)}
            y={getY(50)}
            textAnchor="middle"
            className={`fill-foreground ${fontSize.title} font-semibold`}
            transform={`rotate(-90 ${getX(0) - (isMobile ? 35 : 60)} ${getY(50)})`}
          >
            {isMobile ? "Potencial" : "Potencial / Soft Skills"}
          </text>

          {/* Candidate pins with names above */}
          {candidates.map((candidate, index) => {
            const x = getX(candidate.technical_fit);
            const y = getY(candidate.potential_fit);
            const color = COLORS[index % COLORS.length];
            const isTopCandidate = index === 0;
            const firstName = candidate.candidate_name.split(" ")[0];
            const pinRadius = isMobile ? (isTopCandidate ? 10 : 8) : (isTopCandidate ? 14 : 11);

            return (
              <g key={candidate.candidate_name}>
                {/* Glow effect for top candidate */}
                {isTopCandidate && (
                  <circle cx={x} cy={y} r={pinRadius + 6} fill={color} opacity="0.2" />
                )}
                {/* Shadow */}
                <circle cx={x + 1} cy={y + 1} r={pinRadius} fill="rgba(0,0,0,0.15)" />
                {/* Main dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={pinRadius}
                  fill={color}
                  stroke="white"
                  strokeWidth={isMobile ? 1.5 : 2}
                />
                {/* Candidate name above pin */}
                <text
                  x={x}
                  y={y - (isMobile ? (isTopCandidate ? 14 : 12) : (isTopCandidate ? 22 : 18))}
                  textAnchor="middle"
                  className={`fill-foreground ${fontSize.name} font-semibold pointer-events-none`}
                  style={{
                    textShadow: "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white",
                  }}
                >
                  {firstName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
        {candidates.map((candidate, index) => (
          <div key={candidate.candidate_name} className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {candidate.candidate_name.split(" ")[0]} — {candidate.match_score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
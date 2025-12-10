import { CandidateResult } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const chartSize = 320;
  const padding = 40;
  const innerSize = chartSize - padding * 2;

  const getPosition = (value: number): number => {
    return padding + (value / 100) * innerSize;
  };

  const getZoneColor = (x: number, y: number): string => {
    if (x >= 70 && y >= 70) return "hsl(142 76% 36% / 0.15)"; // green - top right
    if ((x >= 70 && y >= 40) || (x >= 40 && y >= 70)) return "hsl(142 76% 36% / 0.08)"; // light green
    if (x >= 40 && y >= 40) return "hsl(48 96% 53% / 0.12)"; // yellow - middle
    if (x < 40 && y < 40) return "hsl(0 84% 60% / 0.1)"; // red - bottom left
    return "hsl(48 96% 53% / 0.06)"; // light yellow
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground text-center mb-6">
        Matriz de Adequação (9-Box)
      </h3>

      <div className="flex justify-center">
        <div className="relative">
          {/* Y-axis label */}
          <div 
            className="absolute text-xs font-medium text-muted-foreground uppercase tracking-wider"
            style={{
              left: -8,
              top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)',
              transformOrigin: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            Potencial / Soft Skills
          </div>

          <svg width={chartSize} height={chartSize} className="overflow-visible">
            {/* Background zones */}
            {[0, 40, 70].map((xStart) =>
              [0, 40, 70].map((yStart) => {
                const xEnd = xStart === 70 ? 100 : xStart + 30;
                const yEnd = yStart === 70 ? 100 : yStart + 30;
                return (
                  <rect
                    key={`zone-${xStart}-${yStart}`}
                    x={getPosition(xStart)}
                    y={chartSize - getPosition(yEnd)}
                    width={getPosition(xEnd) - getPosition(xStart)}
                    height={getPosition(yEnd) - getPosition(yStart)}
                    fill={getZoneColor(xStart + 15, yStart + 15)}
                  />
                );
              })
            )}

            {/* Grid lines */}
            <line
              x1={getPosition(40)}
              y1={padding}
              x2={getPosition(40)}
              y2={chartSize - padding}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1={getPosition(70)}
              y1={padding}
              x2={getPosition(70)}
              y2={chartSize - padding}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={chartSize - getPosition(40)}
              x2={chartSize - padding}
              y2={chartSize - getPosition(40)}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={chartSize - getPosition(70)}
              x2={chartSize - padding}
              y2={chartSize - getPosition(70)}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Zona de Recomendação highlight */}
            <rect
              x={getPosition(70)}
              y={padding}
              width={getPosition(100) - getPosition(70)}
              height={getPosition(100) - getPosition(70)}
              fill="none"
              stroke="hsl(217 91% 60%)"
              strokeWidth="2"
              rx="4"
            />
            <text
              x={getPosition(85)}
              y={padding + 12}
              textAnchor="middle"
              className="fill-blue-600 text-[8px] font-medium uppercase tracking-wide"
            >
              Zona de Recomendação
            </text>

            {/* X-axis */}
            <line
              x1={padding}
              y1={chartSize - padding}
              x2={chartSize - padding + 10}
              y2={chartSize - padding}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
            />
            {/* X-axis arrow */}
            <polygon
              points={`${chartSize - padding + 10},${chartSize - padding} ${chartSize - padding + 4},${chartSize - padding - 4} ${chartSize - padding + 4},${chartSize - padding + 4}`}
              fill="hsl(var(--foreground))"
            />

            {/* Y-axis */}
            <line
              x1={padding}
              y1={chartSize - padding}
              x2={padding}
              y2={padding - 10}
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
            />
            {/* Y-axis arrow */}
            <polygon
              points={`${padding},${padding - 10} ${padding - 4},${padding - 4} ${padding + 4},${padding - 4}`}
              fill="hsl(var(--foreground))"
            />

            {/* X-axis labels */}
            <text x={padding} y={chartSize - padding + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">0%</text>
            <text x={getPosition(40)} y={chartSize - padding + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">40%</text>
            <text x={getPosition(70)} y={chartSize - padding + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">70%</text>
            <text x={chartSize - padding} y={chartSize - padding + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">100%</text>

            {/* X-axis zone labels */}
            <text x={getPosition(20)} y={chartSize - padding + 32} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium">Baixo</text>
            <text x={getPosition(55)} y={chartSize - padding + 32} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium">Médio</text>
            <text x={getPosition(85)} y={chartSize - padding + 32} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium">Alto</text>

            {/* Y-axis labels */}
            <text x={padding - 8} y={chartSize - padding + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">0%</text>
            <text x={padding - 8} y={chartSize - getPosition(40) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">40%</text>
            <text x={padding - 8} y={chartSize - getPosition(70) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">70%</text>
            <text x={padding - 8} y={padding + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">100%</text>

            {/* Y-axis zone labels */}
            <text x={padding - 24} y={chartSize - getPosition(20)} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium" transform={`rotate(-90 ${padding - 24} ${chartSize - getPosition(20)})`}>Baixo</text>
            <text x={padding - 24} y={chartSize - getPosition(55)} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium" transform={`rotate(-90 ${padding - 24} ${chartSize - getPosition(55)})`}>Médio</text>
            <text x={padding - 24} y={chartSize - getPosition(85)} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium" transform={`rotate(-90 ${padding - 24} ${chartSize - getPosition(85)})`}>Alto</text>

            {/* Candidate dots */}
            <TooltipProvider>
              {candidates.map((candidate, index) => {
                const x = getPosition(candidate.technical_fit);
                const y = chartSize - getPosition(candidate.potential_fit);
                const color = COLORS[index % COLORS.length];
                const isTopCandidate = index === 0;

                return (
                  <Tooltip key={candidate.candidate_name}>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer">
                        {/* Glow effect for top candidate */}
                        {isTopCandidate && (
                          <circle
                            cx={x}
                            cy={y}
                            r="14"
                            fill={color}
                            opacity="0.2"
                          />
                        )}
                        {/* Main dot */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isTopCandidate ? 10 : 8}
                          fill={color}
                          stroke="white"
                          strokeWidth="2"
                          className="transition-all duration-200 hover:r-12"
                        />
                        {/* Candidate initial */}
                        <text
                          x={x}
                          y={y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white text-[10px] font-bold pointer-events-none"
                        >
                          {candidate.candidate_name.charAt(0).toUpperCase()}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card border border-border shadow-lg">
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">{candidate.candidate_name}</p>
                        <p className="text-muted-foreground">
                          Técnico: {candidate.technical_fit}% | Potencial: {candidate.potential_fit}%
                        </p>
                        <p className="text-muted-foreground">
                          Match: {candidate.match_score}%
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </svg>

          {/* X-axis title */}
          <div className="text-center mt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Técnico / Hard Skills
            </span>
          </div>
        </div>
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
              {candidate.candidate_name.split(' ').slice(0, 2).join(' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

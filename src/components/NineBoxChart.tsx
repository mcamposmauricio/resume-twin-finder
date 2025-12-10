import { CandidateResult } from "@/types";

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
  const getGridPosition = (value: number): number => {
    if (value < 40) return 0;
    if (value < 70) return 1;
    return 2;
  };

  const getCellStyle = (perfIndex: number, potIndex: number): string => {
    // Only highlight the top-right cell (Zona de Recomendação)
    if (perfIndex === 2 && potIndex === 2) {
      return "bg-blue-100 border-2 border-blue-300";
    }
    return "bg-muted";
  };

  // Group candidates by grid position
  const candidatesByBox: Map<string, CandidateResult[]> = new Map();
  candidates.forEach((c) => {
    const perfPos = getGridPosition(c.technical_fit);
    const potPos = getGridPosition(c.potential_fit);
    const key = `${perfPos}-${potPos}`;
    if (!candidatesByBox.has(key)) {
      candidatesByBox.set(key, []);
    }
    candidatesByBox.get(key)!.push(c);
  });

  // Find top candidate
  const topCandidate = candidates[0];

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground text-center mb-6">
        Matriz de Adequação (9-Box)
      </h3>

      <div className="flex gap-4">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center items-center">
          <span
            className="text-xs font-medium text-muted-foreground transform -rotate-90 whitespace-nowrap tracking-wider uppercase"
            style={{ width: "20px" }}
          >
            Potencial / Soft Skills
          </span>
        </div>

        <div className="flex-1">
          {/* Grid */}
          <div className="grid grid-cols-3 gap-1">
            {[2, 1, 0].map((potIndex) =>
              [0, 1, 2].map((perfIndex) => {
                const key = `${perfIndex}-${potIndex}`;
                const boxCandidates = candidatesByBox.get(key) || [];
                const isTopRight = perfIndex === 2 && potIndex === 2;
                
                return (
                  <div
                    key={key}
                    className={`aspect-square p-3 rounded ${getCellStyle(perfIndex, potIndex)} flex flex-col items-center justify-center relative min-h-[100px]`}
                  >
                    {isTopRight && (
                      <span className="absolute top-2 right-2 text-[10px] font-medium text-blue-600 uppercase tracking-wide">
                        Zona de Recomendação
                      </span>
                    )}
                    
                    <div className="flex flex-col items-center gap-2">
                      {boxCandidates.map((c) => {
                        const colorIndex = candidates.findIndex(
                          (x) => x.candidate_name === c.candidate_name
                        ) % COLORS.length;
                        const isTop = c.candidate_name === topCandidate?.candidate_name;
                        
                        return (
                      <div key={c.candidate_name} className="flex flex-col items-center">
                            <span className="text-xs font-medium mb-1 text-foreground">
                              {c.candidate_name.split(' ').slice(0, 2).join(' ')}
                            </span>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[colorIndex] }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Técnico / Hard Skills
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

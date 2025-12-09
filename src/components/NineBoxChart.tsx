import { CandidateResult } from "@/types";

interface NineBoxChartProps {
  candidates: CandidateResult[];
}

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export function NineBoxChart({ candidates }: NineBoxChartProps) {
  // Performance = technical_fit, Potential = potential_fit
  // Convert 0-100 to grid position (0, 1, 2 for low, med, high)
  const getGridPosition = (value: number): number => {
    if (value < 40) return 0; // Low
    if (value < 70) return 1; // Medium
    return 2; // High
  };

  const getBoxLabel = (perfIndex: number, potIndex: number): string => {
    const labels = [
      ["Enigma", "Growth Employee", "Future Star"],
      ["Dilemma", "Core Player", "High Performer"],
      ["Talent Risk", "Effective", "Star"],
    ];
    return labels[potIndex][perfIndex];
  };

  const getBoxColor = (perfIndex: number, potIndex: number): string => {
    // Color gradient from red (low-low) to green (high-high)
    const score = perfIndex + potIndex;
    if (score <= 1) return "bg-red-100 border-red-300";
    if (score <= 2) return "bg-yellow-100 border-yellow-300";
    if (score <= 3) return "bg-blue-100 border-blue-300";
    return "bg-green-100 border-green-300";
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        Nine Box Chart - Matriz de Talentos
      </h3>
      <p className="text-slate-600 mb-6">
        Visualização dos candidatos por Performance Técnica vs Potencial de
        Crescimento
      </p>

      <div className="flex">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center items-center mr-2">
          <span
            className="text-sm font-medium text-slate-600 transform -rotate-90 whitespace-nowrap"
            style={{ width: "20px" }}
          >
            Potencial →
          </span>
        </div>

        <div className="flex-1">
          {/* Grid */}
          <div className="grid grid-cols-3 gap-2">
            {[2, 1, 0].map((potIndex) =>
              [0, 1, 2].map((perfIndex) => {
                const key = `${perfIndex}-${potIndex}`;
                const boxCandidates = candidatesByBox.get(key) || [];
                return (
                  <div
                    key={key}
                    className={`aspect-square p-2 rounded-lg border-2 ${getBoxColor(perfIndex, potIndex)} flex flex-col`}
                  >
                    <span className="text-xs font-medium text-slate-600 mb-1">
                      {getBoxLabel(perfIndex, potIndex)}
                    </span>
                    <div className="flex-1 flex flex-wrap gap-1 items-start content-start">
                      {boxCandidates.map((c, idx) => {
                        const colorIndex =
                          candidates.findIndex(
                            (x) => x.candidate_name === c.candidate_name
                          ) % COLORS.length;
                        return (
                          <div
                            key={c.candidate_name}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: COLORS[colorIndex] }}
                            title={c.candidate_name}
                          >
                            {c.candidate_name.charAt(0)}
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
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-slate-600">
              Performance Técnica →
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {candidates.map((c, idx) => (
          <div key={c.candidate_name} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="text-sm text-slate-600">{c.candidate_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

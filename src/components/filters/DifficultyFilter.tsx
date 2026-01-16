import { difficultyColors, difficulties } from "../../utils/graph";

interface DifficultyFilterProps {
    selectedDifficulties: Set<string>;
    toggleDifficulty: (difficulty: string) => void;
}

export default function DifficultyFilter({
    selectedDifficulties,
    toggleDifficulty,
}: DifficultyFilterProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {difficulties.map((diff) => (
                <button
                    key={diff}
                    onClick={() => toggleDifficulty(diff)}
                    className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${selectedDifficulties.has(diff)
                        ? "text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                        }`}
                    style={{
                        backgroundColor: selectedDifficulties.has(diff)
                            ? difficultyColors[diff]
                            : undefined,
                    }}
                >
                    {diff}
                </button>
            ))}
        </div>
    );
}

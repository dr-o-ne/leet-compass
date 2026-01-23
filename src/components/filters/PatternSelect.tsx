import React from "react";
import type { Pattern } from "../../types/graph";

interface PatternSelectProps {
    patterns: Pattern[];
    selectedPattern: string;
    setSelectedPattern: (pattern: string) => void;
}

export default function PatternSelect({
    patterns,
    selectedPattern,
    setSelectedPattern,
}: PatternSelectProps) {
    return (
        <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239ca3af%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
        >
            <option value="">All patterns</option>
            {patterns.map((pattern) => (
                <React.Fragment key={pattern.slug}>
                    <option value={`parent:${pattern.slug}`}>{pattern.name}</option>
                    {pattern.subpatterns?.map((sub) => (
                        <option key={sub.slug} value={sub.slug}>
                            &nbsp;&nbsp;{sub.name}
                        </option>
                    ))}
                </React.Fragment>
            ))}
        </select>
    );
}

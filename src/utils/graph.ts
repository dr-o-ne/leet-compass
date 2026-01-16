export const difficultyColors: Record<string, string> = {
    Easy: "#00b8a3",
    Medium: "#ffc01e",
    Hard: "#ff375f",
};

export const difficulties = ["Easy", "Medium", "Hard"] as const;

export function hashToPosition(str: string, scale = 200) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const x = ((hash % scale) + scale) % scale;
    const y = (((hash >> 8) % scale) + scale) % scale;
    return { x, y };
}

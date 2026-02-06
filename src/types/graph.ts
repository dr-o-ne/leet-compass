export interface Subpattern {
  slug: string;
  name: string;
  description?: string;
}

export interface Pattern {
  slug: string;
  name: string;
  description: string;
  subpatterns?: Subpattern[];
}

export interface Problem {
  id: number;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  name: string;
  patterns: string[];
}

export interface Company {
  name: string;
  problems: number[];
}
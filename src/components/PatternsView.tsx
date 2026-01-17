import React, { useEffect, useRef, useState, useMemo } from "react";
import type { Company, Pattern, Problem } from "../types/graph";
import { difficulties } from "../utils/graph";
import { usePatternsGraph } from "../hooks/usePatternsGraph";
import DifficultyFilter from "./filters/DifficultyFilter";
import SearchBar from "./filters/SearchBar";
import PatternSelect from "./filters/PatternSelect";
import CompanyFilter from "./filters/CompanyFilter";

export default function PatternsView() {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(difficulties));
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [totalProblems, setTotalProblems] = useState(0);
  const [visibleProblems, setVisibleProblems] = useState(0);

  const { containerRef } = usePatternsGraph({
    patterns,
    problems,
    companies,
    selectedDifficulties,
    selectedPattern,
    searchQuery,
    selectedCompany,
    hoveredNode,
    setHoveredNode,
    setVisibleProblems,
    setLoading,
  });
  useEffect(() => {
    async function loadData() {
      const [patternsRes, problemsRes, companiesRes] = await Promise.all([
        fetch("/patterns.json"),
        fetch("/problems.json"),
        fetch("/companies.json"),
      ]);
      const patternsData: Pattern[] = await patternsRes.json();
      const problemsData: Problem[] = await problemsRes.json();
      const companiesData: Company[] = await companiesRes.json();

      setPatterns(patternsData);
      setProblems(problemsData);
      setCompanies(companiesData);
      setTotalProblems(problemsData.length);
      setVisibleProblems(problemsData.length);
    }
    loadData();
  }, []);

  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(diff)) {
        next.delete(diff);
      } else {
        next.add(diff);
      }
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filter panel */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-6 flex-wrap">
        <DifficultyFilter
          selectedDifficulties={selectedDifficulties}
          toggleDifficulty={toggleDifficulty}
        />

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <PatternSelect
          patterns={patterns}
          selectedPattern={selectedPattern}
          setSelectedPattern={setSelectedPattern}
        />

        <CompanyFilter
          companies={companies}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
        />

        {/* Problem counter */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/50 group">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span className="text-slate-900">{visibleProblems}</span>
            <span className="text-[9px] opacity-40 lowercase italic font-normal px-0.5">/</span>
            <span className="text-slate-900">{totalProblems}</span>
            <span className="ml-1 opacity-70">Cataloged</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}

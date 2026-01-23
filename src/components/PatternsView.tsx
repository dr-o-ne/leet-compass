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
  const [showPatterns, setShowPatterns] = useState(true);
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
    showPatterns,
    setHoveredNode,
    setVisibleProblems,
    setLoading,
  });
  useEffect(() => {
    async function loadData() {
      const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL.slice(0, -1)
        : import.meta.env.BASE_URL;

      const [patternsRes, problemsRes, companiesRes] = await Promise.all([
        fetch(`${baseUrl}/patterns.json`),
        fetch(`${baseUrl}/problems.json`),
        fetch(`${baseUrl}/companies.json`),
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
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-center gap-6 flex-wrap">
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

        <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group">
          <input
            type="checkbox"
            checked={showPatterns}
            onChange={(e) => setShowPatterns(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider group-hover:text-indigo-700">
            Show Patterns
          </span>
        </label>

        {/* Problem counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/50 group">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span className="text-slate-900">{visibleProblems}</span>
            <span className="text-[9px] opacity-40 lowercase italic font-normal px-0.5">/</span>
            <span className="text-slate-900">{totalProblems}</span>
            <span className="ml-1 opacity-70">Shown</span>
          </div>
        </div>
      </div>

      {/* Graph with Spinner Overlay */}
      <div className="flex-1 w-full relative overflow-hidden bg-slate-50">
        <div ref={containerRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-500">
            <div className="relative">
              {/* Outer ring */}
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>

              {/* Inner pulsed dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-slate-800 uppercase tracking-widest animate-pulse">
                Initializing Graph
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] opacity-60">
                Processing Patterns and Problems
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

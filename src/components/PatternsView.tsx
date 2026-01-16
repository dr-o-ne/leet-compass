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
        <div className="ml-auto flex items-center gap-1.5 text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{visibleProblems}</span>
          <span>of</span>
          <span>{totalProblems}</span>
          <span>shown</span>
        </div>
      </div>

      {/* Graph */}
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}

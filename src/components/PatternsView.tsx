import React, { useEffect, useRef, useState, useMemo } from "react";
import type { Company, Pattern, Problem } from "../types/graph";
import { difficultyColors, difficulties, hashToPosition } from "../utils/graph";
import { usePatternsGraph } from "../hooks/usePatternsGraph";
import DifficultyFilter from "./filters/DifficultyFilter";

export default function PatternsView() {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(difficulties));
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [companySearch, setCompanySearch] = useState<string>("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [totalProblems, setTotalProblems] = useState(0);
  const [visibleProblems, setVisibleProblems] = useState(0);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    return companies.filter(c =>
      c.name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* Search input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-52 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Pattern filter */}
        <select
          value={selectedPattern}
          onChange={(e) => setSelectedPattern(e.target.value)}
          className="h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239ca3af%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option value="">All patterns</option>
          {patterns.map((pattern) => (
            <React.Fragment key={pattern.slug}>
              <option value={`parent:${pattern.slug}`}>
                {pattern.name}
              </option>
              {pattern.subpatterns.map((sub) => (
                <option key={sub.slug} value={sub.slug}>
                  &nbsp;&nbsp;{sub.name}
                </option>
              ))}
            </React.Fragment>
          ))}
        </select>

        {/* Company filter */}
        <div ref={companyDropdownRef} className="relative">
          <input
            type="text"
            placeholder={selectedCompany || "All companies"}
            value={companySearch}
            onChange={(e) => {
              setCompanySearch(e.target.value);
              setCompanyDropdownOpen(true);
            }}
            onFocus={() => setCompanyDropdownOpen(true)}
            className="h-9 w-44 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
          />
          {selectedCompany && (
            <button
              onClick={() => {
                setSelectedCompany("");
                setCompanySearch("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {companyDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div
                onClick={() => {
                  setSelectedCompany("");
                  setCompanySearch("");
                  setCompanyDropdownOpen(false);
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              >
                All companies
              </div>
              {filteredCompanies.map((company) => (
                <div
                  key={company.name}
                  onClick={() => {
                    setSelectedCompany(company.name);
                    setCompanySearch("");
                    setCompanyDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedCompany === company.name ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
                    }`}
                >
                  {company.name}
                </div>
              ))}
            </div>
          )}
        </div>

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

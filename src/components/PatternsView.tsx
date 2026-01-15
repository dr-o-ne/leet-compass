import React, { useEffect, useRef, useState, useMemo } from "react";
import type { Company, Pattern, Problem } from "../types/graph";

const difficultyColors: Record<string, string> = {
  Easy: "#00b8a3",
  Medium: "#ffc01e",
  Hard: "#ff375f",
};

const difficulties = ["Easy", "Medium", "Hard"] as const;

function hashToPosition(str: string, scale = 200) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const x = ((hash % scale) + scale) % scale;
  const y = (((hash >> 8) % scale) + scale) % scale;
  return { x, y };
}

export default function PatternsView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
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
  const rendererRef = useRef<any>(null);
  const graphRef = useRef<any>(null);
  const problemDataRef = useRef<Map<string, { difficulty: string; patterns: string[]; name: string }>>(new Map());

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
    if (!containerRef.current) return;

    let renderer: any = null;

    async function loadGraph() {
      const [
        { default: Graph },
        { default: Sigma },
        { NodeSquareProgram },
        forceAtlas2Module,
        patternsRes,
        problemsRes,
        companiesRes,
      ] = await Promise.all([
        import("graphology"),
        import("sigma"),
        import("@sigma/node-square"),
        import("graphology-layout-forceatlas2"),
        fetch("/patterns.json"),
        fetch("/problems.json"),
        fetch("/companies.json"),
      ]);
      const forceAtlas2 = forceAtlas2Module.default;
      const patternsData: Pattern[] = await patternsRes.json();
      const problems: Problem[] = await problemsRes.json();
      const companiesData: Company[] = await companiesRes.json();

      setPatterns(patternsData);
      setCompanies(companiesData);
      setTotalProblems(problems.length);
      setVisibleProblems(problems.length);

      const subSlugToFullId = new Map<string, string>();

      const graph = new Graph();

      patternsData.forEach((pattern, patternIndex) => {
        const patternId = pattern.slug;
        const angle = (2 * Math.PI * patternIndex) / patternsData.length;
        const radius = 100;

        graph.addNode(patternId, {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          size: 16,
          label: pattern.name,
          color: "#6366f1",
        });

        pattern.subpatterns.forEach((sub, subIndex) => {
          const subId = `${pattern.slug}/${sub.slug}`;
          subSlugToFullId.set(sub.slug, subId);
          const subRadius = radius + 50;
          const subAngle = angle + (subIndex * 0.2);

          graph.addNode(subId, {
            x: subRadius * Math.cos(subAngle),
            y: subRadius * Math.sin(subAngle),
            size: 12,
            label: sub.name,
            color: "#a5b4fc",
          });

          graph.addEdge(patternId, subId);
        });
      });

      const problemSlugMap = new Map<string, string>();

      problems.forEach((problem) => {
        const problemId = `problem-${problem.id}`;
        problemSlugMap.set(problemId, problem.slug);
        problemDataRef.current.set(problemId, {
          difficulty: problem.difficulty,
          patterns: problem.patterns,
          name: problem.name,
        });

        const { x, y } = hashToPosition(problem.slug, 300);

        graph.addNode(problemId, {
          x,
          y,
          size: 5,
          label: `${problem.id} - ${problem.name}`,
          color: difficultyColors[problem.difficulty] || "#999",
        });

        problem.patterns.forEach((patternSlug) => {
          const fullId = subSlugToFullId.get(patternSlug);
          if (fullId && graph.hasNode(fullId)) {
            graph.addEdge(problemId, fullId);
          }
        });
      });

      forceAtlas2.assign(graph, {
        iterations: 100,
        settings: {
          scalingRatio: 1,
          gravity: 1,
        },
      });

      if (containerRef.current) {
        graphRef.current = graph;
        renderer = new Sigma(graph, containerRef.current, {
          nodeProgramClasses: {
            square: NodeSquareProgram,
          },
        });
        rendererRef.current = renderer;

        renderer.on("clickNode", ({ node }: { node: string }) => {
          const slug = problemSlugMap.get(node);
          if (slug) {
            window.open(`https://leetcode.com/problems/${slug}`, "_blank");
          }
        });

        renderer.on("enterNode", ({ node }: { node: string }) => {
          setHoveredNode(node);
        });

        renderer.on("leaveNode", () => {
          setHoveredNode(null);
        });
      }

      setLoading(false);
    }

    loadGraph();

    return () => {
      if (renderer) renderer.kill();
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const graph = graphRef.current;
    if (!renderer) return;

    renderer.setSetting("nodeReducer", (node: string, data: any) => {
      const isParentFilter = selectedPattern.startsWith("parent:");
      const filterSlug = isParentFilter ? selectedPattern.replace("parent:", "") : selectedPattern;

      // Hover highlighting logic
      if (hoveredNode && graph) {
        const isHoveredNode = node === hoveredNode;
        const isSubpattern = hoveredNode && !hoveredNode.includes("/") && node.startsWith(hoveredNode + "/");
        const isParentPattern = node && !node.includes("/") && hoveredNode.startsWith(node + "/");
        const isConnectedProblem = graph.hasEdge(node, hoveredNode) || graph.hasEdge(hoveredNode, node);
        
        if (isHoveredNode || isSubpattern || isParentPattern || isConnectedProblem) {
          return { ...data, zIndex: 1, highlighted: true };
        } else {
          return { ...data, color: "#e5e7eb", zIndex: 0 };
        }
      }

      if (!node.startsWith("problem-")) {
        if (selectedPattern) {
          if (isParentFilter) {
            if (!node.startsWith(filterSlug)) {
              return { ...data, hidden: true };
            }
          } else {
            const subpatternParent = patterns.find(p => 
              p.subpatterns.some(s => s.slug === filterSlug)
            )?.slug;
            
            if (node.includes(filterSlug) || node === subpatternParent) {
              return data;
            }
            return { ...data, hidden: true };
          }
        }
        return data;
      }

      const problemInfo = problemDataRef.current.get(node);
      if (!problemInfo) return data;

      if (!selectedDifficulties.has(problemInfo.difficulty)) {
        return { ...data, hidden: true };
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const problemId = node.replace("problem-", "");
        if (!problemInfo.name.toLowerCase().includes(query) && !problemId.includes(query)) {
          return { ...data, hidden: true };
        }
      }

      if (selectedCompany) {
        const company = companies.find(c => c.name === selectedCompany);
        const problemId = parseInt(node.replace("problem-", ""));
        if (company && !company.problems.includes(problemId)) {
          return { ...data, hidden: true };
        }
      }

      if (selectedPattern) {
        if (isParentFilter) {
          const parentPattern = patterns.find(p => p.slug === filterSlug);
          const subSlugs = parentPattern?.subpatterns.map(s => s.slug) || [];
          const hasMatch = problemInfo.patterns.some(p => subSlugs.includes(p));
          if (!hasMatch) {
            return { ...data, hidden: true };
          }
        } else {
          if (!problemInfo.patterns.includes(filterSlug)) {
            return { ...data, hidden: true };
          }
        }
      }

      return data;
    });

    renderer.setSetting("edgeReducer", (edge: string, data: any) => {
      const graph = graphRef.current;
      if (!graph) return data;

      const source = graph.source(edge);
      const target = graph.target(edge);

      const sourceHidden = renderer.getNodeDisplayData(source)?.hidden;
      const targetHidden = renderer.getNodeDisplayData(target)?.hidden;

      if (sourceHidden || targetHidden) {
        return { ...data, hidden: true };
      }

      // Hover highlighting for edges
      if (hoveredNode) {
        const isConnected = source === hoveredNode || target === hoveredNode;
        if (!isConnected) {
          return { ...data, color: "#e5e7eb", zIndex: 0 };
        }
        return { ...data, zIndex: 1 };
      }

      return data;
    });

    renderer.refresh();

    // Count visible problems
    if (graph && !hoveredNode) {
      let count = 0;
      graph.forEachNode((node: string) => {
        if (node.startsWith("problem-")) {
          const displayData = renderer.getNodeDisplayData(node);
          if (!displayData?.hidden) {
            count++;
          }
        }
      });
      setVisibleProblems(count);
    }
  }, [selectedDifficulties, selectedPattern, patterns, searchQuery, selectedCompany, companies, hoveredNode]);

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
        {/* Difficulty filter */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => toggleDifficulty(diff)}
              className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedDifficulties.has(diff)
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
              style={{
                backgroundColor: selectedDifficulties.has(diff) ? difficultyColors[diff] : undefined,
              }}
            >
              {diff}
            </button>
          ))}
        </div>

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
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    selectedCompany === company.name ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
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

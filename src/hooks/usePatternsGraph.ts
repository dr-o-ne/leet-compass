import { useEffect, useRef, useMemo } from "react";
import type { Company, Pattern, Problem } from "../types/graph";
import { difficultyColors, hashToPosition } from "../utils/graph";

interface UsePatternsGraphProps {
    patterns: Pattern[];
    problems: Problem[];
    companies: Company[];
    selectedDifficulties: Set<string>;
    selectedPattern: string;
    searchQuery: string;
    selectedCompany: string;
    selectedCollection: string;
    collectionProblems?: number[];
    hoveredNode: string | null;
    showPatterns: boolean;
    setHoveredNode: (node: string | null) => void;
    setVisibleProblems: (count: number) => void;
    setLoading: (loading: boolean) => void;
    setSelectedPattern: (pattern: string) => void;
}

export function usePatternsGraph({
    patterns,
    problems,
    companies,
    selectedDifficulties,
    selectedPattern,
    searchQuery,
    selectedCompany,
    selectedCollection,
    collectionProblems,
    hoveredNode,
    showPatterns,
    setHoveredNode,
    setVisibleProblems,
    setLoading,
    setSelectedPattern,
}: UsePatternsGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<any>(null);
    const graphRef = useRef<any>(null);
    const problemDataRef = useRef<Map<string, { difficulty: string; patterns: string[]; name: string }>>(new Map());
    const selectedPatternRef = useRef<string>(selectedPattern);

    // Keep ref in sync with prop
    useEffect(() => {
        selectedPatternRef.current = selectedPattern;
    }, [selectedPattern]);

    useEffect(() => {
        if (!containerRef.current) return;

        let renderer: any = null;

        async function loadGraph() {
            const [
                { default: Graph },
                { default: Sigma },
                { NodeSquareProgram },
                forceAtlas2Module,
                { NodeImageProgram },
            ] = await Promise.all([
                import("graphology"),
                import("sigma"),
                import("@sigma/node-square"),
                import("graphology-layout-forceatlas2"),
                import("@sigma/node-image"),
            ]);

            // Cross image URL for solved problems
            const solvedImageUrl = "https://cdn-icons-png.flaticon.com/512/1828/1828778.png";

            // Load solved problems from localStorage
            const solvedProblems = new Set<number>();
            try {
                const stored = localStorage.getItem('solvedProblems');
                if (stored) {
                    JSON.parse(stored).forEach((id: number) => solvedProblems.add(id));
                }
            } catch (e) {
                console.error('Failed to load solved problems:', e);
            }
            const forceAtlas2 = forceAtlas2Module.default;

            const subSlugToFullId = new Map<string, string>();
            const graph = new Graph();

            // === PATTERNS VERTICAL, SUBPATTERNS TO THE RIGHT ===
            const rowHeight = 600; // row height for pattern + its subpatterns
            const subSpacingY = 400; // vertical spacing between subpatterns
            const patternX = -5000; // x-coordinate of patterns (left side)
            const subpatternX = 0; // x-coordinate of subpatterns (right side)

            let currentY = 0; // current y-position
            let dbPatternY = 0; // Database pattern position (stored separately)

            // First process all patterns EXCEPT Database
            patterns.filter(p => p.slug !== 'db').forEach((pattern) => {
                const patternId = pattern.slug;
                subSlugToFullId.set(patternId, patternId);

                const subpatternCount = pattern.subpatterns?.length || 0;
                const blockHeight = Math.max(1, subpatternCount) * subSpacingY;

                // Pattern on the left, centered vertically within block
                const patternY = currentY - blockHeight / 2;

                graph.addNode(patternId, {
                    x: patternX,
                    y: patternY,
                    size: 12,
                    label: pattern.name,
                    color: "#6366f1",
                    fixed: true,
                    forceLabel: true,
                });

                // Subpatterns on the right, vertically stacked
                pattern.subpatterns?.forEach((sub, subIndex) => {
                    const subId = `${pattern.slug}/${sub.slug}`;
                    subSlugToFullId.set(sub.slug, subId);

                    const subY = currentY - subIndex * subSpacingY;

                    graph.addNode(subId, {
                        x: subpatternX,
                        y: subY,
                        size: 8,
                        label: sub.name,
                        color: "#a5b4fc",
                        fixed: true,
                        forceLabel: true
                    });

                    graph.addEdge(patternId, subId);
                });

                currentY -= blockHeight + rowHeight;
            });

            // Store the boundary of main patterns
            const mainPatternsEndY = currentY;

            // Now add Database separately, with large gap
            const dbPattern = patterns.find(p => p.slug === 'db');
            if (dbPattern) {
                const dbSeparation = 3000; // gap between main patterns and Database
                currentY -= dbSeparation;
                dbPatternY = currentY;

                const patternId = dbPattern.slug;
                subSlugToFullId.set(patternId, patternId);

                graph.addNode(patternId, {
                    x: patternX,
                    y: currentY,
                    size: 12,
                    label: dbPattern.name,
                    color: "#6366f1", // same blue as other patterns
                    fixed: true,
                    forceLabel: true
                });

                // Database subpatterns (if any)
                dbPattern.subpatterns?.forEach((sub, subIndex) => {
                    const subId = `${dbPattern.slug}/${sub.slug}`;
                    subSlugToFullId.set(sub.slug, subId);

                    graph.addNode(subId, {
                        x: subpatternX,
                        y: currentY - subIndex * subSpacingY,
                        size: 8,
                        label: sub.name,
                        color: "#fcd34d",
                        fixed: true,
                        forceLabel: true
                    });

                    graph.addEdge(patternId, subId);
                });

                currentY -= rowHeight;
            }

            const problemSlugMap = new Map<string, string>();

            // Height of main patterns area (excluding Database)
            const mainHeight = Math.abs(mainPatternsEndY) + 1000;
            const mainStartY = 500;

            problems.forEach((problem, problemIndex) => {
                const problemId = `problem-${problem.id}`;
                problemSlugMap.set(problemId, problem.slug);
                problemDataRef.current.set(problemId, {
                    difficulty: problem.difficulty,
                    patterns: problem.patterns,
                    name: problem.name,
                });

                // Check if this is a Database problem or regular
                const isDbProblem = problem.patterns.includes('db');

                const { x: hashX, y: hashY } = hashToPosition(problem.slug, 1000);
                let x: number;
                let y: number;

                if (isDbProblem) {
                    // Database problems in separate zone below (strictly below mainPatternsEndY)
                    x = 7000 + (hashX / 1000) * 30000;
                    // Database zone: from dbPatternY+500 to dbPatternY-2500
                    y = dbPatternY + 500 - (hashY / 1000) * 3000;
                } else {
                    // Regular problems only in main zone (above mainPatternsEndY)
                    x = 7000 + (hashX / 1000) * 30000;
                    // Regular problems zone: from mainStartY to mainPatternsEndY
                    y = mainStartY - (hashY / 1000) * mainHeight;
                }

                const isSolved = solvedProblems.has(problem.id);

                graph.addNode(problemId, {
                    x,
                    y,
                    size: 5,
                    label: `${problem.id} - ${problem.name}`,
                    color: difficultyColors[problem.difficulty] || "#999",
                    ...(isSolved ? { type: "image", image: solvedImageUrl } : {}),
                });

                problem.patterns.forEach((patternSlug) => {
                    const fullId = subSlugToFullId.get(patternSlug);
                    if (fullId && graph.hasNode(fullId)) {
                        graph.addEdge(problemId, fullId);
                    }
                });
            });



            if (containerRef.current) {
                graphRef.current = graph;
                renderer = new Sigma(graph, containerRef.current, {
                    nodeProgramClasses: {
                        square: NodeSquareProgram,
                        image: NodeImageProgram,
                    },
                });
                rendererRef.current = renderer;

                renderer.on("clickNode", ({ node }: { node: string }) => {
                    const slug = problemSlugMap.get(node);
                    if (slug) {
                        window.open(`https://leetcode.com/problems/${slug}`, "_blank");
                    } else {
                        // Pattern or subpattern click - sync with dropdown (toggle behavior)
                        if (node.includes("/")) {
                            // Subpattern: extract slug after "/"
                            const subSlug = node.split("/")[1];
                            // Toggle: if already selected, clear it
                            if (selectedPatternRef.current === subSlug) {
                                setSelectedPattern("");
                            } else {
                                setSelectedPattern(subSlug);
                            }
                        } else {
                            // Main pattern: use "parent:" prefix
                            const patternValue = `parent:${node}`;
                            // Toggle: if already selected, clear it
                            if (selectedPatternRef.current === patternValue) {
                                setSelectedPattern("");
                            } else {
                                setSelectedPattern(patternValue);
                            }
                        }
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

        if (patterns.length > 0 && problems.length > 0) {
            loadGraph();
        }

        return () => {
            if (renderer) renderer.kill();
        };
    }, [patterns, problems]); // Re-run if data changes initially

    const filterInfo = useMemo(() => {
        const isParentFilter = selectedPattern.startsWith("parent:");
        const filterSlug = isParentFilter ? selectedPattern.replace("parent:", "") : selectedPattern;

        let subpatternParent: string | undefined;
        if (selectedPattern && !isParentFilter) {
            subpatternParent = patterns.find(p =>
                p.subpatterns?.some(s => s.slug === filterSlug)
            )?.slug;
        }

        let fullSelectedId: string | undefined;
        if (selectedPattern && !isParentFilter) {
            const parent = patterns.find(p =>
                p.subpatterns?.some(s => s.slug === filterSlug)
            );
            if (parent) {
                fullSelectedId = `${parent.slug}/${filterSlug}`;
            }
        }

        let subSlugs: string[] = [];
        if (selectedPattern && isParentFilter) {
            const parentPattern = patterns.find(p => p.slug === filterSlug);
            const childSlugs = parentPattern?.subpatterns?.map(s => s.slug) || [];
            subSlugs = [filterSlug, ...childSlugs];
        }

        return { isParentFilter, filterSlug, subpatternParent, subSlugs, fullSelectedId };
    }, [selectedPattern, patterns]);

    const targetCompany = useMemo(() => {
        if (!selectedCompany) return null;
        return companies.find(c => c.name === selectedCompany) || null;
    }, [selectedCompany, companies]);

    useEffect(() => {
        const renderer = rendererRef.current;
        const graph = graphRef.current;
        if (!renderer) return;

        renderer.setSetting("nodeReducer", (node: string, data: any) => {
            const { isParentFilter, filterSlug, subpatternParent, subSlugs, fullSelectedId } = filterInfo;

            // 1. Determine visibility first
            let isHidden = false;
            if (!node.startsWith("problem-")) {
                if (!showPatterns) {
                    isHidden = true;
                } else if (selectedPattern) {
                    if (isParentFilter) {
                        if (!node.startsWith(filterSlug)) {
                            isHidden = true;
                        }
                    } else if (node !== filterSlug && node !== subpatternParent && node !== fullSelectedId) {
                        // Keep visible if it's the exact match or its parent
                        isHidden = true;
                    }
                }
            } else {
                const problemInfo = problemDataRef.current.get(node);
                if (!problemInfo) {
                    isHidden = true;
                } else {
                    if (!selectedDifficulties.has(problemInfo.difficulty)) {
                        isHidden = true;
                    } else if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        const problemId = node.replace("problem-", "");
                        if (!problemInfo.name.toLowerCase().includes(query) && !problemId.includes(query)) {
                            isHidden = true;
                        }
                    } else if (selectedCompany) {
                        const problemId = parseInt(node.replace("problem-", ""));
                        if (targetCompany && !targetCompany.problems.includes(problemId)) {
                            isHidden = true;
                        }
                    }

                    // Collection filter
                    if (!isHidden && selectedCollection && collectionProblems) {
                        const problemId = parseInt(node.replace("problem-", ""));
                        if (!collectionProblems.includes(problemId)) {
                            isHidden = true;
                        }
                    }

                    if (!isHidden && selectedPattern) {
                        if (isParentFilter) {
                            const hasMatch = problemInfo.patterns.some(p => subSlugs.includes(p));
                            if (!hasMatch) {
                                isHidden = true;
                            }
                        } else {
                            if (!problemInfo.patterns.includes(filterSlug)) {
                                isHidden = true;
                            }
                        }
                    }
                }
            }

            if (isHidden) return { ...data, hidden: true };

            // 2. Apply hover logic only if visible
            if (hoveredNode && graph) {
                const isHoveredNode = node === hoveredNode;

                // Check if hoveredNode is a main pattern (no "/" in id)
                const isHoveredMainPattern = hoveredNode && !hoveredNode.includes("/") && !hoveredNode.startsWith("problem-");

                // If hovering a main pattern, highlight its subpatterns
                const isSubpatternOfHovered = isHoveredMainPattern && node.startsWith(hoveredNode + "/");

                // If hovering a main pattern, also highlight problems connected to its subpatterns
                let isProblemOfHoveredPattern = false;
                if (isHoveredMainPattern && node.startsWith("problem-")) {
                    // Check if this problem is connected to any subpattern of the hovered pattern
                    const neighbors = graph.neighbors(node);
                    isProblemOfHoveredPattern = neighbors.some((neighbor: string) =>
                        neighbor === hoveredNode || neighbor.startsWith(hoveredNode + "/")
                    );
                }

                const isParentPattern = node && !node.includes("/") && hoveredNode.startsWith(node + "/");
                const isConnectedProblem = graph.hasEdge(node, hoveredNode) || graph.hasEdge(hoveredNode, node);

                if (isHoveredNode || isSubpatternOfHovered || isParentPattern || isConnectedProblem || isProblemOfHoveredPattern) {
                    return {
                        ...data,
                        zIndex: 1,
                        highlighted: true,
                        size: (data.size || 5) * 1.5
                    };
                } else if (!hoveredNode.startsWith("problem-")) {
                    return { ...data, color: "#e5e7eb", zIndex: 0 };
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

            if (hoveredNode) {
                const isConnected = source === hoveredNode || target === hoveredNode;
                if (!isConnected) {
                    if (hoveredNode.startsWith("problem-")) return data;
                    return { ...data, color: "#e5e7eb", zIndex: 0 };
                }
                return { ...data, zIndex: 1 };
            }

            return data;
        });

        renderer.refresh();

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
    }, [selectedDifficulties, selectedPattern, patterns, searchQuery, selectedCompany, companies, selectedCollection, collectionProblems, hoveredNode, showPatterns, filterInfo, targetCompany]);

    return { containerRef };
}

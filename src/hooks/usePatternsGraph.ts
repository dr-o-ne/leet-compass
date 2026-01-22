import { useEffect, useRef } from "react";
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
    hoveredNode: string | null;
    setHoveredNode: (node: string | null) => void;
    setVisibleProblems: (count: number) => void;
    setLoading: (loading: boolean) => void;
}

export function usePatternsGraph({
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
}: UsePatternsGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<any>(null);
    const graphRef = useRef<any>(null);
    const problemDataRef = useRef<Map<string, { difficulty: string; patterns: string[]; name: string }>>(new Map());

    useEffect(() => {
        if (!containerRef.current) return;

        let renderer: any = null;

        async function loadGraph() {
            const [
                { default: Graph },
                { default: Sigma },
                { NodeSquareProgram },
                forceAtlas2Module,
            ] = await Promise.all([
                import("graphology"),
                import("sigma"),
                import("@sigma/node-square"),
                import("graphology-layout-forceatlas2"),
            ]);
            const forceAtlas2 = forceAtlas2Module.default;

            const subSlugToFullId = new Map<string, string>();
            const graph = new Graph();

            patterns.forEach((pattern, patternIndex) => {
                const patternId = pattern.slug;
                const angle = (2 * Math.PI * patternIndex) / patterns.length;
                const radius = 100;

                graph.addNode(patternId, {
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                    size: 12,
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
                        size: 8,
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
                    } else if (!node.startsWith("problem-")) {
                        // It's a pattern or subpattern node
                        // For sliding-window/fixed-size-window, we might want to go to sliding-window page
                        const patternPath = node.split('/')[0];
                        const baseUrl = import.meta.env.BASE_URL.endsWith('/')
                            ? import.meta.env.BASE_URL
                            : import.meta.env.BASE_URL + '/';

                        window.location.href = `${baseUrl}patterns/${patternPath}`;
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

    useEffect(() => {
        const renderer = rendererRef.current;
        const graph = graphRef.current;
        if (!renderer) return;

        renderer.setSetting("nodeReducer", (node: string, data: any) => {
            const isParentFilter = selectedPattern.startsWith("parent:");
            const filterSlug = isParentFilter ? selectedPattern.replace("parent:", "") : selectedPattern;

            // 1. Determine visibility first
            let isHidden = false;
            if (!node.startsWith("problem-")) {
                if (selectedPattern) {
                    if (isParentFilter) {
                        if (!node.startsWith(filterSlug)) {
                            isHidden = true;
                        }
                    } else {
                        const subpatternParent = patterns.find(p =>
                            p.subpatterns.some(s => s.slug === filterSlug)
                        )?.slug;

                        if (node.includes(filterSlug) || node === subpatternParent) {
                            // Keep visible
                        } else {
                            isHidden = true;
                        }
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
                        const company = companies.find(c => c.name === selectedCompany);
                        const problemId = parseInt(node.replace("problem-", ""));
                        if (company && !company.problems.includes(problemId)) {
                            isHidden = true;
                        }
                    } else if (selectedPattern) {
                        if (isParentFilter) {
                            const parentPattern = patterns.find(p => p.slug === filterSlug);
                            const subSlugs = parentPattern?.subpatterns.map(s => s.slug) || [];
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
                const isSubpattern = hoveredNode && !hoveredNode.includes("/") && node.startsWith(hoveredNode + "/");
                const isParentPattern = node && !node.includes("/") && hoveredNode.startsWith(node + "/");
                const isConnectedProblem = graph.hasEdge(node, hoveredNode) || graph.hasEdge(hoveredNode, node);

                if (isHoveredNode || isSubpattern || isParentPattern || isConnectedProblem) {
                    return { ...data, zIndex: 1, highlighted: true };
                } else {
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
    }, [selectedDifficulties, selectedPattern, patterns, searchQuery, selectedCompany, companies, hoveredNode]);

    return { containerRef };
}

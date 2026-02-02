import { useState, useRef, useEffect } from "react";

interface Collections {
    [key: string]: number[];
}

interface CollectionFilterProps {
    collections: Collections;
    selectedCollection: string;
    setSelectedCollection: (collection: string) => void;
}

export default function CollectionFilter({
    collections,
    selectedCollection,
    setSelectedCollection,
}: CollectionFilterProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const collectionNames = Object.keys(collections);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow flex items-center gap-2 ${selectedCollection ? "text-gray-900" : "text-gray-400"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{selectedCollection || "All collections"}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {selectedCollection && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollection("");
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
            {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 min-w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div
                        onClick={() => {
                            setSelectedCollection("");
                            setDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-b border-gray-100 whitespace-nowrap"
                    >
                        All collections
                    </div>
                    {collectionNames.map((name) => (
                        <div
                            key={name}
                            onClick={() => {
                                setSelectedCollection(name);
                                setDropdownOpen(false);
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 whitespace-nowrap flex items-center justify-between gap-4 ${selectedCollection === name ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
                                }`}
                        >
                            <span>{name}</span>
                            <span className="text-xs text-gray-400">{collections[name].length} problems</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

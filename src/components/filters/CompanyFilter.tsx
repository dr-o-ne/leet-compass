import { useState, useMemo, useRef, useEffect } from "react";
import type { Company } from "../../types/graph";

interface CompanyFilterProps {
    companies: Company[];
    selectedCompany: string;
    setSelectedCompany: (company: string) => void;
}

export default function CompanyFilter({
    companies,
    selectedCompany,
    setSelectedCompany,
}: CompanyFilterProps) {
    const [companySearch, setCompanySearch] = useState("");
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCompanies = useMemo(() => {
        if (!companySearch) return companies;
        return companies.filter((c) =>
            c.name.toLowerCase().includes(companySearch.toLowerCase())
        );
    }, [companies, companySearch]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setCompanyDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
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
    );
}

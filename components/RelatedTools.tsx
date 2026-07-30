import Link from "next/link";
import { Sparkles, ArrowRight, Code2, Globe, RefreshCw, Calculator, FileText, Lock, Minimize2, Scaling, CreditCard, DollarSign, Percent, Scale, MapPin, Database, ImageIcon, FileCode, Type, Layers, Hash, Calendar, Percent as PercentIcon, Sigma, ArrowRightLeft, Clock, QrCode, Combine, Scissors, FileImage, FileType2, Edit3, ListOrdered, Fingerprint, Building, Car } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";

// Map string icon names from registry to Lucide SVG components
const ICON_MAP: Record<string, any> = {
    Sparkles, Code2, Globe, RefreshCw, Calculator, FileText, Lock, Minimize2,
    Scaling, CreditCard, DollarSign, Percent, Scale, MapPin, Database,
    ImageIcon, FileCode, Type, Layers, Hash, Calendar, PercentIcon, Sigma,
    ArrowRightLeft, Clock, QrCode, Combine, Scissors, FileImage, FileType2, Edit3, ListOrdered, Fingerprint, Building, Car
};

interface RelatedToolsProps {
    currentSlug: string;
    currentCategory: string;
}

export default function RelatedTools({ currentSlug, currentCategory }: RelatedToolsProps) {
    // 1. Get all other tools excluding the current active page
    const otherTools = toolsRegistry.filter((t) => t.id !== currentSlug);

    // 2. Filter tools from the same category
    const sameCategoryTools = otherTools.filter((t) => t.category === currentCategory);

    // 3. Fallback tools from other categories if same category has < 3
    const otherCategoryTools = otherTools.filter((t) => t.category !== currentCategory);

    // Deterministic pseudo-shuffle based on string hash to prevent hydration errors
    const hashSeed = currentSlug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sortedSameCat = [...sameCategoryTools].sort((a, b) => (a.id.length + hashSeed) % 7 - (b.id.length + hashSeed) % 7);
    const sortedOtherCat = [...otherCategoryTools].sort((a, b) => (a.id.length + hashSeed) % 5 - (b.id.length + hashSeed) % 5);

    // Pick top 3-4 tools
    const selectedTools = [...sortedSameCat, ...sortedOtherCat].slice(0, 3);

    if (selectedTools.length === 0) return null;

    return (
        <section className="pt-5 mb-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Related & Complementary Utilities
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Explore more privacy-first client-side web tools.
                    </p>
                </div>
                <Link
                    href={`/tools/${currentCategory}`}
                    className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    View All Category Tools <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedTools.map((tool) => {
                    const IconComponent = ICON_MAP[tool.iconName] || Sparkles;
                    return (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                        {tool.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1">
                                        {tool.description}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                <span>Open Utility</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
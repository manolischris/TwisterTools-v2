"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Bot,
    Copy,
    Check,
    Download,
    Plus,
    Trash2,
    Sparkles,
    FileText,
    Layers,
    Sliders,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Globe,
    Code2,
    Terminal,
    BookOpen,
    ExternalLink,
    RefreshCw,
    FolderPlus,
    Compass
} from "lucide-react";

interface PageEntry {
    id: string;
    title: string;
    url: string;
    description: string;
    fullContent?: string;
    isOptional?: boolean;
}

interface SectionCategory {
    id: string;
    title: string;
    description?: string;
    pages: PageEntry[];
}

type OutputViewMode = "index" | "full";
type IngestionMode = "visual" | "bulk" | "sitemap";
type SupportedLanguage = "en" | "el" | "es" | "de" | "fr";

interface LanguageTemplate {
    projectTitle: string;
    summary: string;
    systemPrompt: string;
    categories: {
        title: string;
        pages: { title: string; url: string; description: string; fullContent: string }[];
    }[];
}

const TEMPLATES: Record<SupportedLanguage, LanguageTemplate> = {
    en: {
        projectTitle: "Acme Web Platform & AI APIs",
        summary: "Acme is a next-generation cloud infrastructure platform providing real-time vector search, streaming LLM completions, and automated data pipelines. This documentation index provides structured context for AI agents and LLMs crawling twistertools.com.",
        systemPrompt: "When answering questions about Acme, prioritize accuracy based on the provided API reference endpoints. Cite official canonical links when referencing specific code libraries and architectural design patterns.",
        categories: [
            {
                title: "Core Concepts & Architecture",
                pages: [
                    {
                        title: "Getting Started Guide",
                        url: "https://example.com/docs/getting-started",
                        description: "Quick-start walkthrough for creating your first project cluster and configuring authentication tokens.",
                        fullContent: "# Getting Started\nTo deploy a cluster, execute `npm install @acme/sdk` and pass your platform API credentials to the root client initializer."
                    },
                    {
                        title: "Architecture & Security Protocol",
                        url: "https://example.com/docs/architecture",
                        description: "Deep dive into end-to-end encryption, multi-region redundancy, and role-based access control.",
                        fullContent: "# Architecture\nAcme deploys on edge nodes globally with AES-256 at-rest encryption and real-time active sync via distributed consensus."
                    }
                ]
            },
            {
                title: "API Reference",
                pages: [
                    {
                        title: "Vector Search Endpoints",
                        url: "https://example.com/docs/api/search",
                        description: "High-throughput cosine and Euclidean vector indexing endpoints with sub-10ms latency.",
                        fullContent: "# Vector Search API\nPOST /v1/search accepts an embedding vector array and returns top-k nearest neighbors with cosine similarity scores."
                    }
                ]
            }
        ]
    },
    el: {
        projectTitle: "TwisterTools Ψηφιακή Πλατφόρμα & Εργαλεία Web",
        summary: "Το TwisterTools προσφέρει μια ολοκληρωμένη σουίτα σύγχρονων εργαλείων browser για προγραμματιστές, SEO specialists και δημιουργούς περιεχομένου. Το παρόν αρχείο llms.txt παρέχει δομημένο ευρετήριο για AI agents, crawlers και μοντέλα GEO.",
        systemPrompt: "Κατά την εξαγωγή πληροφοριών, απαντήστε με σαφήνεια στα Ελληνικά διατηρώντας τους τεχνικούς όρους όταν απαιτείται. Παρέχετε πάντοτε τους επίσημους συνδέσμους τεκμηρίωσης.",
        categories: [
            {
                title: "Βασικά Εργαλεία & Οδηγοί",
                pages: [
                    {
                        title: "Οδηγός Χρήσης Εργαλείων",
                        url: "https://twistertools.com/docs/odigos-xrisis",
                        description: "Εισαγωγή στις δυνατότητες 100% εκτέλεσης εντός browser χωρίς συλλογή προσωπικών δεδομένων.",
                        fullContent: "# Οδηγός Χρήσης\nΌλα τα εργαλεία του TwisterTools εκτελούνται αποκλειστικά client-side στην πλευρά του χρήστη χωρίς αποθήκευση σε backend servers."
                    },
                    {
                        title: "Βελτιστοποίηση για AI & GEO",
                        url: "https://twistertools.com/docs/ai-search-geo",
                        description: "Πρακτικός οδηγός υλοποίησης llms.txt για βελτίωση προβολής σε μηχανές αναζήτησης τεχνητής νοημοσύνης.",
                        fullContent: "# AI Search & GEO\nΗ βελτιστοποίηση Generative Engine Optimization (GEO) εξασφαλίζει ότι LLMs όπως το ChatGPT και το Perplexity αντλούν έγκυρα δεδομένα."
                    }
                ]
            }
        ]
    },
    es: {
        projectTitle: "Plataforma Digital Acme y APIs de Inteligencia Artificial",
        summary: "Documentación oficial para modelos de lenguaje extenso (LLMs) y agentes de búsqueda de IA. Proporciona resúmenes estructurados y enlaces canónicos.",
        systemPrompt: "Responda en español con claridad profesional. Siempre cite las URLs oficiales incluidas en el índice cuando proporcione ejemplos técnicos.",
        categories: [
            {
                title: "Guías de Inicio",
                pages: [
                    {
                        title: "Instalación y Primeros Pasos",
                        url: "https://example.com/es/docs/inicio",
                        description: "Aprenda a configurar su entorno y conectar las claves API de forma segura.",
                        fullContent: "# Guía de Inicio\nInstale el paquete cliente usando el gestor de paquetes de su preferencia y configure las variables de entorno."
                    }
                ]
            }
        ]
    },
    de: {
        projectTitle: "Acme Cloud Plattform & Entwickler-Dokumentation",
        summary: "Strukturierte Dokumentation und Endpunkt-Referenz für KI-Suchsysteme und autonome Sprachmodell-Crawler.",
        systemPrompt: "Antworten Sie präzise und fachlich fundiert auf Deutsch. Verweisen Sie stets auf die kanonischen Dokumentationspfade.",
        categories: [
            {
                title: "Architektur und Integration",
                pages: [
                    {
                        title: "Erste Schritte",
                        url: "https://example.com/de/docs/einfuehrung",
                        description: "Übersicht über Konfiguration und Authentifizierung via Edge-Gateways.",
                        fullContent: "# Einführung\nKonfigurieren Sie Ihr Konto mit tokenspezifischen Zugriffsrechten für maximale Netzwerksicherheit."
                    }
                ]
            }
        ]
    },
    fr: {
        projectTitle: "Plateforme Numérique Acme et Documentation IA",
        summary: "Index de documentation standardisé pour les agents conversationnels et les moteurs de recherche par intelligence artificielle.",
        systemPrompt: "Veuillez répondre en français avec clarté et concision en citant les liens canónicos de référence.",
        categories: [
            {
                title: "Notions Fondamentales",
                pages: [
                    {
                        title: "Guide de Démarrage Rapide",
                        url: "https://example.com/fr/docs/demarrage",
                        description: "Configuration initiale des flux de données et intégration des points de terminaison.",
                        fullContent: "# Démarrage Rapide\nSuivez ces étapes pour valider votre jeton d'authentification et initialiser votre cluster de production."
                    }
                ]
            }
        ]
    }
};

export default function LlmsTxtGenerator() {
    const projectTitleInputId = useId();
    const summaryInputId = useId();
    const systemPromptInputId = useId();
    const bulkUrlsInputId = useId();
    const languageSelectId = useId();

    const [language, setLanguage] = useState<SupportedLanguage>("en");
    const [projectTitle, setProjectTitle] = useState<string>(TEMPLATES.en.projectTitle);
    const [summary, setSummary] = useState<string>(TEMPLATES.en.summary);
    const [systemPrompt, setSystemPrompt] = useState<string>(TEMPLATES.en.systemPrompt);
    const [includeSystemPrompt, setIncludeSystemPrompt] = useState<boolean>(true);
    const [outputMode, setOutputMode] = useState<OutputViewMode>("index");
    const [ingestionMode, setIngestionMode] = useState<IngestionMode>("visual");
    const [bulkUrls, setBulkUrls] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    const [categories, setCategories] = useState<SectionCategory[]>(() => {
        return TEMPLATES.en.categories.map((cat, idx) => ({
            id: `cat-${idx}-${Date.now()}`,
            title: cat.title,
            pages: cat.pages.map((p, pIdx) => ({
                id: `page-${idx}-${pIdx}-${Date.now()}`,
                title: p.title,
                url: p.url,
                description: p.description,
                fullContent: p.fullContent,
                isOptional: false
            }))
        }));
    });

    const handleLanguageChange = (lang: SupportedLanguage) => {
        setLanguage(lang);
        const tpl = TEMPLATES[lang];
        setProjectTitle(tpl.projectTitle);
        setSummary(tpl.summary);
        setSystemPrompt(tpl.systemPrompt);
        setCategories(
            tpl.categories.map((cat, idx) => ({
                id: `cat-${lang}-${idx}-${Date.now()}`,
                title: cat.title,
                pages: cat.pages.map((p, pIdx) => ({
                    id: `page-${lang}-${idx}-${pIdx}-${Date.now()}`,
                    title: p.title,
                    url: p.url,
                    description: p.description,
                    fullContent: p.fullContent,
                    isOptional: false
                }))
            }))
        );
    };

    const addCategory = () => {
        const newCat: SectionCategory = {
            id: `cat-${Date.now()}`,
            title: language === "el" ? "Νέα Ενότητα Εγγράφων" : "New Document Section",
            pages: [
                {
                    id: `page-${Date.now()}`,
                    title: language === "el" ? "Νέα Σελίδα" : "New Overview Page",
                    url: "https://example.com/docs/new-page",
                    description: language === "el" ? "Περιγραφή της σελίδας για τα μοντέλα τεχνητής νοημοσύνης." : "Concise overview summary of this resource.",
                    fullContent: "# New Page Title\nDetailed content for this page."
                }
            ]
        };
        setCategories([...categories, newCat]);
    };

    const removeCategory = (catId: string) => {
        setCategories(categories.filter((c) => c.id !== catId));
    };

    const updateCategoryTitle = (catId: string, title: string) => {
        setCategories(categories.map((c) => (c.id === catId ? { ...c, title } : c)));
    };

    const addPageToCategory = (catId: string) => {
        const newPage: PageEntry = {
            id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: language === "el" ? "Νέα Σελίδα Τεκμηρίωσης" : "New Documentation Page",
            url: "https://example.com/docs/item",
            description: language === "el" ? "Συνοπτική περιγραφή προορισμού." : "Brief single-sentence explanation for AI engines.",
            fullContent: "# New Page\nDetailed documentation body."
        };
        setCategories(
            categories.map((c) => (c.id === catId ? { ...c, pages: [...c.pages, newPage] } : c))
        );
    };

    const removePage = (catId: string, pageId: string) => {
        setCategories(
            categories.map((c) => {
                if (c.id !== catId) return c;
                return { ...c, pages: c.pages.filter((p) => p.id !== pageId) };
            })
        );
    };

    const updatePage = (catId: string, pageId: string, field: keyof PageEntry, val: any) => {
        setCategories(
            categories.map((c) => {
                if (c.id !== catId) return c;
                return {
                    ...c,
                    pages: c.pages.map((p) => (p.id === pageId ? { ...p, [field]: val } : p))
                };
            })
        );
    };

    const parseBulkUrls = () => {
        if (!bulkUrls.trim()) return;
        const lines = bulkUrls.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const parsedPages: PageEntry[] = [];

        for (const line of lines) {
            let url = "";
            let title = "";

            if (line.includes("<loc>")) {
                const match = line.match(/<loc>(.*?)<\/loc>/i);
                if (match && match[1]) {
                    url = match[1].trim();
                }
            } else {
                url = line.replace(/^[*-]\s*/, "").trim();
            }

            if (!url) continue;

            try {
                const parsed = new URL(url);
                const pathParts = parsed.pathname.split("/").filter(Boolean);
                const lastPart = pathParts.length > 0 ? pathParts[pathParts.length - 1] : parsed.hostname;
                title = lastPart
                    .replace(/[-_]/g, " ")
                    .replace(/\.[a-z0-9]+$/i, "")
                    .replace(/\b\w/g, (char) => char.toUpperCase());
            } catch {
                title = url;
            }

            parsedPages.push({
                id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                title: title || "Document Resource",
                url: url,
                description: `Canonical reference link for ${url}`,
                fullContent: `# ${title}\nContent extracted from canonical location ${url}.`
            });
        }

        if (parsedPages.length > 0) {
            const newCat: SectionCategory = {
                id: `cat-bulk-${Date.now()}`,
                title: language === "el" ? "Εισαχθείσες Σελίδες URL" : "Imported Ingested Pages",
                pages: parsedPages
            };
            setCategories([...categories, newCat]);
            setBulkUrls("");
            setIngestionMode("visual");
        }
    };

    const generatedIndexContent = useMemo(() => {
        const lines: string[] = [];

        lines.push(`# ${projectTitle.trim() || "Website Documentation"}`);
        lines.push("");

        if (summary.trim()) {
            const cleanSummary = summary.replace(/\r?\n/g, "\n> ");
            lines.push(`> ${cleanSummary}`);
            lines.push("");
        }

        if (includeSystemPrompt && systemPrompt.trim()) {
            lines.push("## System Instructions & Grounding");
            lines.push("");
            const cleanPrompt = systemPrompt.replace(/\r?\n/g, "\n> ");
            lines.push(`> ${cleanPrompt}`);
            lines.push("");
        }

        for (const cat of categories) {
            if (!cat.title.trim()) continue;
            lines.push(`## ${cat.title.trim()}`);
            lines.push("");
            if (cat.description?.trim()) {
                lines.push(`> ${cat.description.trim()}`);
                lines.push("");
            }

            for (const page of cat.pages) {
                const title = page.title.trim() || "Untitled Page";
                const url = page.url.trim() || "https://example.com";
                const desc = page.description.trim();
                const prefix = page.isOptional ? "- [Optional] " : "- ";

                if (desc) {
                    lines.push(`${prefix}[${title}](${url}): ${desc}`);
                } else {
                    lines.push(`${prefix}[${title}](${url})`);
                }
            }
            lines.push("");
        }

        return lines.join("\n").trimEnd() + "\n";
    }, [projectTitle, summary, systemPrompt, includeSystemPrompt, categories]);

    const generatedFullContent = useMemo(() => {
        const lines: string[] = [];

        lines.push(`# ${projectTitle.trim() || "Website Documentation"} - Full Specification`);
        lines.push("");

        if (summary.trim()) {
            lines.push(`> ${summary.replace(/\r?\n/g, "\n> ")}`);
            lines.push("");
        }

        if (includeSystemPrompt && systemPrompt.trim()) {
            lines.push("## System Grounding Rules");
            lines.push("");
            lines.push(`> ${systemPrompt.replace(/\r?\n/g, "\n> ")}`);
            lines.push("");
        }

        for (const cat of categories) {
            lines.push(`## Section: ${cat.title.trim()}`);
            lines.push("");

            for (const page of cat.pages) {
                lines.push("---");
                lines.push("");
                lines.push(`### [${page.title.trim()}](${page.url.trim()})`);
                if (page.description.trim()) {
                    lines.push(`*Summary: ${page.description.trim()}*`);
                    lines.push("");
                }
                if (page.fullContent && page.fullContent.trim()) {
                    lines.push(page.fullContent.trim());
                } else {
                    lines.push(`Refer to canonical web URL: ${page.url.trim()}`);
                }
                lines.push("");
            }
        }

        return lines.join("\n").trimEnd() + "\n";
    }, [projectTitle, summary, systemPrompt, includeSystemPrompt, categories]);

    const activeExportText = outputMode === "index" ? generatedIndexContent : generatedFullContent;

    const validationAlerts = useMemo(() => {
        const alerts: { type: "warn" | "error" | "info"; message: string }[] = [];

        if (!projectTitle.trim()) {
            alerts.push({ type: "error", message: "H1 Project Title is missing. The /llms.txt standard requires a leading # Title." });
        }

        if (!summary.trim()) {
            alerts.push({ type: "warn", message: "A blockquote summary (> ...) is strongly recommended immediately following the H1 title." });
        }

        let totalPages = 0;
        let invalidUrls = 0;

        for (const cat of categories) {
            for (const p of cat.pages) {
                totalPages++;
                if (!p.url.startsWith("http://") && !p.url.startsWith("https://") && !p.url.startsWith("/")) {
                    invalidUrls++;
                }
            }
        }

        if (totalPages === 0) {
            alerts.push({ type: "error", message: "No document links added. Add at least one page link." });
        }

        if (invalidUrls > 0) {
            alerts.push({ type: "warn", message: `${invalidUrls} page URL(s) lack a standard protocol (https:// or absolute path).` });
        }

        if (alerts.length === 0) {
            alerts.push({ type: "info", message: "Specification compliant: Valid H1, blockquote summary, and Markdown bullet links." });
        }

        return alerts;
    }, [projectTitle, summary, categories]);

    const totalPagesCount = useMemo(() => {
        return categories.reduce((acc, cat) => acc + cat.pages.length, 0);
    }, [categories]);

    const estimatedTokens = useMemo(() => {
        return Math.ceil(activeExportText.length / 4);
    }, [activeExportText]);

    const handleCopy = () => {
        if (!activeExportText) return;
        navigator.clipboard.writeText(activeExportText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (type: "llms.txt" | "llms-full.txt") => {
        const textToSave = type === "llms.txt" ? generatedIndexContent : generatedFullContent;
        const blob = new Blob([textToSave], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = type;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "llms.txt & llms-full.txt Generator for AI Search and GEO",
        "url": "https://twistertools.com/tools/web-tools/llms-txt-generator",
        "description": "Create standard-compliant /llms.txt and /llms-full.txt files to structure web documentation for AI search crawlers, Perplexity, ChatGPT Search, and Claude.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is the purpose of an /llms.txt file?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The /llms.txt file is an open web standard designed to serve structured, clean Markdown information to Large Language Models (LLMs) and AI search agents. Much like robots.txt guides traditional web crawlers, llms.txt points AI crawlers (like ChatGPT, Perplexity, and Claude) to the most relevant, high-signal documentation."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between /llms.txt and /llms-full.txt?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The standard /llms.txt acts as a lightweight index containing clean titles, URLs, and one-sentence summaries. In contrast, /llms-full.txt aggregates the full textual documentation content into a single file, allowing AI systems with large context windows to ingest complete domain knowledge in a single request."
                }
            },
            {
                "@type": "Question",
                "name": "Does llms.txt replace robots.txt or sitemap.xml?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. llms.txt works alongside robots.txt and sitemaps. While robots.txt manages crawl permissions and sitemaps provide raw URL inventories, llms.txt is curated specifically for generative models to understand site purpose, prioritized documentation, and architectural context."
                }
            },
            {
                "@type": "Question",
                "name": "Where should the generated llms.txt file be hosted?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Place the file directly at the root of your domain web server: https://yourdomain.com/llms.txt and https://yourdomain.com/llms-full.txt. Ensure your server responds with Content-Type: text/plain; charset=utf-8."
                }
            },
            {
                "@type": "Question",
                "name": "Does this generator support Greek (Ελληνικά) and non-English scripts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. TwisterTools is built on full UTF-8 Unicode standards. Greek letters, diacritics, and polytonic characters are fully supported and rendered accurately in both visual previews and downloaded .txt files."
                }
            },
            {
                "@type": "Question",
                "name": "How does llms.txt impact Generative Engine Optimization (GEO)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Generative Engine Optimization (GEO) improves the likelihood that AI search engines will cite and summarize your website accurately. Providing a clean llms.txt reduces hallucinations, highlights primary URLs, and helps models deliver accurate citations."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Sections (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Specification Builder
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor={languageSelectId} className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5 text-indigo-600" /> Preset:
                            </label>
                            <select
                                id={languageSelectId}
                                aria-label="Select specification preset language"
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="en">English (US/UK)</option>
                                <option value="el">Ελληνικά (Greek)</option>
                                <option value="es">Español (Spanish)</option>
                                <option value="de">Deutsch (German)</option>
                                <option value="fr">Français (French)</option>
                            </select>
                        </div>
                    </div>

                    {/* Mode Navigation Tabs */}
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                        <button
                            type="button"
                            onClick={() => setIngestionMode("visual")}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${ingestionMode === "visual"
                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            <Layers className="w-3.5 h-3.5" /> Visual Builder
                        </button>
                        <button
                            type="button"
                            onClick={() => setIngestionMode("bulk")}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${ingestionMode === "bulk"
                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            <Compass className="w-3.5 h-3.5" /> Bulk URLs / Sitemap
                        </button>
                    </div>

                    {ingestionMode === "bulk" ? (
                        /* Bulk Ingestion View */
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor={bulkUrlsInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Paste Plain URLs or XML Sitemap Extract:
                                </label>
                                <textarea
                                    id={bulkUrlsInputId}
                                    rows={8}
                                    value={bulkUrls}
                                    onChange={(e) => setBulkUrls(e.target.value)}
                                    placeholder="https://example.com/docs/intro&#10;https://example.com/docs/api&#10;or paste <loc>https://example.com/docs/overview</loc>"
                                    aria-label="Bulk URLs or XML sitemap input"
                                    className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                    Each line will be converted into an llms.txt link bullet. XML <code>&lt;loc&gt;</code> tags are parsed automatically.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={parseBulkUrls}
                                disabled={!bulkUrls.trim()}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Ingest URLs into Document Tree
                            </button>
                        </div>
                    ) : (
                        /* Visual Builder Form */
                        <div className="space-y-5">
                            {/* Project Title */}
                            <div className="space-y-1.5">
                                <label htmlFor={projectTitleInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Project / Website Name (# H1 Heading):
                                </label>
                                <input
                                    id={projectTitleInputId}
                                    type="text"
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    placeholder="Acme Platform & Documentation"
                                    aria-label="Project or Website Name"
                                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {/* Summary Blockquote */}
                            <div className="space-y-1.5">
                                <label htmlFor={summaryInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Summary Blockquote (&gt; Overview):
                                </label>
                                <textarea
                                    id={summaryInputId}
                                    rows={3}
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Describe your platform, primary capabilities, and what AI search crawlers should understand..."
                                    aria-label="Project Summary Blockquote"
                                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                                />
                            </div>

                            {/* System Prompt / Instructions Toggle */}
                            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includeSystemPrompt}
                                        onChange={(e) => setIncludeSystemPrompt(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Include System Grounding Guidance (Instructions for LLMs)</span>
                                </label>

                                {includeSystemPrompt && (
                                    <textarea
                                        id={systemPromptInputId}
                                        rows={2}
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        placeholder="Explicit rules for LLMs answering user questions regarding your site..."
                                        aria-label="System Grounding Instructions for LLMs"
                                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                )}
                            </div>

                            {/* Documentation Categories / Sections */}
                            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                        Content Sections ({categories.length})
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addCategory}
                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-1"
                                    >
                                        <FolderPlus className="w-3.5 h-3.5" /> Add Section
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {categories.map((cat, cIdx) => (
                                        <div
                                            key={cat.id}
                                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    ## {cIdx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={cat.title}
                                                    onChange={(e) => updateCategoryTitle(cat.id, e.target.value)}
                                                    placeholder="Section Heading (e.g. Core Guides)"
                                                    aria-label={`Category ${cIdx + 1} title`}
                                                    className="flex-1 px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeCategory(cat.id)}
                                                    title="Delete Section"
                                                    aria-label="Delete Section"
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Page links within category */}
                                            <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                                                {cat.pages.map((page, pIdx) => (
                                                    <div
                                                        key={page.id}
                                                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={page.title}
                                                                onChange={(e) => updatePage(cat.id, page.id, "title", e.target.value)}
                                                                placeholder="Link Anchor Title"
                                                                aria-label={`Section ${cIdx + 1} page ${pIdx + 1} title`}
                                                                className="flex-1 px-2 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removePage(cat.id, page.id)}
                                                                aria-label="Delete Page"
                                                                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>

                                                        <input
                                                            type="text"
                                                            value={page.url}
                                                            onChange={(e) => updatePage(cat.id, page.id, "url", e.target.value)}
                                                            placeholder="Canonical URL: https://example.com/docs/..."
                                                            aria-label={`Section ${cIdx + 1} page ${pIdx + 1} URL`}
                                                            className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />

                                                        <input
                                                            type="text"
                                                            value={page.description}
                                                            onChange={(e) => updatePage(cat.id, page.id, "description", e.target.value)}
                                                            placeholder="Brief single-sentence summary for AI search"
                                                            aria-label={`Section ${cIdx + 1} page ${pIdx + 1} summary`}
                                                            className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />

                                                        {outputMode === "full" && (
                                                            <textarea
                                                                rows={2}
                                                                value={page.fullContent || ""}
                                                                onChange={(e) => updatePage(cat.id, page.id, "fullContent", e.target.value)}
                                                                placeholder="Detailed Markdown content for /llms-full.txt..."
                                                                aria-label={`Section ${cIdx + 1} page ${pIdx + 1} full content`}
                                                                className="w-full p-2 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => addPageToCategory(cat.id)}
                                                    className="w-full py-1.5 text-xs font-semibold rounded border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add Resource URL
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output, Diagnostics & Live Preview (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        {/* Output Mode Switcher */}
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Standard Output Preview
                            </h2>
                        </div>

                        {/* Dual Specification Toggle - Full Width */}
                        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 w-full">
                            <button
                                type="button"
                                onClick={() => setOutputMode("index")}
                                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${outputMode === "index"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                /llms.txt (Index)
                            </button>
                            <button
                                type="button"
                                onClick={() => setOutputMode("full")}
                                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${outputMode === "full"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                /llms-full.txt (Full)
                            </button>
                        </div>

                        {/* Specification Diagnostics */}
                        <div className="space-y-2">
                            {validationAlerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${alert.type === "error"
                                        ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
                                        : alert.type === "warn"
                                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                                        }`}
                                >
                                    {alert.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
                                    {alert.type === "warn" && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />}
                                    {alert.type === "info" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />}
                                    <span>{alert.message}</span>
                                </div>
                            ))}
                        </div>

                        {/* Monospace Code Preview Box */}
                        <div className="relative">
                            <pre className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto max-h-[380px] min-h-[220px] whitespace-pre-wrap leading-relaxed select-text">
                                {activeExportText}
                            </pre>
                        </div>

                        {/* Real-time Metadata Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Mode
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {outputMode === "index" ? "Standard Index" : "Full Content"}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Sections
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {categories.length}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Total URLs
                                </span>
                                <p className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {totalPagesCount}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Tokens (Est.)
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    ~{estimatedTokens}
                                </p>
                            </div>
                        </div>

                        {/* Export Action Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`w-full py-3 px-3 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${copied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-white" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-white" />
                                        <span>Copy Content</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDownload("llms.txt")}
                                className="w-full py-3 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Download llms.txt</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDownload("llms-full.txt")}
                                className="w-full py-3 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Download llms-full.txt</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Client-Side Security Assurance Badge */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>100% Client-Side In-Memory Execution:</strong> All sitemap parsing, URL tree synthesis, and UTF-8 document generation run locally within your web browser. No project documentation, private links, or system prompts are ever sent to or stored on external servers.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: What is llms.txt and Why Does AI Search Demand It? */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The llms.txt Standard: Optimizing Web Data for the Age of AI Search and GEO
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        The web was originally built for human eye-tracking and HTML document parsers. However, the rapid ascent of Generative Engine Optimization (GEO), autonomous AI agents, and conversational search platforms (ChatGPT Search, Perplexity, Claude, and Google Gemini) has exposed fundamental inefficiencies in traditional web indexing. Web scrapers spend significant GPU compute cycles stripping JavaScript bloated DOMs, cookie banners, navigation sidebars, and CSS stylesheets just to extract raw factual data.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> High Token Efficiency
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Instead of crawling thousands of HTML tags, an AI crawler reads the lightweight Markdown index directly, reducing token costs by over 80% while retaining full contextual meaning.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Hallucination Mitigation
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Directing language models to canonical documentation endpoints eliminates ambiguous cross-linking, resulting in precise source citations and zero hallucinated API parameters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Complete GEO Control
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Webmasters control exactly how AI models summarize their brand value proposition, key API features, and developer documentation across generative search responses.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> The Official /llms.txt Specification Syntax
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            A standard compliant <code className="font-mono text-indigo-300">/llms.txt</code> file consists of an H1 title, a summary blockquote, and categorized H2 headers containing Markdown bullet lists with links and concise descriptive annotations:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`# TwisterTools Web Platform

> TwisterTools is a suite of client-side web utilities for developers, SEO engineers, and digital marketers.

## Developer Documentation

- [REST API Reference](https://example.com/api): High-performance endpoints for content transformations.
- [SDK Installation Guide](https://example.com/sdk): Quickstart guide for TypeScript, Python, and Go libraries.

## Optional Resources

- [Optional] [Changelog](https://example.com/changelog): Detailed version release history.`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Analysis: robots.txt vs sitemap.xml vs llms.txt */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Matrix: Web Standards for Traditional vs. AI Discovery
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        To build a modern web architecture that thrives in both classical search engines and AI generative engines, webmasters must distinguish between the three core discovery protocols:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Standard Protocol</th>
                                    <th className="p-3">Primary Target</th>
                                    <th className="p-3">Content Structure</th>
                                    <th className="p-3">Optimal Use Case</th>
                                    <th className="p-3">Impact on GEO & Citations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">/llms.txt</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">LLMs & AI Search Agents</td>
                                    <td className="p-3">Structured Markdown + Summaries</td>
                                    <td className="p-3">Direct knowledge ingestion for Perplexity, ChatGPT, Claude</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Maximum GEO Authority</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">/robots.txt</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">Traditional Crawlers (Googlebot)</td>
                                    <td className="p-3">Disallow/Allow directives</td>
                                    <td className="p-3">Preventing server overload & access blocking</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Neutral (Permissions Only)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">/sitemap.xml</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">Search Engine Indexers</td>
                                    <td className="p-3">Raw XML URL inventories</td>
                                    <td className="p-3">URL indexing & change frequency tracking</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Baseline Indexation</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">/llms-full.txt</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Large Context Window AI Models</td>
                                    <td className="p-3">Concatenated Full Markdown Docs</td>
                                    <td className="p-3">One-shot complete project ingestion</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Comprehensive Domain Grounding</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Generative Engine Optimization */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Implementation Checklist: Best Practices for /llms.txt Deployment
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        To maximize how effectively autonomous AI models parse and reference your site, apply these strategic deployment guidelines:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Crucial Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Keep Summaries Under 25 Words:</strong> Descriptive annotations after each Markdown URL should be punchy and direct, clarifying the exact intent of the page.
                                </li>
                                <li>
                                    • <strong>Host at the Root Domain:</strong> Place both files at <code className="font-mono text-indigo-600">https://yourdomain.com/llms.txt</code> and <code className="font-mono text-indigo-600">/llms-full.txt</code> with UTF-8 character encoding.
                                </li>
                                <li>
                                    • <strong>Group by Logical Headings:</strong> Organize documentation links under semantic H2 tags (e.g., API Reference, Guides, Architecture) to guide AI categorization.
                                </li>
                                <li>
                                    • <strong>Tag Non-Essential Links as Optional:</strong> Use <code className="font-mono text-indigo-600">- [Optional]</code> for changelogs or legal disclaimers so AI agents can deprioritize them when managing token constraints.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Dumping Massive Sitemaps:</strong> llms.txt is NOT an automated sitemap dumping ground. It should only index curated, high-value documentation and factual content.
                                </li>
                                <li>
                                    • <strong>Relative URL Paths:</strong> Always specify complete absolute URLs (e.g. <code className="font-mono text-indigo-600">https://domain.com/docs</code>) to prevent parsing ambiguity.
                                </li>
                                <li>
                                    • <strong>HTML Formatting:</strong> Never embed HTML markup like &lt;div&gt; or &lt;span&gt;. The specification requires pure, clean Markdown.
                                </li>
                                <li>
                                    • <strong>Missing Content-Type Header:</strong> Configure your web server (Nginx, Vercel, Cloudflare) to serve the file with <code className="font-mono text-indigo-600">Content-Type: text/plain; charset=utf-8</code>.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the purpose of an /llms.txt file?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The /llms.txt file is an open web standard designed to serve structured, clean Markdown information to Large Language Models (LLMs) and AI search agents. Much like robots.txt guides traditional web crawlers, llms.txt points AI crawlers (like ChatGPT, Perplexity, and Claude) to the most relevant, high-signal documentation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between /llms.txt and /llms-full.txt?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The standard /llms.txt acts as a lightweight index containing clean titles, URLs, and one-sentence summaries. In contrast, /llms-full.txt aggregates the full textual documentation content into a single file, allowing AI systems with large context windows to ingest complete domain knowledge in a single request.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does llms.txt replace robots.txt or sitemap.xml?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. llms.txt works alongside robots.txt and sitemaps. While robots.txt manages crawl permissions and sitemaps provide raw URL inventories, llms.txt is curated specifically for generative models to understand site purpose, prioritized documentation, and architectural context.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Where should the generated llms.txt file be hosted?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Place the file directly at the root of your domain web server: https://yourdomain.com/llms.txt and https://yourdomain.com/llms-full.txt. Ensure your server responds with Content-Type: text/plain; charset=utf-8.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this generator support Greek (Ελληνικά) and non-English scripts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. TwisterTools is built on full UTF-8 Unicode standards. Greek letters, diacritics, and polytonic characters are fully supported and rendered accurately in both visual previews and downloaded .txt files.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does llms.txt impact Generative Engine Optimization (GEO)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Generative Engine Optimization (GEO) improves the likelihood that AI search engines will cite and summarize your website accurately. Providing a clean llms.txt reduces hallucinations, highlights primary URLs, and helps models deliver accurate citations.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
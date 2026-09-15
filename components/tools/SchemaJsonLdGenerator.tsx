"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Code2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    FileCode,
    Plus,
    Trash2,
    Layers,
    Terminal,
    Search,
    Share2,
    ArrowRight,
    Tag,
    Globe,
    Calendar,
    User,
    Image,
    CheckSquare,
    ExternalLink,
    Maximize2
} from "lucide-react";

type SchemaType = "FAQPage" | "Article" | "Combined";

interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

interface ArticleData {
    articleType: "Article" | "NewsArticle" | "BlogPosting" | "TechArticle";
    headline: string;
    description: string;
    image: string;
    url: string;
    datePublished: string;
    dateModified: string;
    authorType: "Person" | "Organization";
    authorName: string;
    authorUrl: string;
    publisherName: string;
    publisherLogo: string;
    keywords: string;
}

export default function SchemaJsonLdGenerator() {
    const [schemaType, setSchemaType] = useState<SchemaType>("FAQPage");

    // FAQ State
    const [faqs, setFaqs] = useState<FaqItem[]>([
        {
            id: "faq-1",
            question: "What is Schema.org JSON-LD structured data?",
            answer: "JSON-LD (JavaScript Object Notation for Linked Data) is a lightweight Linked Data format that allows search engines like Google, Bing, and Yandex to parse machine-readable metadata about your webpage content directly."
        },
        {
            id: "faq-2",
            question: "How does FAQPage schema trigger Google Rich Results?",
            answer: "When properly formatted and validated with Google's Rich Results criteria, FAQPage markup allows expandable question accordion snippets to display directly underneath your organic Google search result snippet."
        }
    ]);

    // Article State
    const [articleData, setArticleData] = useState<ArticleData>({
        articleType: "Article",
        headline: "Mastering Rich Results: The Comprehensive Guide to Schema.org Markup",
        description: "Learn how to craft, validate, and inject valid JSON-LD structured data to maximize organic CTR and qualify for Google rich cards.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        url: "https://example.com/blog/mastering-rich-results-schema-guide",
        datePublished: "2026-03-15T09:00:00+00:00",
        dateModified: "2026-03-15T11:30:00+00:00",
        authorType: "Person",
        authorName: "Sarah Jenkins",
        authorUrl: "https://example.com/authors/sarah-jenkins",
        publisherName: "TwisterTools Digital Insights",
        publisherLogo: "https://example.com/assets/logo.png",
        keywords: "schema markup, json-ld, rich snippets, seo metadata"
    });

    const [copied, setCopied] = useState<boolean>(false);
    const [previewMode, setPreviewMode] = useState<"script" | "raw">("script");
    const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");

    // Dynamic IDs for WCAG accessibility
    const headlineId = useId();
    const descId = useId();
    const urlId = useId();
    const imgId = useId();
    const pubDateId = useId();
    const modDateId = useId();
    const authorTypeId = useId();
    const authorNameId = useId();
    const authorUrlId = useId();
    const pubNameId = useId();
    const pubLogoId = useId();
    const keywordsId = useId();
    const articleTypeId = useId();

    // FAQ Handlers
    const addFaq = () => {
        const newId = `faq-${Date.now()}`;
        setFaqs((prev) => [
            ...prev,
            { id: newId, question: "", answer: "" }
        ]);
    };

    const removeFaq = (id: string) => {
        if (faqs.length <= 1) return;
        setFaqs((prev) => prev.filter((item) => item.id !== id));
    };

    const updateFaq = (id: string, field: "question" | "answer", val: string) => {
        setFaqs((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
        );
    };

    // Article Handlers
    const updateArticle = (field: keyof ArticleData, val: string) => {
        setArticleData((prev) => ({ ...prev, [field]: val }));
    };

    // Construct Clean JSON-LD Object
    const generatedJsonLd = useMemo(() => {
        const buildFaqPart = () => ({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs
                .filter((f) => f.question.trim() !== "" || f.answer.trim() !== "")
                .map((f) => ({
                    "@type": "Question",
                    "name": f.question.trim(),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": f.answer.trim()
                    }
                }))
        });

        const buildArticlePart = () => {
            const art: Record<string, unknown> = {
                "@context": "https://schema.org",
                "@type": articleData.articleType,
                "headline": articleData.headline.trim(),
                "description": articleData.description.trim()
            };

            if (articleData.image.trim()) {
                art["image"] = [articleData.image.trim()];
            }

            if (articleData.url.trim()) {
                art["mainEntityOfPage"] = {
                    "@type": "WebPage",
                    "@id": articleData.url.trim()
                };
            }

            if (articleData.datePublished.trim()) {
                art["datePublished"] = articleData.datePublished.trim();
            }

            if (articleData.dateModified.trim()) {
                art["dateModified"] = articleData.dateModified.trim();
            }

            if (articleData.authorName.trim()) {
                const authorObj: Record<string, string> = {
                    "@type": articleData.authorType,
                    "name": articleData.authorName.trim()
                };
                if (articleData.authorUrl.trim()) {
                    authorObj["url"] = articleData.authorUrl.trim();
                }
                art["author"] = authorObj;
            }

            if (articleData.publisherName.trim()) {
                const pubObj: Record<string, unknown> = {
                    "@type": "Organization",
                    "name": articleData.publisherName.trim()
                };
                if (articleData.publisherLogo.trim()) {
                    pubObj["logo"] = {
                        "@type": "ImageObject",
                        "url": articleData.publisherLogo.trim()
                    };
                }
                art["publisher"] = pubObj;
            }

            if (articleData.keywords.trim()) {
                art["keywords"] = articleData.keywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean);
            }

            return art;
        };

        if (schemaType === "FAQPage") {
            return buildFaqPart();
        } else if (schemaType === "Article") {
            return buildArticlePart();
        } else {
            // Combined Graph
            const faq = buildFaqPart();
            const art = buildArticlePart();
            return {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        ...art,
                        "@context": undefined
                    },
                    {
                        ...faq,
                        "@context": undefined
                    }
                ]
            };
        }
    }, [schemaType, faqs, articleData]);

    const formattedJsonString = useMemo(() => {
        return JSON.stringify(generatedJsonLd, null, 2);
    }, [generatedJsonLd]);

    const snippetWithScriptTags = useMemo(() => {
        return `<script type="application/ld+json">\n${formattedJsonString}\n</script>`;
    }, [formattedJsonString]);

    const handleCopy = () => {
        const textToCopy = previewMode === "script" ? snippetWithScriptTags : formattedJsonString;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        if (schemaType === "FAQPage" || schemaType === "Combined") {
            setFaqs([
                {
                    id: "faq-1",
                    question: "What is Schema.org JSON-LD structured data?",
                    answer: "JSON-LD (JavaScript Object Notation for Linked Data) is a lightweight Linked Data format that allows search engines like Google, Bing, and Yandex to parse machine-readable metadata about your webpage content directly."
                }
            ]);
        }
        if (schemaType === "Article" || schemaType === "Combined") {
            setArticleData({
                articleType: "Article",
                headline: "Article Headline Goes Here",
                description: "Brief summary describing the article for search results.",
                image: "https://example.com/featured-image.jpg",
                url: "https://example.com/article-slug",
                datePublished: new Date().toISOString(),
                dateModified: new Date().toISOString(),
                authorType: "Person",
                authorName: "Author Name",
                authorUrl: "https://example.com/author",
                publisherName: "Publisher / Organization Name",
                publisherLogo: "https://example.com/logo.png",
                keywords: "seo, schema, structured data"
            });
        }
    };

    // Google Rich Results Test URL
    const googleTestUrl = "https://search.google.com/test/rich-results";
    const schemaValidatorUrl = "https://validator.schema.org/";

    // Built-in SEO Metadata Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Schema.org FAQPage & Article JSON-LD Microdata Builder",
        "url": "https://twistertools.com/tools/web-tools/schema-jsonld-generator",
        "description": "Generate valid, search-engine compliant Schema.org JSON-LD markup for FAQPage, Article, NewsArticle, and BlogPosting schemas with 1-click rich snippet generation.",
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
                "name": "Why is JSON-LD preferred over Microdata or RDFa for Schema.org markup?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Google officially recommends JSON-LD because it decouples structured data from HTML presentation elements. Unlike Microdata and RDFa which require injecting attributes throughout the DOM tree, JSON-LD is encapsulated within a self-contained <script type=\"application/ld+json\"> block, preventing rendering bugs and making maintenance seamless."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Article, NewsArticle, and BlogPosting schemas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While all three inherit from the base Article schema, NewsArticle is tailored for timely journalistic editorial reporting eligible for Google News and Top Stories carousels, BlogPosting is designed for weblogs and informal journals, and Article serves as the general specification for technical guides, evergreen whitepapers, and knowledge articles."
                }
            },
            {
                "@type": "Question",
                "name": "Can I combine both Article and FAQPage schema onto the same webpage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Google supports multiple structured data entities on a single page using a Schema.org @graph container or multiple independent JSON-LD script blocks. Combining Article and FAQPage schema allows your page to qualify simultaneously for author/publisher cards and question-and-answer expandable rich snippets."
                }
            },
            {
                "@type": "Question",
                "name": "Where should the generated JSON-LD script tag be placed in HTML?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The JSON-LD code block can be placed inside either the <head> or <body> section of your HTML document. Placing it inside the <head> is the industry standard practice as it ensures web crawlers parse structured data before streaming heavier visual assets."
                }
            },
            {
                "@type": "Question",
                "name": "How long does it take for Google to show FAQ and Article rich snippets?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Once deployed and indexed, search engines typically update rich snippets within a few days to several weeks, depending on your crawl frequency and domain authority. Keep in mind that implementing valid schema makes your page eligible for rich snippets, but Google algorithms dynamically decide whether to render them based on search intent and page quality."
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

            {/* 12-Column Responsive Workspace Grid (6/6 Balanced split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Schema Type Selection & Dynamic Form Builder (6 Cols) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Schema Configuration
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                    </div>

                    {/* Schema Type Selector */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Select Schema Entity Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setSchemaType("FAQPage")}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${schemaType === "FAQPage"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                    }`}
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>FAQPage</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSchemaType("Article")}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${schemaType === "Article"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                    }`}
                            >
                                <FileCode className="w-4 h-4" />
                                <span>Article / Blog</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSchemaType("Combined")}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${schemaType === "Combined"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                                    }`}
                            >
                                <Layers className="w-4 h-4" />
                                <span>Article + FAQ (@graph)</span>
                            </button>
                        </div>
                    </div>

                    {/* ARTICLE FORM FIELDS */}
                    {(schemaType === "Article" || schemaType === "Combined") && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <FileCode className="w-4 h-4" /> Article Attributes
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">Schema.org/Article</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor={articleTypeId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Subtype (@type)
                                    </label>
                                    <select
                                        id={articleTypeId}
                                        aria-label="Article subtype"
                                        value={articleData.articleType}
                                        onChange={(e) => updateArticle("articleType", e.target.value as ArticleData["articleType"])}
                                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="Article">Article (Standard)</option>
                                        <option value="BlogPosting">BlogPosting</option>
                                        <option value="NewsArticle">NewsArticle</option>
                                        <option value="TechArticle">TechArticle</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor={urlId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Canonical Page URL
                                    </label>
                                    <input
                                        id={urlId}
                                        type="url"
                                        value={articleData.url}
                                        onChange={(e) => updateArticle("url", e.target.value)}
                                        placeholder="https://example.com/post-slug"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor={headlineId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Headline / Title (110 chars max recommended)
                                </label>
                                <input
                                    id={headlineId}
                                    type="text"
                                    value={articleData.headline}
                                    onChange={(e) => updateArticle("headline", e.target.value)}
                                    placeholder="Enter captivating article title..."
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor={descId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Article Description / Abstract
                                </label>
                                <textarea
                                    id={descId}
                                    rows={2}
                                    value={articleData.description}
                                    onChange={(e) => updateArticle("description", e.target.value)}
                                    placeholder="Summary of the article for SERP snippets..."
                                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                                />
                            </div>

                            <div>
                                <label htmlFor={imgId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Featured Image URL (Min 1200x675px recommended)
                                </label>
                                <input
                                    id={imgId}
                                    type="url"
                                    value={articleData.image}
                                    onChange={(e) => updateArticle("image", e.target.value)}
                                    placeholder="https://example.com/images/hero.jpg"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor={pubDateId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Date Published (ISO 8601)
                                    </label>
                                    <input
                                        id={pubDateId}
                                        type="text"
                                        value={articleData.datePublished}
                                        onChange={(e) => updateArticle("datePublished", e.target.value)}
                                        placeholder="YYYY-MM-DDTHH:mm:ssZ"
                                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={modDateId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Date Modified (ISO 8601)
                                    </label>
                                    <input
                                        id={modDateId}
                                        type="text"
                                        value={articleData.dateModified}
                                        onChange={(e) => updateArticle("dateModified", e.target.value)}
                                        placeholder="YYYY-MM-DDTHH:mm:ssZ"
                                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Author & Publisher Subsection */}
                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                                    Author & Publisher Entities
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label htmlFor={authorTypeId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Author Type
                                        </label>
                                        <select
                                            id={authorTypeId}
                                            aria-label="Author entity type"
                                            value={articleData.authorType}
                                            onChange={(e) => updateArticle("authorType", e.target.value as ArticleData["authorType"])}
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                                        >
                                            <option value="Person">Person</option>
                                            <option value="Organization">Organization</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor={authorNameId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Author Full Name
                                        </label>
                                        <input
                                            id={authorNameId}
                                            type="text"
                                            value={articleData.authorName}
                                            onChange={(e) => updateArticle("authorName", e.target.value)}
                                            placeholder="e.g. John Doe"
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label htmlFor={pubNameId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Publisher Name
                                        </label>
                                        <input
                                            id={pubNameId}
                                            type="text"
                                            value={articleData.publisherName}
                                            onChange={(e) => updateArticle("publisherName", e.target.value)}
                                            placeholder="Company / Publication"
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={pubLogoId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                            Publisher Logo URL
                                        </label>
                                        <input
                                            id={pubLogoId}
                                            type="url"
                                            value={articleData.publisherLogo}
                                            onChange={(e) => updateArticle("publisherLogo", e.target.value)}
                                            placeholder="https://example.com/logo.png"
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor={keywordsId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Keywords (Comma Separated)
                                </label>
                                <input
                                    id={keywordsId}
                                    type="text"
                                    value={articleData.keywords}
                                    onChange={(e) => updateArticle("keywords", e.target.value)}
                                    placeholder="seo, rich snippets, json-ld schema"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* FAQPAGE BUILDER SECTION */}
                    {(schemaType === "FAQPage" || schemaType === "Combined") && (
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <HelpCircle className="w-4 h-4" /> FAQ Questions & Answers ({faqs.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={addFaq}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Question
                                </button>
                            </div>

                            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                                {faqs.map((faq, index) => (
                                    <div
                                        key={faq.id}
                                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5 relative group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                Question #{index + 1}
                                            </span>
                                            {faqs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFaq(faq.id)}
                                                    aria-label={`Remove question ${index + 1}`}
                                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            aria-label={`Question ${index + 1} text`}
                                            value={faq.question}
                                            onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                                            placeholder="What is your customer's common question?"
                                            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <textarea
                                            rows={3}
                                            aria-label={`Answer ${index + 1} text`}
                                            value={faq.answer}
                                            onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                                            placeholder="Provide a clear, accurate, and direct HTML-safe answer..."
                                            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output Code & SERP Visualizer (6 Cols) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    {/* Visualizer & Code Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        {/* Tab Switcher */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("builder")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === "builder"
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                        }`}
                                >
                                    <Code2 className="w-3.5 h-3.5" /> JSON-LD Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("preview")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === "preview"
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                        }`}
                                >
                                    <Eye className="w-3.5 h-3.5" /> SERP Simulation
                                </button>
                            </div>

                            {activeTab === "builder" && (
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode("script")}
                                        className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${previewMode === "script"
                                                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                                                : "text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        &lt;script&gt;
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode("raw")}
                                        className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${previewMode === "raw"
                                                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                                                : "text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        Raw JSON
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* View 1: JSON-LD Code Block */}
                        {activeTab === "builder" && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <pre className="p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[440px] leading-relaxed select-all">
                                        <code>{previewMode === "script" ? snippetWithScriptTags : formattedJsonString}</code>
                                    </pre>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ${copied
                                                ? "bg-emerald-600 text-white"
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            }`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Copied JSON-LD Code!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                <span>Copy {previewMode === "script" ? "Script Tag" : "JSON"}</span>
                                            </>
                                        )}
                                    </button>

                                    <a
                                        href={googleTestUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        <span>Test in Google Rich Results</span>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* View 2: Live Google SERP Snippet Visualizer */}
                        {activeTab === "preview" && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                                    {/* Google Breadcrumb */}
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                            G
                                        </div>
                                        <span className="truncate max-w-[200px]">
                                            {articleData.url || "https://example.com/page"}
                                        </span>
                                        <span className="text-slate-400">› blog</span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-base font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                                        {schemaType === "FAQPage"
                                            ? faqs[0]?.question || "Frequently Asked Questions"
                                            : articleData.headline || "Article Title Snippet"}
                                    </h3>

                                    {/* Snippet Description */}
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">
                                        <span className="text-slate-400 font-normal">
                                            {new Date(articleData.datePublished).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })} —
                                        </span>{" "}
                                        {schemaType === "FAQPage"
                                            ? faqs[0]?.answer || "Comprehensive answers to common questions."
                                            : articleData.description || "Article snippet meta description text..."}
                                    </p>

                                    {/* FAQ Accordion Previews */}
                                    {(schemaType === "FAQPage" || schemaType === "Combined") && faqs.length > 0 && (
                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider">
                                                Simulated Google FAQ Dropdowns:
                                            </span>
                                            {faqs.slice(0, 3).map((faq, i) => (
                                                <div
                                                    key={i}
                                                    className="py-1.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200"
                                                >
                                                    <span className="font-medium truncate pr-2">
                                                        {faq.question || `Question #${i + 1}`}
                                                    </span>
                                                    <span className="text-slate-400 text-[10px]">▼</span>
                                                </div>
                                            ))}
                                            {faqs.length > 3 && (
                                                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                                    +{faqs.length - 3} more questions
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                        Google rich snippets are not guaranteed. Validity qualifies your page for enhanced SERP features, but display frequency is subject to Google&apos;s automated quality filters.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                    Active Entity
                                </span>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    {schemaType}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                    Questions
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {schemaType === "Article" ? "N/A" : faqs.length}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                    Spec Standard
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    v15.0 Schema
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: What is JSON-LD & Why It Drives Search CTR */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Understanding Schema.org Structured Data: Boosting SERP Real Estate with JSON-LD
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Search engine crawlers index web pages by parsing raw HTML, but unstructured prose often obscures essential entity relationships. Schema.org vocabulary bridges this gap by providing an explicit machine-readable semantic dictionary. By encoding your content in JSON-LD (JavaScript Object Notation for Linked Data), search engines can extract key entities without ambiguity:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Increased Organic CTR
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Rich snippets expand your vertical footprint on Search Engine Results Pages (SERPs). Interactive FAQ accordions and rich article cards significantly improve click-through rates by up to 30% over standard plain text listings.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Clean DOM Decoupling
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Unlike legacy Microdata or RDFa that clutter your JSX markup with inline attributes (<code className="font-mono text-indigo-600 dark:text-indigo-400">itemscope</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">itemprop</code>), JSON-LD resides cleanly in a single script container without affecting styling or page load performance.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Voice Search Optimization
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Conversational AI assistants like Google Assistant, Siri, and Alexa use Schema structured Q&amp;A blocks as direct data sources to answer verbal user questions directly with high citation accuracy.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Next.js 15 & React Script Injection Pattern
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            To inject generated JSON-LD microdata safely in Next.js App Router without escaping issues, render it inside a script tag within your page layout or component:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// In your Next.js page.tsx or article component:
export default function BlogPost({ post }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.coverImage,
    "datePublished": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author.name
    }
  };

  return (
    <article>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Analysis of Structured Data Formats */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Format Comparison: JSON-LD vs. Microdata vs. RDFa
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Web developers have multiple formats available to express Schema.org vocabularies. Here is how modern JSON-LD compares directly against legacy alternatives:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Specification Format</th>
                                    <th className="p-3">Google Recommendation</th>
                                    <th className="p-3">Implementation Effort</th>
                                    <th className="p-3">Maintenance Risk</th>
                                    <th className="p-3">Framework Compatibility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">JSON-LD (Recommended)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Preferred Standard</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Low (Stand-alone block)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Zero DOM collision</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Universal (React, Next, Vue)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Microdata</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Supported (Legacy)</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">High (Tied to HTML tags)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">CSS changes break schema</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Cumbersome in component trees</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">RDFa</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Supported (Infrequent)</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">High (Complex syntax)</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Moderate nesting errors</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Poor component ergonomics</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices & Validation Guide */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Google Rich Snippet Guidelines: 5 Rules for Flawless Indexing
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        To protect users from misleading search listings, Google maintains strict editorial guidelines regarding structured markup. Ensure your implementation adheres to these parameters:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mandatory Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>100% Visual Parity:</strong> Every question and answer present in your FAQPage JSON-LD must be visibly accessible to human readers on the same page.
                                </li>
                                <li>
                                    • <strong>High-Resolution Images:</strong> Article schema requires image URLs with minimum dimensions of 1200 pixels wide for Google Discover and Carousel inclusion.
                                </li>
                                <li>
                                    • <strong>Explicit ISO 8601 Timestamps:</strong> Always provide both <code className="font-mono text-indigo-600 dark:text-indigo-400">datePublished</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">dateModified</code> with timezone offsets to ensure Google displays correct freshness indicators.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Violations That Trigger Penalties
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>User-Submitted Answers:</strong> Do NOT use FAQPage schema for community forum threads where users submit alternative answers; use <code className="font-mono text-indigo-600 dark:text-indigo-400">QAPage</code> schema instead.
                                </li>
                                <li>
                                    • <strong>Promotional Advertising:</strong> Never inject promotional slogans, affiliate spam, or deceptive sales text disguised as legitimate FAQ answers.
                                </li>
                                <li>
                                    • <strong>Missing Author Attribution:</strong> Article schema without clear author and publisher objects will trigger warnings in Google Search Console reports.
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
                                Why is JSON-LD preferred over Microdata or RDFa for Schema.org markup?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Google officially recommends JSON-LD because it decouples structured data from HTML presentation elements. Unlike Microdata and RDFa which require injecting attributes throughout the DOM tree, JSON-LD is encapsulated within a self-contained &lt;script type=&quot;application/ld+json&quot;&gt; block, preventing rendering bugs and making maintenance seamless.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between Article, NewsArticle, and BlogPosting schemas?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                While all three inherit from the base Article schema, NewsArticle is tailored for timely journalistic editorial reporting eligible for Google News and Top Stories carousels, BlogPosting is designed for weblogs and informal journals, and Article serves as the general specification for technical guides, evergreen whitepapers, and knowledge articles.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I combine both Article and FAQPage schema onto the same webpage?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Google supports multiple structured data entities on a single page using a Schema.org @graph container or multiple independent JSON-LD script blocks. Combining Article and FAQPage schema allows your page to qualify simultaneously for author/publisher cards and question-and-answer expandable rich snippets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Where should the generated JSON-LD script tag be placed in HTML?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The JSON-LD code block can be placed inside either the &lt;head&gt; or &lt;body&gt; section of your HTML document. Placing it inside the &lt;head&gt; is the industry standard practice as it ensures web crawlers parse structured data before streaming heavier visual assets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How long does it take for Google to show FAQ and Article rich snippets?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Once deployed and indexed, search engines typically update rich snippets within a few days to several weeks, depending on your crawl frequency and domain authority. Keep in mind that implementing valid schema makes your page eligible for rich snippets, but Google algorithms dynamically decide whether to render them based on search intent and page quality.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
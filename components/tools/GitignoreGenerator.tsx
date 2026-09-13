"use client";

import React, { useState, useMemo, useId } from "react";
import {
    FileCode,
    Copy,
    Check,
    Download,
    Trash2,
    Search,
    Layers,
    Terminal,
    Sparkles,
    Sliders,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Code2,
    RefreshCw,
    Plus,
    X,
    FolderGit2
} from "lucide-react";

type StackCategory = "frameworks" | "languages" | "environments" | "tools" | "os";

interface TechTemplate {
    id: string;
    name: string;
    category: StackCategory;
    description: string;
    rules: string[];
}

const PRESET_TEMPLATES: TechTemplate[] = [
    // Frameworks & Libraries
    {
        id: "nextjs",
        name: "Next.js",
        category: "frameworks",
        description: "App router, pages, build cache, and standalone outputs",
        rules: [
            "# Next.js build and cache",
            ".next/",
            "out/",
            "build/",
            "dist/",
            "next-env.d.ts.bak"
        ]
    },
    {
        id: "react",
        name: "React (Vite / CRA)",
        category: "frameworks",
        description: "Vite build outputs, CRA static bundles, and coverage reports",
        rules: [
            "# React build outputs",
            "dist/",
            "dist-ssr/",
            "build/",
            "coverage/"
        ]
    },
    {
        id: "vue",
        name: "Vue.js / Nuxt",
        category: "frameworks",
        description: "Nuxt generation directories, cache, and dist folders",
        rules: [
            "# Nuxt & Vue outputs",
            ".nuxt/",
            ".output/",
            "dist/",
            ".nitro/",
            ".cache/"
        ]
    },
    {
        id: "angular",
        name: "Angular",
        category: "frameworks",
        description: "Angular CLI build artifacts and compilation caches",
        rules: [
            "# Angular artifacts",
            ".angular/cache/",
            "dist/",
            "bazel-out/"
        ]
    },
    {
        id: "django",
        name: "Django",
        category: "frameworks",
        description: "SQLite databases, media uploads, and static collects",
        rules: [
            "# Django specific",
            "*.log",
            "*.pot",
            "db.sqlite3",
            "db.sqlite3-journal",
            "media/",
            "staticfiles/"
        ]
    },
    {
        id: "laravel",
        name: "Laravel",
        category: "frameworks",
        description: "Vendor packages, framework cache, and storage symlinks",
        rules: [
            "# Laravel storage & vendor",
            "/vendor/",
            "node_modules/",
            "public/storage",
            "public/hot",
            "storage/*.key",
            ".env.backup"
        ]
    },
    {
        id: "flutter",
        name: "Flutter",
        category: "frameworks",
        description: "Flutter build directories, ephemerals, and symbols",
        rules: [
            "# Flutter engine & builds",
            ".dart_tool/",
            ".flutter-plugins",
            ".flutter-plugins-dependencies",
            ".packages",
            "build/",
            "ios/.generated/"
        ]
    },

    // Languages & Runtimes
    {
        id: "nodejs",
        name: "Node.js / TypeScript",
        category: "languages",
        description: "node_modules, logs, runtime pids, and TS declaration maps",
        rules: [
            "# Node dependencies & logs",
            "node_modules/",
            "npm-debug.log*",
            "yarn-debug.log*",
            "yarn-error.log*",
            "pnpm-debug.log*",
            "lerna-debug.log*",
            ".pnpm-debug.log*",
            "*.tsbuildinfo"
        ]
    },
    {
        id: "python",
        name: "Python",
        category: "languages",
        description: "__pycache__, compiled bytecode, eggs, and wheel builds",
        rules: [
            "# Byte-compiled / optimized / DLL files",
            "__pycache__/",
            "*.py[cod]",
            "*$py.class",
            "*.so",
            ".Python",
            "build/",
            "develop-eggs/",
            "dist/",
            "downloads/",
            "eggs/",
            ".eggs/",
            "lib/",
            "lib64/",
            "parts/",
            "sdist/",
            "var/",
            "wheels/",
            "*.egg-info/",
            ".installed.cfg",
            "*.egg"
        ]
    },
    {
        id: "rust",
        name: "Rust (Cargo)",
        category: "languages",
        description: "Cargo target directories, incremental compilations, and lock backups",
        rules: [
            "# Rust target outputs",
            "/target/",
            "**/*.rs.bk",
            "Cargo.lock"
        ]
    },
    {
        id: "golang",
        name: "Go (Golang)",
        category: "languages",
        description: "Compiled binaries, test outputs, and vendor archives",
        rules: [
            "# Go compiled binaries",
            "bin/",
            "*.exe",
            "*.exe~",
            "*.dll",
            "*.so",
            "*.dylib",
            "*.test",
            "*.out",
            "vendor/"
        ]
    },
    {
        id: "java",
        name: "Java / Gradle / Maven",
        category: "languages",
        description: ".class files, JARs, build targets, and Gradle wrapper archives",
        rules: [
            "# Compiled class file",
            "*.class",
            "*.log",
            "*.jar",
            "*.war",
            "*.nar",
            "*.ear",
            "*.zip",
            "*.tar.gz",
            "*.rar",
            "target/",
            ".gradle/",
            "build/"
        ]
    },
    {
        id: "csharp",
        name: "C# / .NET",
        category: "languages",
        description: "bin/ and obj/ compilation artifacts, NuGet packages, user settings",
        rules: [
            "# .NET output and user cache",
            "[Bb]in/",
            "[Oo]bj/",
            "*.user",
            "*.userosv",
            "*.suo",
            "*.userprefs",
            "*.lock.json"
        ]
    },

    // Environments & Secrets
    {
        id: "env-secrets",
        name: ".env Secrets & Keys",
        category: "environments",
        description: "Local environments, secret certificates, SSH keys, credentials",
        rules: [
            "# Local Environment Variables & Secrets",
            ".env",
            ".env.local",
            ".env.development.local",
            ".env.test.local",
            ".env.production.local",
            "*.pem",
            "*.key",
            "*.crt",
            "id_rsa*",
            "credentials.json"
        ]
    },
    {
        id: "docker",
        name: "Docker & Compose",
        category: "environments",
        description: "Docker overrides, compose local configurations, and volume exports",
        rules: [
            "# Docker local overrides",
            "docker-compose.override.yml",
            ".dockerignore.bak"
        ]
    },
    {
        id: "terraform",
        name: "Terraform",
        category: "environments",
        description: "Terraform state files, lock files, and plugin directories",
        rules: [
            "# Terraform state and providers",
            ".terraform/",
            "*.tfstate",
            "*.tfstate.*",
            "crash.log",
            "override.tf",
            "override.tf.json",
            "*_override.tf",
            "*_override.tf.json"
        ]
    },

    // Developer Tools & IDEs
    {
        id: "vscode",
        name: "VS Code",
        category: "tools",
        description: ".vscode directory, workspace storage, and local history",
        rules: [
            "# Visual Studio Code",
            ".vscode/*",
            "!.vscode/settings.json",
            "!.vscode/tasks.json",
            "!.vscode/launch.json",
            "!.vscode/extensions.json",
            "*.code-workspace",
            ".history/"
        ]
    },
    {
        id: "jetbrains",
        name: "JetBrains (IntelliJ, WebStorm, PyCharm)",
        category: "tools",
        description: ".idea workspaces, dynamic project files, and user dictionaries",
        rules: [
            "# JetBrains IDEs",
            ".idea/",
            "*.iws",
            "*.iml",
            "out/"
        ]
    },

    // Operating Systems
    {
        id: "macos",
        name: "macOS",
        category: "os",
        description: ".DS_Store files, AppleDouble files, and Spotlight metadata",
        rules: [
            "# macOS system files",
            ".DS_Store",
            ".AppleDouble",
            ".LSOverride",
            "Icon\r\r",
            ".Spotlight-V100",
            ".Trashes"
        ]
    },
    {
        id: "windows",
        name: "Windows",
        category: "os",
        description: "Thumbs.db, desktop.ini, and Recycle Bin directory records",
        rules: [
            "# Windows desktop indexing",
            "Thumbs.db",
            "Thumbs.db:encryptable",
            "ehthumbs.db",
            "ehthumbs_vista.db",
            "Desktop.ini",
            "$RECYCLE.BIN/"
        ]
    },
    {
        id: "linux",
        name: "Linux",
        category: "os",
        description: "Temporary editor swap files, trash bins, and core crash dumps",
        rules: [
            "# Linux transient dumps",
            "*~",
            ".fuse_hidden*",
            ".directory",
            ".Trash-*"
        ]
    }
];

const PRESET_BUNDLES: { name: string; ids: string[] }[] = [
    {
        name: "Next.js Full-Stack Web",
        ids: ["nextjs", "nodejs", "env-secrets", "vscode", "macos", "windows"]
    },
    {
        name: "Modern Python API (FastAPI / Django)",
        ids: ["python", "django", "env-secrets", "docker", "vscode", "macos"]
    },
    {
        name: "Cross-Platform Rust Backend",
        ids: ["rust", "env-secrets", "docker", "vscode", "linux", "macos"]
    },
    {
        name: "Enterprise Go Microservice",
        ids: ["golang", "env-secrets", "docker", "terraform", "jetbrains"]
    }
];

export default function GitignoreGenerator() {
    const [selectedIds, setSelectedIds] = useState<string[]>([
        "nextjs",
        "nodejs",
        "env-secrets",
        "vscode",
        "macos"
    ]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activeTab, setActiveTab] = useState<StackCategory | "all">("all");
    const [customRules, setCustomRules] = useState<string>("# Custom project rules\n*.local.json\nbuild-artifacts/");
    const [copied, setCopied] = useState<boolean>(false);

    const searchInputId = useId();
    const customRulesId = useId();

    const toggleTemplate = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const applyBundle = (ids: string[]) => {
        setSelectedIds(ids);
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const filteredTemplates = useMemo(() => {
        return PRESET_TEMPLATES.filter((template) => {
            const matchesSearch =
                template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeTab === "all" || template.category === activeTab;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeTab]);

    const generatedGitignore = useMemo(() => {
        const header = [
            "# ========================================================================",
            "# .gitignore generated via TwisterTools (https://twistertools.com)",
            "# Tech Stack: " +
            (selectedIds.length > 0
                ? selectedIds
                    .map((id) => PRESET_TEMPLATES.find((t) => t.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")
                : "Custom Only"),
            "# Created on: " + new Date().toISOString().split("T")[0],
            "# ========================================================================\n"
        ].join("\n");

        const selectedBlocks = PRESET_TEMPLATES.filter((template) =>
            selectedIds.includes(template.id)
        ).map((template) => {
            return [
                `# ------------------------------------------------------------------------`,
                `# [${template.name}] - ${template.description}`,
                `# ------------------------------------------------------------------------`,
                ...template.rules,
                ""
            ].join("\n");
        });

        const customBlock = customRules.trim()
            ? [
                `# ------------------------------------------------------------------------`,
                `# [Custom Project Overrides]`,
                `# ------------------------------------------------------------------------`,
                customRules.trim(),
                ""
            ].join("\n")
            : "";

        return [header, ...selectedBlocks, customBlock].filter(Boolean).join("\n");
    }, [selectedIds, customRules]);

    const handleCopy = () => {
        if (!generatedGitignore) return;
        navigator.clipboard.writeText(generatedGitignore);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedGitignore) return;
        const blob = new Blob([generatedGitignore], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = ".gitignore";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const lineCount = useMemo(() => {
        return generatedGitignore ? generatedGitignore.split("\n").length : 0;
    }, [generatedGitignore]);

    const ruleCount = useMemo(() => {
        if (!generatedGitignore) return 0;
        return generatedGitignore
            .split("\n")
            .filter((l) => l.trim() !== "" && !l.trim().startsWith("#")).length;
    }, [generatedGitignore]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Git .gitignore Template Generator by Tech Stack",
        "url": "https://twistertools.com/tools/developer-tools/gitignore-generator",
        "description": "Compose enterprise-ready, multi-stack .gitignore files instantly. Merge Node, Next.js, Python, Docker, macOS, and IDE ignore rules into a unified config file.",
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
                "name": "Why is a properly configured .gitignore crucial for software repositories?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A comprehensive .gitignore prevents bloated binary builds (like node_modules and target/ folders) from cluttering Git history, saves storage bandwidth, prevents merge conflicts on machine-specific IDE metadata, and critically protects against accidental commits of .env files holding API keys and production credentials."
                }
            },
            {
                "@type": "Question",
                "name": "Why does Git continue tracking files even after adding them to .gitignore?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Git only ignores untracked files. If a file was already committed prior to adding its pattern to .gitignore, Git tracks changes continuously. To resolve this, remove it from cache without deleting your local copy by running: git rm --cached <file-path> followed by a commit."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between global and repository-specific .gitignore files?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A repository .gitignore lives in the project root and is shared across all collaborators via version control to ensure standardized project builds. A global .gitignore is configured on your local operating system (via git config --global core.excludesfile) to discard personal OS artifacts (.DS_Store, Thumbs.db) and editor preferences across all local repositories."
                }
            },
            {
                "@type": "Question",
                "name": "How do negation rules (!) work in Git ignore syntax?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An exclamation point prefix negates a pattern. For instance, putting .vscode/* ignores all files inside the .vscode directory, but adding !.vscode/settings.json creates an explicit exception, ensuring your team's common linter and formatter configuration remains versioned."
                }
            },
            {
                "@type": "Question",
                "name": "Can I merge multiple technology stacks into a single .gitignore file?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Modern full-stack repositories (such as monorepos combining Next.js frontends, Python microservices, and Docker configurations) routinely merge ignore blocks. This generator synthesizes diverse framework, runtime, OS, and IDE blocks into a single consolidated, conflict-free configuration."
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

            {/* 12-Column Responsive Workspace Grid (6/6 Balanced) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Tech Stack Selectors & Presets */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Select Technology Stacks
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {selectedIds.length} Selected
                            </span>
                            {selectedIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stack Bundles */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Quick-Start Preset Bundles:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PRESET_BUNDLES.map((bundle) => (
                                <button
                                    key={bundle.name}
                                    type="button"
                                    onClick={() => applyBundle(bundle.ids)}
                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition cursor-pointer group flex items-center justify-between"
                                >
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                        {bundle.name}
                                    </span>
                                    <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search & Category Filter Bar */}
                    <div className="space-y-3 pt-1">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                id={searchInputId}
                                type="text"
                                aria-label="Search tech stack templates"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter languages, frameworks, or operating systems..."
                                className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                            {(["all", "frameworks", "languages", "environments", "tools", "os"] as const).map(
                                (cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setActiveTab(cat)}
                                        className={`px-2.5 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition cursor-pointer ${activeTab === cat
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        {cat === "os" ? "Operating Systems" : cat}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Stack Selection Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1 p-1">
                        {filteredTemplates.map((template) => {
                            const isSelected = selectedIds.includes(template.id);
                            return (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => toggleTemplate(template.id)}
                                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${isSelected
                                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-600 text-indigo-950 dark:text-indigo-200"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold">{template.name}</span>
                                        <div
                                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${isSelected
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                        {template.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Rules Appender */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label
                            htmlFor={customRulesId}
                            className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between"
                        >
                            <span>Append Custom Patterns:</span>
                            <span className="text-[11px] font-normal text-slate-600 dark:text-slate-300 lowercase">
                                (glob syntax supported)
                            </span>
                        </label>
                        <textarea
                            id={customRulesId}
                            rows={3}
                            aria-label="Custom .gitignore patterns input"
                            value={customRules}
                            onChange={(e) => setCustomRules(e.target.value)}
                            placeholder="Add your own custom rules, e.g.:&#10;*.private.json&#10;local-exports/"
                            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition"
                        />
                    </div>
                </div>

                {/* Right Panel: Live Synthesized Output & File Controls */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Synthesized .gitignore
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {ruleCount} Rules Active
                                </span>
                            </div>
                        </div>

                        {/* Code Display Area */}
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
                            <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 text-[11px] text-slate-400 font-mono">
                                <span className="flex items-center gap-1.5 text-slate-300">
                                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" /> .gitignore
                                </span>
                                <span>UTF-8 • UNIX EOL</span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-indigo-100/95 overflow-x-auto max-h-[420px] min-h-[300px] leading-relaxed whitespace-pre select-text">
                                {generatedGitignore}
                            </pre>
                        </div>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Total Lines
                                </span>
                                <p className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {lineCount}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Filtered Rules
                                </span>
                                <p className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {ruleCount}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Modules
                                </span>
                                <p className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {selectedIds.length}
                                </p>
                            </div>
                        </div>

                        {/* Primary File Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-white" />
                                        <span>Copied to Clipboard!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-white" />
                                        <span>Copy .gitignore</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDownload}
                                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700"
                            >
                                <Download className="w-4 h-4 text-indigo-400" />
                                <span>Download .gitignore File</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE TECHNICAL PROSE & GUIDES */}
            <div className="space-y-6">
                {/* Card 1: Core Mechanics of Gitignore & Glob Syntax */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Mastering Git Pattern Matching: Glob Syntax & Priority Rules
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        A <code className="font-mono text-indigo-600 dark:text-indigo-400">.gitignore</code> file informs Git which untracked files should be ignored by default. Git evaluates ignore patterns using shell globbing rules sequentially from top to bottom, with child directory specifications overriding parent rules.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 font-mono">
                                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Asterisk (*) Wildcard
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Matches zero or more characters inside a filename without traversing directory delimiters. For example, <code className="font-mono text-indigo-600 dark:text-indigo-400">*.log</code> ignores all log files in the current folder.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 font-mono">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Double Asterisk (**)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Traverses across nested subdirectories. Specifying <code className="font-mono text-indigo-600 dark:text-indigo-400">**/build/**</code> matches any build folder regardless of nesting depth across your monorepo.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 font-mono">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Negation Prefix (!)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Re-includes a previously ignored file. If you ignore <code className="font-mono text-indigo-600 dark:text-indigo-400">*.env*</code>, you can add <code className="font-mono text-indigo-600 dark:text-indigo-400">!.env.example</code> to commit the sanitized template.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Untracking Already Committed Files (The Clean Slate Command)
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Adding a path to <code className="font-mono text-indigo-300">.gitignore</code> does not delete or untrack files that have already been indexed in Git history. To untrack existing committed artifacts without deleting your physical local copies, run the following sequence in your terminal:
                        </p>
                        <div className="bg-slate-950 p-3.5 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800 space-y-1">
                            <div><span className="text-slate-500"># 1. Clear cached indexed tracking records</span></div>
                            <div>git rm -r --cached .</div>
                            <div><span className="text-slate-500"># 2. Re-index according to the new .gitignore rules</span></div>
                            <div>git add .</div>
                            <div><span className="text-slate-500"># 3. Commit clean state without unwanted build artifacts</span></div>
                            <div>git commit -m &quot;chore: cleanup tracked files respecting .gitignore&quot;</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Repository vs. Global vs. Local Exclude: Where Should Patterns Live?
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Git provides three distinct tiers for excluding files. Understanding where to place rules prevents repository pollution and team friction:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Configuration Layer</th>
                                    <th className="p-3">File Location</th>
                                    <th className="p-3">Shared With Team?</th>
                                    <th className="p-3">Primary Use Case</th>
                                    <th className="p-3">Priority Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Project .gitignore</td>
                                    <td className="p-3 font-mono text-xs">/repo-root/.gitignore</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes (Committed)</td>
                                    <td className="p-3">Dependencies (node_modules), build outputs, static bundles</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">Standard</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Local Excludes</td>
                                    <td className="p-3 font-mono text-xs">.git/info/exclude</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">No (Local machine only)</td>
                                    <td className="p-3">Temporary test scripts, local mock databases, developer scratchpads</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">Overrides project</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Global Git Excludes</td>
                                    <td className="p-3 font-mono text-xs">~/.gitignore_global</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">No (User home dir)</td>
                                    <td className="p-3">OS trash (.DS_Store, Thumbs.db), personal editor configurations</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Base Fallback</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Security Best Practices for Secret Management */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Security Hardening: Protecting Secrets and Credentials in Version Control
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Accidental credential leakage via Git commits remains one of the leading attack vectors for enterprise infrastructure compromises. Follow these enterprise engineering protocols:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mandatory Ignore Conventions
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                <li>
                                    • <strong>Always wildcard environment variants:</strong> Instead of just ignoring <code className="font-mono text-indigo-600 dark:text-indigo-400">.env</code>, ignore <code className="font-mono text-indigo-600 dark:text-indigo-400">.env*.local</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">*.pem</code>, and <code className="font-mono text-indigo-600 dark:text-indigo-400">*.key</code>.
                                </li>
                                <li>
                                    • <strong>Provide an explicitly committed sample:</strong> Maintain a clean <code className="font-mono text-indigo-600 dark:text-indigo-400">.env.example</code> with dummy keys so teammates know which configuration variables are required.
                                </li>
                                <li>
                                    • <strong>Adopt Pre-Commit Secret Scanning:</strong> Combine your <code className="font-mono text-indigo-600 dark:text-indigo-400">.gitignore</code> with automated hooks like GitGuardian or Gitleaks to block commits containing private keys.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Mistakes to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                <li>
                                    • <strong>Committing credentials and &quot;fixing&quot; it later:</strong> Simply removing a secret file in a future commit leaves it completely exposed in Git commit history.
                                </li>
                                <li>
                                    • <strong>Ignoring parent directories carelessly:</strong> Writing <code className="font-mono text-indigo-600 dark:text-indigo-400">build/</code> can unintentionally ignore valid static documentation folders located inside non-root packages.
                                </li>
                                <li>
                                    • <strong>Forgetting trailing directory slashes:</strong> A rule like <code className="font-mono text-indigo-600 dark:text-indigo-400">temp</code> matches both a file named &quot;temp&quot; and a directory named &quot;temp&quot;. Always append <code className="font-mono text-indigo-600 dark:text-indigo-400">temp/</code> if targeting folders exclusively.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Static FAQ Section */}
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
                                Why is a properly configured .gitignore crucial for software repositories?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A comprehensive .gitignore prevents bloated binary builds (like node_modules and target/ folders) from cluttering Git history, saves storage bandwidth, prevents merge conflicts on machine-specific IDE metadata, and critically protects against accidental commits of .env files holding API keys and production credentials.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does Git continue tracking files even after adding them to .gitignore?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Git only ignores untracked files. If a file was already committed prior to adding its pattern to .gitignore, Git tracks changes continuously. To resolve this, remove it from cache without deleting your local copy by running: <code className="font-mono text-indigo-600 dark:text-indigo-400">git rm --cached &lt;file-path&gt;</code> followed by a commit.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between global and repository-specific .gitignore files?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A repository .gitignore lives in the project root and is shared across all collaborators via version control to ensure standardized project builds. A global .gitignore is configured on your local operating system (via git config --global core.excludesfile) to discard personal OS artifacts (.DS_Store, Thumbs.db) and editor preferences across all local repositories.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do negation rules (!) work in Git ignore syntax?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                An exclamation point prefix negates a pattern. For instance, putting <code className="font-mono text-indigo-600 dark:text-indigo-400">.vscode/*</code> ignores all files inside the .vscode directory, but adding <code className="font-mono text-indigo-600 dark:text-indigo-400">!.vscode/settings.json</code> creates an explicit exception, ensuring your team&apos;s common linter and formatter configuration remains versioned.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I merge multiple technology stacks into a single .gitignore file?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Modern full-stack repositories (such as monorepos combining Next.js frontends, Python microservices, and Docker configurations) routinely merge ignore blocks. This generator synthesizes diverse framework, runtime, OS, and IDE blocks into a single consolidated, conflict-free configuration.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
    Info,
    ChevronRight,
    Zap,
    ShieldCheck,
    Cpu,
    Sparkles,
    Code2,
    Globe2,
    ArrowRight,
    Layers,
    CheckCircle2,
    Terminal,
    FileCheck2
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'About Us & Architecture Philosophy',
    description: 'Discover TwisterTools 2.0: an ultra-fast, privacy-first web utility suite built with Next.js 15, client-side execution, and zero-retention ephemeral processing.',
    alternates: {
        canonical: 'https://www.twistertools.com/about',
    },
    openGraph: {
        title: 'About Us & Architecture Philosophy | TwisterTools',
        description: 'Discover TwisterTools 2.0: an ultra-fast, privacy-first web utility suite built with Next.js 15, client-side execution, and zero-retention ephemeral processing.',
        type: 'website',
        url: 'https://www.twistertools.com/about',
        siteName: 'TwisterTools',
        images: [
            {
                url: 'https://www.twistertools.com/images/about.jpg',
                width: 1200,
                height: 630,
                alt: 'About TwisterTools 2.0',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About Us & Architecture Philosophy | TwisterTools',
        description: 'Discover TwisterTools 2.0: an ultra-fast, privacy-first web utility suite built with Next.js 15, client-side execution, and zero-retention ephemeral processing.',
    },
};

export default function AboutPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About TwisterTools',
        url: 'https://www.twistertools.com/about',
        description: 'Overview of TwisterTools mission, client-first engineering philosophy, zero-retention architecture, and platform metrics.',
        publisher: {
            '@type': 'Organization',
            name: 'TwisterTools',
            url: 'https://www.twistertools.com',
            logo: 'https://www.twistertools.com/logo.png',
        },
        mainEntity: {
            '@type': 'Organization',
            name: 'TwisterTools',
            url: 'https://www.twistertools.com',
            knowsAbout: [
                'Developer, Code & Web Engineering Tools',
                'Data Serialization',
                'Cryptography & Hashing',
                'SEO, Domain & Network Inspector Tools',
                'Daily Essentials, Financial & Math Calculators',
                'Image Editing, Compression & Conversion Tools',
                'PDF & Document Utilities'
            ]
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header: Edge-to-Edge Slate-to-Indigo Title Bar */}
            <header className="relative overflow-hidden bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-indigo-700/50 shadow-md">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src="/images/og-hero.jpg"
                        alt="TwisterTools Background Visual"
                        fill
                        priority
                        className="object-cover object-center opacity-50 mix-blend-luminosity"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
                </div>
                <div className="relative z-10 max-w-5xl mx-auto">
                    <nav className="flex items-center space-x-2 text-xs sm:text-sm text-indigo-100 mb-4 font-medium">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white font-semibold">About Us</span>
                    </nav>
                    <div className="flex items-start space-x-4">
                        <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                            <Info className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">About TwisterTools</h1>
                            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-2xl leading-relaxed">
                                Engineered for extreme speed, complete data isolation, and frictionless workflows.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Workspace Container */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">

                {/* Core Mission */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Our Core Mission</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools 2.0 was created to solve a persistent web problem: bloatware utility platforms filled with invasive ads, artificial wait timers, required signups, and hidden server tracking that compromises sensitive user data.
                        </p>
                        <p>
                            Our philosophy is simple: <strong>deliver instant, high-performance web tools that respect user privacy above all else</strong>. Whether you are validating JSON structures, computing SHA-256 hashes, converting images, or compiling complex PDF documents, TwisterTools executes operations securely and transparently.
                        </p>
                    </div>
                </section>

                {/* 3 Core Platform Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Zero Latency Execution</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            For all interactive client tools, server round-trips are eliminated—processing executes instantly on your device CPU.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Ephemeral Storage</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Interactive utilities run 100% in RAM. For server-assisted PDF jobs, files are encrypted in transit and purged immediately after task completion.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Zero-Lock In & Free</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            No subscription tiers, paywalls, or mandatory accounts needed. Access all utilities freely across any modern desktop or mobile browser.
                        </p>
                    </div>
                </div>

                {/* Technical Architecture Deep Dive */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Architectural Philosophy</h2>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            Traditional online converters route every piece of user data to cloud servers, queue processing, and force users to wait for a download link. This introduces latency, consumes bandwidth, and exposes sensitive files to security risks.
                        </p>
                        <p>
                            TwisterTools 2.0 uses a modern hybrid model: browser-native utilities leverage HTML5 FileReader, Canvas APIs, WebAssembly, and native TypeScript compilation to process data locally inside your browser runtime. For heavy server-assisted operations (such as multi-page PDF rendering), documents are transferred over TLS-encrypted pipelines and automatically deleted from volatile memory immediately after processing.
                        </p>
                    </div>

                    {/* Architecture Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-4 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Browser-Native Utilities
                            </h3>
                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                JSON, CSV, XML, image tools, and formatters parse datasets directly in your browser RAM without network overhead.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-4 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Zero-Retention Server Workflows
                            </h3>
                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Heavy PDF document jobs execute over secure SSL channels. Source documents are auto-deleted immediately upon task execution.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tech Stack Tech Details */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Our Engineering Stack</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                            <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Next.js 15</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">App Router</div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                            <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
                            <div className="font-bold text-slate-900 dark:text-white text-sm">TypeScript</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Strict Typing</div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Tailwind CSS</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Design System</div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center space-y-1">
                            <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Lucide Icons</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Clean Vectors</div>
                        </div>
                    </div>
                </section>

                {/* Platform Impact Stats */}
                <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
                    <div className="flex items-center space-x-3 mb-6">
                        <Globe2 className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-bold">Platform Impact & Scale</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                        <div className="space-y-1">
                            <div className="text-3xl font-extrabold text-indigo-400">Client-First</div>
                            <div className="text-xs text-slate-400">Privacy Architecture</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl font-extrabold text-indigo-400">Auto-Purge</div>
                            <div className="text-xs text-slate-400">Ephemeral Storage</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl font-extrabold text-indigo-400">60+</div>
                            <div className="text-xs text-slate-400">Active Live Utilities</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl font-extrabold text-indigo-400">9</div>
                            <div className="text-xs text-slate-400">Core Categories</div>
                        </div>
                    </div>
                </section>

                {/* Call To Action */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white text-center space-y-4 shadow-lg">
                    <h2 className="text-2xl font-bold">Ready to streamline your daily workflow?</h2>
                    <p className="text-indigo-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Explore our master tools catalog and experience real-time, browser-native file converters, data formatters, and calculators today.
                    </p>
                    <div>
                        <Link
                            href="/tools"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <span>Explore Master Tools Directory</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}
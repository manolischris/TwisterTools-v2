import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
    FileText,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    Cpu,
    Copyright,
    Zap,
    RefreshCw,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service | TwisterTools',
    description: 'Read the terms, acceptable use guidelines, client-side liability disclaimers, and service policies for utilizing TwisterTools utilities.',
    alternates: {
        canonical: 'https://www.twistertools.com/terms-of-service',
    },
    openGraph: {
        title: 'Terms of Service | TwisterTools',
        description: 'Read the terms, acceptable use guidelines, client-side liability disclaimers, and service policies for utilizing TwisterTools utilities.',
        type: 'website',
        url: 'https://www.twistertools.com/terms-of-service',
        siteName: 'TwisterTools',
        images: [
            {
                url: 'https://www.twistertools.com/images/og-default.jpg',
                width: 1200,
                height: 630,
                alt: 'TwisterTools Terms of Service',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Terms of Service | TwisterTools',
        description: 'Read the terms, acceptable use guidelines, client-side liability disclaimers, and service policies for utilizing TwisterTools utilities.',
    },
};

export default function TermsOfServicePage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Terms of Service',
        url: 'https://www.twistertools.com/terms-of-service',
        description: 'Terms of Service outlining terms of access, user obligations, and intellectual property conditions for TwisterTools.',
        publisher: {
            '@type': 'Organization',
            name: 'TwisterTools',
            url: 'https://www.twistertools.com',
            email: 'twistertoolscom@gmail.com'
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Header */}
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
                        <span className="text-white font-semibold">Terms of Service</span>
                    </nav>
                    <div className="flex items-start space-x-4">
                        <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
                            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-2xl leading-relaxed">
                                Last Updated: July 2026 | Platform Terms, Acceptable Use & Operational Policies
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">

                {/* Section 1: Acceptance */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            By accessing, browsing, or utilizing any tool, calculator, converter, or page on twistertools.com (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should immediately discontinue using the site.
                        </p>
                    </div>
                </section>

                {/* Section 2: Acceptable Use */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Acceptable Use Guidelines</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools provides free developer, designer, data, and daily productivity utilities. When utilizing our utilities, you agree not to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li>Attempt to scrape, reverse-engineer, or automatically harvest backend routes outside of normal Web UI browser interactions.</li>
                            <li>Utilize tools to encode, generate, or transmit malicious code, malware, exploits, or illegal content.</li>
                            <li>Attempt to bypass bandwidth limits or technical safeguards put in place to ensure platform availability for all users.</li>
                            <li>Incorporate our public endpoints into automated bot networks or DDoS vectors.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 3: Execution Models & Disclaimers */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Tool Execution & Disclaimer of Warranties</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            Our platform utilizes a hybrid execution model. Browser-native utilities execute directly on your local device CPU, while heavy document tools (like PDF operations) process files on ephemeral servers with immediate automatic deletion.
                        </p>
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 text-sm space-y-2">
                            <div className="flex items-center space-x-2 font-semibold text-amber-800 dark:text-amber-300">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                <span>Warranty Disclaimer</span>
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                                The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, express or implied. TwisterTools does not guarantee that mathematical calculations, data conversions, or file transformations will be error-free or uninterrupted. TwisterTools is not liable for data loss or operational issues resulting from tool usage.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Intellectual Property */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Copyright className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Intellectual Property Rights</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            All branding, custom codebases, design architecture, and logos associated with TwisterTools are the intellectual property of TwisterTools.
                        </p>
                        <p>
                            <strong>Your Ownership:</strong> TwisterTools claims zero ownership or copyright over the input text, code snippets, graphics, or files you process using our utilities. All converted or generated outputs belong entirely to you.
                        </p>
                    </div>
                </section>

                {/* Section 5: Advertising & Affiliate Disclosure */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <ExternalLink className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Advertisements & Affiliate Links</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            To keep our tools freely accessible, TwisterTools displays third-party advertisements (such as Google AdSense) and may include affiliate referral links.
                        </p>
                        <p className="text-xs md:text-sm">
                            Interacting with third-party advertisements or clicking affiliate links redirects you to external web services governed by their own privacy policies and terms. TwisterTools does not endorse or guarantee third-party products, and clicking affiliate links incurs no extra cost to you.
                        </p>
                    </div>
                </section>

                {/* Section 6: Modifications */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Service Modifications</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools reserves the right to modify, adjust, update, or temporarily pause any tool, feature, or route at any time to maintain system security or performance without prior notice.
                        </p>
                    </div>
                </section>

                {/* Section 7: Updates */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Terms Amendments</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            We reserve the right to revise these Terms of Service periodically. Continued usage of TwisterTools following published updates signifies your agreement to the modified terms.
                        </p>
                    </div>
                </section>

            </main>
        </div>
    );
}
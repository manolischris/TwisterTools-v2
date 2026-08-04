import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
    ShieldCheck,
    ChevronRight,
    HardDrive,
    Lock,
    Eye,
    Cookie,
    Users,
    Bell,
    Mail,
    Database,
    Cpu,
    CheckCircle2
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | TwisterTools',
    description: 'Learn how TwisterTools protects your privacy through 100% local client-side execution, zero-retention server processing, and transparent data handling practices across all 117+ tools.',
    alternates: {
        canonical: 'https://www.twistertools.com/privacy-policy',
    },
    openGraph: {
        title: 'Privacy Policy | TwisterTools',
        description: 'Learn how TwisterTools protects your privacy through 100% local client-side execution, zero-retention server processing, and transparent data handling practices.',
        type: 'website',
        url: 'https://www.twistertools.com/privacy-policy',
        siteName: 'TwisterTools',
        images: [
            {
                url: 'https://www.twistertools.com/images/og-default.jpg',
                width: 1200,
                height: 630,
                alt: 'TwisterTools Privacy Policy',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Privacy Policy | TwisterTools',
        description: 'Learn how TwisterTools protects your privacy through 100% local client-side execution, zero-retention server processing, and transparent data handling practices.',
    },
};

export default function PrivacyPolicyPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Privacy Policy',
        url: 'https://www.twistertools.com/privacy-policy',
        description: 'Privacy Policy detailing TwisterTools local client-side execution architecture, zero-retention data isolation, and GDPR Consent Mode v2 transparency.',
        publisher: {
            '@type': 'Organization',
            name: 'TwisterTools',
            url: 'https://www.twistertools.com',
            email: 'contact@twistertools.com'
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
                        <span className="text-white font-semibold">Privacy Policy</span>
                    </nav>
                    <div className="flex items-start space-x-4">
                        <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
                            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-2xl leading-relaxed">
                                Last Updated: August 2026 | Transparent Client-Side Data Security & Privacy
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">

                {/* Executive Summary Banner */}
                <section className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-200 space-y-3 shadow-sm">
                    <h2 className="text-lg font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Executive Summary: Privacy-First Client Execution Architecture
                    </h2>
                    <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
                        At TwisterTools, we prioritize data isolation and complete user privacy. All interactive utilities across our platform—including financial calculators, health estimators, code formatters, image converters, and PDF tools—execute <strong>100% locally inside your web browser</strong> using client-side JavaScript, WebAssembly, and modern browser APIs. Your files, calculations, financial parameters, and code strings are processed in local device memory (RAM) and are <strong>never stored, logged, or transmitted to external servers or databases</strong>.
                    </p>
                </section>

                {/* Section 1: Data Processing Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Local Client-Side Execution Architecture</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools is built from the ground up to eliminate unnecessary server-side data processing:
                        </p>
                        <div className="space-y-3">
                            <div className="border-l-4 border-indigo-500 pl-4 py-2 space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-r-xl">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Browser-Local Execution
                                </h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Our interactive calculators, code formatters, JSON/CSV converters, text transformers, image tools, and document processors compute results entirely inside your browser's V8 or SpiderMonkey JavaScript virtual machines. Inputs never leave your local device.
                                </p>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4 py-2 space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-r-xl">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Zero File & Input Data Retention
                                </h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    We do not operate backend file-ingestion servers or database tables for tool execution. Files modified or generated on twistertools.com remain strictly within your browser's local memory and are immediately cleared when you close or refresh the page.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Local Storage */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Database className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Browser Local Storage & Settings</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools uses client-side web storage APIs (<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-indigo-600 dark:text-indigo-400 font-mono">localStorage</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-indigo-600 dark:text-indigo-400 font-mono">sessionStorage</code>) exclusively to store user interface preferences locally on your device:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li><strong>UI & Workspace State:</strong> Preserving settings like dark mode toggles, unit preferences (Metric vs. Imperial), or currency selections.</li>
                            <li><strong>Calculation History Logs:</strong> Storing recent calculator outputs locally in your browser memory so you can easily reference or copy prior results.</li>
                        </ul>
                        <p className="text-xs md:text-sm">
                            This data remains 100% on your personal hardware and can be cleared at any time directly through your web browser settings.
                        </p>
                    </div>
                </section>

                {/* Section 3: Analytics, AdSense & GDPR Consent Mode v2 */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Cookie className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Analytics, Advertising & Consent Mode v2</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            To keep our web tools free and maintain service quality, TwisterTools integrates reputable analytics and advertising providers (including Google Tag Manager, Google Analytics, and Google AdSense) operating under strict **GDPR Consent Mode v2** standards:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li><strong>Pre-Hydration Default Consent:</strong> All tracking parameters (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">ad_storage</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">analytics_storage</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">ad_user_data</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">ad_personalization</code>) are set to 'denied' by default prior to user interaction.</li>
                            <li><strong>Aggregated Telemetry:</strong> We measure aggregated, non-identifiable technical metrics (such as page request volume, error rates, and load speed) to improve site performance and accessibility.</li>
                            <li><strong>Customizing Preferences:</strong> You can manage or revoke cookie choices at any time through our interactive consent banner or by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Google Ad Settings</a>.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4: Hosting Infrastructure */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Eye className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Hosting Infrastructure & CDN Edge Logs</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools uses modern global Content Delivery Networks (CDNs) and cloud hosting platforms to serve static web assets rapidly worldwide. Standard, transient server edge logs (such as IP addresses, User-Agent headers, and request timestamps) are processed automatically strictly for DDoS protection, network routing, and security threat prevention.
                        </p>
                    </div>
                </section>

                {/* Section 5: Rights */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Privacy Rights (GDPR & CCPA/CPRA)</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            Depending on your legal jurisdiction, you maintain specific rights regarding personal privacy and browser data control:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li><strong>Right to Control Consent:</strong> Grant or revoke tracking choices via our consent manager banner.</li>
                            <li><strong>Data Erasure:</strong> Clear local storage data and cached browser files directly through your client settings.</li>
                            <li><strong>Inquiries:</strong> Submit any privacy queries or compliance questions via our contact support desk.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 6: Policy Changes */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Policy Updates</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            We may update this Privacy Policy periodically to reflect platform expansions, regulatory revisions, or new browser feature integrations. Any adjustments will be published directly on this page with an updated modification timestamp.
                        </p>
                    </div>
                </section>

                {/* Section 7: Contact */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Contact Information</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            For questions, feedback, or privacy queries regarding TwisterTools, feel free to reach out directly:
                        </p>
                        <div className="pt-2 flex flex-wrap gap-4 items-center">
                            <a
                                href="mailto:contact@twistertools.com"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                            >
                                <Mail className="w-4 h-4" />
                                <span>contact@twistertools.com</span>
                            </a>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                                <span>Visit Contact Desk</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
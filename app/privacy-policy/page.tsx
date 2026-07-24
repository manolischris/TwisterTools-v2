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
    FileCheck2
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | TwisterTools',
    description: 'Learn how TwisterTools protects your privacy through local client-side execution, zero-retention server processing, and transparent data handling practices.',
    alternates: {
        canonical: 'https://www.twistertools.com/privacy-policy',
    },
    openGraph: {
        title: 'Privacy Policy | TwisterTools',
        description: 'Learn how TwisterTools protects your privacy through local client-side execution, zero-retention server processing, and transparent data handling practices.',
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
        description: 'Learn how TwisterTools protects your privacy through local client-side execution, zero-retention server processing, and transparent data handling practices.',
    },
};

export default function PrivacyPolicyPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Privacy Policy',
        url: 'https://www.twistertools.com/privacy-policy',
        description: 'Privacy Policy detailing TwisterTools local client execution architecture, zero-retention ephemeral processing, and data handling practices.',
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
                                Last Updated: July 2026 | Transparent Data Isolation & Security Standards
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
                        Executive Summary: Privacy-First Architecture
                    </h2>
                    <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
                        At TwisterTools, we prioritize data privacy and transparency. The vast majority of interactive web utilities on twistertools.com execute <strong>100% locally in your web browser</strong> using WebAssembly, HTML5 APIs, and client-side JavaScript. For workflows that require server processing (such as complex PDF operations), files are transmitted over TLS-encrypted channels, processed in ephemeral memory, and <strong>automatically purged immediately after execution</strong>.
                    </p>
                </section>

                {/* Section 1: Client-Side Execution & Ephemeral Storage */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Data Processing Architecture</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            We employ a hybrid technical approach engineered for maximum performance and user privacy:
                        </p>
                        <div className="space-y-3">
                            <div className="border-l-4 border-indigo-500 pl-4 py-1 space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Browser-Local Processing</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                                    Calculators, code formatters, JSON/CSV tools, text manipulation utilities, and hashing generators process input data entirely inside your device's memory. No input data from these tools is ever sent to or stored on our servers.
                                </p>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4 py-1 space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Server-Assisted Ephemeral Processing</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                                    For heavy file transformations (such as multi-page PDF processing), uploaded files are securely transferred over encrypted HTTPS/TLS connections. Files are held exclusively in volatile RAM during execution and are automatically deleted from server memory immediately after conversion. We do not store, inspect, or backup your files.
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
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Browser Local Storage & Preference Cookies</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools utilizes browser storage APIs (<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-indigo-600 dark:text-indigo-400 font-mono">localStorage</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-indigo-600 dark:text-indigo-400 font-mono">sessionStorage</code>) exclusively to store user preferences on your device:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li><strong>Tool Bookmarks:</strong> Saving pinned tools locally so you can easily access your favorites.</li>
                            <li><strong>UI Preferences:</strong> Preserving settings like dark mode toggles or recent formatting choices.</li>
                        </ul>
                        <p className="text-xs md:text-sm">
                            This data remains entirely on your personal device and can be cleared at any time through your browser settings.
                        </p>
                    </div>
                </section>

                {/* Section 3: Advertising & Analytics */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Cookie className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Analytics, Advertising & Third-Party Cookies</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            To support our free platform and monitor service health, TwisterTools collaborates with third-party analytics and advertising partners (such as Google Analytics and Google AdSense):
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li><strong>Analytics & Telemetry:</strong> We collect aggregated, non-personally identifiable metrics (such as page views, error rates, and load performance) to improve site navigation and reliability.</li>
                            <li><strong>Advertising & Cookies:</strong> Third-party vendors, including Google, use cookies to serve ads based on user visits to this and other websites. These ads help support our free tools. You can customize your consent preferences through our consent banner or by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Google Ad Settings</a>.</li>
                            <li><strong>Affiliate Links:</strong> Some pages may include affiliate referral links. Clicking an affiliate link does not alter your pricing or cost, nor does it share your tool input data with the partner site.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4: CDNs & Network Security */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Eye className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Hosting Infrastructure & CDNs</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            TwisterTools uses reputable global cloud hosting platforms and Content Delivery Networks (CDNs) to ensure fast load speeds worldwide. Standard network request logs (such as IP addresses, browser User-Agent headers, and timestamps) are processed automatically at the server edge strictly for security protection, DDoS mitigation, and network routing.
                        </p>
                    </div>
                </section>

                {/* Section 5: Legal Rights */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Privacy Rights (GDPR & CCPA/CPRA)</h2>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                            Depending on your location, you hold specific rights regarding privacy and data control:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                            <li><strong>Right to Opt-Out:</strong> Manage cookie choices and opt-out of non-essential tracking via our consent banner.</li>
                            <li><strong>Data Erasure:</strong> Clear local storage and site data directly through your browser settings.</li>
                            <li><strong>Inquiries:</strong> Submit privacy queries or requests via our dedicated contact options.</li>
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
                            We may update this Privacy Policy periodically to reflect site updates, regulatory changes, or new tool additions. Any changes will be posted directly to this page with an updated modification timestamp.
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
                            For questions, feedback, or privacy-related concerns regarding TwisterTools, feel free to reach out directly to our team:
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
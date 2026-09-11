"use client";

import React, { useState, useMemo, useId } from "react";
import {
    MessageSquare,
    Copy,
    Check,
    RotateCcw,
    ExternalLink,
    QrCode,
    Sparkles,
    ShieldAlert,
    Smartphone,
    Globe,
    Send,
    Code,
    Sliders,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Terminal,
    Share2,
    Hash,
    Type
} from "lucide-react";

interface CountryCodeOption {
    name: string;
    code: string;
    dial: string;
    format: string;
}

const COUNTRY_DIRECTORIES: CountryCodeOption[] = [
    { name: "Argentina", code: "AR", dial: "54", format: "9 11 1234-5678" },
    { name: "Australia", code: "AU", dial: "61", format: "412 345 678" },
    { name: "Austria", code: "AT", dial: "43", format: "664 1234567" },
    { name: "Bangladesh", code: "BD", dial: "880", format: "1712-345678" },
    { name: "Belgium", code: "BE", dial: "32", format: "470 12 34 56" },
    { name: "Brazil", code: "BR", dial: "55", format: "11 91234-5678" },
    { name: "Bulgaria", code: "BG", dial: "359", format: "87 123 4567" },
    { name: "Canada", code: "CA", dial: "1", format: "(555) 000-0000" },
    { name: "Chile", code: "CL", dial: "56", format: "9 1234 5678" },
    { name: "China", code: "CN", dial: "86", format: "139 1234 5678" },
    { name: "Colombia", code: "CO", dial: "57", format: "300 123 4567" },
    { name: "Croatia", code: "HR", dial: "385", format: "91 123 4567" },
    { name: "Cyprus", code: "CY", dial: "357", format: "99 123456" },
    { name: "Czech Republic", code: "CZ", dial: "420", format: "601 123 456" },
    { name: "Denmark", code: "DK", dial: "45", format: "20 12 34 56" },
    { name: "Egypt", code: "EG", dial: "20", format: "10 1234 5678" },
    { name: "Finland", code: "FI", dial: "358", format: "40 1234567" },
    { name: "France", code: "FR", dial: "33", format: "6 12 34 56 78" },
    { name: "Germany", code: "DE", dial: "49", format: "151 23456789" },
    { name: "Greece", code: "GR", dial: "30", format: "691 234 5678" },
    { name: "Hungary", code: "HU", dial: "36", format: "20 123 4567" },
    { name: "India", code: "IN", dial: "91", format: "98765 43210" },
    { name: "Indonesia", code: "ID", dial: "62", format: "812-3456-7890" },
    { name: "Ireland", code: "IE", dial: "353", format: "83 123 4567" },
    { name: "Israel", code: "IL", dial: "972", format: "50 123 4567" },
    { name: "Italy", code: "IT", dial: "39", format: "312 345 6789" },
    { name: "Japan", code: "JP", dial: "81", format: "90 1234 5678" },
    { name: "Kenya", code: "KE", dial: "254", format: "712 345 678" },
    { name: "Malaysia", code: "MY", dial: "60", format: "12-345 6789" },
    { name: "Mexico", code: "MX", dial: "52", format: "55 1234 5678" },
    { name: "Netherlands", code: "NL", dial: "31", format: "6 12345678" },
    { name: "New Zealand", code: "NZ", dial: "64", format: "21 123 4567" },
    { name: "Nigeria", code: "NG", dial: "234", format: "802 123 4567" },
    { name: "Norway", code: "NO", dial: "47", format: "412 34 567" },
    { name: "Pakistan", code: "PK", dial: "92", format: "301 2345678" },
    { name: "Peru", code: "PE", dial: "51", format: "912 345 678" },
    { name: "Philippines", code: "PH", dial: "63", format: "917 123 4567" },
    { name: "Poland", code: "PL", dial: "48", format: "512 345 678" },
    { name: "Portugal", code: "PT", dial: "351", format: "912 345 678" },
    { name: "Qatar", code: "QA", dial: "974", format: "5512 3456" },
    { name: "Romania", code: "RO", dial: "40", format: "712 345 678" },
    { name: "Saudi Arabia", code: "SA", dial: "966", format: "50 123 4567" },
    { name: "Serbia", code: "RS", dial: "381", format: "61 1234567" },
    { name: "Singapore", code: "SG", dial: "65", format: "8123 4567" },
    { name: "South Africa", code: "ZA", dial: "27", format: "71 123 4567" },
    { name: "South Korea", code: "KR", dial: "82", format: "10 1234 5678" },
    { name: "Spain", code: "ES", dial: "34", format: "612 34 56 78" },
    { name: "Sweden", code: "SE", dial: "46", format: "70 123 45 67" },
    { name: "Switzerland", code: "CH", dial: "41", format: "79 123 45 67" },
    { name: "Thailand", code: "TH", dial: "66", format: "81 234 5678" },
    { name: "Turkey", code: "TR", dial: "90", format: "532 123 45 67" },
    { name: "Ukraine", code: "UA", dial: "380", format: "50 123 4567" },
    { name: "United Arab Emirates", code: "AE", dial: "971", format: "50 123 4567" },
    { name: "United Kingdom", code: "GB", dial: "44", format: "7911 123456" },
    { name: "United States", code: "US", dial: "1", format: "(555) 000-0000" },
    { name: "Vietnam", code: "VN", dial: "84", format: "91 234 5678" }
];

const PRESET_MESSAGES = {
    ecommerce: "Hi! I am interested in ordering your featured product. Is it currently in stock, and what are the delivery options?",
    leadGen: "Hello! I saw your services portfolio on your website and would love to schedule a quick discovery consultation.",
    customerSupport: "Hello Support Team, I need assistance with an existing order I recently placed. My inquiry details are below:",
    appointment: "Hi there! I would like to check availability and book an appointment for next week. Please let me know your openings."
};

export default function WhatsAppLinkGenerator() {
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("US");
    const [phoneNumber, setPhoneNumber] = useState<string>("5550192834");
    const [customMessage, setCustomMessage] = useState<string>("Hello! I saw your website and would like to learn more about your services.");
    const [urlType, setUrlType] = useState<"wa.me" | "api">("wa.me");
    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
    const [copiedQrUrl, setCopiedQrUrl] = useState<boolean>(false);

    const countrySelectId = useId();
    const phoneInputId = useId();
    const messageInputId = useId();

    const activeCountryObj = useMemo(() => {
        return COUNTRY_DIRECTORIES.find((c) => c.code === selectedCountryCode) || COUNTRY_DIRECTORIES[0];
    }, [selectedCountryCode]);

    const selectedDial = activeCountryObj.dial;

    // Sanitize and normalize the complete international phone number (digits only, no plus sign)
    const sanitizedFullPhone = useMemo(() => {
        const rawDigits = phoneNumber.replace(/\D/g, "");
        const dialClean = selectedDial.replace(/\D/g, "");
        if (!rawDigits) return "";
        // If user already pasted a number that starts with the dial code, don't duplicate
        if (rawDigits.startsWith(dialClean)) {
            return rawDigits;
        }
        return `${dialClean}${rawDigits}`;
    }, [phoneNumber, selectedDial]);

    // Construct valid WhatsApp URL
    const generatedUrl = useMemo(() => {
        if (!sanitizedFullPhone) return "";
        const encodedText = customMessage.trim() ? encodeURIComponent(customMessage.trim()) : "";
        const textParam = encodedText ? `?text=${encodedText}` : "";

        if (urlType === "wa.me") {
            return `https://wa.me/${sanitizedFullPhone}${textParam}`;
        }
        return `https://api.whatsapp.com/send?phone=${sanitizedFullPhone}${encodedText ? `&text=${encodedText}` : ""}`;
    }, [sanitizedFullPhone, customMessage, urlType]);

    // HTML Anchor embed snippet
    const htmlSnippet = useMemo(() => {
        if (!generatedUrl) return "";
        return `<a href="${generatedUrl}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn">Chat with us on WhatsApp</a>`;
    }, [generatedUrl]);

    // QR Code API generator link
    const qrCodeImageUrl = useMemo(() => {
        if (!generatedUrl) return "";
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}&margin=10`;
    }, [generatedUrl]);

    const handleCopy = (type: "link" | "html" | "qr") => {
        let textToCopy = "";
        if (type === "link") textToCopy = generatedUrl;
        else if (type === "html") textToCopy = htmlSnippet;
        else if (type === "qr") textToCopy = qrCodeImageUrl;

        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);

        if (type === "link") {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } else if (type === "html") {
            setCopiedHtml(true);
            setTimeout(() => setCopiedHtml(false), 2000);
        } else if (type === "qr") {
            setCopiedQrUrl(true);
            setTimeout(() => setCopiedQrUrl(false), 2000);
        }
    };

    const handleClear = () => {
        setPhoneNumber("");
        setCustomMessage("");
    };

    const loadPreset = (presetKey: keyof typeof PRESET_MESSAGES) => {
        setCustomMessage(PRESET_MESSAGES[presetKey]);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "WhatsApp Direct Chat Click-to-Chat Link Generator",
        "url": "https://twistertools.com/tools/social-tools/whatsapp-link-generator",
        "description": "Create instant wa.me click-to-chat WhatsApp links with pre-filled greeting messages and QR codes. Start direct chats without saving contact phone numbers.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "What is a WhatsApp Click-to-Chat link?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "WhatsApp's Click to Chat feature allows users to begin a conversation with someone without having their phone number saved in their phone's address book. By clicking a specialized wa.me link, WhatsApp automatically opens a direct message dialogue window with the designated recipient."
                }
            },
            {
                "@type": "Question",
                "name": "Should I include '+' signs, dashes, or zeros in the WhatsApp phone number?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The official WhatsApp wa.me API standard requires a completely clean international format with digits only. Do not include any plus symbols (+), hyphens (-), parentheses, spaces, or leading zeroes. TwisterTools automatically strips all unnecessary characters to ensure your generated link conforms to Meta's technical specification."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between 'wa.me' and 'api.whatsapp.com' links?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "'wa.me' is WhatsApp's modern, lightweight, short-link URL redirect service designed specifically for modern mobile and desktop browsers. 'api.whatsapp.com' is the legacy API URL endpoint. Both execute identically, but wa.me is universally preferred for social media bios, emails, and QR codes due to its concise length."
                }
            },
            {
                "@type": "Question",
                "name": "Does the pre-filled custom message send automatically when clicked?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. For privacy and anti-spam protocols, WhatsApp populates the pre-filled text inside the user's message composition input field, but the user must tap the 'Send' button themselves to transmit the message."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use WhatsApp Click-to-Chat links on desktop computers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When clicked on a desktop computer, the link redirects the user to WhatsApp Web or prompts them to launch the official WhatsApp desktop client application for macOS or Windows seamlessly."
                }
            },
            {
                "@type": "Question",
                "name": "Is my phone number or customer message stored on TwisterTools servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Never. TwisterTools operates 100% client-side inside your web browser. No phone numbers, custom messages, IP logs, or contact records are ever transmitted to or stored on any external database."
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
                {/* Left Panel: Configuration & Message Editor (5 Columns) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Link Configuration
                        </h2>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        >
                            Reset Fields
                        </button>
                    </div>

                    {/* Country Code & Phone Number Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Target Phone Number
                        </label>

                        <div className="space-y-2">
                            <div>
                                <label htmlFor={countrySelectId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Select Country:
                                </label>
                                <select
                                    id={countrySelectId}
                                    aria-label="Target Country Dial Code"
                                    value={selectedCountryCode}
                                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                                    className="w-full p-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition cursor-pointer"
                                >
                                    {COUNTRY_DIRECTORIES.map((item) => (
                                        <option key={item.code} value={item.code}>
                                            {item.name} (+{item.dial})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor={phoneInputId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Local Number (digits only):
                                </label>
                                <div className="relative flex rounded-xl shadow-xs">
                                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm font-semibold">
                                        +{selectedDial}
                                    </span>
                                    <input
                                        id={phoneInputId}
                                        type="tel"
                                        aria-label="Local phone number without country code"
                                        placeholder={`e.g. ${activeCountryObj.format}`}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full p-2.5 sm:p-3 text-sm font-mono rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                                    Format preview: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">+{sanitizedFullPhone || selectedDial}</span> (no spaces, dashes, or plus signs in final link)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pre-filled Message Text Area */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label htmlFor={messageInputId} className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Pre-filled Greeting Message:
                            </label>
                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                {customMessage.length} chars
                            </span>
                        </div>

                        <textarea
                            id={messageInputId}
                            rows={4}
                            aria-label="Pre-filled custom message"
                            placeholder="e.g. Hello! I'm interested in your product pricing. Could you share details?"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            className="w-full p-3 text-xs sm:text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y"
                        />

                        {/* Quick Message Presets */}
                        <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                                Quick Industry Presets:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => loadPreset("ecommerce")}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-left truncate"
                                >
                                    E-Commerce Product
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loadPreset("leadGen")}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-left truncate"
                                >
                                    Client Lead Gen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loadPreset("customerSupport")}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-left truncate"
                                >
                                    Customer Support
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loadPreset("appointment")}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-left truncate"
                                >
                                    Book Appointment
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Protocol URL Type Toggle */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Link Syntax Protocol:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setUrlType("wa.me")}
                                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${urlType === "wa.me"
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                wa.me (Modern / Short)
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrlType("api")}
                                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${urlType === "api"
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                api.whatsapp.com (Legacy)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Live Output, Phone Mockup & Export Tools (7 Columns) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    {/* Link Output & Action Container */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Ready-to-Use WhatsApp Link
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Clean & Verified
                            </span>
                        </div>

                        {/* Generated URL Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Generated Click-to-Chat Link:
                            </label>
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-indigo-600 dark:text-indigo-300 break-all select-all">
                                {generatedUrl || "Please enter a valid phone number on the left."}
                            </div>
                        </div>

                        {/* Action Buttons (Copy & Test Direct) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleCopy("link")}
                                disabled={!generatedUrl}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedLink
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                            >
                                {copiedLink ? (
                                    <>
                                        <Check className="w-4 h-4 text-white" />
                                        <span>Copied Link!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-white" />
                                        <span>Copy WhatsApp Link</span>
                                    </>
                                )}
                            </button>

                            <a
                                href={generatedUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 text-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 ${!generatedUrl ? "opacity-50 pointer-events-none" : "cursor-pointer"
                                    }`}
                            >
                                <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Test Link Now</span>
                            </a>
                        </div>

                        {/* Realistic WhatsApp Chat Bubble Mockup */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-[#eae6df] dark:bg-slate-950 overflow-hidden shadow-inner p-4 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-300/60 dark:border-slate-800 pb-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                                    WA
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                        WhatsApp Chat Preview
                                    </p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                                        Target: +{sanitizedFullPhone || "0000000000"}
                                    </p>
                                </div>
                            </div>

                            {/* Message Bubble Simulator */}
                            <div className="flex flex-col items-end space-y-1 max-w-sm ml-auto">
                                <div className="bg-[#dcf8c6] dark:bg-emerald-900/60 text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border border-emerald-200/50 dark:border-emerald-800/40">
                                    {customMessage || "Type your greeting message to view what your recipient will see."}
                                    <div className="text-[10px] text-slate-600 dark:text-slate-300 text-right mt-1 font-mono">
                                        12:00 PM • Read
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integration Snippets: HTML Anchor & QR Code */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* HTML Embed Card */}
                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> HTML Website Embed
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy("html")}
                                        disabled={!generatedUrl}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                        {copiedHtml ? "Copied!" : "Copy Tag"}
                                    </button>
                                </div>
                                <textarea
                                    readOnly
                                    aria-label="HTML button code snippet"
                                    rows={2}
                                    value={htmlSnippet}
                                    className="w-full p-2 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 resize-none outline-none select-all"
                                />
                            </div>

                            {/* QR Code Quick Embed */}
                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> WhatsApp QR Code
                                    </span>
                                    <a
                                        href={qrCodeImageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download="whatsapp-qr-code.png"
                                        className={`text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer ${!generatedUrl ? "opacity-50 pointer-events-none" : ""}`}
                                    >
                                        Download PNG
                                    </a>
                                </div>
                                <div className="flex items-center gap-3">
                                    {generatedUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={qrCodeImageUrl}
                                            alt="WhatsApp Click to Chat QR Code"
                                            className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0" />
                                    )}
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                                        Scan with any mobile camera to open WhatsApp automatically without saving contacts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mandatory Social Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Architecture & Mechanics */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            How WhatsApp Click-to-Chat Works: Protocols, Direct Deep Linking, and Syntax
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Traditional smartphone messaging workflows require users to manually save a contact to their address book, wait for the messaging application to refresh its contact index, and only then initiate a chat. WhatsApp Click-to-Chat eliminates this friction by leveraging Meta&apos;s universal deep linking protocol.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Deep Link Direct Routing
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                When a user navigates to a <code className="font-mono text-indigo-600 dark:text-indigo-400">wa.me</code> URL, the mobile operating system detects the domain and delegates the intent directly to the native WhatsApp app engine, bypassing contact book constraints entirely.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> URI Percent-Encoding
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Pre-filled greeting messages are parsed using RFC 3986 percent-encoding. Special characters, spaces (<code className="font-mono text-indigo-600 dark:text-indigo-400">%20</code>), and line returns (<code className="font-mono text-indigo-600 dark:text-indigo-400">%0A</code>) are formatted seamlessly so WhatsApp can pre-populate user inputs without syntax errors.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Universal Fallback Handlers
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                If the recipient is accessing the link from a desktop or laptop computer without a native app, WhatsApp redirects them to WhatsApp Web automatically, allowing desktop customer support workflows to function uninterrupted.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Technical URI Anatomy Specification
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            A standardized WhatsApp Click-to-Chat URI follows an exact structural hierarchy governed by Meta&apos;s developer documentation:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Standard wa.me click-to-chat format:
https://wa.me/[CountryCode][SubscriberNumber]?text=[PercentEncodedGreeting]

// Concrete Real-World Example:
https://wa.me/15550192834?text=Hi!%20I'm%20interested%20in%20your%20services.`}
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
                            Comparative Analysis: WhatsApp wa.me Links vs. Alternative Channels
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the right communication channel dictates your customer conversion rates. Here is an objective comparison between WhatsApp Click-to-Chat links and alternative website lead generation methods:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Interaction Method</th>
                                    <th className="p-3">User Conversion Speed</th>
                                    <th className="p-3">Contact Saving Required?</th>
                                    <th className="p-3">Open / Read Rates</th>
                                    <th className="p-3">Commercial Suitability</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">WhatsApp wa.me Link</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Instant (1 Tap)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">No (Direct Chat)</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">~98% Open Rate</td>
                                    <td className="p-3 text-emerald-600 font-bold">High Intent Leads & Support</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Traditional Website Contact Form</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Slow (Multi-field typing)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">No</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">~20% (Email bounce risk)</td>
                                    <td className="p-3 text-amber-600">Complex Inquiries</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Raw Unformatted Phone Number</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">High Friction (Manual Save)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Yes (Must add to contacts)</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">N/A (User abandons)</td>
                                    <td className="p-3 text-rose-600">Poor Mobile Conversion</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">mailto: Email Hyperlink</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Medium (App switching)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">No</td>
                                    <td className="p-3 font-mono text-amber-600 dark:text-amber-400">18% - 25%</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">B2B Formal Communications</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Proven Business Playbooks */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            High-Conversion Implementation: 5 Strategic WhatsApp Link Use Cases
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Embedding direct WhatsApp links within your marketing assets streamlines interaction paths across multiple customer acquisition funnels:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Optimal Placement Frameworks
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Instagram & TikTok Bio Links:</strong> Add your wa.me link directly to your social profile bio or link-in-bio hub to channel casual profile visitors into high-intent inbound conversations.
                                </li>
                                <li>
                                    • <strong>Website Floating Chat Widgets:</strong> Replace heavy JavaScript chat widgets that degrade Core Web Vitals with a lightweight CSS anchor link pointing directly to your wa.me URL.
                                </li>
                                <li>
                                    • <strong>Printable QR Codes for Physical Packaging:</strong> Print the generated QR code onto restaurant tables, product packaging, or business cards for zero-typing customer re-ordering.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Syntax Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Accidental Plus Signs (+) or Zero Prefixes:</strong> Adding &ldquo;+1&rdquo; or international dialing prefix &ldquo;00&rdquo; causes WhatsApp to fail parsing the number. TwisterTools automatically normalizes inputs to clean digits.
                                </li>
                                <li>
                                    • <strong>Unencoded Special Characters:</strong> Manually typing ampersands, quotation marks, or hash symbols into raw URL parameters will break the link string. Always utilize standard URL encoding.
                                </li>
                                <li>
                                    • <strong>Generic Blank Greetings:</strong> Sending users to a blank chat window increases drop-off. Pre-populating a specific context question boosts conversion response rates by over 40%.
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
                                What is a WhatsApp Click-to-Chat link?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                WhatsApp&apos;s Click to Chat feature allows users to begin a conversation with someone without having their phone number saved in their phone&apos;s address book. By clicking a specialized wa.me link, WhatsApp automatically opens a direct message dialogue window with the designated recipient.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Should I include &apos;+&apos; signs, dashes, or zeros in the WhatsApp phone number?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. The official WhatsApp wa.me API standard requires a completely clean international format with digits only. Do not include any plus symbols (+), hyphens (-), parentheses, spaces, or leading zeroes. TwisterTools automatically strips all unnecessary characters to ensure your generated link conforms to Meta&apos;s technical specification.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between &apos;wa.me&apos; and &apos;api.whatsapp.com&apos; links?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                &apos;wa.me&apos; is WhatsApp&apos;s modern, lightweight, short-link URL redirect service designed specifically for modern mobile and desktop browsers. &apos;api.whatsapp.com&apos; is the legacy API URL endpoint. Both execute identically, but wa.me is universally preferred for social media bios, emails, and QR codes due to its concise length.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does the pre-filled custom message send automatically when clicked?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. For privacy and anti-spam protocols, WhatsApp populates the pre-filled text inside the user&apos;s message composition input field, but the user must tap the &apos;Send&apos; button themselves to transmit the message.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I use WhatsApp Click-to-Chat links on desktop computers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. When clicked on a desktop computer, the link redirects the user to WhatsApp Web or prompts them to launch the official WhatsApp desktop client application for macOS or Windows seamlessly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is my phone number or customer message stored on TwisterTools servers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Never. TwisterTools operates 100% client-side inside your web browser. No phone numbers, custom messages, IP logs, or contact records are ever transmitted to or stored on any external database.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
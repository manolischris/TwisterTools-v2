"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, X } from "lucide-react";

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        try {
            const savedConsent = localStorage.getItem("twistertools_cookie_consent");
            if (!savedConsent) {
                setShowBanner(true);
            } else {
                // Apply stored consent choice to gtag on page load
                const consentData = JSON.parse(savedConsent);
                updateGtagConsent(consentData.analytics, consentData.marketing);
            }
        } catch {
            setShowBanner(true);
        }
    }, []);

    const updateGtagConsent = (analytics: boolean, marketing: boolean) => {
        if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
            (window as any).gtag("consent", "update", {
                analytics_storage: analytics ? "granted" : "denied",
                ad_storage: marketing ? "granted" : "denied",
                ad_user_data: marketing ? "granted" : "denied",
                ad_personalization: marketing ? "granted" : "denied",
            });
        }
    };

    const handleAcceptAll = () => {
        const consent = { analytics: true, marketing: true, timestamp: new Date().toISOString() };
        localStorage.setItem("twistertools_cookie_consent", JSON.stringify(consent));
        updateGtagConsent(true, true);
        setShowBanner(false);
    };

    const handleEssentialOnly = () => {
        const consent = { analytics: false, marketing: false, timestamp: new Date().toISOString() };
        localStorage.setItem("twistertools_cookie_consent", JSON.stringify(consent));
        updateGtagConsent(false, false);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <Cookie className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm text-white">Cookie & Privacy Choices</h3>
                    </div>
                    <button
                        onClick={handleEssentialOnly}
                        className="text-slate-400 hover:text-white p-1 transition-colors"
                        aria-label="Dismiss banner with essential cookies only"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                    We use cookies to analyze performance, personalize advertising, and enhance your workflow. Essential utilities process data locally in your browser. Read our{" "}
                    <Link href="/privacy-policy" className="text-indigo-400 underline hover:text-indigo-300">
                        Privacy Policy
                    </Link>
                    .
                </p>

                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={handleAcceptAll}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Accept All
                    </button>
                    <button
                        onClick={handleEssentialOnly}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        Essential Only
                    </button>
                </div>
            </div>
        </div>
    );
}
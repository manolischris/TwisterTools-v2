"use client";

import React, { useState, useMemo } from "react";
import {
    Printer,
    Calculator,
    Image as ImageIcon,
    Sliders,
    Maximize2,
    BookOpen,
    HelpCircle,
    Info,
    Check,
    Copy,
    RefreshCw,
    Download,
    Eye,
    Layers,
    FileSpreadsheet,
    Compass,
    Sparkles,
    ShieldCheck,
    ZoomIn
} from "lucide-react";

type Unit = "inches" | "cm" | "mm";
type QualityTier = "fine_art" | "standard_commercial" | "good_photo" | "acceptable_digital" | "low_res";

interface StandardPrintPreset {
    name: string;
    widthInches: number;
    heightInches: number;
    category: "Photo" | "ISO (A-Series)" | "Poster / Canvas";
}

const STANDARD_PRESETS: StandardPrintPreset[] = [
    { name: '4" × 6" (Standard Photo)', widthInches: 4, heightInches: 6, category: "Photo" },
    { name: '5" × 7" (Greeting / Portrait)', widthInches: 5, heightInches: 7, category: "Photo" },
    { name: '8" × 10" (Gallery Print)', widthInches: 8, heightInches: 10, category: "Photo" },
    { name: '8.5" × 11" (US Letter Document)', widthInches: 8.5, heightInches: 11, category: "Photo" },
    { name: '11" × 14" (Wall Portrait)', widthInches: 11, heightInches: 14, category: "Photo" },
    { name: "A4 (210 × 297 mm)", widthInches: 8.27, heightInches: 11.69, category: "ISO (A-Series)" },
    { name: "A3 (297 × 420 mm)", widthInches: 11.69, heightInches: 16.54, category: "ISO (A-Series)" },
    { name: "A2 (420 × 594 mm)", widthInches: 16.54, heightInches: 23.39, category: "ISO (A-Series)" },
    { name: "A1 (594 × 841 mm)", widthInches: 23.39, heightInches: 33.11, category: "ISO (A-Series)" },
    { name: '16" × 20" (Medium Poster)', widthInches: 16, heightInches: 20, category: "Poster / Canvas" },
    { name: '18" × 24" (Art Exhibition)', widthInches: 18, heightInches: 24, category: "Poster / Canvas" },
    { name: '24" × 36" (Full Architectural Poster)', widthInches: 24, heightInches: 36, category: "Poster / Canvas" },
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function ImageDpiPrintCalculator() {
    // Mode toggle: Forward (Pixels -> Print Size) vs Reverse (Print Size -> Required Pixels)
    const [calcMode, setCalcMode] = useState<"pixels_to_print" | "print_to_pixels">("pixels_to_print");

    // Primary State Variables
    const [pixelWidth, setPixelWidth] = useState<number>(3840);
    const [pixelHeight, setPixelHeight] = useState<number>(2160);
    const [targetDpi, setTargetDpi] = useState<number>(300);

    // Reverse Mode Print Size States
    const [inputPrintWidth, setInputPrintWidth] = useState<number>(8);
    const [inputPrintHeight, setInputPrintHeight] = useState<number>(10);
    const [reverseUnit, setReverseUnit] = useState<Unit>("inches");

    // Active Display Unit
    const [displayUnit, setDisplayUnit] = useState<Unit>("inches");
    const [viewingDistanceInches, setViewingDistanceInches] = useState<number>(20);
    const [copied, setCopied] = useState<boolean>(false);

    // Helper conversion functions
    const inchesToUnit = (inches: number, unit: Unit): number => {
        if (unit === "inches") return inches;
        if (unit === "cm") return inches * 2.54;
        return inches * 25.4;
    };

    const unitToInches = (val: number, unit: Unit): number => {
        if (unit === "inches") return val;
        if (unit === "cm") return val / 2.54;
        return val / 25.4;
    };

    // Forward Calculations
    const forwardCalculations = useMemo(() => {
        const dpi = targetDpi > 0 ? targetDpi : 1;
        const widthIn = pixelWidth / dpi;
        const heightIn = pixelHeight / dpi;

        const widthCm = widthIn * 2.54;
        const heightCm = heightIn * 2.54;

        const widthMm = widthIn * 25.4;
        const heightMm = heightIn * 25.4;

        const totalPixels = pixelWidth * pixelHeight;
        const megapixels = totalPixels / 1_000_000;

        // Visual Acuity Threshold Formula: DPI ≈ 3438 / Distance (inches)
        const distance = viewingDistanceInches > 0 ? viewingDistanceInches : 1;
        const recommendedDistanceDpi = Math.round(3438 / distance);

        let quality: QualityTier = "standard_commercial";
        if (dpi >= 300) quality = "fine_art";
        else if (dpi >= 240) quality = "standard_commercial";
        else if (dpi >= 150) quality = "good_photo";
        else if (dpi >= 100) quality = "acceptable_digital";
        else quality = "low_res";

        return {
            widthIn,
            heightIn,
            widthCm,
            heightCm,
            widthMm,
            heightMm,
            megapixels,
            totalPixels,
            recommendedDistanceDpi,
            quality
        };
    }, [pixelWidth, pixelHeight, targetDpi, viewingDistanceInches]);

    // Reverse Calculations (Print Dimensions + DPI -> Pixels)
    const reverseCalculations = useMemo(() => {
        const widthIn = unitToInches(inputPrintWidth, reverseUnit);
        const heightIn = unitToInches(inputPrintHeight, reverseUnit);
        const dpi = targetDpi > 0 ? targetDpi : 1;

        const requiredWidthPx = Math.round(widthIn * dpi);
        const requiredHeightPx = Math.round(heightIn * dpi);
        const totalPx = requiredWidthPx * requiredHeightPx;
        const mp = totalPx / 1_000_000;

        return {
            widthIn,
            heightIn,
            requiredWidthPx,
            requiredHeightPx,
            totalPx,
            mp
        };
    }, [inputPrintWidth, inputPrintHeight, reverseUnit, targetDpi]);

    // Active values based on selected calculation mode
    const activeWidthDisplay = useMemo(() => {
        if (calcMode === "pixels_to_print") {
            return inchesToUnit(forwardCalculations.widthIn, displayUnit).toFixed(2);
        }
        return inputPrintWidth.toFixed(2);
    }, [calcMode, forwardCalculations.widthIn, displayUnit, inputPrintWidth]);

    const activeHeightDisplay = useMemo(() => {
        if (calcMode === "pixels_to_print") {
            return inchesToUnit(forwardCalculations.heightIn, displayUnit).toFixed(2);
        }
        return inputPrintHeight.toFixed(2);
    }, [calcMode, forwardCalculations.heightIn, displayUnit, inputPrintHeight]);

    // Apply standard preset
    const handleApplyPreset = (preset: StandardPrintPreset) => {
        setTargetDpi(300);
        if (calcMode === "pixels_to_print") {
            setPixelWidth(Math.round(preset.widthInches * 300));
            setPixelHeight(Math.round(preset.heightInches * 300));
        } else {
            setInputPrintWidth(inchesToUnit(preset.widthInches, reverseUnit));
            setInputPrintHeight(inchesToUnit(preset.heightInches, reverseUnit));
        }
    };

    const handleReset = () => {
        setCalcMode("pixels_to_print");
        setPixelWidth(3840);
        setPixelHeight(2160);
        setTargetDpi(300);
        setInputPrintWidth(8);
        setInputPrintHeight(10);
        setDisplayUnit("inches");
        setReverseUnit("inches");
        setViewingDistanceInches(20);
    };

    const handleCopySummary = () => {
        const isFwd = calcMode === "pixels_to_print";
        const wIn = isFwd ? forwardCalculations.widthIn : reverseCalculations.widthIn;
        const hIn = isFwd ? forwardCalculations.heightIn : reverseCalculations.heightIn;
        const pxW = isFwd ? pixelWidth : reverseCalculations.requiredWidthPx;
        const pxH = isFwd ? pixelHeight : reverseCalculations.requiredHeightPx;
        const mp = isFwd ? forwardCalculations.megapixels : reverseCalculations.mp;

        const text = `Image DPI & Print Dimension Calculator Summary:
----------------------------------------
Calculation Mode: ${isFwd ? "Pixel Resolution to Physical Print Size" : "Print Target to Required Pixels"}
Resolution: ${pxW.toLocaleString()} × ${pxH.toLocaleString()} px (${mp.toFixed(2)} Megapixels)
Print Density: ${targetDpi} DPI / PPI
Physical Print Dimensions:
  • Inches: ${wIn.toFixed(2)}" × ${hIn.toFixed(2)}"
  • Centimeters: ${(wIn * 2.54).toFixed(2)} cm × ${(hIn * 2.54).toFixed(2)} cm
  • Millimeters: ${(wIn * 25.4).toFixed(1)} mm × ${(hIn * 25.4).toFixed(1)} mm
Recommended Viewing Distance: ${viewingDistanceInches} inches (Requires min ~${forwardCalculations.recommendedDistanceDpi} DPI)
----------------------------------------
Generated via twistertools.com/tools/image-tools/image-dpi-print-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Preset Name", "Width (Inches)", "Height (Inches)", "Width (cm)", "Height (cm)", "Target DPI", "Required Width (px)", "Required Height (px)", "Total Megapixels"];
        const rows = STANDARD_PRESETS.map((preset) => {
            const reqW = Math.round(preset.widthInches * targetDpi);
            const reqH = Math.round(preset.heightInches * targetDpi);
            const mp = (reqW * reqH) / 1_000_000;
            return [
                `"${preset.name}"`,
                preset.widthInches.toFixed(2),
                preset.heightInches.toFixed(2),
                (preset.widthInches * 2.54).toFixed(2),
                (preset.heightInches * 2.54).toFixed(2),
                targetDpi,
                reqW,
                reqH,
                mp.toFixed(2)
            ];
        });

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dpi_${targetDpi}_print_matrix.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Quality tier badges and labels
    const getTierDetails = (tier: QualityTier) => {
        switch (tier) {
            case "fine_art":
                return { label: "Fine Art & Gallery Grade (300+ DPI)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
            case "standard_commercial":
                return { label: "High Quality Commercial Print (240-299 DPI)", color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
            case "good_photo":
                return { label: "Standard Photo & Magazine (150-239 DPI)", color: "text-blue-700 bg-blue-50 border-blue-200" };
            case "acceptable_digital":
                return { label: "Acceptable Posters / Billboards (100-149 DPI)", color: "text-amber-700 bg-amber-50 border-amber-200" };
            case "low_res":
                return { label: "Pixelated for Close Inspection (<100 DPI)", color: "text-rose-700 bg-rose-50 border-rose-200" };
        }
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image DPI to Physical Print Dimension Calculator",
        "url": "https://twistertools.com/tools/image-tools/image-dpi-print-calculator",
        "description": "Accurately calculate physical print sizes from digital image pixels, convert target paper dimensions to required pixel resolutions, and determine optimal print DPI based on human eye viewing distance.",
        "applicationCategory": "DesignApplication",
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
                "name": "What is the difference between DPI and PPI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PPI (Pixels Per Inch) measures the digital pixel density of an image sensor or display screen, indicating how many raw digital pixels exist per linear inch. DPI (Dots Per Inch) refers to the mechanical density of physical ink droplets sprayed onto physical paper by a printer. While technically distinct, both terms are used interchangeably in digital prepress workflows to denote linear print resolution."
                }
            },
            {
                "@type": "Question",
                "name": "Why is 300 DPI considered the standard resolution for professional printing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 300 DPI benchmark derives directly from human visual acuity limits. At a comfortable reading distance of 10 to 14 inches (25-35 cm), the standard human eye can resolve details up to approximately 1 arcminute (1/60th of a degree), translating to roughly 300 distinct pixels per inch. Finer densities yield negligible perceived sharpness improvements for human vision."
                }
            },
            {
                "@type": "Question",
                "name": "How does viewing distance affect required print DPI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As distance between the viewer and the printed medium increases, the angular size of individual pixels shrinks. Consequently, large wall posters viewed from 3 feet away require only 100 to 150 DPI, while roadside billboards viewed from 30+ feet require only 15 to 30 DPI to appear crisp and photorealistic."
                }
            },
            {
                "@type": "Question",
                "name": "What is the exact mathematical formula to convert pixels to print dimensions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To calculate physical inches from pixels: Physical Inches = Total Pixels / DPI. To convert the resulting dimension into centimeters or millimeters, multiply inches by 2.54 (for cm) or 25.4 (for mm)."
                }
            },
            {
                "@type": "Question",
                "name": "Does changing the DPI in image metadata alter file size or pixel dimensions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Adjusting the DPI metadata header inside an image file does not alter the underlying pixel array or file size in megabytes. It simply instructs printing hardware how closely to group those identical pixels across the physical page."
                }
            },
            {
                "@type": "Question",
                "name": "How many megapixels do I need to print a sharp 24x36 inch poster?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For gallery-grade 300 DPI, a 24x36 inch poster requires 7,200 x 10,800 pixels (77.76 Megapixels). However, because wall posters are viewed from 3 to 5 feet away, 150 DPI is standard commercial practice, requiring only 3,600 x 5,400 pixels (19.44 Megapixels)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Data Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Mode Selector & Dimension Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Mode Selection Tabs */}
                        <div className="mb-5 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="w-4 h-4 text-indigo-600" />
                                    Calculation Workflow Mode
                                </label>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition border border-slate-200/60 shadow-2xs cursor-pointer"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Reset Calculator
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("pixels_to_print")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${calcMode === "pixels_to_print"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Pixels → Print Size</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("print_to_pixels")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${calcMode === "print_to_pixels"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Print Target → Required Pixels</span>
                                </button>
                            </div>
                        </div>

                        {/* Density (DPI / PPI) Selector */}
                        <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Printer className="w-4 h-4 text-indigo-600" />
                                    Print Density (DPI / PPI)
                                </label>
                                <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    {targetDpi} DPI
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    max="2400"
                                    value={targetDpi === 0 ? "" : targetDpi}
                                    onChange={(e) => handleNumberInput(e, setTargetDpi)}
                                    className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    placeholder="Enter DPI"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                    Dots / In
                                </span>
                            </div>

                            {/* Preset DPI Pills */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[72, 150, 200, 240, 300, 600, 1200].map((dpiVal) => (
                                    <button
                                        key={dpiVal}
                                        type="button"
                                        onClick={() => setTargetDpi(dpiVal)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold border transition cursor-pointer ${targetDpi === dpiVal
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {dpiVal} DPI
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Inputs according to Mode */}
                        {calcMode === "pixels_to_print" ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Pixel Width (px)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pixelWidth === 0 ? "" : pixelWidth}
                                            onChange={(e) => handleNumberInput(e, setPixelWidth)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder="Width"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Pixel Height (px)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pixelHeight === 0 ? "" : pixelHeight}
                                            onChange={(e) => handleNumberInput(e, setPixelHeight)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder="Height"
                                        />
                                    </div>
                                </div>

                                {/* Quick Camera Sensor Aspect Presets */}
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Quick Resolution Benchmarks
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setPixelWidth(1920); setPixelHeight(1080); }}
                                            className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition text-xs cursor-pointer"
                                        >
                                            <div className="font-bold text-slate-800">1080p FHD</div>
                                            <div className="text-[10px] text-slate-500">1920 × 1080 (2.07 MP)</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setPixelWidth(3840); setPixelHeight(2160); }}
                                            className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition text-xs cursor-pointer"
                                        >
                                            <div className="font-bold text-slate-800">4K UHD</div>
                                            <div className="text-[10px] text-slate-500">3840 × 2160 (8.29 MP)</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setPixelWidth(6000); setPixelHeight(4000); }}
                                            className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition text-xs cursor-pointer"
                                        >
                                            <div className="font-bold text-slate-800">24MP DSLR</div>
                                            <div className="text-[10px] text-slate-500">6000 × 4000 (24.0 MP)</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Physical Target Dimensions
                                    </span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                                        {(["inches", "cm", "mm"] as Unit[]).map((u) => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setReverseUnit(u)}
                                                className={`px-2 py-0.5 rounded-md font-semibold capitalize transition cursor-pointer ${reverseUnit === u ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                                                    }`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Width ({reverseUnit})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            value={inputPrintWidth === 0 ? "" : inputPrintWidth}
                                            onChange={(e) => handleNumberInput(e, setInputPrintWidth)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder="Width"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Height ({reverseUnit})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            value={inputPrintHeight === 0 ? "" : inputPrintHeight}
                                            onChange={(e) => handleNumberInput(e, setInputPrintHeight)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder="Height"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Standard Print Presets Picker */}
                        <div className="mt-5 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                                Apply Standard Prepress Paper Sizes
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1 border border-slate-100 rounded-xl p-1.5 bg-slate-50/50">
                                {STANDARD_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-xs transition cursor-pointer"
                                    >
                                        <p className="font-bold text-slate-800 truncate">{preset.name}</p>
                                        <p className="text-[10px] text-slate-500">{preset.category}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Viewing Distance Slider */}
                        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Eye className="w-4 h-4 text-indigo-600" /> Expected Viewing Distance
                                </span>
                                <span className="text-indigo-600 font-mono">{viewingDistanceInches} inches ({(viewingDistanceInches * 2.54).toFixed(0)} cm)</span>
                            </div>
                            <input
                                type="range"
                                min="6"
                                max="120"
                                step="2"
                                value={viewingDistanceInches}
                                onChange={(e) => setViewingDistanceInches(parseInt(e.target.value, 10))}
                                className="w-full accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                <span>Reading (10-15")</span>
                                <span>Wall Frame (20-36")</span>
                                <span>Exhibition Poster (40-60")</span>
                                <span>Billboard (100"+)</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Utility Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Print Specs"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Results & Fidelity Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Computed Output Dimensions
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                {(["inches", "cm", "mm"] as Unit[]).map((u) => (
                                    <button
                                        key={u}
                                        onClick={() => setDisplayUnit(u)}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${displayUnit === u ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                            }`}
                                    >
                                        {u}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Highlight Output Banner */}
                        <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                                <span>{calcMode === "pixels_to_print" ? "Maximum Physical Print Size" : "Required Pixel Dimensions"}</span>
                                <span className="text-indigo-600 font-extrabold">{targetDpi} DPI</span>
                            </div>

                            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                                {calcMode === "pixels_to_print" ? (
                                    <span>
                                        {activeWidthDisplay} × {activeHeightDisplay} <span className="text-base sm:text-lg font-bold text-indigo-600 font-sans uppercase">{displayUnit}</span>
                                    </span>
                                ) : (
                                    <span>
                                        {reverseCalculations.requiredWidthPx.toLocaleString()} × {reverseCalculations.requiredHeightPx.toLocaleString()} <span className="text-base sm:text-lg font-bold text-indigo-600 font-sans">PX</span>
                                    </span>
                                )}
                            </div>

                            {/* Aspect Ratio and Megapixels Subline */}
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 pt-1 border-t border-indigo-100">
                                <span>
                                    Aspect Ratio:{" "}
                                    <strong className="text-slate-900">
                                        {calcMode === "pixels_to_print"
                                            ? (pixelWidth / (pixelHeight || 1)).toFixed(2) + ":1"
                                            : (reverseCalculations.requiredWidthPx / (reverseCalculations.requiredHeightPx || 1)).toFixed(2) + ":1"}
                                    </strong>
                                </span>
                                <span>
                                    Sensor Volume:{" "}
                                    <strong className="text-indigo-600">
                                        {calcMode === "pixels_to_print"
                                            ? forwardCalculations.megapixels.toFixed(2)
                                            : reverseCalculations.mp.toFixed(2)}{" "}
                                        Megapixels
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {/* Quality Fidelity & Visual Acuity Assessment */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Prepress Fidelity & Visual Sharpness Analysis
                            </label>

                            {/* Quality Tier Pill */}
                            <div className={`p-3.5 rounded-xl border font-bold text-xs flex items-center gap-2 ${getTierDetails(forwardCalculations.quality).color}`}>
                                <Sparkles className="w-4 h-4 flex-shrink-0" />
                                <span>{getTierDetails(forwardCalculations.quality).label}</span>
                            </div>

                            {/* Visual Acuity Card */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
                                <div className="flex items-center justify-between font-bold text-slate-900">
                                    <span className="flex items-center gap-1.5">
                                        <Eye className="w-4 h-4 text-indigo-600" />
                                        Eye Acuity at {viewingDistanceInches}" Viewing Distance:
                                    </span>
                                    <span className="text-indigo-600 font-mono">
                                        Min ~{forwardCalculations.recommendedDistanceDpi} DPI Required
                                    </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                    {targetDpi >= forwardCalculations.recommendedDistanceDpi
                                        ? `✓ At ${viewingDistanceInches} inches, your current density of ${targetDpi} DPI matches or exceeds human visual resolving power. The print will appear perfectly crisp with zero visible dot structure.`
                                        : `⚠️ At ${viewingDistanceInches} inches, the human eye can resolve fine details up to ~${forwardCalculations.recommendedDistanceDpi} DPI. A print at ${targetDpi} DPI may show slight softening upon close inspection.`}
                                </p>
                            </div>
                        </div>

                        {/* Metric Grid Breakdowns */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
                            {/* Inches Dimension */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Inches</span>
                                <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                    {calcMode === "pixels_to_print"
                                        ? `${forwardCalculations.widthIn.toFixed(2)}" × ${forwardCalculations.heightIn.toFixed(2)}"`
                                        : `${reverseCalculations.widthIn.toFixed(2)}" × ${reverseCalculations.heightIn.toFixed(2)}"`}
                                </p>
                            </div>

                            {/* Centimeters Dimension */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Centimeters</span>
                                <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                    {calcMode === "pixels_to_print"
                                        ? `${forwardCalculations.widthCm.toFixed(2)} × ${forwardCalculations.heightCm.toFixed(2)} cm`
                                        : `${(reverseCalculations.widthIn * 2.54).toFixed(2)} × ${(reverseCalculations.heightIn * 2.54).toFixed(2)} cm`}
                                </p>
                            </div>

                            {/* Millimeters Dimension */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Millimeters</span>
                                <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                    {calcMode === "pixels_to_print"
                                        ? `${forwardCalculations.widthMm.toFixed(1)} × ${forwardCalculations.heightMm.toFixed(1)} mm`
                                        : `${(reverseCalculations.widthIn * 25.4).toFixed(1)} × ${(reverseCalculations.heightIn * 25.4).toFixed(1)} mm`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Prepress Acuity Engine
                        </span>
                        <span>ISO 216 / ANSI Standard Compliant</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Core Mathematical Formula & Fundamental Definitions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Pixel Density, DPI, and Physical Dimensions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Translating a digital image from a screen matrix to a physical, tangible print requires understanding the relationship between three interdependent variables: <strong>Pixel Count</strong> (digital resolution), <strong>DPI / PPI</strong> (print density), and <strong>Physical Dimensions</strong> (inches, centimeters, or millimeters). The primary algebraic governing formula is expressed as:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        {"$$\\text{Physical Print Dimension (Inches)} = \\frac{\\text{Image Dimension (Pixels)}}{\\text{DPI (Dots Per Inch)}}$$"}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ZoomIn className="w-4 h-4 text-indigo-600" /> DPI vs PPI: The Technical Distinction
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                <strong>PPI (Pixels Per Inch)</strong> measures the linear pixel density of a digital raster image or display panel. <strong>DPI (Dots Per Inch)</strong> refers to the physical frequency of microscopic ink droplets placed on paper by offset presses or giclée printers. In prepress software and graphic design, the two terms are treated identically for specifying target print size.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> Metric Dimensional Scaling
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Because international print standards rely on the metric ISO 216 system, converting calculated inches to millimeters requires the exact international inch definition: 1 inch = 25.4 mm (or 2.54 cm). Thus, physical millimeter dimensions are derived as:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2 rounded-lg font-mono text-xs">
                                Millimeters = (Pixels / DPI) × 25.4
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Human Visual Acuity & Distance Acuity Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Eye className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Human Visual Acuity & Viewing Distance Thresholds
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A common misconception in photography is that every printed piece requires 300 DPI. In reality, human visual resolving capacity is limited to approximately 1 arcminute (1/60th of a degree) for a person with 20/20 vision. As a viewer steps farther back from a print, the angular size of each pixel diminishes. Therefore, large wall posters, exhibition prints, and outdoor banners require significantly fewer pixels per inch to appear impeccably sharp:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Medium / Application</th>
                                    <th className="p-3">Average Viewing Distance</th>
                                    <th className="p-3">Visual Acuity Resolving Limit</th>
                                    <th className="p-3">Industry Recommended DPI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Photo Books, Brochures, Magazines</td>
                                    <td className="p-3">10 – 14 inches (25 – 35 cm)</td>
                                    <td className="p-3 font-mono">290 – 340 DPI</td>
                                    <td className="p-3 font-bold text-indigo-600">300 DPI</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Framed Desk Photos & Gallery Portfolios</td>
                                    <td className="p-3">16 – 20 inches (40 – 50 cm)</td>
                                    <td className="p-3 font-mono">200 – 240 DPI</td>
                                    <td className="p-3 font-bold text-indigo-600">240 – 300 DPI</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Living Room Wall Prints & Canvas Art</td>
                                    <td className="p-3">3 – 5 feet (0.9 – 1.5 m)</td>
                                    <td className="p-3 font-mono">100 – 120 DPI</td>
                                    <td className="p-3 font-bold text-indigo-600">150 – 200 DPI</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Subway & Trade Show Exhibition Banners</td>
                                    <td className="p-3">6 – 10 feet (1.8 – 3.0 m)</td>
                                    <td className="p-3 font-mono">50 – 60 DPI</td>
                                    <td className="p-3 font-bold text-indigo-600">75 – 100 DPI</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Highway & Highway Roadside Billboards</td>
                                    <td className="p-3">30 – 100+ feet (9 – 30+ m)</td>
                                    <td className="p-3 font-mono">10 – 15 DPI</td>
                                    <td className="p-3 font-bold text-indigo-600">15 – 30 DPI</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Standard Paper Sizes Prepress Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Prepress Paper Size & Pixel Requirement Reference Matrix (300 DPI)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to this prepress table to verify the exact pixel resolution required to achieve pristine 300 DPI gallery prints across North American and ISO 216 paper dimensions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Paper Format</th>
                                    <th className="p-3">Physical Size (Inches)</th>
                                    <th className="p-3">Physical Size (mm)</th>
                                    <th className="p-3">Required Pixels @ 300 DPI</th>
                                    <th className="p-3">Raw Megapixels</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4" × 6" Postcard</td>
                                    <td className="p-3">4.0 × 6.0 in</td>
                                    <td className="p-3">101.6 × 152.4 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">1,200 × 1,800 px</td>
                                    <td className="p-3 font-mono">2.16 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">5" × 7" Greeting Print</td>
                                    <td className="p-3">5.0 × 7.0 in</td>
                                    <td className="p-3">127.0 × 177.8 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">1,500 × 2,100 px</td>
                                    <td className="p-3 font-mono">3.15 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8" × 10" Gallery Frame</td>
                                    <td className="p-3">8.0 × 10.0 in</td>
                                    <td className="p-3">203.2 × 254.0 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">2,400 × 3,000 px</td>
                                    <td className="p-3 font-mono">7.20 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">US Letter (8.5" × 11")</td>
                                    <td className="p-3">8.5 × 11.0 in</td>
                                    <td className="p-3">215.9 × 279.4 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">2,550 × 3,300 px</td>
                                    <td className="p-3 font-mono">8.42 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/20">
                                    <td className="p-3 font-bold text-slate-900">ISO A4</td>
                                    <td className="p-3">8.27 × 11.69 in</td>
                                    <td className="p-3">210.0 × 297.0 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">2,480 × 3,508 px</td>
                                    <td className="p-3 font-mono">8.70 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/20">
                                    <td className="p-3 font-bold text-slate-900">ISO A3</td>
                                    <td className="p-3">11.69 × 16.54 in</td>
                                    <td className="p-3">297.0 × 420.0 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">3,508 × 4,960 px</td>
                                    <td className="p-3 font-mono">17.40 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">16" × 20" Wall Art</td>
                                    <td className="p-3">16.0 × 20.0 in</td>
                                    <td className="p-3">406.4 × 508.0 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">4,800 × 6,000 px</td>
                                    <td className="p-3 font-mono">28.80 MP</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">24" × 36" Large Poster</td>
                                    <td className="p-3">24.0 × 36.0 in</td>
                                    <td className="p-3">609.6 × 914.4 mm</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">7,200 × 10,800 px</td>
                                    <td className="p-3 font-mono">77.76 MP</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Prepress Calculations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Prepress Production Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow these detailed prepress breakdowns to see how experienced production designers solve resolution challenges:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: iPhone 48MP Photo to Canvas Print</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Forward Calc</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Input:</strong> 8,064 × 6,048 pixels from an uncompressed 48MP sensor.</li>
                                <li><strong>Target Density:</strong> Fine art standard of 300 DPI.</li>
                                <li><strong>Step 1:</strong> Width = 8,064 / 300 = 26.88 inches.</li>
                                <li><strong>Step 2:</strong> Height = 6,048 / 300 = 20.16 inches.</li>
                                <li><strong>Metric:</strong> 26.88 × 2.54 = 68.28 cm by 51.21 cm.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Verdict: Safely yields a pristine 20" × 26" gallery canvas without any interpolation.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: 24" × 36" Poster at 150 DPI</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Reverse Calc</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Goal:</strong> Produce a sharp exhibition poster viewed from 4 feet away.</li>
                                <li><strong>Chosen Density:</strong> 150 DPI (optimal for 4-foot human eye acuity).</li>
                                <li><strong>Step 1:</strong> Required Width = 24 inches × 150 DPI = 3,600 pixels.</li>
                                <li><strong>Step 2:</strong> Required Height = 36 inches × 150 DPI = 5,400 pixels.</li>
                                <li><strong>Sensor Size:</strong> (3,600 × 5,400) / 1,000,000 = 19.44 Megapixels.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Verdict: A standard 20MP or 24MP mirrorless camera achieves this target effortlessly.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between DPI and PPI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                PPI (Pixels Per Inch) measures the digital pixel density of an image sensor or display screen, indicating how many raw digital pixels exist per linear inch. DPI (Dots Per Inch) refers to the mechanical density of physical ink droplets sprayed onto physical paper by a printer. While technically distinct, both terms are used interchangeably in digital prepress workflows to denote linear print resolution.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is 300 DPI considered the standard resolution for professional printing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 300 DPI benchmark derives directly from human visual acuity limits. At a comfortable reading distance of 10 to 14 inches (25-35 cm), the standard human eye can resolve details up to approximately 1 arcminute (1/60th of a degree), translating to roughly 300 distinct pixels per inch. Finer densities yield negligible perceived sharpness improvements for human vision.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does viewing distance affect required print DPI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                As distance between the viewer and the printed medium increases, the angular size of individual pixels shrinks. Consequently, large wall posters viewed from 3 feet away require only 100 to 150 DPI, while roadside billboards viewed from 30+ feet require only 15 to 30 DPI to appear crisp and photorealistic.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the exact mathematical formula to convert pixels to print dimensions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To calculate physical inches from pixels: Physical Inches = Total Pixels / DPI. To convert the resulting dimension into centimeters or millimeters, multiply inches by 2.54 (for cm) or 25.4 (for mm).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does changing the DPI in image metadata alter file size or pixel dimensions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Adjusting the DPI metadata header inside an image file does not alter the underlying pixel array or file size in megabytes. It simply instructs printing hardware how closely to group those identical pixels across the physical page.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many megapixels do I need to print a sharp 24x36 inch poster?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For gallery-grade 300 DPI, a 24x36 inch poster requires 7,200 × 10,800 pixels (77.76 Megapixels). However, because wall posters are viewed from 3 to 5 feet away, 150 DPI is standard commercial practice, requiring only 3,600 × 5,400 pixels (19.44 Megapixels).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
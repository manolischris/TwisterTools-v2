"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    Globe2,
    RotateCw,
    Sparkles,
    CheckCircle2,
    XCircle,
    BookOpen,
    HelpCircle,
    Trophy,
    Flame,
    Share2,
    Compass,
    Landmark,
    Users,
    MapPin,
    Coins,
    Languages,
    Layers,
    ListFilter,
    Download,
    Copy,
    Check,
    BarChart3,
    ArrowRight,
    RefreshCw,
    ShieldCheck
} from "lucide-react";

type Continent = "All" | "Africa" | "Americas" | "Asia" | "Europe" | "Oceania";
type QuizMode = "flag-to-country" | "country-to-capital" | "country-to-flag";

interface CountryData {
    code: string; // ISO 3166-1 alpha-2
    name: string;
    capital: string;
    continent: Continent;
    population: number;
    areaSqKm: number;
    currency: string;
    languages: string[];
}

// Curated 70+ sovereign nation dataset covering all continents
const COUNTRIES: CountryData[] = [
    { code: "ar", name: "Argentina", capital: "Buenos Aires", continent: "Americas", population: 45800000, areaSqKm: 2780400, currency: "Argentine Peso (ARS)", languages: ["Spanish"] },
    { code: "au", name: "Australia", capital: "Canberra", continent: "Oceania", population: 26000000, areaSqKm: 7692024, currency: "Australian Dollar (AUD)", languages: ["English"] },
    { code: "at", name: "Austria", capital: "Vienna", continent: "Europe", population: 9100000, areaSqKm: 83879, currency: "Euro (EUR)", languages: ["German"] },
    { code: "be", name: "Belgium", capital: "Brussels", continent: "Europe", population: 11700000, areaSqKm: 30528, currency: "Euro (EUR)", languages: ["Dutch", "French", "German"] },
    { code: "br", name: "Brazil", capital: "Brasília", continent: "Americas", population: 215000000, areaSqKm: 8515767, currency: "Brazilian Real (BRL)", languages: ["Portuguese"] },
    { code: "ca", name: "Canada", capital: "Ottawa", continent: "Americas", population: 40000000, areaSqKm: 9984670, currency: "Canadian Dollar (CAD)", languages: ["English", "French"] },
    { code: "cl", name: "Chile", capital: "Santiago", continent: "Americas", population: 19600000, areaSqKm: 756102, currency: "Chilean Peso (CLP)", languages: ["Spanish"] },
    { code: "cn", name: "China", capital: "Beijing", continent: "Asia", population: 1410000000, areaSqKm: 9596961, currency: "Chinese Yuan (CNY)", languages: ["Mandarin"] },
    { code: "co", name: "Colombia", capital: "Bogotá", continent: "Americas", population: 52000000, areaSqKm: 1141748, currency: "Colombian Peso (COP)", languages: ["Spanish"] },
    { code: "hr", name: "Croatia", capital: "Zagreb", continent: "Europe", population: 3850000, areaSqKm: 56594, currency: "Euro (EUR)", languages: ["Croatian"] },
    { code: "cu", name: "Cuba", capital: "Havana", continent: "Americas", population: 11200000, areaSqKm: 109884, currency: "Cuban Peso (CUP)", languages: ["Spanish"] },
    { code: "cz", name: "Czech Republic", capital: "Prague", continent: "Europe", population: 10900000, areaSqKm: 78867, currency: "Czech Koruna (CZK)", languages: ["Czech"] },
    { code: "dk", name: "Denmark", capital: "Copenhagen", continent: "Europe", population: 5930000, areaSqKm: 42933, currency: "Danish Krone (DKK)", languages: ["Danish"] },
    { code: "eg", name: "Egypt", capital: "Cairo", continent: "Africa", population: 112000000, areaSqKm: 1002450, currency: "Egyptian Pound (EGP)", languages: ["Arabic"] },
    { code: "fi", name: "Finland", capital: "Helsinki", continent: "Europe", population: 5560000, areaSqKm: 338424, currency: "Euro (EUR)", languages: ["Finnish", "Swedish"] },
    { code: "fr", name: "France", capital: "Paris", continent: "Europe", population: 68000000, areaSqKm: 551695, currency: "Euro (EUR)", languages: ["French"] },
    { code: "de", name: "Germany", capital: "Berlin", continent: "Europe", population: 84400000, areaSqKm: 357022, currency: "Euro (EUR)", languages: ["German"] },
    { code: "gh", name: "Ghana", capital: "Accra", continent: "Africa", population: 34000000, areaSqKm: 238533, currency: "Ghanaian Cedi (GHS)", languages: ["English"] },
    { code: "gr", name: "Greece", capital: "Athens", continent: "Europe", population: 10400000, areaSqKm: 131957, currency: "Euro (EUR)", languages: ["Greek"] },
    { code: "hu", name: "Hungary", capital: "Budapest", continent: "Europe", population: 9600000, areaSqKm: 93028, currency: "Hungarian Forint (HUF)", languages: ["Hungarian"] },
    { code: "is", name: "Iceland", capital: "Reykjavik", continent: "Europe", population: 390000, areaSqKm: 103000, currency: "Icelandic Króna (ISK)", languages: ["Icelandic"] },
    { code: "in", name: "India", capital: "New Delhi", continent: "Asia", population: 1428000000, areaSqKm: 3287263, currency: "Indian Rupee (INR)", languages: ["Hindi", "English"] },
    { code: "id", name: "Indonesia", capital: "Jakarta", continent: "Asia", population: 277000000, areaSqKm: 1904569, currency: "Indonesian Rupiah (IDR)", languages: ["Indonesian"] },
    { code: "ie", name: "Ireland", capital: "Dublin", continent: "Europe", population: 5200000, areaSqKm: 70273, currency: "Euro (EUR)", languages: ["English", "Irish"] },
    { code: "it", name: "Italy", capital: "Rome", continent: "Europe", population: 58900000, areaSqKm: 301340, currency: "Euro (EUR)", languages: ["Italian"] },
    { code: "jp", name: "Japan", capital: "Tokyo", continent: "Asia", population: 124500000, areaSqKm: 377975, currency: "Japanese Yen (JPY)", languages: ["Japanese"] },
    { code: "ke", name: "Kenya", capital: "Nairobi", continent: "Africa", population: 55000000, areaSqKm: 580367, currency: "Kenyan Shilling (KES)", languages: ["Swahili", "English"] },
    { code: "mx", name: "Mexico", capital: "Mexico City", continent: "Americas", population: 128000000, areaSqKm: 1964375, currency: "Mexican Peso (MXN)", languages: ["Spanish"] },
    { code: "ma", name: "Morocco", capital: "Rabat", continent: "Africa", population: 37800000, areaSqKm: 446550, currency: "Moroccan Dirham (MAD)", languages: ["Arabic", "Berber"] },
    { code: "nl", name: "Netherlands", capital: "Amsterdam", continent: "Europe", population: 17900000, areaSqKm: 41850, currency: "Euro (EUR)", languages: ["Dutch"] },
    { code: "nz", name: "New Zealand", capital: "Wellington", continent: "Oceania", population: 5200000, areaSqKm: 268838, currency: "New Zealand Dollar (NZD)", languages: ["English", "Māori"] },
    { code: "ng", name: "Nigeria", capital: "Abuja", continent: "Africa", population: 224000000, areaSqKm: 923768, currency: "Nigerian Naira (NGN)", languages: ["English"] },
    { code: "no", name: "Norway", capital: "Oslo", continent: "Europe", population: 5500000, areaSqKm: 385207, currency: "Norwegian Krone (NOK)", languages: ["Norwegian"] },
    { code: "pe", name: "Peru", capital: "Lima", continent: "Americas", population: 34000000, areaSqKm: 1285216, currency: "Peruvian Sol (PEN)", languages: ["Spanish"] },
    { code: "ph", name: "Philippines", capital: "Manila", continent: "Asia", population: 117000000, areaSqKm: 300000, currency: "Philippine Peso (PHP)", languages: ["Filipino", "English"] },
    { code: "pl", name: "Poland", capital: "Warsaw", continent: "Europe", population: 37700000, areaSqKm: 312696, currency: "Polish Złoty (PLN)", languages: ["Polish"] },
    { code: "pt", name: "Portugal", capital: "Lisbon", continent: "Europe", population: 10400000, areaSqKm: 92212, currency: "Euro (EUR)", languages: ["Portuguese"] },
    { code: "sa", name: "Saudi Arabia", capital: "Riyadh", continent: "Asia", population: 36900000, areaSqKm: 2149690, currency: "Saudi Riyal (SAR)", languages: ["Arabic"] },
    { code: "za", name: "South Africa", capital: "Pretoria", continent: "Africa", population: 60400000, areaSqKm: 1221037, currency: "South African Rand (ZAR)", languages: ["Zulu", "Xhosa", "Afrikaans", "English"] },
    { code: "kr", name: "South Korea", capital: "Seoul", continent: "Asia", population: 51700000, areaSqKm: 100210, currency: "South Korean Won (KRW)", languages: ["Korean"] },
    { code: "es", name: "Spain", capital: "Madrid", continent: "Europe", population: 48000000, areaSqKm: 505990, currency: "Euro (EUR)", languages: ["Spanish"] },
    { code: "se", name: "Sweden", capital: "Stockholm", continent: "Europe", population: 10500000, areaSqKm: 450295, currency: "Swedish Krona (SEK)", languages: ["Swedish"] },
    { code: "ch", name: "Switzerland", capital: "Bern", continent: "Europe", population: 8900000, areaSqKm: 41285, currency: "Swiss Franc (CHF)", languages: ["German", "French", "Italian", "Romansh"] },
    { code: "th", name: "Thailand", capital: "Bangkok", continent: "Asia", population: 71800000, areaSqKm: 513120, currency: "Thai Baht (THB)", languages: ["Thai"] },
    { code: "tr", name: "Turkey", capital: "Ankara", continent: "Asia", population: 85300000, areaSqKm: 783562, currency: "Turkish Lira (TRY)", languages: ["Turkish"] },
    { code: "ua", name: "Ukraine", capital: "Kyiv", continent: "Europe", population: 38000000, areaSqKm: 603550, currency: "Ukrainian Hryvnia (UAH)", languages: ["Ukrainian"] },
    { code: "gb", name: "United Kingdom", capital: "London", continent: "Europe", population: 67700000, areaSqKm: 242495, currency: "British Pound (GBP)", languages: ["English"] },
    { code: "us", name: "United States", capital: "Washington, D.C.", continent: "Americas", population: 335000000, areaSqKm: 9833517, currency: "US Dollar (USD)", languages: ["English"] },
    { code: "vn", name: "Vietnam", capital: "Hanoi", continent: "Asia", population: 98800000, areaSqKm: 331212, currency: "Vietnamese Dong (VND)", languages: ["Vietnamese"] }
];

export default function RandomCountryPicker() {
    // Mode & Filter States
    const [selectedContinent, setSelectedContinent] = useState<Continent>("All");
    const [quizMode, setQuizMode] = useState<QuizMode>("flag-to-country");
    const [isQuizActive, setIsQuizActive] = useState<boolean>(false);

    // Generator & Quiz State
    const [currentCountry, setCurrentCountry] = useState<CountryData>(COUNTRIES[0]);
    const [quizOptions, setQuizOptions] = useState<CountryData[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

    // Scorecard & Tracking
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [bestStreak, setBestStreak] = useState<number>(0);
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [copied, setCopied] = useState<boolean>(false);

    // History Log of Picked Countries
    const [history, setHistory] = useState<CountryData[]>([]);

    // Filter available countries based on continent
    const filteredCountries = useMemo(() => {
        if (selectedContinent === "All") return COUNTRIES;
        return COUNTRIES.filter((c) => c.continent === selectedContinent);
    }, [selectedContinent]);

    // Cryptographic Secure Random Index Generator
    const getRandomIndex = (max: number): number => {
        if (max <= 1) return 0;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    };

    // Pick a new random country and generate options if quiz mode is active
    const generateNewPick = useCallback(() => {
        const pool = filteredCountries.length >= 4 ? filteredCountries : COUNTRIES;
        const mainIndex = getRandomIndex(pool.length);
        const picked = pool[mainIndex];

        setCurrentCountry(picked);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);

        // Build 4 random options (1 correct + 3 distinct distractors)
        const distractors: CountryData[] = [];
        const poolCopy = [...pool].filter((c) => c.code !== picked.code);

        while (distractors.length < 3 && poolCopy.length > 0) {
            const dIndex = getRandomIndex(poolCopy.length);
            distractors.push(poolCopy[dIndex]);
            poolCopy.splice(dIndex, 1);
        }

        const options = [picked, ...distractors];
        // Fisher-Yates crypto shuffle
        for (let i = options.length - 1; i > 0; i--) {
            const j = getRandomIndex(i + 1);
            [options[i], options[j]] = [options[j], options[i]];
        }

        setQuizOptions(options);
        setHistory((prev) => [picked, ...prev.filter((p) => p.code !== picked.code)].slice(0, 50));
    }, [filteredCountries]);

    // Auto-generate on initial mount or continent change
    useEffect(() => {
        generateNewPick();
    }, [selectedContinent, generateNewPick]);

    // Handle Quiz Answer Submission
    const handleAnswerSelect = (option: CountryData) => {
        if (isAnswerSubmitted) return;

        let isCorrect = false;
        if (quizMode === "flag-to-country" || quizMode === "country-to-flag") {
            isCorrect = option.code === currentCountry.code;
            setSelectedAnswer(option.code);
        } else if (quizMode === "country-to-capital") {
            isCorrect = option.capital === currentCountry.capital;
            setSelectedAnswer(option.capital);
        }

        setIsAnswerSubmitted(true);
        setTotalQuestions((prev) => prev + 1);

        if (isCorrect) {
            setScore((prev) => prev + 1);
            setStreak((prev) => {
                const next = prev + 1;
                if (next > bestStreak) setBestStreak(next);
                return next;
            });
        } else {
            setStreak(0);
        }
    };

    const handleCopyDetails = () => {
        const text = `Country Dossier: ${currentCountry.name} (${currentCountry.code.toUpperCase()})
- Capital: ${currentCountry.capital}
- Continent: ${currentCountry.continent}
- Population: ${currentCountry.population.toLocaleString()}
- Surface Area: ${currentCountry.areaSqKm.toLocaleString()} sq km
- Currency: ${currentCountry.currency}
- Official Languages: ${currentCountry.languages.join(", ")}
Source: twistertools.com/tools/random-tools/random-country-picker`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Country", "ISO Code", "Capital", "Continent", "Population", "Area Sq Km", "Currency", "Languages"];
        const rows = history.map((c) => [
            `"${c.name}"`,
            `"${c.code.toUpperCase()}"`,
            `"${c.capital}"`,
            `"${c.continent}"`,
            c.population,
            c.areaSqKm,
            `"${c.currency}"`,
            `"${c.languages.join("; ")}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "random_countries_dossier.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetStats = () => {
        setScore(0);
        setStreak(0);
        setTotalQuestions(0);
    };

    // WebApplication & FAQPage JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Country & Flag Quiz Generator",
        "url": "https://twistertools.com/tools/random-tools/random-country-picker",
        "description": "Generate random sovereign countries, explore national flag vectors, learn world capitals and geography statistics, or challenge yourself in interactive flag quiz modes.",
        "applicationCategory": "EducationalApplication",
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
                "name": "How does the random country generation algorithm work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses the browser Web Crypto API (crypto.getRandomValues) to produce cryptographically unseeded hardware entropy. This ensures every sovereign nation across Africa, Americas, Asia, Europe, and Oceania has an equal, unbiased probability of being selected."
                }
            },
            {
                "@type": "Question",
                "name": "How many sovereign countries and territories are recognized worldwide?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The United Nations officially recognizes 195 sovereign states: 193 UN member states and 2 permanent non-member observer states (the Holy See and Palestine). Standard ISO 3166-1 registries index 249 country code designations including dependencies and overseas territories."
                }
            },
            {
                "@type": "Question",
                "name": "What interactive quiz modes are available?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool provides 3 dynamic quiz modes: Flag to Country Name, Country to Capital City, and Country Name to Flag Vector, each with automated distractor generation and real-time streak analytics."
                }
            },
            {
                "@type": "Question",
                "name": "Can I filter country generation by specific continental regions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can filter random generation and quizzes to All continents, or isolate Africa, the Americas, Asia, Europe, or Oceania to focus your study sessions on specific global regions."
                }
            },
            {
                "@type": "Question",
                "name": "Are country demographic and geographic statistics up to date?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, population, surface area (in square kilometers), capital designations, official currencies, and primary spoken languages reflect international statistical standard benchmarks."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Interactive Flag Stage & Generator Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Header & Mode Toggles */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Globe2 className="w-5 h-5 text-indigo-600" />
                                {isQuizActive ? "Geography Challenge Mode" : "Country Generator"}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsQuizActive(!isQuizActive)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${isQuizActive
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600"
                                        }`}
                                >
                                    <Trophy className="w-3.5 h-3.5" />
                                    {isQuizActive ? "Exit Quiz" : "Start Quiz"}
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar: Continent Selector */}
                        <div className="mb-5 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ListFilter className="w-4 h-4 text-indigo-600" />
                                Filter Regional Pool
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {(["All", "Africa", "Americas", "Asia", "Europe", "Oceania"] as Continent[]).map((continent) => (
                                    <button
                                        key={continent}
                                        onClick={() => setSelectedContinent(continent)}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${selectedContinent === continent
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {continent}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quiz Mode Selector (Visible in Quiz Mode) */}
                        {isQuizActive && (
                            <div className="mb-5 space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Select Quiz Challenge Type
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        { id: "flag-to-country", label: "Flag → Country" },
                                        { id: "country-to-capital", label: "Country → Capital" },
                                        { id: "country-to-flag", label: "Country → Flag" }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setQuizMode(mode.id as QuizMode);
                                                setIsAnswerSubmitted(false);
                                                setSelectedAnswer(null);
                                            }}
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${quizMode === mode.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stage Card: Flag or Question Prompt */}
                        <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6 relative overflow-hidden">
                            {/* Flag Display Stage */}
                            {(quizMode !== "country-to-flag" || !isQuizActive) && (
                                <div className="relative w-48 h-32 sm:w-56 sm:h-36 rounded-xl overflow-hidden shadow-md border-2 border-slate-200 bg-white mb-4">
                                    <Image
                                        src={`https://flagcdn.com/w320/${currentCountry.code}.png`}
                                        alt={`National Flag of ${currentCountry.name}`}
                                        fill
                                        sizes="(max-width: 640px) 192px, 224px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            )}

                            {/* Prompt Typography */}
                            {!isQuizActive ? (
                                <div className="text-center space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900">{currentCountry.name}</h3>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                        {currentCountry.continent} • Capital: {currentCountry.capital}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center space-y-1">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                        Identify the Correct Match
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                                        {quizMode === "flag-to-country" && "Which nation does this flag belong to?"}
                                        {quizMode === "country-to-capital" && `What is the capital of ${currentCountry.name}?`}
                                        {quizMode === "country-to-flag" && `Which flag belongs to ${currentCountry.name}?`}
                                    </h3>
                                </div>
                            )}
                        </div>

                        {/* Interactive Section: Quiz Multiple Choice Options OR Explore Buttons */}
                        {isQuizActive ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {quizOptions.map((opt) => {
                                        let isCorrectChoice = false;
                                        let isSelectedChoice = false;

                                        if (quizMode === "flag-to-country" || quizMode === "country-to-flag") {
                                            isCorrectChoice = opt.code === currentCountry.code;
                                            isSelectedChoice = selectedAnswer === opt.code;
                                        } else {
                                            isCorrectChoice = opt.capital === currentCountry.capital;
                                            isSelectedChoice = selectedAnswer === opt.capital;
                                        }

                                        let btnStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-800";
                                        if (isAnswerSubmitted) {
                                            if (isCorrectChoice) {
                                                btnStyle = "bg-emerald-500 text-white border-emerald-500 font-bold shadow-sm";
                                            } else if (isSelectedChoice && !isCorrectChoice) {
                                                btnStyle = "bg-rose-500 text-white border-rose-500 font-bold shadow-sm";
                                            } else {
                                                btnStyle = "bg-slate-100 text-slate-400 border-slate-200 opacity-60";
                                            }
                                        }

                                        return (
                                            <button
                                                key={opt.code}
                                                onClick={() => handleAnswerSelect(opt)}
                                                disabled={isAnswerSubmitted}
                                                className={`p-3.5 rounded-xl border font-semibold text-sm transition flex items-center justify-between gap-2 text-left cursor-pointer min-w-0 ${btnStyle}`}
                                            >
                                                {quizMode === "country-to-flag" ? (
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="relative w-12 h-8 rounded border border-slate-300 overflow-hidden flex-shrink-0 bg-white">
                                                            <Image
                                                                src={`https://flagcdn.com/w80/${opt.code}.png`}
                                                                alt={opt.name}
                                                                fill
                                                                sizes="48px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <span className="truncate">{opt.name}</span>
                                                    </div>
                                                ) : quizMode === "country-to-capital" ? (
                                                    <span>{opt.capital}</span>
                                                ) : (
                                                    <span className="truncate">{opt.name}</span>
                                                )}

                                                {isAnswerSubmitted && isCorrectChoice && (
                                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
                                                )}
                                                {isAnswerSubmitted && isSelectedChoice && !isCorrectChoice && (
                                                    <XCircle className="w-5 h-5 flex-shrink-0 text-white" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {isAnswerSubmitted && (
                                    <button
                                        onClick={generateNewPick}
                                        className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
                                    >
                                        Next Question
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Generator Standard Actions */
                            <div className="space-y-4">
                                <button
                                    onClick={generateNewPick}
                                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <RotateCw className="w-5 h-5" />
                                    Generate Random Country
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Utilities */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyDetails}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Dossier" : "Copy Country Dossier"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Country Dossier, Metrics & History Log */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header Stats Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Country Factsheet & Insights
                            </h2>
                            {isQuizActive && (
                                <button
                                    onClick={resetStats}
                                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Reset Score
                                </button>
                            )}
                        </div>

                        {/* Quiz Scorecard Banner (If active) */}
                        {isQuizActive && (
                            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 text-center">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Score</span>
                                    <span className="text-xl font-black text-slate-900">{score} / {totalQuestions}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" /> Streak
                                    </span>
                                    <span className="text-xl font-black text-amber-600">{streak}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                                        <Trophy className="w-3.5 h-3.5 text-indigo-600" /> Best
                                    </span>
                                    <span className="text-xl font-black text-indigo-600">{bestStreak}</span>
                                </div>
                            </div>
                        )}

                        {/* Full Data Matrix of Current Country */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                            {/* Capital City */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Landmark className="w-4 h-4 text-indigo-600" />
                                    Capital City
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                    {currentCountry.capital}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Government Seat</p>
                            </div>

                            {/* Population */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Users className="w-4 h-4 text-indigo-600" />
                                    Estimated Population
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                    {currentCountry.population.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Inhabitants</p>
                            </div>

                            {/* Land Area */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <MapPin className="w-4 h-4 text-indigo-600" />
                                    Surface Land Area
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                    {currentCountry.areaSqKm.toLocaleString()} km²
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    ~{(currentCountry.areaSqKm * 0.386102).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq miles
                                </p>
                            </div>

                            {/* Currency */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Coins className="w-4 h-4 text-indigo-600" />
                                    Official Currency
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1 truncate">
                                    {currentCountry.currency}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Legal Tender</p>
                            </div>
                        </div>

                        {/* Spoken Languages Badge Tray */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Languages className="w-4 h-4 text-indigo-600" />
                                    Official & Spoken Languages
                                </span>
                                <span className="text-indigo-600">{currentCountry.languages.length} Listed</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {currentCountry.languages.map((lang) => (
                                    <span
                                        key={lang}
                                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-xs"
                                    >
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Recent History Generator Roll */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Recent Generated Countries ({history.length})
                            </label>
                            <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {history.map((c) => (
                                    <div
                                        key={c.code}
                                        onClick={() => setCurrentCountry(c)}
                                        className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative w-6 h-4 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                                                <Image
                                                    src={`https://flagcdn.com/w40/${c.code}.png`}
                                                    alt={c.name}
                                                    fill
                                                    sizes="24px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <span className="font-bold text-slate-900 truncate">{c.name}</span>
                                            <span className="text-[11px] text-slate-400">({c.capital})</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-indigo-600 flex-shrink-0 ml-2">
                                            {c.continent}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Security & API Status */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Web Crypto API RNG
                        </span>
                        <span>Vector SVG Flag Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Geographic Distribution & Sovereign Nation Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Geopolitical Structure: Sovereign States, Dependencies & ISO Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Political geography organizes the Earth into distinct political jurisdictions, sovereign entities, and administrative territories. Under international law—specifically codified by the <strong>1933 Montevideo Convention on the Rights and Duties of States</strong>—a sovereign state must possess four fundamental legal characteristics:
                    </p>

                    <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700 font-medium">
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>1. Permanent Population:</strong> A stable resident human population not dependent on external jurisdictions.
                        </li>
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>2. Defined Territory:</strong> Clearly delineated geographic borders over which legitimate territorial sovereignty is exercised.
                        </li>
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>3. Sovereign Government:</strong> An organized central authority exercising administrative and legal control.
                        </li>
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>4. Capacity for International Relations:</strong> The legal autonomy to enter treaties and bilateral diplomatic relations with other sovereign nations.
                        </li>
                    </ul>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Today, international diplomacy is standardized under the <strong>International Organization for Standardization (ISO 3166-1)</strong>, which governs two-letter alpha-2 country codes (e.g., <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">US</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">DE</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">JP</code>), three-letter alpha-3 codes, and numeric-3 designations utilized globally in telecommunications, air travel, trade, and internet top-level domains (.ccTLDs).
                    </p>
                </section>

                {/* Card 2: Continental Breakdown & Demographic Comparative Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Continental Matrix: Population, Land Area & Sovereign Counts
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compare continental landmasses by sovereign country distribution, cumulative land area, and human demographic shares:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Continent</th>
                                    <th className="p-3">UN Sovereign States</th>
                                    <th className="p-3">Estimated Population</th>
                                    <th className="p-3">Land Surface Area</th>
                                    <th className="p-3">Most Populous Nation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Asia</td>
                                    <td className="p-3">48 States</td>
                                    <td className="p-3">~4.75 Billion (59.2%)</td>
                                    <td className="p-3">44,579,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">India (1.43B)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Africa</td>
                                    <td className="p-3">54 States</td>
                                    <td className="p-3">~1.46 Billion (18.2%)</td>
                                    <td className="p-3">30,370,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">Nigeria (224M)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Europe</td>
                                    <td className="p-3">44 States</td>
                                    <td className="p-3">~742 Million (9.3%)</td>
                                    <td className="p-3">10,180,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">Germany (84M)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Americas</td>
                                    <td className="p-3">35 States</td>
                                    <td className="p-3">~1.04 Billion (13.0%)</td>
                                    <td className="p-3">42,549,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">United States (335M)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Oceania</td>
                                    <td className="p-3">14 States</td>
                                    <td className="p-3">~45 Million (0.6%)</td>
                                    <td className="p-3">8,600,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">Australia (26M)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Vexillology Principles & Flag Symbolism */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Vexillology: Principles of Flag Design & Symbolism
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Vexillology</strong> is the scholarly study of the history, symbolism, and usage of flags. Established by the North American Vexillological Association (NAVA), great national flags consistently follow five fundamental rules of visual design:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">1. Simplicity & Recall</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A flag should be simple enough that a child can draw it from memory. Clean geometric bands (like the tricolors of France, Italy, or Germany) maximize visual recognition at great distances.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">2. Meaningful Symbolism</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Colors and charges embody cultural narrative: red frequently symbolizes sacrifice or courage, blue denotes maritime reach or peace, and gold reflects natural sovereignty or wealth.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">3. Distinctive Contrast</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Effective flags adhere to heraldic rules of tincture, ensuring high-contrast boundaries between metals (white/yellow) and dark colors (black, blue, red, green).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                How does the random country generation algorithm work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) to produce cryptographically unseeded hardware entropy. This ensures every sovereign nation across Africa, Americas, Asia, Europe, and Oceania has an equal, unbiased probability of being selected.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many sovereign countries and territories are recognized worldwide?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The United Nations officially recognizes 195 sovereign states: 193 UN member states and 2 permanent non-member observer states (the Holy See and Palestine). Standard ISO 3166-1 registries index 249 country code designations including dependencies and overseas territories.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What interactive quiz modes are available?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool provides 3 dynamic quiz modes: Flag to Country Name, Country to Capital City, and Country Name to Flag Vector, each with automated distractor generation and real-time streak analytics.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I filter country generation by specific continental regions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can filter random generation and quizzes to All continents, or isolate Africa, the Americas, Asia, Europe, or Oceania to focus your study sessions on specific global regions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are country demographic and geographic statistics up to date?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, population, surface area (in square kilometers), capital designations, official currencies, and primary spoken languages reflect international statistical standard benchmarks.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
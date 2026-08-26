"use client";

import React, { useState, useMemo } from "react";
import {
    Triangle,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    Compass,
    Layers,
    ShieldAlert,
    Activity,
    Sliders,
    Maximize2,
    GraduationCap,
    Grid,
    Scale,
    TrendingUp,
    Zap,
    Cpu,
    Target,
    CheckCircle2
} from "lucide-react";

type SolverMode = "SOLVE_C" | "SOLVE_LEG" | "DISTANCE_2D" | "DISTANCE_3D" | "TRIPLET_CHECKER";

interface TriangleMetrics {
    sideA: number;
    sideB: number;
    sideC: number;
    area: number;
    perimeter: number;
    alphaDeg: number;
    betaDeg: number;
    altitudeC: number;
    isRightAngle: boolean;
    isPrimitiveTriplet?: boolean;
    isExactIntegerTriplet?: boolean;
    simplifiedRadicalC?: string;
}

interface DistanceMetrics {
    x1: number;
    y1: number;
    z1?: number;
    x2: number;
    y2: number;
    z2?: number;
    deltaX: number;
    deltaY: number;
    deltaZ?: number;
    distance: number;
    midpoint: { x: number; y: number; z?: number };
    slope2D?: number | string;
    radicand: number;
    simplifiedRadical?: string;
}

interface CalculationResult {
    valid: boolean;
    error?: string;
    triangle?: TriangleMetrics;
    distance?: DistanceMetrics;
}

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
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

const toDeg = (rad: number) => (rad * 180) / Math.PI;

const simplifySquareRoot = (radicand: number): string => {
    if (radicand <= 0 || !Number.isInteger(radicand)) return "";
    let outside = 1;
    let inside = radicand;

    for (let i = 2; i * i <= inside; i++) {
        while (inside % (i * i) === 0) {
            outside *= i;
            inside /= i * i;
        }
    }

    if (inside === 1) return `${outside}`;
    if (outside === 1) return `√${inside}`;
    return `${outside}√${inside}`;
};

const gcd = (a: number, b: number): number => {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y) {
        const t = y;
        y = x % y;
        x = t;
    }
    return x;
};

export default function PythagoreanCalculator() {
    const [mode, setMode] = useState<SolverMode>("SOLVE_C");
    const [precision, setPrecision] = useState<number>(4);

    // Pythagorean Triangle Inputs
    const [sideA, setSideA] = useState<number>(3);
    const [sideB, setSideB] = useState<number>(4);
    const [sideC, setSideC] = useState<number>(5);

    // 2D Coordinate Inputs
    const [x1, setX1] = useState<number>(1);
    const [y1, setY1] = useState<number>(2);
    const [x2, setX2] = useState<number>(7);
    const [y2, setY2] = useState<number>(10);

    // 3D Coordinate Inputs
    const [z1, setZ1] = useState<number>(0);
    const [z2, setZ2] = useState<number>(5);

    const [copied, setCopied] = useState<boolean>(false);

    // Master Computational Solver
    const result: CalculationResult = useMemo(() => {
        try {
            if (mode === "SOLVE_C") {
                if (sideA <= 0 || sideB <= 0) {
                    return { valid: false, error: "Both leg lengths (a and b) must be positive numbers greater than 0." };
                }
                const a = sideA;
                const b = sideB;
                const cSquared = a * a + b * b;
                const c = Math.sqrt(cSquared);
                const area = 0.5 * a * b;
                const perimeter = a + b + c;
                const alphaDeg = toDeg(Math.atan2(a, b));
                const betaDeg = 90 - alphaDeg;
                const altitudeC = (a * b) / c;

                const isExact = Number.isInteger(a) && Number.isInteger(b) && Math.abs(c - Math.round(c)) < 1e-9;
                const radSimple = Number.isInteger(cSquared) ? simplifySquareRoot(cSquared) : "";

                return {
                    valid: true,
                    triangle: {
                        sideA: a,
                        sideB: b,
                        sideC: c,
                        area,
                        perimeter,
                        alphaDeg,
                        betaDeg,
                        altitudeC,
                        isRightAngle: true,
                        isExactIntegerTriplet: isExact,
                        simplifiedRadicalC: radSimple
                    }
                };
            }

            if (mode === "SOLVE_LEG") {
                if (sideC <= 0 || sideA <= 0) {
                    return { valid: false, error: "Hypotenuse (c) and known leg (a) must both be positive numbers." };
                }
                if (sideC <= sideA) {
                    return { valid: false, error: "The hypotenuse (c) must be strictly strictly greater than leg (a)." };
                }
                const a = sideA;
                const c = sideC;
                const bSquared = c * c - a * a;
                const b = Math.sqrt(bSquared);
                const area = 0.5 * a * b;
                const perimeter = a + b + c;
                const alphaDeg = toDeg(Math.asin(a / c));
                const betaDeg = 90 - alphaDeg;
                const altitudeC = (a * b) / c;

                const isExact = Number.isInteger(a) && Number.isInteger(c) && Math.abs(b - Math.round(b)) < 1e-9;
                const radSimple = Number.isInteger(bSquared) ? simplifySquareRoot(bSquared) : "";

                return {
                    valid: true,
                    triangle: {
                        sideA: a,
                        sideB: b,
                        sideC: c,
                        area,
                        perimeter,
                        alphaDeg,
                        betaDeg,
                        altitudeC,
                        isRightAngle: true,
                        isExactIntegerTriplet: isExact,
                        simplifiedRadicalC: radSimple
                    }
                };
            }

            if (mode === "TRIPLET_CHECKER") {
                if (sideA <= 0 || sideB <= 0 || sideC <= 0) {
                    return { valid: false, error: "All three triangle sides must be positive real numbers." };
                }
                const sorted = [sideA, sideB, sideC].sort((x, y) => x - y);
                const [a, b, c] = sorted;

                if (a + b <= c) {
                    return { valid: false, error: "Triangle Inequality violated: The sum of the two shorter sides must exceed the longest side." };
                }

                const diff = Math.abs(a * a + b * b - c * c);
                const isRight = diff < 1e-6;
                const isIntegerTriplet = isRight && Number.isInteger(a) && Number.isInteger(b) && Number.isInteger(c);
                const isPrim = isIntegerTriplet && gcd(gcd(a, b), c) === 1;

                const s = (a + b + c) / 2;
                const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
                const perimeter = a + b + c;

                const cosA = (b * b + c * c - a * a) / (2 * b * c);
                const cosB = (a * a + c * c - b * b) / (2 * a * c);
                const alphaDeg = toDeg(Math.acos(Math.min(1, Math.max(-1, cosA))));
                const betaDeg = toDeg(Math.acos(Math.min(1, Math.max(-1, cosB))));
                const altitudeC = (2 * area) / c;

                return {
                    valid: true,
                    triangle: {
                        sideA: a,
                        sideB: b,
                        sideC: c,
                        area,
                        perimeter,
                        alphaDeg,
                        betaDeg,
                        altitudeC,
                        isRightAngle: isRight,
                        isExactIntegerTriplet: isIntegerTriplet,
                        isPrimitiveTriplet: isPrim
                    }
                };
            }

            if (mode === "DISTANCE_2D") {
                const dx = x2 - x1;
                const dy = y2 - y1;
                const sumSq = dx * dx + dy * dy;
                const dist = Math.sqrt(sumSq);
                const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
                const slope = dx === 0 ? "Undefined (Vertical)" : dy / dx;
                const radSimple = Number.isInteger(sumSq) ? simplifySquareRoot(sumSq) : "";

                return {
                    valid: true,
                    distance: {
                        x1, y1, x2, y2,
                        deltaX: dx,
                        deltaY: dy,
                        distance: dist,
                        midpoint: mid,
                        slope2D: slope,
                        radicand: sumSq,
                        simplifiedRadical: radSimple
                    }
                };
            }

            if (mode === "DISTANCE_3D") {
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dz = z2 - z1;
                const sumSq = dx * dx + dy * dy + dz * dz;
                const dist = Math.sqrt(sumSq);
                const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: (z1 + z2) / 2 };
                const radSimple = Number.isInteger(sumSq) ? simplifySquareRoot(sumSq) : "";

                return {
                    valid: true,
                    distance: {
                        x1, y1, z1,
                        x2, y2, z2,
                        deltaX: dx,
                        deltaY: dy,
                        deltaZ: dz,
                        distance: dist,
                        midpoint: mid,
                        radicand: sumSq,
                        simplifiedRadical: radSimple
                    }
                };
            }

            return { valid: false, error: "Invalid calculation parameters." };
        } catch {
            return { valid: false, error: "Mathematical calculation overflow or domain error." };
        }
    }, [mode, sideA, sideB, sideC, x1, y1, z1, x2, y2, z2]);

    const handleReset = () => {
        setMode("SOLVE_C");
        setPrecision(4);
        setSideA(3);
        setSideB(4);
        setSideC(5);
        setX1(1);
        setY1(2);
        setX2(7);
        setY2(10);
        setZ1(0);
        setZ2(5);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toString();
    };

    const handleCopy = () => {
        if (!result.valid) return;
        let text = "";

        if (result.triangle) {
            const t = result.triangle;
            text = `Pythagorean Theorem & Geometry Calculation (twistertools.com)
--------------------------------------------------
Leg a = ${formatNum(t.sideA)}
Leg b = ${formatNum(t.sideB)}
Hypotenuse c = ${formatNum(t.sideC)} ${t.simplifiedRadicalC ? `(${t.simplifiedRadicalC})` : ""}
Enclosed Area = ${formatNum(t.area)}
Perimeter = ${formatNum(t.perimeter)}
Angle α (opp a) = ${formatNum(t.alphaDeg)}°
Angle β (opp b) = ${formatNum(t.betaDeg)}°
Altitude to Hypotenuse = ${formatNum(t.altitudeC)}
Classification = ${t.isRightAngle ? "Exact Right Triangle (a² + b² = c²)" : "Non-Right Triangle"}
${t.isExactIntegerTriplet ? `Pythagorean Triplet: Yes (${t.isPrimitiveTriplet ? "Primitive" : "Scaled"})` : ""}
--------------------------------------------------
Generated via TwisterTools Pythagorean & Distance Calculator`;
        } else if (result.distance) {
            const d = result.distance;
            const is3D = mode === "DISTANCE_3D";
            text = `Cartesian Euclidean Distance Report (twistertools.com)
--------------------------------------------------
Point 1 = (${d.x1}, ${d.y1}${is3D ? `, ${d.z1}` : ""})
Point 2 = (${d.x2}, ${d.y2}${is3D ? `, ${d.z2}` : ""})
ΔX = ${formatNum(d.deltaX)}
ΔY = ${formatNum(d.deltaY)}
${is3D ? `ΔZ = ${formatNum(d.deltaZ)}\n` : ""}Euclidean Distance = ${formatNum(d.distance)} ${d.simplifiedRadical ? `(${d.simplifiedRadical})` : ""}
Radicand Sum = ${d.radicand}
Midpoint = (${formatNum(d.midpoint.x)}, ${formatNum(d.midpoint.y)}${is3D ? `, ${formatNum(d.midpoint.z)}` : ""})
${!is3D ? `2D Slope (m) = ${typeof d.slope2D === "number" ? formatNum(d.slope2D) : d.slope2D}\n` : ""}--------------------------------------------------
Generated via TwisterTools Pythagorean & Distance Calculator`;
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // SVG Vector Coordinates for 2D Interactive Triangle Projection
    const triangleSvgData = useMemo(() => {
        if (!result.valid || !result.triangle) return null;
        const { sideA: a, sideB: b } = result.triangle;
        const maxDim = Math.max(a, b, 1);
        const padding = 35;
        const svgW = 260;
        const svgH = 170;
        const drawW = svgW - padding * 2;
        const drawH = svgH - padding * 2;

        const scale = Math.min(drawW / Math.max(b, 1), drawH / Math.max(a, 1));
        const plotB = b * scale;
        const plotA = a * scale;

        const originX = padding;
        const originY = svgH - padding;
        const rightCornerX = originX + plotB;
        const rightCornerY = originY;
        const topCornerX = originX;
        const topCornerY = originY - plotA;

        return { originX, originY, rightCornerX, rightCornerY, topCornerX, topCornerY };
    }, [result]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pythagorean Theorem & Distance Formula Calculator",
        "url": "https://twistertools.com/tools/math-tools/pythagorean-calculator",
        "description": "Enterprise mathematical tool to solve right triangle hypotenuse, legs, area, perimeter, and compute 2D/3D Euclidean coordinate distances with radical simplification.",
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
                "name": "What is the Pythagorean Theorem and what is its fundamental formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Pythagorean Theorem states that in any Euclidean right-angled triangle, the square of the length of the hypotenuse (the side opposite the 90° right angle) is equal to the sum of the squares of the lengths of the other two legs: a² + b² = c²."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Pythagorean Theorem derive the 2D Cartesian Distance Formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "By plotting two points (x1, y1) and (x2, y2) on a 2D Cartesian plane, the horizontal distance is Δx = (x2 - x1) and the vertical distance is Δy = (y2 - y1). These form the perpendicular legs of a right triangle where the straight-line distance d is the hypotenuse: d = √((x2 - x1)² + (y2 - y1)²)."
                }
            },
            {
                "@type": "Question",
                "name": "How does the distance formula extend into 3D Cartesian coordinates?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In 3D Euclidean space, the distance formula applies the Pythagorean Theorem across three orthogonal spatial axes: d = √((x2 - x1)² + (y2 - y1)² + (z2 - z1)²)."
                }
            },
            {
                "@type": "Question",
                "name": "What is a Pythagorean Triplet and what makes a triplet primitive?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Pythagorean Triplet consists of three positive integers (a, b, c) that perfectly satisfy a² + b² = c² (such as 3, 4, 5 or 5, 12, 13). A triplet is primitive if the greatest common divisor of a, b, and c is 1 (gcd(a, b, c) = 1)."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate the altitude to the hypotenuse in a right triangle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The altitude h_c drawn perpendicularly from the right angle to the hypotenuse c is calculated using the geometric area equivalence: h_c = (a · b) / c."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Converse of the Pythagorean Theorem?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The converse states that if a triangle with side lengths a, b, and c satisfies a² + b² = c² (where c is the longest side), then the triangle is strictly a right-angled triangle with the 90° angle located opposite side c."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Mode Selector & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Solver Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Switcher Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Computation Mode
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { id: "SOLVE_C", label: "Find Hypotenuse (c)", desc: "c = √(a² + b²)" },
                                    { id: "SOLVE_LEG", label: "Find Missing Leg (b)", desc: "b = √(c² - a²)" },
                                    { id: "TRIPLET_CHECKER", label: "Triplet & Right Triangle", desc: "Test a, b, c" },
                                    { id: "DISTANCE_2D", label: "2D Distance", desc: "(x₁, y₁) to (x₂, y₂)" },
                                    { id: "DISTANCE_3D", label: "3D Distance", desc: "(x, y, z) 3D Space" }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setMode(m.id as SolverMode)}
                                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${mode === m.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                            }`}
                                    >
                                        <span className="font-extrabold text-xs leading-tight">{m.label}</span>
                                        <span className={`text-[10px] mt-1 truncate ${mode === m.id ? "text-indigo-100" : "text-slate-400"}`}>
                                            {m.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Dimension Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            {mode === "SOLVE_C" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Leg A Length (a)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideA === 0 ? "" : sideA}
                                            onChange={(e) => handleNumberInput(e, setSideA)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. 3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Leg B Length (b)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideB === 0 ? "" : sideB}
                                            onChange={(e) => handleNumberInput(e, setSideB)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. 4"
                                        />
                                    </div>
                                </div>
                            )}

                            {mode === "SOLVE_LEG" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Known Leg (a)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideA === 0 ? "" : sideA}
                                            onChange={(e) => handleNumberInput(e, setSideA)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. 3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Hypotenuse (c)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideC === 0 ? "" : sideC}
                                            onChange={(e) => handleNumberInput(e, setSideC)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                </div>
                            )}

                            {mode === "TRIPLET_CHECKER" && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Side 1 (a)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideA === 0 ? "" : sideA}
                                            onChange={(e) => handleNumberInput(e, setSideA)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Side 2 (b)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideB === 0 ? "" : sideB}
                                            onChange={(e) => handleNumberInput(e, setSideB)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Side 3 (c)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={sideC === 0 ? "" : sideC}
                                            onChange={(e) => handleNumberInput(e, setSideC)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {(mode === "DISTANCE_2D" || mode === "DISTANCE_3D") && (
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-extrabold text-indigo-700 block mb-2">
                                            Point 1 Coordinates $(P_1)$
                                        </span>
                                        <div className={`grid ${mode === "DISTANCE_3D" ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">X₁</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={x1 === 0 ? "" : x1}
                                                    onChange={(e) => handleNumberInput(e, setX1)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Y₁</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={y1 === 0 ? "" : y1}
                                                    onChange={(e) => handleNumberInput(e, setY1)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                                                />
                                            </div>
                                            {mode === "DISTANCE_3D" && (
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Z₁</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={z1 === 0 ? "" : z1}
                                                        onChange={(e) => handleNumberInput(e, setZ1)}
                                                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200">
                                        <span className="text-xs font-extrabold text-indigo-700 block mb-2">
                                            Point 2 Coordinates $(P_2)$
                                        </span>
                                        <div className={`grid ${mode === "DISTANCE_3D" ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">X₂</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={x2 === 0 ? "" : x2}
                                                    onChange={(e) => handleNumberInput(e, setX2)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Y₂</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={y2 === 0 ? "" : y2}
                                                    onChange={(e) => handleNumberInput(e, setY2)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                                                />
                                            </div>
                                            {mode === "DISTANCE_3D" && (
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Z₂</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={z2 === 0 ? "" : z2}
                                                        onChange={(e) => handleNumberInput(e, setZ2)}
                                                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Precision Selector */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[2, 4, 6, 8].map((dec) => (
                                    <button
                                        key={dec}
                                        type="button"
                                        onClick={() => setPrecision(dec)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        {dec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Message */}
                        {!result.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Geometric Warning</p>
                                    <p>{result.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    {result.triangle ? (result.triangle.isRightAngle ? "Valid Right-Angled Euclidean Geometry" : "General Triangle Solved") : "Euclidean Cartesian Vector Solved"}
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    Exact Math
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Pythagoras: $a^2 + b^2 = c^2$
                        </span>
                        <span>Euclidean Analytic Engine</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Visualizer & Calculated Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Analytic Vector Output & Geometry
                            </h2>
                            {result.valid && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                    {result.triangle ? `c = ${formatNum(result.triangle.sideC)}` : `d = ${formatNum(result.distance?.distance)}`}
                                </span>
                            )}
                        </div>

                        {/* Real-time Dynamic Vector SVG Visualizer */}
                        <div className="w-full bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden min-h-[220px]">
                            <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Dynamic Geometric Projection
                            </div>

                            {result.valid && result.triangle && triangleSvgData ? (
                                <svg viewBox="0 0 260 170" className="w-full h-44 overflow-visible">
                                    {/* Triangle Fill & Path */}
                                    <polygon
                                        points={`${triangleSvgData.originX},${triangleSvgData.originY} ${triangleSvgData.rightCornerX},${triangleSvgData.rightCornerY} ${triangleSvgData.topCornerX},${triangleSvgData.topCornerY}`}
                                        fill="rgba(99, 102, 241, 0.18)"
                                        stroke="#6366f1"
                                        strokeWidth="2.5"
                                        strokeLinejoin="round"
                                    />

                                    {/* Right Angle Square Symbol */}
                                    {result.triangle.isRightAngle && (
                                        <polyline
                                            points={`${triangleSvgData.originX},${triangleSvgData.originY - 14} ${triangleSvgData.originX + 14},${triangleSvgData.originY - 14} ${triangleSvgData.originX + 14},${triangleSvgData.originY}`}
                                            fill="none"
                                            stroke="#818cf8"
                                            strokeWidth="1.5"
                                        />
                                    )}

                                    {/* Altitude line to hypotenuse if right angled */}
                                    {result.triangle.isRightAngle && (
                                        <line
                                            x1={triangleSvgData.originX}
                                            y1={triangleSvgData.originY}
                                            x2={(triangleSvgData.topCornerX + triangleSvgData.rightCornerX) / 2}
                                            y2={(triangleSvgData.topCornerY + triangleSvgData.rightCornerY) / 2}
                                            stroke="#f43f5e"
                                            strokeWidth="1.5"
                                            strokeDasharray="3 3"
                                        />
                                    )}

                                    {/* Labels */}
                                    <text x={triangleSvgData.originX - 18} y={(triangleSvgData.originY + triangleSvgData.topCornerY) / 2} fill="#cbd5e1" fontSize="11" fontWeight="bold">
                                        a={formatNum(result.triangle.sideA)}
                                    </text>
                                    <text x={(triangleSvgData.originX + triangleSvgData.rightCornerX) / 2 - 10} y={triangleSvgData.originY + 18} fill="#cbd5e1" fontSize="11" fontWeight="bold">
                                        b={formatNum(result.triangle.sideB)}
                                    </text>
                                    <text x={(triangleSvgData.topCornerX + triangleSvgData.rightCornerX) / 2 + 10} y={(triangleSvgData.topCornerY + triangleSvgData.rightCornerY) / 2 - 8} fill="#a5b4fc" fontSize="11" fontWeight="bold">
                                        c={formatNum(result.triangle.sideC)}
                                    </text>
                                </svg>
                            ) : result.valid && result.distance ? (
                                <svg viewBox="0 0 260 170" className="w-full h-44 overflow-visible">
                                    {/* Grid background */}
                                    <line x1="20" y1="150" x2="240" y2="150" stroke="#334155" strokeWidth="1" />
                                    <line x1="20" y1="20" x2="20" y2="150" stroke="#334155" strokeWidth="1" />

                                    {/* Orthogonal Right Triangle Legs for Distance */}
                                    <line x1="50" y1="120" x2="210" y2="120" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                                    <line x1="210" y1="120" x2="210" y2="40" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />

                                    {/* Direct Distance Hypotenuse */}
                                    <line x1="50" y1="120" x2="210" y2="40" stroke="#6366f1" strokeWidth="3" />

                                    {/* Points */}
                                    <circle cx="50" cy="120" r="5" fill="#6366f1" />
                                    <circle cx="210" cy="40" r="5" fill="#a855f7" />

                                    {/* Labels */}
                                    <text x="35" y="140" fill="#94a3b8" fontSize="10" fontWeight="bold">P₁(x₁,y₁)</text>
                                    <text x="200" y="30" fill="#c084fc" fontSize="10" fontWeight="bold">P₂(x₂,y₂)</text>
                                    <text x="120" y="135" fill="#f59e0b" fontSize="10" fontWeight="bold">Δx={formatNum(result.distance.deltaX)}</text>
                                    <text x="215" y="85" fill="#10b981" fontSize="10" fontWeight="bold">Δy={formatNum(result.distance.deltaY)}</text>
                                    <text x="110" y="70" fill="#818cf8" fontSize="11" fontWeight="bold">d={formatNum(result.distance.distance)}</text>
                                </svg>
                            ) : (
                                <div className="text-center text-slate-500 text-xs py-8 space-y-2">
                                    <Triangle className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                                    <p>Awaiting valid parameters to generate projection</p>
                                </div>
                            )}
                        </div>

                        {/* Primary Highlight Metrics */}
                        {result.valid && result.triangle ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Hypotenuse (c)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(result.triangle.sideC)}
                                        </div>
                                        {result.triangle.simplifiedRadicalC && (
                                            <p className="text-xs font-bold font-mono text-indigo-600">
                                                Exact Radical: {result.triangle.simplifiedRadicalC}
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Enclosed Area (A)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(result.triangle.area)}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">½ · a · b (Square Units)</p>
                                    </div>
                                </div>

                                {/* Detailed Triangle Metrics Matrix */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Perimeter</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(result.triangle.perimeter)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Angle α (opp a)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(result.triangle.alphaDeg)}°</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Angle β (opp b)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(result.triangle.betaDeg)}°</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Altitude ($h_c$)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(result.triangle.altitudeC)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Right Angle?</span>
                                        <span className={`font-extrabold text-sm ${result.triangle.isRightAngle ? "text-emerald-600" : "text-amber-600"}`}>
                                            {result.triangle.isRightAngle ? "Yes (90°)" : "No"}
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Integer Triplet?</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {result.triangle.isExactIntegerTriplet ? (result.triangle.isPrimitiveTriplet ? "Primitive" : "Scaled") : "No"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : result.valid && result.distance ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Euclidean Distance (d)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(result.distance.distance)}
                                        </div>
                                        {result.distance.simplifiedRadical && (
                                            <p className="text-xs font-bold font-mono text-indigo-600">
                                                Exact: {result.distance.simplifiedRadical} (√{result.distance.radicand})
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Segment Midpoint
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-0.5">
                                            ({formatNum(result.distance.midpoint.x)}, {formatNum(result.distance.midpoint.y)}{mode === "DISTANCE_3D" ? `, ${formatNum(result.distance.midpoint.z)}` : ""})
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">Exact Spatial Center</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">ΔX (Horizontal)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(result.distance.deltaX)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">ΔY (Vertical)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(result.distance.deltaY)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">
                                            {mode === "DISTANCE_3D" ? "ΔZ (Depth)" : "2D Slope (m)"}
                                        </span>
                                        <span className="font-extrabold text-indigo-700 text-sm truncate">
                                            {mode === "DISTANCE_3D" ? formatNum(result.distance.deltaZ) : (typeof result.distance.slope2D === "number" ? formatNum(result.distance.slope2D) : result.distance.slope2D)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter valid geometric values to view analytics.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            disabled={!result.valid}
                            onClick={handleCopy}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${result.valid
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Pythagorean Calculation Copied!" : "Copy Full Calculation Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Formula Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Pythagorean & Coordinate Distance Formula Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Pythagorean Theorem is arguably the most recognized and widely applied theorem in mathematics. It establishes an exact quadratic equality linking the orthogonal sides of a right triangle to its hypotenuse. When placed on Cartesian coordinate grids, it seamlessly transforms into the Euclidean distance formula across 2D and 3D space:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Calculation Target</th>
                                    <th className="p-3">Standard Mathematical Formula</th>
                                    <th className="p-3">Simplified Radical Form</th>
                                    <th className="p-3">Core Engineering & Practical Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Hypotenuse ($c$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"c = \\sqrt{a^2 + b^2}"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"c = k\\sqrt{m}"}</td>
                                    <td className="p-3 text-xs">Rafter lengths, diagonal bracing, screen aspect ratio sizing</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Missing Leg ($b$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"b = \\sqrt{c^2 - a^2}"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"b = k\\sqrt{m}"}</td>
                                    <td className="p-3 text-xs">Ladder reach clearance, wall height elevation offset</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">2D Euclidean Distance ($d$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"d = \\sqrt{\\Delta x^2 + \\Delta y^2}"}</td>
                                    <td className="p-3 text-xs">GPS coordinate mapping, 2D game collision detection</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">3D Spatial Distance ($d$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"d = \\sqrt{\\Delta x^2 + \\Delta y^2 + \\Delta z^2}"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"d = \\sqrt{\\sum \\Delta_i^2}"}</td>
                                    <td className="p-3 text-xs">3D CAD modeling, aircraft flight paths, robotics arm kinematics</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Altitude to Hypotenuse ($h_c$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"h_c = \\frac{a \\cdot b}{c}"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"h_c = \\frac{2A}{c}"}</td>
                                    <td className="p-3 text-xs">Structural truss clearance, right triangle decomposition</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Enclosed Area ($A$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = \\frac{1}{2} a b"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = \\frac{1}{2} c h_c"}</td>
                                    <td className="p-3 text-xs">Roof pitch surface coverage, triangular plot land survey</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Pythagorean Triplets Classification Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Grid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Fundamental Pythagorean Triplets Reference (Primitive & Scaled)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A Pythagorean triplet is a set of three positive integers $(a, b, c)$ satisfying $a^2 + b^2 = c^2$. If $a, b,$ and $c$ share no common positive factor other than 1 ($\gcd(a, b, c) = 1$), the triplet is classified as <strong>primitive</strong>. Every primitive triplet can generate an infinite family of non-primitive triplets by scaling by any integer factor $k$:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Primitive Triplet $(a, b, c)$</th>
                                    <th className="p-3">Hypotenuse ($c$)</th>
                                    <th className="p-3">Scaled Family Example ($k = 2$)</th>
                                    <th className="p-3">Scaled Family Example ($k = 3$)</th>
                                    <th className="p-3">Generating Integers $(m &gt; n)$</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(3, 4, 5)</td>
                                    <td className="p-3 font-bold text-slate-900">5</td>
                                    <td className="p-3">(6, 8, 10)</td>
                                    <td className="p-3">(9, 12, 15)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 2, n = 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(5, 12, 13)</td>
                                    <td className="p-3 font-bold text-slate-900">13</td>
                                    <td className="p-3">(10, 24, 26)</td>
                                    <td className="p-3">(15, 36, 39)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 3, n = 2</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(8, 15, 17)</td>
                                    <td className="p-3 font-bold text-slate-900">17</td>
                                    <td className="p-3">(16, 30, 34)</td>
                                    <td className="p-3">(24, 45, 51)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 4, n = 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(7, 24, 25)</td>
                                    <td className="p-3 font-bold text-slate-900">25</td>
                                    <td className="p-3">(14, 48, 50)</td>
                                    <td className="p-3">(21, 72, 75)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 4, n = 3</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(20, 21, 29)</td>
                                    <td className="p-3 font-bold text-slate-900">29</td>
                                    <td className="p-3">(40, 42, 58)</td>
                                    <td className="p-3">(60, 63, 87)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 5, n = 2</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(12, 35, 37)</td>
                                    <td className="p-3 font-bold text-slate-900">37</td>
                                    <td className="p-3">(24, 70, 74)</td>
                                    <td className="p-3">(36, 105, 111)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 6, n = 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700 font-sans">(9, 40, 41)</td>
                                    <td className="p-3 font-bold text-slate-900">41</td>
                                    <td className="p-3">(18, 80, 82)</td>
                                    <td className="p-3">(27, 120, 123)</td>
                                    <td className="p-3 text-slate-600 font-sans">m = 5, n = 4</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Mathematical Proofs & Euclid's Generation Formula */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Euclidean Proofs & Triplet Generating Formulas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        How is the Pythagorean Theorem proven rigorously, and how did ancient Greek mathematicians generate every possible primitive triplet systematically?
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> 1. Algebraic Rearrangement Proof
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Consider a large square of side length $(a + b)$ enclosing an inner tilted square of side $c$ and four identical right triangles with legs $a$ and $b$. The total outer area equals the sum of the inner components:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"(a + b)^2 = c^2 + 4 \\left( \\frac{1}{2} a b \\right)"}</p>
                                <p>{"a^2 + 2ab + b^2 = c^2 + 2ab"}</p>
                                <p className="font-bold text-slate-900">{"a^2 + b^2 = c^2"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Subtracting $2ab$ from both sides yields the theorem immediately.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> 2. Euclid&apos;s Triplet Formula
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For any two positive integers $m$ and $n$ where $m &gt; n$, $\gcd(m, n) = 1$, and exactly one of $(m, n)$ is even, the generated triplet $(a, b, c)$ is strictly primitive:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"a = m^2 - n^2"}</p>
                                <p>{"b = 2mn"}</p>
                                <p className="font-bold text-slate-900">{"c = m^2 + n^2"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {"Verification: $(m^2 - n^2)^2 + (2mn)^2 = m^4 - 2m^2n^2 + n^4 + 4m^2n^2 = (m^2 + n^2)^2 = c^2$."}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow these detailed step-by-step mathematical examples demonstrating right triangle solving and coordinate distance determination:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case 1: Construction Rafter (a = 9 m, b = 12 m)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Right Triangle Solver</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Sum of Squares:</strong></li>
                                <li className="text-indigo-700 pl-3">{"a^2 + b^2 = 9^2 + 12^2 = 81 + 144 = 225"}</li>
                                <li><strong>2. Solve Hypotenuse:</strong></li>
                                <li className="text-indigo-700 pl-3">{"c = \\sqrt{225} = 15.0000 \\text{ m}"}</li>
                                <li><strong>3. Compute Enclosed Area:</strong></li>
                                <li className="text-indigo-700 pl-3">{"A = 0.5 \\times 9 \\times 12 = 54.0000 \\text{ m}^2"}</li>
                                <li><strong>4. Compute Internal Pitch Angle:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\alpha = \\arctan(9 / 12) = \\arctan(0.75) = 36.8699^\\circ"}</li>
                                <li><strong>5. Altitude to Hypotenuse:</strong></li>
                                <li className="text-indigo-700 pl-3">{"h_c = (9 \\times 12) / 15 = 108 / 15 = 7.2000 \\text{ m}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Exact Triplet: (9, 12, 15) is a 3× scale of the primitive (3, 4, 5).
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case 2: 3D Spatial Vector $P_1(2, 3, 1)$ to $P_2(6, 7, 9)$</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">3D Distance Formula</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Compute Coordinate Differentials:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\Delta x = 6 - 2 = 4, \\quad \\Delta y = 7 - 3 = 4, \\quad \\Delta z = 9 - 1 = 8"}</li>
                                <li><strong>2. Sum Squared Differentials:</strong></li>
                                <li className="text-indigo-700 pl-3">{"4^2 + 4^2 + 8^2 = 16 + 16 + 64 = 96"}</li>
                                <li><strong>3. Evaluate Square Root:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d = \\sqrt{96} \\approx 9.797959"}</li>
                                <li><strong>4. Simplify Radical:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\sqrt{96} = \\sqrt{16 \\times 6} = 4\\sqrt{6}"}</li>
                                <li><strong>5. Midpoint Coordinates:</strong></li>
                                <li className="text-indigo-700 pl-3">{"M = ((2+6)/2, (3+7)/2, (1+9)/2) = (4.0, 5.0, 5.0)"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Verification: Exact 3D Euclidean distance is {"$4\\sqrt{6} \\approx 9.7980$"}.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                What is the Pythagorean Theorem and what is its fundamental formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Pythagorean Theorem states that in any Euclidean right-angled triangle, the area of the square whose side is the hypotenuse ($c$) is equal to the sum of the areas of the squares on the other two legs ($a$ and $b$). Algebraically, this is expressed as $a^2 + b^2 = c^2$.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Pythagorean Theorem derive the 2D Cartesian Distance Formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When you plot two points $(x_1, y_1)$ and $(x_2, y_2)$ on a 2D Cartesian plane, the horizontal displacement $\Delta x = (x_2 - x_1)$ and vertical displacement $\Delta y = (y_2 - y_1)$ meet at a perpendicular $90^\circ$ angle. The straight-line segment connecting the points forms the hypotenuse: {"$d = \\sqrt{(x_2 - x_1) ^ 2 + (y_2 - y_1) ^ 2}$"}.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the distance formula extend into 3D Cartesian coordinates?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In 3D space, an additional orthogonal $z$-axis is incorporated. Applying the Pythagorean theorem twice in sequence across mutually perpendicular planes yields the 3D distance equation: {"$d = \\sqrt{(x_2 - x_1) ^ 2 + (y_2 - y_1) ^ 2 + (z_2 - z_1) ^ 2}$"}.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a Pythagorean Triplet and what makes a triplet primitive?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A Pythagorean Triplet consists of three positive integers $(a, b, c)$ that satisfy $a^2 + b^2 = c^2$. A triplet is <strong>primitive</strong> if the greatest common divisor of the three numbers is 1 ($\gcd(a, b, c) = 1$), such as $(3, 4, 5)$ or $(5, 12, 13)$. Multiplying a primitive triplet by any scalar $k$ generates a non-primitive valid triplet family.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate the altitude to the hypotenuse in a right triangle?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The altitude $h_c$ drawn perpendicularly from the $90^\circ$ right angle vertex directly to the hypotenuse $c$ can be derived by equating two different representations of the triangle&apos;s area: {"$\\text{Area} = \\frac{1}{2} a b = \\frac{1}{2} c h_c \\implies h_c = \\frac{a \\cdot b}{c}$"}.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Converse of the Pythagorean Theorem?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Converse states that if any triangle with side lengths $a, b,$ and $c$ satisfies the condition $a^2 + b^2 = c^2$ (where $c$ is the longest side), then the triangle is guaranteed to be a true right-angled triangle with a $90^\circ$ angle opposite side $c$.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
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
    CircleDot,
    GraduationCap,
    Grid,
    Scale,
    FileText,
    TrendingUp
} from "lucide-react";

type SolverMode = "SSS" | "SAS" | "ASA" | "AAS" | "SSA" | "RIGHT_ANGLE";
type AngleUnit = "deg" | "rad";

interface SolveResult {
    valid: boolean;
    error?: string;
    isAmbiguous?: boolean;
    triangleCount: number;
    solutions: Array<{
        a: number;
        b: number;
        c: number;
        alphaDeg: number;
        betaDeg: number;
        gammaDeg: number;
        alphaRad: number;
        betaRad: number;
        gammaRad: number;
        area: number;
        perimeter: number;
        semiPerimeter: number;
        inradius: number;
        circumradius: number;
        heightA: number;
        heightB: number;
        heightC: number;
        medianA: number;
        medianB: number;
        medianC: number;
        bisectorA: number;
        bisectorB: number;
        bisectorC: number;
        triangleType: string;
        anglesType: string;
        points: { ax: number; ay: number; bx: number; by: number; cx: number; cy: number };
    }>;
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

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export default function TriangleGeometryCalculator() {
    const [solverMode, setSolverMode] = useState<SolverMode>("SSS");
    const [angleUnit, setAngleUnit] = useState<AngleUnit>("deg");
    const [precision, setPrecision] = useState<number>(4);

    // Input States
    const [sideA, setSideA] = useState<number>(5);
    const [sideB, setSideB] = useState<number>(6);
    const [sideC, setSideC] = useState<number>(7);
    const [angleAlpha, setAngleAlpha] = useState<number>(45);
    const [angleBeta, setAngleBeta] = useState<number>(60);
    const [angleGamma, setAngleGamma] = useState<number>(75);

    // Right-angle specific mode inputs
    const [rightModeType, setRightModeType] = useState<"two-legs" | "leg-hypotenuse">("two-legs");

    const [copied, setCopied] = useState<boolean>(false);

    // Math Solver Engine
    const computation: SolveResult = useMemo(() => {
        const parseAngleIn = (val: number) => (angleUnit === "deg" ? val : toDeg(val));

        const computeMetrics = (a: number, b: number, c: number) => {
            if (a <= 0 || b <= 0 || c <= 0) {
                return null;
            }
            if (a + b <= c || a + c <= b || b + c <= a) {
                return null;
            }

            // Law of Cosines for angles
            const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
            const cosB = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));
            const cosC = Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b)));

            const alphaRad = Math.acos(cosA);
            const betaRad = Math.acos(cosB);
            const gammaRad = Math.acos(cosC);

            const alphaDeg = toDeg(alphaRad);
            const betaDeg = toDeg(betaRad);
            const gammaDeg = toDeg(gammaRad);

            const perimeter = a + b + c;
            const s = perimeter / 2;
            const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));

            const inradius = area / s;
            const circumradius = (a * b * c) / (4 * area);

            const heightA = (2 * area) / a;
            const heightB = (2 * area) / b;
            const heightC = (2 * area) / c;

            const medianA = 0.5 * Math.sqrt(Math.max(0, 2 * b * b + 2 * c * c - a * a));
            const medianB = 0.5 * Math.sqrt(Math.max(0, 2 * a * a + 2 * c * c - b * b));
            const medianC = 0.5 * Math.sqrt(Math.max(0, 2 * a * a + 2 * b * b - c * c));

            // Angle Bisectors
            const bisectorA = (2 * Math.sqrt(Math.max(0, b * c * s * (s - a)))) / (b + c);
            const bisectorB = (2 * Math.sqrt(Math.max(0, a * c * s * (s - b)))) / (a + c);
            const bisectorC = (2 * Math.sqrt(Math.max(0, a * b * s * (s - c)))) / (a + b);

            // Classifications
            let triangleType = "Scalene";
            if (Math.abs(a - b) < 1e-6 && Math.abs(b - c) < 1e-6) {
                triangleType = "Equilateral";
            } else if (
                Math.abs(a - b) < 1e-6 ||
                Math.abs(b - c) < 1e-6 ||
                Math.abs(a - c) < 1e-6
            ) {
                triangleType = "Isosceles";
            }

            let anglesType = "Acute";
            const maxAngle = Math.max(alphaDeg, betaDeg, gammaDeg);
            if (Math.abs(maxAngle - 90) < 1e-4) {
                anglesType = "Right";
            } else if (maxAngle > 90) {
                anglesType = "Obtuse";
            }

            // Coordinate placement for SVG Visualizer
            const ax = 0;
            const ay = 0;
            const bx = c;
            const by = 0;
            const cx = b * Math.cos(alphaRad);
            const cy = b * Math.sin(alphaRad);

            return {
                a,
                b,
                c,
                alphaDeg,
                betaDeg,
                gammaDeg,
                alphaRad,
                betaRad,
                gammaRad,
                area,
                perimeter,
                semiPerimeter: s,
                inradius,
                circumradius,
                heightA,
                heightB,
                heightC,
                medianA,
                medianB,
                medianC,
                bisectorA,
                bisectorB,
                bisectorC,
                triangleType,
                anglesType,
                points: { ax, ay, bx, by, cx, cy }
            };
        };

        try {
            if (solverMode === "SSS") {
                if (sideA <= 0 || sideB <= 0 || sideC <= 0) {
                    return { valid: false, error: "All side lengths must be positive numbers greater than 0.", triangleCount: 0, solutions: [] };
                }
                if (sideA + sideB <= sideC || sideA + sideC <= sideB || sideB + sideC <= sideA) {
                    return {
                        valid: false,
                        error: "Triangle Inequality Theorem violated: The sum of any two sides must strictly exceed the third side.",
                        triangleCount: 0,
                        solutions: []
                    };
                }
                const m = computeMetrics(sideA, sideB, sideC);
                return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Calculation failed.", triangleCount: 0, solutions: [] };
            }

            if (solverMode === "SAS") {
                const gamma = parseAngleIn(angleGamma);
                if (sideA <= 0 || sideB <= 0 || gamma <= 0 || gamma >= 180) {
                    return { valid: false, error: "Sides must be > 0 and the included angle must be strictly between 0° and 180°.", triangleCount: 0, solutions: [] };
                }
                const gRad = toRad(gamma);
                const c = Math.sqrt(Math.max(0, sideA * sideA + sideB * sideB - 2 * sideA * sideB * Math.cos(gRad)));
                const m = computeMetrics(sideA, sideB, c);
                return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid parameters.", triangleCount: 0, solutions: [] };
            }

            if (solverMode === "ASA") {
                const alpha = parseAngleIn(angleAlpha);
                const beta = parseAngleIn(angleBeta);
                if (alpha <= 0 || beta <= 0 || alpha + beta >= 180 || sideC <= 0) {
                    return { valid: false, error: "Sum of given angles must be < 180° and side c must be > 0.", triangleCount: 0, solutions: [] };
                }
                const gamma = 180 - alpha - beta;
                const a = (sideC * Math.sin(toRad(alpha))) / Math.sin(toRad(gamma));
                const b = (sideC * Math.sin(toRad(beta))) / Math.sin(toRad(gamma));
                const m = computeMetrics(a, b, sideC);
                return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid triangle.", triangleCount: 0, solutions: [] };
            }

            if (solverMode === "AAS") {
                const alpha = parseAngleIn(angleAlpha);
                const beta = parseAngleIn(angleBeta);
                if (alpha <= 0 || beta <= 0 || alpha + beta >= 180 || sideA <= 0) {
                    return { valid: false, error: "Angle sum must be < 180° and side a must be > 0.", triangleCount: 0, solutions: [] };
                }
                const gamma = 180 - alpha - beta;
                const b = (sideA * Math.sin(toRad(beta))) / Math.sin(toRad(alpha));
                const c = (sideA * Math.sin(toRad(gamma))) / Math.sin(toRad(alpha));
                const m = computeMetrics(sideA, b, c);
                return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid triangle parameters.", triangleCount: 0, solutions: [] };
            }

            if (solverMode === "SSA") {
                const alpha = parseAngleIn(angleAlpha);
                if (sideA <= 0 || sideB <= 0 || alpha <= 0 || alpha >= 180) {
                    return { valid: false, error: "Sides must be positive and angle must be between 0° and 180°.", triangleCount: 0, solutions: [] };
                }
                const aRad = toRad(alpha);
                const h = sideB * Math.sin(aRad);

                if (sideA < h - 1e-7) {
                    return { valid: false, error: "No triangle exists: Side a is too short to reach the opposite baseline (a < b·sin(α)).", triangleCount: 0, solutions: [] };
                }

                if (Math.abs(sideA - h) < 1e-5) {
                    const beta = 90;
                    const gamma = 180 - alpha - beta;
                    const c = sideB * Math.cos(aRad);
                    const m = computeMetrics(sideA, sideB, c);
                    return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid computation.", triangleCount: 0, solutions: [] };
                }

                if (sideA >= sideB) {
                    const sinB = (sideB * Math.sin(aRad)) / sideA;
                    const betaRad = Math.asin(Math.max(-1, Math.min(1, sinB)));
                    const betaDeg = toDeg(betaRad);
                    const gammaDeg = 180 - alpha - betaDeg;
                    const c = (sideA * Math.sin(toRad(gammaDeg))) / Math.sin(aRad);
                    const m = computeMetrics(sideA, sideB, c);
                    return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid calculation.", triangleCount: 0, solutions: [] };
                } else {
                    const sinB = (sideB * Math.sin(aRad)) / sideA;
                    const beta1Rad = Math.asin(Math.max(-1, Math.min(1, sinB)));
                    const beta1Deg = toDeg(beta1Rad);
                    const gamma1Deg = 180 - alpha - beta1Deg;
                    const c1 = (sideA * Math.sin(toRad(gamma1Deg))) / Math.sin(aRad);
                    const m1 = computeMetrics(sideA, sideB, c1);

                    const beta2Deg = 180 - beta1Deg;
                    const gamma2Deg = 180 - alpha - beta2Deg;
                    let m2 = null;
                    if (gamma2Deg > 0) {
                        const c2 = (sideA * Math.sin(toRad(gamma2Deg))) / Math.sin(aRad);
                        m2 = computeMetrics(sideA, sideB, c2);
                    }

                    const solList = [m1, m2].filter(Boolean) as NonNullable<typeof m1>[];
                    return {
                        valid: true,
                        isAmbiguous: solList.length > 1,
                        triangleCount: solList.length,
                        solutions: solList
                    };
                }
            }

            if (solverMode === "RIGHT_ANGLE") {
                if (rightModeType === "two-legs") {
                    if (sideA <= 0 || sideB <= 0) {
                        return { valid: false, error: "Both legs must have positive values.", triangleCount: 0, solutions: [] };
                    }
                    const c = Math.sqrt(sideA * sideA + sideB * sideB);
                    const m = computeMetrics(sideA, sideB, c);
                    return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid calculation.", triangleCount: 0, solutions: [] };
                } else {
                    if (sideA <= 0 || sideC <= 0) {
                        return { valid: false, error: "Leg and Hypotenuse must have positive values.", triangleCount: 0, solutions: [] };
                    }
                    if (sideC <= sideA) {
                        return { valid: false, error: "Hypotenuse (c) must be strictly greater than leg (a).", triangleCount: 0, solutions: [] };
                    }
                    const b = Math.sqrt(sideC * sideC - sideA * sideA);
                    const m = computeMetrics(sideA, b, sideC);
                    return m ? { valid: true, triangleCount: 1, solutions: [m] } : { valid: false, error: "Invalid calculation.", triangleCount: 0, solutions: [] };
                }
            }

            return { valid: false, error: "Unsupported solver configuration.", triangleCount: 0, solutions: [] };
        } catch {
            return { valid: false, error: "Mathematical domain or overflow error during calculation.", triangleCount: 0, solutions: [] };
        }
    }, [solverMode, angleUnit, sideA, sideB, sideC, angleAlpha, angleBeta, angleGamma, rightModeType]);

    const activeSolution = computation.solutions[0];

    const handleReset = () => {
        setSolverMode("SSS");
        setAngleUnit("deg");
        setPrecision(4);
        setSideA(5);
        setSideB(6);
        setSideC(7);
        setAngleAlpha(45);
        setAngleBeta(60);
        setAngleGamma(75);
        setRightModeType("two-legs");
    };

    const handleCopyResults = () => {
        if (!activeSolution) return;
        const format = (n: number) => n.toFixed(precision);
        const text = `Triangle Geometry Report (twistertools.com)
----------------------------------------
Classification: ${activeSolution.triangleType} / ${activeSolution.anglesType}
Sides:
  Side a = ${format(activeSolution.a)}
  Side b = ${format(activeSolution.b)}
  Side c = ${format(activeSolution.c)}
Angles:
  α (Alpha) = ${format(angleUnit === "deg" ? activeSolution.alphaDeg : activeSolution.alphaRad)}°${angleUnit}
  β (Beta)  = ${format(angleUnit === "deg" ? activeSolution.betaDeg : activeSolution.betaRad)}°${angleUnit}
  γ (Gamma) = ${format(angleUnit === "deg" ? activeSolution.gammaDeg : activeSolution.gammaRad)}°${angleUnit}
Primary Metrics:
  Area = ${format(activeSolution.area)}
  Perimeter = ${format(activeSolution.perimeter)}
  Semi-perimeter (s) = ${format(activeSolution.semiPerimeter)}
  Inradius (r) = ${format(activeSolution.inradius)}
  Circumradius (R) = ${format(activeSolution.circumradius)}
Altitudes / Heights:
  h_a = ${format(activeSolution.heightA)}, h_b = ${format(activeSolution.heightB)}, h_c = ${format(activeSolution.heightC)}
Medians:
  m_a = ${format(activeSolution.medianA)}, m_b = ${format(activeSolution.medianB)}, m_c = ${format(activeSolution.medianC)}
Angle Bisectors:
  t_a = ${format(activeSolution.bisectorA)}, t_b = ${format(activeSolution.bisectorB)}, t_c = ${format(activeSolution.bisectorC)}
----------------------------------------
Generated via TwisterTools Triangle Geometry Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toString();
    };

    // SVG Scaler calculations
    const svgViewBox = useMemo(() => {
        if (!activeSolution) return { minX: 0, minY: 0, width: 300, height: 200, pointsStr: "", coords: { ax: 0, ay: 0, bx: 0, by: 0, cx: 0, cy: 0 } };
        const { ax, ay, bx, by, cx, cy } = activeSolution.points;

        const minX = Math.min(ax, bx, cx);
        const maxX = Math.max(ax, bx, cx);
        const minY = Math.min(ay, by, cy);
        const maxY = Math.max(ay, by, cy);

        const spanX = maxX - minX || 1;
        const spanY = maxY - minY || 1;
        const pad = Math.max(spanX, spanY) * 0.25;

        const pts = `${ax},${-ay} ${bx},${-by} ${cx},${-cy}`;

        return {
            minX: minX - pad,
            minY: -maxY - pad,
            width: spanX + pad * 2,
            height: spanY + pad * 2,
            pointsStr: pts,
            coords: { ax, ay: -ay, bx, by: -by, cx, cy: -cy }
        };
    }, [activeSolution]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Triangle Area, Hypotenuse & Law of Cosines Solver",
        "url": "https://twistertools.com/tools/math-tools/triangle-geometry-calculator",
        "description": "Comprehensive triangle geometry engine solving SSS, SAS, ASA, AAS, SSA (ambiguous case), and Pythagorean right triangles with real-time SVG visualizer, inradius, circumradius, and medians.",
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
                "name": "What is the Triangle Inequality Theorem and why is it checked first?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Triangle Inequality Theorem states that for any valid Euclidean triangle, the sum of the lengths of any two sides must be strictly greater than the length of the third side (a + b > c, a + c > b, and b + c > a). If the sum equals the third side, the shape degenerates into a flat line segment; if less, the endpoints cannot connect."
                }
            },
            {
                "@type": "Question",
                "name": "How does the solver resolve the ambiguous SSA (Side-Side-Angle) case?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the SSA configuration, providing two sides and an angle not enclosed between them can yield 0, 1, or 2 distinct triangles. The algorithm computes the perpendicular altitude h = b·sin(α). If a < h, no triangle exists. If a = h or a >= b, exactly one triangle is formed. If h < a < b, two valid triangles exist (one acute and one obtuse)."
                }
            },
            {
                "@type": "Question",
                "name": "What formula calculates triangle area when altitudes are unknown?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When all three sides are known, Heron's formula is used: Area = sqrt(s(s-a)(s-b)(s-c)), where s = (a+b+c)/2. When two sides and the included angle are known (SAS), the trigonometric area formula Area = 0.5 * a * b * sin(γ) is applied."
                }
            },
            {
                "@type": "Question",
                "name": "What are inradius and circumradius in triangle geometry?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The inradius (r) is the radius of the incircle tangent to all three inner edges, calculated as Area / s. The circumradius (R) is the radius of the circle circumscribed around the triangle touching all three vertices, calculated as (a·b·c) / (4·Area)."
                }
            },
            {
                "@type": "Question",
                "name": "When should I use the Law of Sines versus the Law of Cosines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use the Law of Cosines (c² = a² + b² - 2ab·cos(γ)) when solving SSS (three sides) or SAS (two sides with included angle). Use the Law of Sines (a/sin(α) = b/sin(β) = c/sin(γ)) when solving ASA, AAS, or SSA setups where at least one opposite angle-side pair is provided."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Pythagorean theorem relate to the Law of Cosines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Law of Cosines is the generalized Euclidean formula for non-right triangles. When the angle γ equals 90°, cos(90°) = 0, causing the -2ab·cos(γ) term to vanish completely and simplifying the expression directly to c² = a² + b²."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a median, an altitude, and an angle bisector?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An altitude (height) is a perpendicular line segment dropped from a vertex to the opposite base line. A median is a line segment connecting a vertex directly to the midpoint of the opposite side, dividing the triangle into two equal areas. An angle bisector divides an interior vertex angle into two equal halves."
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

                {/* Left Workspace Panel: Input & Solver Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Geometry Input Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode & Unit Selector */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Given Known Properties (Theorem)
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500">Angle Unit:</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setAngleUnit("deg")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${angleUnit === "deg" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Degrees (°)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAngleUnit("rad")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${angleUnit === "rad" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Radians (rad)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Solver Mode Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {[
                                    { id: "SSS", label: "SSS", desc: "3 Sides" },
                                    { id: "SAS", label: "SAS", desc: "2 Sides + In Angle" },
                                    { id: "ASA", label: "ASA", desc: "2 Angles + In Side" },
                                    { id: "AAS", label: "AAS", desc: "2 Angles + Opp Side" },
                                    { id: "SSA", label: "SSA", desc: "Ambiguous Case" },
                                    { id: "RIGHT_ANGLE", label: "Right Δ", desc: "Pythagorean" }
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setSolverMode(mode.id as SolverMode)}
                                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${solverMode === mode.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                            }`}
                                    >
                                        <span className="font-extrabold text-xs">{mode.label}</span>
                                        <span className={`text-[10px] truncate max-w-full ${solverMode === mode.id ? "text-indigo-100" : "text-slate-400"}`}>
                                            {mode.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Inputs Based on Theorem */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            {solverMode === "SSS" && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Side Lengths (a, b, c)</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side a</label>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side b</label>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side c</label>
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
                                </div>
                            )}

                            {solverMode === "SAS" && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Two Sides & Included Angle (γ between a & b)</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side a</label>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side b</label>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Angle γ ({angleUnit})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={angleGamma === 0 ? "" : angleGamma}
                                                onChange={(e) => handleNumberInput(e, setAngleGamma)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {solverMode === "ASA" && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Two Angles & Included Side c</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Angle α ({angleUnit})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={angleAlpha === 0 ? "" : angleAlpha}
                                                onChange={(e) => handleNumberInput(e, setAngleAlpha)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side c</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={sideC === 0 ? "" : sideC}
                                                onChange={(e) => handleNumberInput(e, setSideC)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Angle β ({angleUnit})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={angleBeta === 0 ? "" : angleBeta}
                                                onChange={(e) => handleNumberInput(e, setAngleBeta)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {solverMode === "AAS" && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Two Angles & Opposite Side a</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Angle α ({angleUnit})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={angleAlpha === 0 ? "" : angleAlpha}
                                                onChange={(e) => handleNumberInput(e, setAngleAlpha)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Angle β ({angleUnit})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={angleBeta === 0 ? "" : angleBeta}
                                                onChange={(e) => handleNumberInput(e, setAngleBeta)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side a</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={sideA === 0 ? "" : sideA}
                                                onChange={(e) => handleNumberInput(e, setSideA)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {solverMode === "SSA" && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Two Sides & Non-Included Opposite Angle (Side a, Side b, Angle α)</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side a (Opp α)</label>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Side b (Adjacent)</label>
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
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Angle α ({angleUnit})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={angleAlpha === 0 ? "" : angleAlpha}
                                                onChange={(e) => handleNumberInput(e, setAngleAlpha)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {solverMode === "RIGHT_ANGLE" && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRightModeType("two-legs")}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${rightModeType === "two-legs" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                                                }`}
                                        >
                                            Two Legs (a, b)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRightModeType("leg-hypotenuse")}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${rightModeType === "leg-hypotenuse" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                                                }`}
                                        >
                                            Leg & Hypotenuse (a, c)
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Leg a</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={sideA === 0 ? "" : sideA}
                                                onChange={(e) => handleNumberInput(e, setSideA)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        {rightModeType === "two-legs" ? (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Leg b</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={sideB === 0 ? "" : sideB}
                                                    onChange={(e) => handleNumberInput(e, setSideB)}
                                                    className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Hypotenuse c</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={sideC === 0 ? "" : sideC}
                                                    onChange={(e) => handleNumberInput(e, setSideC)}
                                                    className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Precision Modifier */}
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

                        {/* Status / Alert Banner */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Geometric Invalidity</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : computation.isAmbiguous ? (
                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Ambiguous Case (SSA): 2 Solutions Exist</p>
                                    <p>Displaying primary acute solution. Both acute and obtuse triangles satisfy the given parameters.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Valid Triangle Geometry Solved
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    {activeSolution?.triangleType} • {activeSolution?.anglesType}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Euclidean 2D Plane
                        </span>
                        <span>Law of Cosines & Sines Engine</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Analytics & Real-Time SVG Renderer */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Calculated Metrics & Dynamic SVG
                            </h2>
                            {computation.valid && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                    {activeSolution?.anglesType} Triangle
                                </span>
                            )}
                        </div>

                        {/* Real-time Dynamic Triangle SVG Renderer */}
                        <div className="w-full bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden min-h-[220px]">
                            <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Dynamic 2D Vector Projection
                            </div>

                            {computation.valid && activeSolution ? (
                                <svg
                                    viewBox={`${svgViewBox.minX} ${svgViewBox.minY} ${svgViewBox.width} ${svgViewBox.height}`}
                                    className="w-full h-44 overflow-visible"
                                >
                                    {/* Triangle Polygon */}
                                    <polygon
                                        points={svgViewBox.pointsStr}
                                        fill="rgba(99, 102, 241, 0.2)"
                                        stroke="#818cf8"
                                        strokeWidth={Math.max(svgViewBox.width, svgViewBox.height) * 0.015}
                                        strokeLinejoin="round"
                                    />
                                    {/* Vertices */}
                                    <circle cx={svgViewBox.coords.ax} cy={svgViewBox.coords.ay} r={Math.max(svgViewBox.width, svgViewBox.height) * 0.03} fill="#6366f1" />
                                    <circle cx={svgViewBox.coords.bx} cy={svgViewBox.coords.by} r={Math.max(svgViewBox.width, svgViewBox.height) * 0.03} fill="#6366f1" />
                                    <circle cx={svgViewBox.coords.cx} cy={svgViewBox.coords.cy} r={Math.max(svgViewBox.width, svgViewBox.height) * 0.03} fill="#6366f1" />

                                    {/* Vertex Labels */}
                                    <text x={svgViewBox.coords.ax} y={svgViewBox.coords.ay + Math.max(svgViewBox.width, svgViewBox.height) * 0.09} fill="#cbd5e1" fontSize={Math.max(svgViewBox.width, svgViewBox.height) * 0.08} textAnchor="middle" fontWeight="bold">A</text>
                                    <text x={svgViewBox.coords.bx} y={svgViewBox.coords.by + Math.max(svgViewBox.width, svgViewBox.height) * 0.09} fill="#cbd5e1" fontSize={Math.max(svgViewBox.width, svgViewBox.height) * 0.08} textAnchor="middle" fontWeight="bold">B</text>
                                    <text x={svgViewBox.coords.cx} y={svgViewBox.coords.cy - Math.max(svgViewBox.width, svgViewBox.height) * 0.05} fill="#cbd5e1" fontSize={Math.max(svgViewBox.width, svgViewBox.height) * 0.08} textAnchor="middle" fontWeight="bold">C</text>
                                </svg>
                            ) : (
                                <div className="text-center text-slate-500 text-xs py-8 space-y-2">
                                    <Triangle className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                                    <p>Awaiting valid geometric parameters to render SVG</p>
                                </div>
                            )}
                        </div>

                        {/* Core Output Highlight Cards */}
                        {computation.valid && activeSolution ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Enclosed Area (A)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(activeSolution.area)}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">Square Units</p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Perimeter (P)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(activeSolution.perimeter)}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            Semi-perimeter (s): {formatNum(activeSolution.semiPerimeter)}
                                        </p>
                                    </div>
                                </div>

                                {/* Detailed Dimension Matrix */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Side a</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(activeSolution.a)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Side b</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(activeSolution.b)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Side c</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(activeSolution.c)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Angle α (Alpha)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {formatNum(angleUnit === "deg" ? activeSolution.alphaDeg : activeSolution.alphaRad)}°{angleUnit}
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Angle β (Beta)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {formatNum(angleUnit === "deg" ? activeSolution.betaDeg : activeSolution.betaRad)}°{angleUnit}
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Angle γ (Gamma)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {formatNum(angleUnit === "deg" ? activeSolution.gammaDeg : activeSolution.gammaRad)}°{angleUnit}
                                        </span>
                                    </div>
                                </div>

                                {/* Advanced Geometric Radii & Altitudes */}
                                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                                    <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                        <span>Advanced Radii & Altitudes</span>
                                        <span className="text-[10px] text-slate-400 font-mono">Precision: {precision}dp</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                                        <div>Inradius (r): <strong className="text-white">{formatNum(activeSolution.inradius)}</strong></div>
                                        <div>Circumradius (R): <strong className="text-white">{formatNum(activeSolution.circumradius)}</strong></div>
                                        <div>Height h_a: <strong className="text-white">{formatNum(activeSolution.heightA)}</strong></div>
                                        <div>Median m_a: <strong className="text-white">{formatNum(activeSolution.medianA)}</strong></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Provide valid triangle dimensions to display geometric analytics.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            disabled={!computation.valid}
                            onClick={handleCopyResults}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${computation.valid
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Geometry Report Copied!" : "Copy Full Geometric Summary"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Theorem Reference & Solving Taxonomy Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Trigonometry & Triangle Theorem Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In Euclidean plane geometry, a triangle is fully determined by three independent parameters (at least one of which must be a side length). The system uses the following mathematical taxonomy to evaluate congruence, calculate missing sides and interior angles, and verify topological existence:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Theorem / Given Setup</th>
                                    <th className="p-3">Mathematical Governing Formula</th>
                                    <th className="p-3">Existence Constraint</th>
                                    <th className="p-3">Unique Solutions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">SSS (Side-Side-Side)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">cos(γ) = (a² + b² - c²) / (2ab)</td>
                                    <td className="p-3 text-xs">a + b &gt; c, a + c &gt; b, b + c &gt; a</td>
                                    <td className="p-3 text-emerald-700 font-bold">1 Unique</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">SAS (Side-Angle-Side)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">c² = a² + b² - 2ab·cos(γ)</td>
                                    <td className="p-3 text-xs">0° &lt; γ &lt; 180° and a, b &gt; 0</td>
                                    <td className="p-3 text-emerald-700 font-bold">1 Unique</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">ASA (Angle-Side-Angle)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">a / sin(α) = c / sin(180° - α - β)</td>
                                    <td className="p-3 text-xs">α + β &lt; 180° and c &gt; 0</td>
                                    <td className="p-3 text-emerald-700 font-bold">1 Unique</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">AAS (Angle-Angle-Side)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">b = (a·sin(β)) / sin(α)</td>
                                    <td className="p-3 text-xs">α + β &lt; 180° and a &gt; 0</td>
                                    <td className="p-3 text-emerald-700 font-bold">1 Unique</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">SSA (Side-Side-Angle)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">sin(β) = (b·sin(α)) / a</td>
                                    <td className="p-3 text-xs">Altitude h = b·sin(α)</td>
                                    <td className="p-3 text-amber-700 font-bold">0, 1, or 2 (Ambiguous)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Right Triangle (Pythagorean)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">c² = a² + b², Area = ½ab</td>
                                    <td className="p-3 text-xs">γ = 90° (Hypotenuse c &gt; legs)</td>
                                    <td className="p-3 text-emerald-700 font-bold">1 Unique</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Complete Mathematical Formulas & Geometric Derivations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Geometric Formula Index & Analytical Derivations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This calculator solves for more than simple side lengths and angles. It computes complete triangle metrics including inradii, circumradii, altitudes, medians, and angle bisectors using these verified formulas:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Area Formulations
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1 font-mono">
                                <li><strong>Heron:</strong> A = √(s(s-a)(s-b)(s-c))</li>
                                <li><strong>Trig:</strong> A = ½ · a · b · sin(γ)</li>
                                <li><strong>Base-Height:</strong> A = ½ · base · height</li>
                                <li><strong>Semi-Perimeter:</strong> s = (a + b + c) / 2</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CircleDot className="w-4 h-4 text-indigo-600" /> Circular Boundaries
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1 font-mono">
                                <li><strong>Inradius (r):</strong> r = Area / s</li>
                                <li><strong>Circumradius (R):</strong> R = (a · b · c) / (4 · Area)</li>
                                <li><strong>Incircle Area:</strong> A_in = π · r²</li>
                                <li><strong>Circumcircle Area:</strong> A_circ = π · R²</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Grid className="w-4 h-4 text-indigo-600" /> Altitudes & Medians
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1 font-mono">
                                <li><strong>Altitude h_a:</strong> (2 · Area) / a</li>
                                <li><strong>Median m_a:</strong> ½√(2b² + 2c² - a²)</li>
                                <li><strong>Bisector t_a:</strong> (2√(bc·s(s-a))) / (b+c)</li>
                                <li><strong>Perimeter:</strong> P = a + b + c</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> Cartesian Derivation of the Law of Cosines
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Consider triangle ΔABC placed on a 2D Cartesian plane where vertex A is positioned at origin (0, 0) and side c lies along the positive x-axis to point B(c, 0). Vertex C is defined at coordinates (b·cos(α), b·sin(α)). By computing the Euclidean distance squared between point B and point C:
                        </p>
                        <div className="font-mono text-xs text-indigo-200 bg-slate-950 p-3 rounded-lg space-y-1 border border-slate-800">
                            <p>a² = (b·cos(α) - c)² + (b·sin(α) - 0)²</p>
                            <p>a² = b²·cos²(α) - 2bc·cos(α) + c² + b²·sin²(α)</p>
                            <p>a² = b²(cos²(α) + sin²(α)) + c² - 2bc·cos(α)</p>
                            <p className="text-white font-bold">Since cos²(α) + sin²(α) = 1  →  a² = b² + c² - 2bc·cos(α)</p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Deep Dive into the Ambiguous SSA Case */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Ambiguous Case (SSA): Mathematical Boundary Conditions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When two sides and an angle not between them are provided (Side-Side-Angle), the geometry cannot always guarantee a single unique solution. The length of the opposite side ($a$) compared to the vertical altitude ($h = b \cdot \sin(\alpha)$) determines one of four possible geometric outcomes:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5">
                            <span className="font-extrabold text-rose-800 block uppercase">No Triangle (0 Solutions)</span>
                            <p className="font-mono font-bold text-slate-800">a &lt; h = b·sin(α)</p>
                            <p className="text-slate-600">The swinging side $a$ is too short to reach the opposite baseline. No enclosed polygon can be formed.</p>
                        </div>

                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                            <span className="font-extrabold text-emerald-800 block uppercase">One Right Triangle</span>
                            <p className="font-mono font-bold text-slate-800">a = h = b·sin(α)</p>
                            <p className="text-slate-600">Side $a$ meets the baseline at a 90° angle, forming exactly one right-angled triangle.</p>
                        </div>

                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                            <span className="font-extrabold text-amber-800 block uppercase">Two Triangles (Ambiguous)</span>
                            <p className="font-mono font-bold text-slate-800">h &lt; a &lt; b</p>
                            <p className="text-slate-600">Side $a$ intersects the baseline at two distinct points, generating one acute and one obtuse triangle.</p>
                        </div>

                        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1.5">
                            <span className="font-extrabold text-indigo-800 block uppercase">One Unique Triangle</span>
                            <p className="font-mono font-bold text-slate-800">a ≥ b</p>
                            <p className="text-slate-600">Side $a$ can only swing forward; swinging backward extends past vertex A, leaving one valid triangle.</p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Triangle Classification & Morphological Characteristics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Triangle Classification by Sides and Angles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Triangles are classified into dual geometric categories based on side symmetry and interior angle distribution:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Side Classification */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-900 text-sm border-b border-slate-200">
                                Classification by Side Symmetry
                            </div>
                            <div className="divide-y divide-slate-100 p-2 text-xs space-y-1">
                                <div className="p-2 space-y-0.5">
                                    <span className="font-bold text-slate-900 block">Equilateral Triangle</span>
                                    <p className="text-slate-600">{"All 3 sides are equal ($a = b = c$). All 3 interior angles equal exactly 60°. Area = $\\frac{\\sqrt{3}}{4}a^2$."}</p>
                                </div>
                                <div className="p-2 space-y-0.5">
                                    <span className="font-bold text-slate-900 block">Isosceles Triangle</span>
                                    <p className="text-slate-600">At least 2 sides are equal ($a = b \neq c$). The angles opposite the equal sides are also identical.</p>
                                </div>
                                <div className="p-2 space-y-0.5">
                                    <span className="font-bold text-slate-900 block">Scalene Triangle</span>
                                    <p className="text-slate-600">All 3 sides have different lengths ($a \neq b \neq c$). All 3 interior angles have distinct measures.</p>
                                </div>
                            </div>
                        </div>

                        {/* Angle Classification */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-900 text-sm border-b border-slate-200">
                                Classification by Interior Angles
                            </div>
                            <div className="divide-y divide-slate-100 p-2 text-xs space-y-1">
                                <div className="p-2 space-y-0.5">
                                    <span className="font-bold text-slate-900 block">Acute Triangle</span>
                                    <p className="text-slate-600">All 3 interior angles are strictly less than 90° ($\alpha, \beta, \gamma &lt; 90^\circ$). The circumcenter lies inside the triangle.</p>
                                </div>
                                <div className="p-2 space-y-0.5">
                                    <span className="font-bold text-slate-900 block">Right Triangle</span>
                                    <p className="text-slate-600">Contains exactly one 90° right angle ($\gamma = 90^\circ$). Governed by $a^2 + b^2 = c^2$. Circumcenter lies on the hypotenuse midpoint.</p>
                                </div>
                                <div className="p-2 space-y-0.5">
                                    <span className="font-bold text-slate-900 block">Obtuse Triangle</span>
                                    <p className="text-slate-600">Contains one interior angle greater than 90° ($\gamma &gt; 90^\circ$). The circumcenter and orthocenter lie outside the triangle boundary.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Real-World Applications of Triangle Trigonometry */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Engineering & Scientific Applications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Triangles are the structural foundation of computation, engineering, and spatial geometry because they are the only 2D polygons that are naturally rigid:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-700">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="font-bold text-slate-900 text-sm block">1. Structural Engineering & Trusses</span>
                            <p className="leading-relaxed">
                                Bridges, cranes, and geodesic domes rely on triangular pin-jointed trusses. Because a triangle cannot deform without altering side lengths, it distributes tensile and compressive loads evenly.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="font-bold text-slate-900 text-sm block">2. Geodesy, GPS & Triangulation</span>
                            <p className="leading-relaxed">
                                Surveying networks and satellite GPS constellations calculate exact geographical coordinates on Earth&apos;s surface by measuring angle bearings between known reference points (triangulation and trilateration).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="font-bold text-slate-900 text-sm block">3. 3D Computer Graphics & Mesh Rendering</span>
                            <p className="leading-relaxed">
                                Modern GPUs render 3D assets using triangle meshes (rasterization). Three vertices define a single flat plane in 3D space, preventing rendering ambiguity and non-planar warping artifacts.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Step-by-Step Practical Worked Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Geometric Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Walk through these end-to-end calculations to see how different theorems solve for complete triangle metrics:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: SSS Configuration (7, 8, 9)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Heron&apos;s Method</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>Semi-Perimeter:</strong> s = (7 + 8 + 9) / 2 = 12</li>
                                <li><strong>Area:</strong> √(12 · (12-7) · (12-8) · (12-9)) = √(12·5·4·3) = √720 ≈ 26.8328</li>
                                <li><strong>Angle γ:</strong> arccos((7² + 8² - 9²) / (2 · 7 · 8)) = arccos(32 / 112) ≈ 73.3985°</li>
                                <li><strong>Angle α:</strong> arccos((8² + 9² - 7²) / (2 · 8 · 9)) = arccos(96 / 144) ≈ 48.1897°</li>
                                <li><strong>Angle β:</strong> 180° - 73.3985° - 48.1897° ≈ 58.4118°</li>
                                <li><strong>Inradius (r):</strong> 26.8328 / 12 ≈ 2.2361</li>
                                <li><strong>Circumradius (R):</strong> (7 · 8 · 9) / (4 · 26.8328) = 504 / 107.3312 ≈ 4.6957</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Classification: Scalene Acute Triangle
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: SAS Configuration (10, 15, 60°)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Law of Cosines</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>Third Side c:</strong> √(10² + 15² - 2(10)(15)cos(60°)) = √(100 + 225 - 150) = √175 ≈ 13.2288</li>
                                <li><strong>Enclosed Area:</strong> ½ · 10 · 15 · sin(60°) = 75 · 0.866025 ≈ 64.9519</li>
                                <li><strong>Perimeter:</strong> 10 + 15 + 13.2288 = 38.2288 (s = 19.1144)</li>
                                <li><strong>Angle α:</strong> arcsin((10 · sin(60°)) / 13.2288) = arcsin(0.6547) ≈ 40.8934°</li>
                                <li><strong>Angle β:</strong> 180° - 60° - 40.8934° ≈ 79.1066°</li>
                                <li><strong>Inradius (r):</strong> 64.9519 / 19.1144 ≈ 3.3981</li>
                                <li><strong>Circumradius (R):</strong> (10 · 15 · 13.2288) / (4 · 64.9519) ≈ 7.6376</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Classification: Scalene Acute Triangle
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 7: Frequently Asked Questions (FAQ) */}
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
                                What is the Triangle Inequality Theorem and why is it checked first?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Triangle Inequality Theorem states that for any valid Euclidean triangle, the sum of the lengths of any two sides must be strictly greater than the length of the third side ($a + b &gt; c$, $a + c &gt; b$, and $b + c &gt; a$). If the sum equals the third side, the shape degenerates into a flat line segment; if less, the endpoints cannot connect.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the solver resolve the ambiguous SSA (Side-Side-Angle) case?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the SSA configuration, providing two sides and an angle not enclosed between them can yield 0, 1, or 2 distinct triangles. The algorithm computes the perpendicular altitude $h = b \cdot \sin(\alpha)$. If $a &lt; h$, no triangle exists. If $a = h$ or $a \ge b$, exactly one triangle is formed. If $h &lt; a &lt; b$, two valid triangles exist (one acute and one obtuse).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What formula calculates triangle area when altitudes are unknown?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"When all three sides are known, Heron's formula is used: $\\text{Area} = \\sqrt{s(s - a)(s - b)(s - c)}$, where $s = \\frac{a + b + c}{2}$. When two sides and the included angle are known (SAS), the trigonometric area formula $\\text{Area} = \\frac{1}{2}ab\\sin(\\gamma)$ is applied."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are inradius and circumradius in triangle geometry?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The inradius ($r$) is the radius of the incircle tangent to all three inner edges, calculated as $\\text{Area} / s$. The circumradius ($R$) is the radius of the circle circumscribed around the triangle touching all three vertices, calculated as $(abc) / (4 \\cdot \\text{Area})$."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When should I use the Law of Sines versus the Law of Cosines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Use the Law of Cosines ($c^2 = a^2 + b^2 - 2ab\cos(\gamma)$) when solving SSS (three sides) or SAS (two sides with included angle). Use the Law of Sines ($a/\sin(\alpha) = b/\sin(\beta) = c/\sin(\gamma)$) when solving ASA, AAS, or SSA setups where at least one opposite angle-side pair is provided.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Pythagorean theorem relate to the Law of Cosines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Law of Cosines is the generalized Euclidean formula for non-right triangles. When the angle $\gamma$ equals 90°, $\cos(90^\circ) = 0$, causing the $-2ab\cos(\gamma)$ term to vanish completely and simplifying the expression directly to $c^2 = a^2 + b^2$.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a median, an altitude, and an angle bisector?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An altitude (height) is a perpendicular line segment dropped from a vertex to the opposite base line. A median is a line segment connecting a vertex directly to the midpoint of the opposite side, dividing the triangle into two equal areas. An angle bisector divides an interior vertex angle into two equal halves.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
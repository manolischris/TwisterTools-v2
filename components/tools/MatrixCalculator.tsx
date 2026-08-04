"use client";

import React, { useState, useMemo } from "react";
import {
    Grid,
    Calculator,
    Copy,
    Check,
    Download,
    RefreshCw,
    HelpCircle,
    BookOpen,
    Sparkles,
    ShieldCheck,
    Sliders,
    Table,
    FileText,
    CheckCircle2,
    Binary,
    ArrowRightLeft,
    Layers,
    Lightbulb,
    Cpu,
    FunctionSquare,
    Workflow,
    AlertCircle,
    BarChart3
} from "lucide-react";

type MatrixOperation =
    | "determinant"
    | "inverse"
    | "transpose"
    | "add"
    | "subtract"
    | "multiply"
    | "scalar";

interface Preset {
    id: string;
    label: string;
    operation: MatrixOperation;
    rowsA: number;
    colsA: number;
    matrixA: number[][];
    rowsB: number;
    colsB: number;
    matrixB: number[][];
    scalarK: number;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "det-3x3",
        label: "3x3 Invertible Matrix (Determinant)",
        operation: "determinant",
        rowsA: 3,
        colsA: 3,
        matrixA: [
            [6, 1, 1],
            [4, -2, 5],
            [2, 8, 7]
        ],
        rowsB: 3,
        colsB: 3,
        matrixB: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        scalarK: 2,
        tag: "Determinant"
    },
    {
        id: "inv-2x2",
        label: "2x2 Matrix Inversion",
        operation: "inverse",
        rowsA: 2,
        colsA: 2,
        matrixA: [
            [4, 7],
            [2, 6]
        ],
        rowsB: 2,
        colsB: 2,
        matrixB: [
            [1, 0],
            [0, 1]
        ],
        scalarK: 1,
        tag: "Inverse"
    },
    {
        id: "mult-3x3",
        label: "3x3 Matrix Multiplication (A × B)",
        operation: "multiply",
        rowsA: 3,
        colsA: 3,
        matrixA: [
            [1, 2, 3],
            [0, 1, 4],
            [5, 6, 0]
        ],
        rowsB: 3,
        colsB: 3,
        matrixB: [
            [-2, 1, 0],
            [3, -1, 2],
            [0, 4, 1]
        ],
        scalarK: 1,
        tag: "Multiplication"
    },
    {
        id: "scalar-3x3",
        label: "Scalar Multiplication (k = 5)",
        operation: "scalar",
        rowsA: 3,
        colsA: 3,
        matrixA: [
            [2, -1, 4],
            [3, 0, -5],
            [1, 2, 8]
        ],
        rowsB: 3,
        colsB: 3,
        matrixB: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        scalarK: 5,
        tag: "Scalar"
    }
];

// Helper to create empty grid
const createGrid = (rows: number, cols: number, initialVal = 0): number[][] =>
    Array.from({ length: rows }, () => Array(cols).fill(initialVal));

// Determinant calculation (Recursive expansion by minors)
function calculateDeterminant(matrix: number[][]): number {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

    let det = 0;
    for (let c = 0; c < n; c++) {
        const subMatrix = matrix.slice(1).map(row => row.filter((_, colIdx) => colIdx !== c));
        det += Math.pow(-1, c) * matrix[0][c] * calculateDeterminant(subMatrix);
    }
    return det;
}

// Matrix Transpose
function transposeMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = createGrid(cols, rows);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            result[c][r] = matrix[r][c];
        }
    }
    return result;
}

// Cofactor Matrix
function getCofactorMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const cofactors = createGrid(n, n);
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const subMatrix = matrix
                .filter((_, rowIdx) => rowIdx !== r)
                .map(row => row.filter((_, colIdx) => colIdx !== c));
            cofactors[r][c] = Math.pow(-1, r + c) * calculateDeterminant(subMatrix);
        }
    }
    return cofactors;
}

// Matrix Inverse
function inverseMatrix(matrix: number[][]): { result: number[][] | null; det: number } {
    const n = matrix.length;
    const det = calculateDeterminant(matrix);
    if (Math.abs(det) < 1e-10) return { result: null, det };

    if (n === 1) return { result: [[1 / matrix[0][0]]], det };

    const cofactors = getCofactorMatrix(matrix);
    const adjugate = transposeMatrix(cofactors);
    const inv = createGrid(n, n);

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            inv[r][c] = adjugate[r][c] / det;
        }
    }
    return { result: inv, det };
}

export default function MatrixCalculator() {
    // Operation State
    const [operation, setOperation] = useState<MatrixOperation>("determinant");

    // Matrix A State
    const [rowsA, setRowsA] = useState<number>(3);
    const [colsA, setColsA] = useState<number>(3);
    const [matrixA, setMatrixA] = useState<number[][]>([
        [6, 1, 1],
        [4, -2, 5],
        [2, 8, 7]
    ]);

    // Matrix B State
    const [rowsB, setRowsB] = useState<number>(3);
    const [colsB, setColsB] = useState<number>(3);
    const [matrixB, setMatrixB] = useState<number[][]>([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ]);

    // Scalar Factor State
    const [scalarK, setScalarK] = useState<string>("2");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("det-3x3");

    // Dynamic Matrix Dimension Resizing
    const handleDimensionChange = (
        target: "A" | "B",
        newRows: number,
        newCols: number
    ) => {
        const r = Math.max(1, Math.min(4, newRows));
        const c = Math.max(1, Math.min(4, newCols));

        if (target === "A") {
            setRowsA(r);
            setColsA(c);
            setMatrixA(prev => {
                const next = createGrid(r, c, 0);
                for (let i = 0; i < Math.min(prev.length, r); i++) {
                    for (let j = 0; j < Math.min(prev[0].length, c); j++) {
                        next[i][j] = prev[i][j];
                    }
                }
                return next;
            });
        } else {
            setRowsB(r);
            setColsB(c);
            setMatrixB(prev => {
                const next = createGrid(r, c, 0);
                for (let i = 0; i < Math.min(prev.length, r); i++) {
                    for (let j = 0; j < Math.min(prev[0].length, c); j++) {
                        next[i][j] = prev[i][j];
                    }
                }
                return next;
            });
        }
        setActivePresetId(null);
    };

    const handleCellChange = (
        target: "A" | "B",
        r: number,
        c: number,
        val: string
    ) => {
        const num = val === "" ? 0 : parseFloat(val);
        const sanitizeVal = isNaN(num) ? 0 : num;

        if (target === "A") {
            setMatrixA(prev => {
                const copy = prev.map(row => [...row]);
                copy[r][c] = sanitizeVal;
                return copy;
            });
        } else {
            setMatrixB(prev => {
                const copy = prev.map(row => [...row]);
                copy[r][c] = sanitizeVal;
                return copy;
            });
        }
        setActivePresetId(null);
    };

    const handleScalarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setScalarK("");
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        setScalarK(cleaned);
        setActivePresetId(null);
    };

    // Calculation Processing
    const calculation = useMemo(() => {
        const kVal = parseFloat(scalarK) || 0;

        if (operation === "determinant") {
            if (rowsA !== colsA) {
                return { valid: false, message: "Determinant calculation requires a square matrix (N × N)." };
            }
            const det = calculateDeterminant(matrixA);
            const steps: string[] = [`Matrix dimensions: ${rowsA} × ${colsA}`];
            if (rowsA === 2) {
                steps.push(`det(A) = (a₁₁ × a₂₂) - (a₁₂ × a₂₁)`);
                steps.push(`det(A) = (${matrixA[0][0]} × ${matrixA[1][1]}) - (${matrixA[0][1]} × ${matrixA[1][0]})`);
                steps.push(`det(A) = ${matrixA[0][0] * matrixA[1][1]} - ${matrixA[0][1] * matrixA[1][0]} = ${det}`);
            } else if (rowsA === 3) {
                steps.push(`Expanded along row 1 using minors & cofactors.`);
                steps.push(`det(A) = a₁₁(b₂₂b₃₃ - b₂₃b₃₂) - a₁₂(b₂₁b₃₃ - b₂₃b₃₁) + a₁₃(b₂₁b₃₂ - b₂₂b₃₁)`);
                steps.push(`det(A) = ${det}`);
            } else {
                steps.push(`Evaluated using cofactor expansion down to 2×2 sub-determinants.`);
                steps.push(`det(A) = ${det}`);
            }
            return { valid: true, det, steps, resultMatrix: null };
        }

        if (operation === "transpose") {
            const transposed = transposeMatrix(matrixA);
            return {
                valid: true,
                resultMatrix: transposed,
                steps: [
                    `Matrix dimensions flipped from ${rowsA}×${colsA} to ${colsA}×${rowsA}`,
                    `Element A[i][j] mapped to Aᵀ[j][i]`
                ]
            };
        }

        if (operation === "inverse") {
            if (rowsA !== colsA) {
                return { valid: false, message: "Matrix inversion requires a square matrix (N × N)." };
            }
            const { result, det } = inverseMatrix(matrixA);
            if (!result) {
                return {
                    valid: false,
                    message: `Matrix is singular (det(A) = 0). Non-invertible because division by zero is undefined.`
                };
            }
            return {
                valid: true,
                resultMatrix: result,
                det,
                steps: [
                    `Determinant det(A) = ${det}`,
                    `Calculated Cofactor Matrix C and Adjugate adj(A) = Cᵀ`,
                    `Inverse A⁻¹ = (1 / det(A)) × adj(A)`
                ]
            };
        }

        if (operation === "scalar") {
            const res = matrixA.map(row => row.map(cell => cell * kVal));
            return {
                valid: true,
                resultMatrix: res,
                steps: [
                    `Scalar constant k = ${kVal}`,
                    `Multiplied every entry in Matrix A by ${kVal}`
                ]
            };
        }

        if (operation === "add" || operation === "subtract") {
            if (rowsA !== rowsB || colsA !== colsB) {
                return {
                    valid: false,
                    message: `Matrix addition/subtraction requires identical dimensions. Matrix A is ${rowsA}×${colsA}, Matrix B is ${rowsB}×${colsB}.`
                };
            }
            const res = createGrid(rowsA, colsA);
            for (let r = 0; r < rowsA; r++) {
                for (let c = 0; c < colsA; c++) {
                    res[r][c] = operation === "add"
                        ? matrixA[r][c] + matrixB[r][c]
                        : matrixA[r][c] - matrixB[r][c];
                }
            }
            return {
                valid: true,
                resultMatrix: res,
                steps: [
                    `Applied element-wise ${operation === "add" ? "addition" : "subtraction"}`,
                    `Result dimensions: ${rowsA}×${colsA}`
                ]
            };
        }

        if (operation === "multiply") {
            if (colsA !== rowsB) {
                return {
                    valid: false,
                    message: `Matrix multiplication requires Columns of A (${colsA}) to equal Rows of B (${rowsB}).`
                };
            }
            const res = createGrid(rowsA, colsB);
            for (let r = 0; r < rowsA; r++) {
                for (let c = 0; c < colsB; c++) {
                    let sum = 0;
                    for (let k = 0; k < colsA; k++) {
                        sum += matrixA[r][k] * matrixB[k][c];
                    }
                    res[r][c] = sum;
                }
            }
            return {
                valid: true,
                resultMatrix: res,
                steps: [
                    `Dot product of Matrix A rows (${rowsA}) with Matrix B columns (${colsB})`,
                    `Resulting Matrix dimensions: ${rowsA} × ${colsB}`
                ]
            };
        }

        return { valid: false, message: "Invalid operation selected." };
    }, [operation, rowsA, colsA, matrixA, rowsB, colsB, matrixB, scalarK]);

    const applyPreset = (preset: Preset) => {
        setOperation(preset.operation);
        setRowsA(preset.rowsA);
        setColsA(preset.colsA);
        setMatrixA(preset.matrixA);
        setRowsB(preset.rowsB);
        setColsB(preset.colsB);
        setMatrixB(preset.matrixB);
        setScalarK(preset.scalarK.toString());
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setOperation("determinant");
        setRowsA(3);
        setColsA(3);
        setMatrixA([
            [6, 1, 1],
            [4, -2, 5],
            [2, 8, 7]
        ]);
        setRowsB(3);
        setColsB(3);
        setMatrixB([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]);
        setScalarK("2");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        if (!calculation.valid) return;

        let summaryText = `Matrix Mathematics Result (TwisterTools):\n----------------------------------------\n`;
        summaryText += `Operation: ${operation.toUpperCase()}\n`;
        summaryText += `Matrix A (${rowsA}x${colsA}):\n${matrixA.map(r => r.join("\t")).join("\n")}\n\n`;

        if (operation === "add" || operation === "subtract" || operation === "multiply") {
            summaryText += `Matrix B (${rowsB}x${colsB}):\n${matrixB.map(r => r.join("\t")).join("\n")}\n\n`;
        } else if (operation === "scalar") {
            summaryText += `Scalar Factor k = ${scalarK}\n\n`;
        }

        if (operation === "determinant") {
            summaryText += `Determinant det(A) = ${calculation.det}\n`;
        } else if (calculation.resultMatrix) {
            summaryText += `Result Matrix:\n${calculation.resultMatrix.map(r => r.map(n => Number(n.toFixed(4))).join("\t")).join("\n")}\n`;
        }

        summaryText += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/matrix-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        let csvRows: string[] = [];
        csvRows.push(`"Operation","${operation}"`);

        if (operation === "determinant") {
            csvRows.push(`"Determinant","${calculation.det}"`);
        } else if (calculation.resultMatrix) {
            csvRows.push(`"Result Matrix Rows","${calculation.resultMatrix.length}"`);
            csvRows.push(`"Result Matrix Columns","${calculation.resultMatrix[0].length}"`);
            calculation.resultMatrix.forEach((row, i) => {
                csvRows.push(`"Row ${i + 1}",${row.map(n => `"${Number(n.toFixed(4))}"`).join(",")}`);
            });
        }

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `matrix_calculation_result.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Matrix Mathematics & Determinant Calculator",
        "url": "https://twistertools.com/tools/calculators/matrix-calculator",
        "description": "Browser-native matrix arithmetic engine to solve determinants, matrix inverses, transpositions, dot product multiplication, and linear transformations.",
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
                "name": "What is a matrix determinant and why is it important?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The determinant is a scalar value calculated from a square matrix that characterizes the scaling factor of the linear transformation. A determinant of zero indicates the matrix is singular and cannot be inverted."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate the inverse of a matrix?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To invert a matrix A, calculate its determinant det(A), build the matrix of cofactors, transpose it to obtain the adjugate matrix adj(A), and multiply adj(A) by 1 / det(A)."
                }
            },
            {
                "@type": "Question",
                "name": "What are the dimensional rules for matrix multiplication?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Matrix multiplication A × B is valid only if the number of columns in Matrix A equals the number of rows in Matrix B. If A is m × n and B is n × p, the product is m × p."
                }
            },
            {
                "@type": "Question",
                "name": "Why is matrix multiplication non-commutative?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unlike real number multiplication, matrix multiplication generally depends on ordering, meaning A × B does not equal B × A in most cases."
                }
            },
            {
                "@type": "Question",
                "name": "What is a singular matrix?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A singular matrix is a square matrix whose determinant is equal to zero. Singular matrices lack an inverse because division by zero is mathematically undefined."
                }
            },
            {
                "@type": "Question",
                "name": "How is the transpose of a matrix computed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The transpose of a matrix is formed by swapping its rows and columns. Entry A[i][j] in the original matrix becomes entry Aᵀ[j][i] in the transposed matrix."
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
                {/* Left Workspace Panel: Controls & Matrix Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Matrix Input Controls
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Operation Selection Grid */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Target Matrix Operation
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("determinant"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${operation === "determinant" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        det(A)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("inverse"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${operation === "inverse" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        A⁻¹ (Inverse)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("multiply"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${operation === "multiply" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        A × B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("transpose"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${operation === "transpose" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Aᵀ (Transpose)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("add"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${operation === "add" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        A + B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("subtract"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${operation === "subtract" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        A - B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOperation("scalar"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition col-span-2 ${operation === "scalar" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        k × A (Scalar)
                                    </button>
                                </div>
                            </div>

                            {/* Matrix A Input Controls */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Binary className="w-4 h-4 text-indigo-600" /> Matrix A
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-slate-500">Dimensions:</span>
                                        <select
                                            value={`${rowsA}x${colsA}`}
                                            onChange={(e) => {
                                                const [r, c] = e.target.value.split("x").map(Number);
                                                handleDimensionChange("A", r, c);
                                            }}
                                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="2x2">2 × 2</option>
                                            <option value="3x3">3 × 3</option>
                                            <option value="4x4">4 × 4</option>
                                            <option value="2x3">2 × 3</option>
                                            <option value="3x2">3 × 2</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Matrix A Grid Inputs */}
                                <div
                                    className="grid gap-2 p-2 bg-white rounded-lg border border-slate-200 max-w-full overflow-x-auto"
                                    style={{ gridTemplateColumns: `repeat(${colsA}, minmax(0, 1fr))` }}
                                >
                                    {matrixA.map((row, r) =>
                                        row.map((val, c) => (
                                            <input
                                                key={`a-${r}-${c}`}
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleCellChange("A", r, c, e.target.value)}
                                                className="w-full text-center px-2 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50/50"
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Secondary Input: Matrix B or Scalar Factor */}
                            {(operation === "add" || operation === "subtract" || operation === "multiply") && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Binary className="w-4 h-4 text-indigo-600" /> Matrix B
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-semibold text-slate-500">Dimensions:</span>
                                            <select
                                                value={`${rowsB}x${colsB}`}
                                                onChange={(e) => {
                                                    const [r, c] = e.target.value.split("x").map(Number);
                                                    handleDimensionChange("B", r, c);
                                                }}
                                                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="2x2">2 × 2</option>
                                                <option value="3x3">3 × 3</option>
                                                <option value="4x4">4 × 4</option>
                                                <option value="2x3">2 × 3</option>
                                                <option value="3x2">3 × 2</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Matrix B Grid Inputs */}
                                    <div
                                        className="grid gap-2 p-2 bg-white rounded-lg border border-slate-200 max-w-full overflow-x-auto"
                                        style={{ gridTemplateColumns: `repeat(${colsB}, minmax(0, 1fr))` }}
                                    >
                                        {matrixB.map((row, r) =>
                                            row.map((val, c) => (
                                                <input
                                                    key={`b-${r}-${c}`}
                                                    type="number"
                                                    value={val}
                                                    onChange={(e) => handleCellChange("B", r, c, e.target.value)}
                                                    className="w-full text-center px-2 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50/50"
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {operation === "scalar" && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Scalar Constant (k)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 5"
                                        value={scalarK}
                                        onChange={handleScalarInput}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Quick Presets Section */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets & Worked Templates
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Copy and Export Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            disabled={!calculation.valid}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Solution"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={!calculation.valid}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Dynamic Output Grid & Steps */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Solution Output & Proof
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                Mode: {operation}
                            </span>
                        </div>

                        {!calculation.valid ? (
                            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-amber-600" /> Calculation Requirement Unmet
                                </h3>
                                <p className="text-xs leading-relaxed">{calculation.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Hero Calculation Result Card */}
                                <div className="p-5 rounded-2xl border bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Binary className="w-4 h-4 text-indigo-400" /> Computation Result
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                            Verified Output
                                        </span>
                                    </div>

                                    {/* Determinant Hero Display */}
                                    {operation === "determinant" && (
                                        <div className="space-y-2">
                                            <div className="text-xs text-indigo-300">Determinant value det(A):</div>
                                            <div className="text-4xl sm:text-5xl font-black text-white">{calculation.det}</div>
                                            <div className="pt-2 text-xs text-indigo-200 border-t border-indigo-800/80">
                                                Matrix Status: <strong>{calculation.det !== 0 ? "Non-Singular (Invertible)" : "Singular (Non-Invertible)"}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {/* Matrix Output Grid Display */}
                                    {calculation.resultMatrix && (
                                        <div className="space-y-3">
                                            <div className="text-xs text-indigo-300">
                                                Result Matrix ({calculation.resultMatrix.length} × {calculation.resultMatrix[0].length}):
                                            </div>
                                            <div
                                                className="grid gap-2 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-full overflow-x-auto"
                                                style={{ gridTemplateColumns: `repeat(${calculation.resultMatrix[0].length}, minmax(0, 1fr))` }}
                                            >
                                                {calculation.resultMatrix.map((row, r) =>
                                                    row.map((val, c) => (
                                                        <div
                                                            key={`res-${r}-${c}`}
                                                            className="text-center py-2 px-1 bg-white/10 rounded-lg text-white font-mono font-bold text-xs sm:text-sm border border-white/10"
                                                        >
                                                            {Number(val.toFixed(3))}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Step-by-Step Mathematical Derivation */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Step-by-Step Mathematical Proof
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs text-slate-800">
                                        {calculation.steps?.map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="font-bold text-indigo-600 select-none">[{idx + 1}]</span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Native Math
                        </span>
                        <span>TwisterTools Matrix Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Fundamental Mathematical Definitions & Core Rules */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Linear Algebra Core Principles & Matrix Fundamentals
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In modern mathematical computation, a <strong>matrix</strong> is a two-dimensional rectangular array of numbers, symbols, or expressions arranged in horizontal rows and vertical columns. Matrices are fundamental to modeling physical systems, solving linear equations, performing geometric transformations in 3D computer graphics, and powering deep neural network architectures in artificial intelligence.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Binary className="w-4 h-4 text-indigo-600" /> Matrix Determinant
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A scalar value extracted exclusively from square matrices ($N \times N$). It defines the geometric volume scaling factor of a linear transformation and determines whether a matrix is invertible.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <ArrowRightLeft className="w-4 h-4 text-emerald-600" /> Matrix Inverse
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The multiplicative inverse matrix A^-1 satisfies A · A^-1 = I, where I is the identity matrix. Inversions are central to solving linear systems A x = b via x = A^-1 b.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Layers className="w-4 h-4 text-amber-600" /> Matrix Transposition
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Computed by reflecting a matrix across its main diagonal. Row indices become column indices (A^T_ij = A_ji), converting an M x N matrix into an N x M matrix.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Essential Mathematical Rules of Matrix Operations
                        </h3>
                        <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
                            <li><strong>Non-Commutative Multiplication Property:</strong> Matrix multiplication is non-commutative in general; $A \times B \neq B \times A$.</li>
                            <li><strong>Invertibility Condition (Singularity):</strong> A matrix possesses a valid inverse if and only if its determinant is non-zero ($\det(A) \neq 0$). A matrix with $\det(A) = 0$ is singular.</li>
                            <li><strong>Reversal Rule for Transposes:</strong> The transpose of a matrix product reverses the operational order: $(A \times B)^T = B^T \times A^T$.</li>
                            <li><strong>Determinant Multiplicative Property:</strong> The determinant of a matrix product equals the product of individual determinants: $\det(A \times B) = \det(A) \times \det(B)$.</li>
                        </ul>
                    </div>
                </section>

                {/* Card 2: Technical Property Matrix Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Matrix Operations Property Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below summarizes key dimensional constraints, formula definitions, computational complexity, and essential operational properties across primary linear algebra procedures:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Operation</th>
                                    <th className="p-3">Required Dimensions</th>
                                    <th className="p-3">Resulting Dimensions</th>
                                    <th className="p-3">Primary Formula / Expression</th>
                                    <th className="p-3">Commutative?</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Determinant ($\det(A)$)</td>
                                    <td className="p-3">Square ($N \times N$)</td>
                                    <td className="p-3">Scalar ($1 \times 1$)</td>
                                    <td className="p-3 font-mono text-xs">sum over permutations sigma in S_n of sgn(sigma) * product(i=1..n) a[i, sigma(i)]</td>
                                    <td className="p-3 font-semibold text-slate-500">N/A (Scalar)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">Inverse ($A^{-1}$)</td>
                                    <td className="p-3">Square (N x N), det(A) != 0</td>
                                    <td className="p-3">Square ($N \times N$)</td>
                                    <td className="p-3 font-mono text-xs">A^-1 = (1 / det(A)) * adj(A)</td>
                                    <td className="p-3 font-semibold text-emerald-600">Yes (A * A^-1 = A^-1 * A)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Multiplication ($A \times B$)</td>
                                    <td className="p-3">Cols of A = Rows of B (M x K, K x N)</td>
                                    <td className="p-3">$M \times N$</td>
                                    <td className="p-3 font-mono text-xs">c_ij = sum(k=1..K) a_ik * b_kj</td>
                                    <td className="p-3 font-semibold text-rose-600">No (A x B != B x A)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">Transpose ($A^T$)</td>
                                    <td className="p-3">Any ($M \times N$)</td>
                                    <td className="p-3">$N \times M$</td>
                                    <td className="p-3 font-mono text-xs">a^T_ij = a_ji</td>
                                    <td className="p-3 font-semibold text-slate-500">N/A (Single Matrix)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Addition ($A + B$)</td>
                                    <td className="p-3">Identical ($M \times N$ & $M \times N$)</td>
                                    <td className="p-3">$M \times N$</td>
                                    <td className="p-3 font-mono text-xs">c_ij = a_ij + b_ij</td>
                                    <td className="p-3 font-semibold text-emerald-600">Yes ($A + B = B + A$)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">Scalar Product ($k \cdot A$)</td>
                                    <td className="p-3">Any ($M \times N$), Scalar $k$</td>
                                    <td className="p-3">$M \times N$</td>
                                    <td className="p-3 font-mono text-xs font-bold">c_ij = k * a_ij</td>
                                    <td className="p-3 font-semibold text-emerald-600">Yes ($k \cdot A = A \cdot k$)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Determinant Algorithms for 2x2, 3x3, and NxN */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FunctionSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithms for Determinant Computation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating determinants depends on the matrix order $N$. While small matrices use direct algebraic cross-multiplication, higher-order matrices rely on recursive expansion or Gaussian elimination.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                2×2 Matrix Determinant Formula
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For a second-order square matrix A = [[a, b], [c, d]], the determinant is computed directly by taking the product of the main diagonal minus the anti-diagonal:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                                det(A) = ad - bc
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                3×3 Matrix Sarrus Rule & Cofactor Method
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For a third-order square matrix, expand along the first row using minors and cofactors:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                                det(A) = a11(a22a33 - a23a32) - a12(a21a33 - a23a31) + a13(a21a32 - a22a31)
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border border-amber-200 rounded-xl bg-amber-50/50 space-y-2">
                        <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                            <Workflow className="w-4 h-4 text-amber-600" /> Laplace Expansion (Cofactor Expansion) for $N \times N$ Matrices
                        </h4>
                        <p className="text-xs text-amber-900 leading-relaxed">
                            For any N x N matrix, the determinant can be recursively computed along row i:
                            det(A) = sum(j=1..N) (-1)^(i+j) * a_ij * det(M_ij)
                            where M_ij is the (N-1) x (N-1) submatrix formed by deleting the i-th row and j-th column.
                        </p>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Solutions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Calculation Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review detailed mathematical derivations for key matrix operations to better understand the underlying step-by-step logic:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 1: 2×2 Matrix Inversion</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Inversion</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Find A^-1 for A = [[4, 7], [2, 6]]:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
                                <div>1. Calculate Determinant: det(A) = (4 x 6) - (7 x 2) = 24 - 14 = 10</div>
                                <div>2. Form Adjugate Matrix: Swap main diagonal elements, negate off-diagonals:</div>
                                <div className="pl-3 font-bold text-slate-700">adj(A) = [[6, -7], [-2, 4]]</div>
                                <div>3. Multiply by 1 / det(A) = 1/10:</div>
                                <div className="pl-3 font-bold text-indigo-600">A^-1 = [[0.6, -0.7], [-0.2, 0.4]]</div>
                            </div>
                        </div>

                        {/* Example 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 2: 2×2 Matrix Multiplication (Dot Product)</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Multiplication</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Compute A x B for A = [[1, 2], [3, 4]] and B = [[2, 0], [1, 3]]:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
                                <div>1. c11 = (1 x 2) + (2 x 1) = 2 + 2 = 4</div>
                                <div>2. c12 = (1 x 0) + (2 x 3) = 0 + 6 = 6</div>
                                <div>3. c21 = (3 x 2) + (4 x 1) = 6 + 4 = 10</div>
                                <div>4. c22 = (3 x 0) + (4 x 3) = 0 + 12 = 12</div>
                                <div className="font-bold text-indigo-600">A x B = [[4, 6], [10, 12]]</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: How-To Usage Steps */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the Matrix & Determinant Calculator
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Choose Target Operation</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Select between Determinant, Inverse, Multiplication, Transpose, Addition, or Scalar scaling.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Set Matrix Dimensions</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Pick matrix grid sizes (2×2 up to 4×4) for Matrix A and Matrix B.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Input Numerical Coefficients</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Fill in cell values. Instant live computation yields calculated outputs automatically.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Copy or Export CSV</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Copy formatted matrices or download detailed CSV reports for homework or technical documentation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Industry Applications & Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Industry Applications Across Science & Engineering
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Matrix transformations serve as the foundational numerical infrastructure across modern science and technology fields:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" /> 3D Graphics Engines & Video Games
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                4×4 transformation matrices handle 3D perspective projection, object scaling, world-space rotation, and camera viewport positioning across modern graphics APIs (WebGL, Vulkan, DirectX).
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-emerald-600" /> Machine Learning & Deep Neural Networks
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Artificial neural networks execute trillions of matrix-vector multiplications per second during forward passes and weight matrix transpositions during backpropagation gradient descent.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <Workflow className="w-4 h-4 text-amber-600" /> Multi-Loop Circuit Analysis
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Electrical engineers solve complex circuit mesh currents and Kirchhoff's voltage laws using matrix inversion (V = I * R implies I = R^-1 V) across multi-loop electrical grids.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Cryptography & Data Encryption
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The Hill Cipher encryption algorithm uses modular matrix multiplication to encode plaintext message blocks, relying on invertible key matrices for decryption.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 7: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a matrix determinant and why is it important?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The determinant is a scalar value calculated from a square matrix that characterizes the scaling factor of the linear transformation. A determinant of zero indicates the matrix is singular and cannot be inverted.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate the inverse of a matrix?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To invert a matrix A, calculate its determinant det(A), build the matrix of cofactors, transpose it to obtain the adjugate matrix adj(A), and multiply adj(A) by 1 / det(A).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the dimensional rules for matrix multiplication?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Matrix multiplication A x B is valid only if the number of columns in Matrix A equals the number of rows in Matrix B. If A is M x K and B is K x N, the resulting matrix product is M x N.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is matrix multiplication non-commutative?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Unlike real number multiplication, matrix multiplication depends on ordering because row-by-column dot products differ when matrices are swapped, meaning A x B != B x A in general.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a singular matrix?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A singular matrix is a square matrix whose determinant is equal to zero. Singular matrices lack an inverse because division by zero is mathematically undefined.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is the transpose of a matrix computed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The transpose of a matrix is formed by swapping its rows and columns. Entry a_ij in the original matrix becomes entry a^T_ji in the transposed matrix.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
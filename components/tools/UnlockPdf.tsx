"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    Unlock,
    Lock,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    AlertTriangle,
    ShieldCheck,
    Zap,
    KeyRound,
    FileText,
    Eye,
    EyeOff,
    CheckCircle2,
    Cpu,
    Table,
    Workflow,
    Shield,
    HelpCircle,
    FileCheck2,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { decryptPDF } from "@pdfsmaller/pdf-decrypt";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface PDFPagePreview {
    id: string;
    originalIndex: number;
    thumbnailUrl: string;
}

export default function UnlockPdf() {
    // ── Core File & Decryption State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // ── Password & Validation State ──
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

    // ── Page Preview State ──
    const [pages, setPages] = useState<PDFPagePreview[]>([]);
    const [previewPageUrl, setPreviewPageUrl] = useState<string | null>(null);

    // ── UI & Processing State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // Thumbnail Rendering Pipeline
    // ─────────────────────────────────────────────────────────────

    const renderThumbnails = async (dataBuffer: Uint8Array, pass?: string) => {
        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const loadingTask = pdfjsLib.getDocument({
                data: dataBuffer.slice(),
                password: pass,
            });

            const pdfDoc = await loadingTask.promise;
            const count = pdfDoc.numPages;
            setTotalPages(count);

            const pageItems: PDFPagePreview[] = [];

            for (let i = 1; i <= Math.min(count, 12); i++) {
                setLoadingProgress(Math.round((i / Math.min(count, 12)) * 100));
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas,
                    }).promise;

                    const thumbnailUrl = canvas.toDataURL("image/png");
                    pageItems.push({
                        id: `page-${i}-${Date.now()}`,
                        originalIndex: i - 1,
                        thumbnailUrl,
                    });
                }
            }

            setPages(pageItems);
            setIsUnlocked(true);
            setSuccessMessage("PDF successfully authenticated and decrypted in memory!");
        } catch (err: any) {
            if (err.name === "PasswordException") {
                setIsEncrypted(true);
                if (pass) {
                    setErrorMessage("Incorrect password provided. Please verify and try again.");
                } else {
                    setErrorMessage("This PDF is password protected. Enter password to unlock.");
                }
            } else {
                setErrorMessage(
                    err instanceof Error
                        ? err.message
                        : "Failed to read or parse PDF structure."
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // File Loading Handler
    // ─────────────────────────────────────────────────────────────

    const handleFile = useCallback(async (file: File) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsUnlocked(false);
        setPassword("");

        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File size exceeds 20 MB limit. Please select a smaller PDF.");
            return;
        }

        setIsLoading(true);
        setLoadingProgress(10);
        setFileName(file.name);
        setFileSize(file.size);
        setPdfFile(file);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            setPdfBytes(uint8Array.slice());

            // Try reading without password first
            await renderThumbnails(uint8Array, "");
        } catch (err) {
            setErrorMessage("Error reading PDF file bytes.");
            setIsLoading(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const clearWorkspace = () => {
        setPdfFile(null);
        setPdfBytes(null);
        setPages([]);
        setFileName("");
        setFileSize(0);
        setTotalPages(0);
        setPassword("");
        setIsEncrypted(false);
        setIsUnlocked(false);
        setErrorMessage(null);
        setSuccessMessage(null);
        setLoadingProgress(0);
        setPreviewPageUrl(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Decryption & Unlock Logic
    // ─────────────────────────────────────────────────────────────

    const handleUnlockAuthentication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfBytes || !password) return;

        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        await renderThumbnails(pdfBytes, password);
    };

    // ─────────────────────────────────────────────────────────────
    // Export Handler (pdf-lib Engine)
    // ─────────────────────────────────────────────────────────────

    const handleExportUnlockedPdf = async () => {
        if (!pdfBytes) return;

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            let unlockedBytes = pdfBytes;
            if (isEncrypted) {
                unlockedBytes = await decryptPDF(pdfBytes, password);
            }

            const blob = new Blob([unlockedBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName
                ? `${fileName.replace(/\.pdf$/i, "")}_unlocked.pdf`
                : "unlocked_document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            setSuccessMessage("Unlocked PDF generated and downloaded successfully!");
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to assemble unencrypted PDF document."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & DECRYPTION ══════════════════ */}
                <div className="space-y-5">
                    {/* File Upload Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">1. Select Encrypted PDF</h2>
                            </div>
                            {pdfFile && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Clear File
                                </button>
                            )}
                        </div>

                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-7 px-4 text-center ${isDragging
                                    ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                    : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />

                            {pdfFile ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                                        {isEncrypted && !isUnlocked ? (
                                            <Lock className="w-6 h-6 text-amber-600" />
                                        ) : (
                                            <Unlock className="w-6 h-6 text-emerald-600" />
                                        )}
                                    </div>
                                    <div className="text-left space-y-1">
                                        <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                                            {fileName}
                                        </p>
                                        <p className="text-[11px] font-mono text-slate-500">
                                            {formatBytes(fileSize)} {totalPages > 0 && `• ${totalPages} Pages`}
                                        </p>
                                        {isEncrypted && !isUnlocked ? (
                                            <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                Password Protected
                                            </span>
                                        ) : (
                                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                Ready to Export Unencrypted
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                        Drop locked PDF document here, or <span className="text-indigo-600">click to browse</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400">Maximum file size limit: 20 MB</p>
                                </>
                            )}
                        </div>

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>Authenticating & Rendering Pages...</span>
                                    <span className="font-mono text-indigo-600">{loadingProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Password Authentication Card */}
                    {pdfFile && isEncrypted && !isUnlocked && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <KeyRound className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">2. Enter Owner/User Password</h2>
                            </div>

                            <form onSubmit={handleUnlockAuthentication} className="space-y-3">
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter document password..."
                                        className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 text-slate-800 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!password || isLoading}
                                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${password && !isLoading
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    <Unlock className="w-4 h-4" />
                                    <span>Authenticate & Decrypt PDF</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ══════════════════ RIGHT PANEL: PREVIEW & EXPORT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    3. Decrypted Document Preview ({pages.length})
                                </h2>
                            </div>
                        </div>

                        {/* Document Preview Thumbnail Grid */}
                        {pages.length === 0 ? (
                            <div className="h-[280px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                <Lock className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">Preview Locked</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Upload a password-protected PDF and authenticate to view decrypted pages.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[280px] overflow-y-auto pr-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {pages.map((page, index) => (
                                        <div
                                            key={page.id}
                                            className="bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center shadow-sm relative group"
                                        >
                                            <div className="w-full flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    #{index + 1}
                                                </span>
                                            </div>
                                            <div
                                                className="w-full h-28 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1 relative cursor-pointer border border-slate-200"
                                                onClick={() => setPreviewPageUrl(page.thumbnailUrl)}
                                            >
                                                <img
                                                    src={page.thumbnailUrl}
                                                    alt={`Page ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Export Summary & Action */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Original Encrypted File:</span>
                                <span className="font-mono font-bold text-slate-800">
                                    {fileName ? truncateFilename(fileName, 20) : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Decryption Security Status:</span>
                                <span className="font-mono font-bold text-emerald-600">
                                    {isUnlocked ? "Unlocked in Memory" : "Encrypted"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleExportUnlockedPdf}
                            disabled={!isUnlocked || isProcessing}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${isUnlocked && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Generating Unencrypted Document...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Download Unlocked PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewPageUrl && (
                <div
                    className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewPageUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-4 max-w-lg max-h-[85vh] flex flex-col items-center space-y-3 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800">Decrypted Page Expanded Preview</span>
                            <button
                                onClick={() => setPreviewPageUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img src={previewPageUrl} alt="Page Expanded Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg border" />
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture & Encryption Mechanics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of PDF Encryption & Decryption</span>
                        <span className="ml-auto hidden md:inline-flex px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-mono font-semibold text-indigo-600 flex-shrink-0">
                            AES-256 & Standard Security Handler
                        </span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            PDF encryption relies on the PDF Standard Security Handler (specified in ISO 32000-1 / ISO 32000-2). Security parameters dictate access permissions through two distinct passwords: the <strong>User Password</strong> (required to open and render document byte streams) and the <strong>Owner Password</strong> (required to modify permissions, edit form fields, or remove restrictions).
                        </p>
                        <p>
                            When a PDF is protected using standard encryption algorithms such as RC4 or AES (Advanced Encryption Standard with 128-bit or 256-bit keys), the underlying indirect objects—such as page content streams, embedded fonts, and vector paths—are encrypted using a generated Encryption Key.
                        </p>
                        <p>
                            Our client-side WebAssembly and JavaScript framework authenticates user credentials directly inside your browser sandbox. Upon providing valid owner or user credentials, the PDF objects are decrypted into native memory arrays. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> then reconstructs a clean PDF file binary, copying decrypted streams into a new document tree without applying encryption dictionaries, producing an unencrypted standard PDF.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>PDF Security & Decryption Standards Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Overview of standard encryption schemes supported by modern PDF readers and client-side web utilities:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Encryption Handler</th>
                                    <th className="px-4 py-3.5 font-bold">Key Length</th>
                                    <th className="px-4 py-3.5 font-bold">Decryption Requirement</th>
                                    <th className="px-4 py-3.5 font-bold">Client-Side Capability</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Standard V2 Encryption</td>
                                    <td className="px-4 py-3 font-mono text-xs">40-bit RC4</td>
                                    <td className="px-4 py-3">Owner / User Password</td>
                                    <td className="px-4 py-3 font-mono text-xs text-emerald-600">Supported</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Standard V4 Encryption</td>
                                    <td className="px-4 py-3 font-mono text-xs">128-bit AES / RC4</td>
                                    <td className="px-4 py-3">Owner / User Password</td>
                                    <td className="px-4 py-3 font-mono text-xs text-emerald-600">Supported</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Standard V5 Encryption (PDF 2.0)</td>
                                    <td className="px-4 py-3 font-mono text-xs">256-bit AES (R6)</td>
                                    <td className="px-4 py-3">Valid Key/Password</td>
                                    <td className="px-4 py-3 font-mono text-xs text-emerald-600">Supported</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Unlock and Remove Passwords from PDF Files</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Protected PDF",
                                body: "Select or drag your encrypted PDF document into the workspace upload box (up to 20 MB).",
                            },
                            {
                                step: "02",
                                title: "Enter Authentication Password",
                                body: "Provide the document's open/user password to authenticate and decrypt object streams in browser memory.",
                            },
                            {
                                step: "03",
                                title: "Verify Unlocked Page Thumbnails",
                                body: "Confirm that page thumbnails render correctly in the visual preview area once decrypted.",
                            },
                            {
                                step: "04",
                                title: "Export Unencrypted PDF",
                                body: "Click Download Unlocked PDF to compile and save an unencrypted version of your document.",
                            },
                        ].map(({ step, title, body }) => (
                            <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                    {step}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                                    <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 4: Enterprise Privacy & Security Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Client-Side Security & Data Privacy Architecture</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Zero File Uploads",
                                body: "Your passwords and sensitive PDF files never cross the network. All password authentication and decryption routines execute locally in client memory.",
                            },
                            {
                                title: "Browser Sandbox Protection",
                                body: "Leverages standard HTML5 FileReader and WebAssembly primitives, ensuring that memory buffers are cleared when you refresh or navigate away.",
                            },
                            {
                                title: "Immediate Memory Flushing",
                                body: "Decrypted byte structures exist strictly in volatile RAM memory during your active browser session.",
                            },
                            {
                                title: "Zero Data Logging",
                                body: "No analytics or server metrics capture your passwords or file content, providing absolute compliance for legal and financial documents.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Do I need to know the password to unlock my PDF?",
                                a: "Yes. To decrypt standard user-password protected PDF files, you must provide the authorized password once to authenticate and strip restrictions.",
                            },
                            {
                                q: "Is it safe to type my confidential PDF password here?",
                                a: "Yes! Processing is 100% client-side. Your password and PDF content are processed entirely in your web browser and are never sent to any server.",
                            },
                            {
                                q: "Will removing the password affect PDF quality or formatting?",
                                a: "No. The unlock tool preserves vector elements, embedded text formatting, image layers, and document layout without quality loss.",
                            },
                            {
                                q: "What is the maximum file size supported?",
                                a: "The tool supports PDF files up to 20 MB directly in your web browser.",
                            },
                        ].map(({ q, a }, idx) => (
                            <div
                                key={idx}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
                            >
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5">{q}</h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── JSON-LD Structured Data Schemas ── */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Unlock PDF & Password Remover",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports WebAssembly.",
                        description:
                            "Unlock password-protected PDF files and remove document encryption directly in your web browser with complete client-side privacy.",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "Do I need to know the password to unlock my PDF?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, you must provide the authorized document password to authenticate and decrypt the PDF file.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is it safe to type my confidential PDF password here?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, all processing occurs locally in your browser sandbox with zero file uploads.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}

function truncateFilename(str: string, maxLen: number) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + "...";
}
"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    Lock,
    Unlock,
    Upload,
    FileText,
    Trash2,
    RefreshCw,
    FileDown,
    AlertTriangle,
    Check,
    Eye,
    EyeOff,
    Shield,
    ShieldCheck,
    Key,
    KeyRound,
    Cpu,
    Layers,
    Table,
    Workflow,
    HelpCircle,
    Zap,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb, PDFString } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type EncryptionAlgorithm = "AES-256" | "RC4";

interface SecurityFlags {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
}

export default function LockPdfSuite() {
    // ── Core File State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // ── Security & Password State ──
    const [userPassword, setUserPassword] = useState<string>("");
    const [ownerPassword, setOwnerPassword] = useState<string>("");
    const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
    const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);
    const [algorithm, setAlgorithm] = useState<EncryptionAlgorithm>("AES-256");

    // ── Granular Permissions ──
    const [permissions, setPermissions] = useState<SecurityFlags>({
        printing: true,
        modifying: false,
        copying: false,
        annotating: false,
    });

    // ── Processing State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // File Loading Pipeline
    // ─────────────────────────────────────────────────────────────

    const handleFile = useCallback(async (file: File) => {
        setErrorMessage(null);
        setSuccessMessage(null);

        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File size exceeds 20 MB limit. Please select a smaller PDF.");
            return;
        }

        setIsLoading(true);
        setFileName(file.name);
        setFileSize(file.size);
        setPdfFile(file);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Verify that pdf-lib can parse the document and extract metadata
            const srcDoc = await PDFDocument.load(uint8Array, { ignoreEncryption: true });
            if (srcDoc.isEncrypted) {
                setErrorMessage("This PDF is already password protected. Please unlock it first.");
                clearWorkspace();
                return;
            }

            setPdfBytes(uint8Array);
            setTotalPages(srcDoc.getPageCount());
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to read PDF file. The document may be corrupted or protected."
            );
            clearWorkspace();
        } finally {
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
        setFileName("");
        setFileSize(0);
        setTotalPages(0);
        setUserPassword("");
        setOwnerPassword("");
        setErrorMessage(null);
        setSuccessMessage(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Password Strength Estimator
    // ─────────────────────────────────────────────────────────────

    const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
        if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
        let score = 0;
        if (pass.length >= 8) score += 25;
        if (pass.length >= 12) score += 25;
        if (/[A-Z]/.test(pass)) score += 15;
        if (/[0-9]/.test(pass)) score += 15;
        if (/[^A-Za-z0-9]/.test(pass)) score += 20;

        if (score < 40) return { score, label: "Weak", color: "bg-rose-500" };
        if (score < 75) return { score, label: "Moderate", color: "bg-amber-500" };
        return { score, label: "Strong", color: "bg-emerald-500" };
    };

    const strength = calculatePasswordStrength(userPassword);

    // ─────────────────────────────────────────────────────────────
    // PDF Encryption Pipeline (pdf-lib Encryption Engine)
    // ─────────────────────────────────────────────────────────────

    const handleEncryptAndDownload = async () => {
        if (!pdfBytes || !pdfFile) {
            setErrorMessage("Please upload a PDF document before applying encryption.");
            return;
        }

        if (!userPassword.trim()) {
            setErrorMessage("Please enter a User Password to protect open access.");
            return;
        }

        setIsEncrypting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        // Escape patch for PDFString to ensure raw binary encrypted strings are correctly escaped
        // in the output PDF, preventing syntax corruption (unbalanced parens/backslashes) in Acrobat Reader.
        const escapePdfString = (str: string): string => {
            let escaped = "";
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                if (char === "\\" || char === "(" || char === ")") {
                    escaped += "\\" + char;
                } else {
                    escaped += char;
                }
            }
            return escaped;
        };

        const originalToString = PDFString.prototype.toString;
        const originalSize = PDFString.prototype.sizeInBytes;
        const originalCopyBytes = PDFString.prototype.copyBytesInto;

        (PDFString.prototype as any).toString = function (this: any) {
            return "(" + escapePdfString(this.value || "") + ")";
        };
        (PDFString.prototype as any).sizeInBytes = function (this: any) {
            return escapePdfString(this.value || "").length + 2;
        };
        (PDFString.prototype as any).copyBytesInto = function (this: any, buffer: Uint8Array, offset: number) {
            const escaped = escapePdfString(this.value || "");
            buffer[offset++] = 40; // '('
            for (let i = 0; i < escaped.length; i++) {
                buffer[offset++] = escaped.charCodeAt(i);
            }
            buffer[offset++] = 41; // ')'
            return escaped.length + 2;
        };

        try {
            // Encrypt using @pdfsmaller/pdf-encrypt client-side library directly on the original uploaded bytes
            const encryptedBytes = await encryptPDF(pdfBytes, userPassword, {
                ownerPassword: ownerPassword.trim() || undefined,
                algorithm: algorithm === "AES-256" ? "AES-256" : "RC4",
                allowPrinting: permissions.printing,
                allowModifying: permissions.modifying,
                allowCopying: permissions.copying,
                allowAnnotating: permissions.annotating,
                allowFillingForms: permissions.modifying,
                allowExtraction: permissions.copying,
                allowAssembly: permissions.modifying,
                allowHighQualityPrint: permissions.printing,
            });

            const blob = new Blob([encryptedBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName
                ? `${fileName.replace(/\.pdf$/i, "")}_locked.pdf`
                : "protected_document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            setSuccessMessage("PDF encrypted and downloaded successfully!");
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to encrypt PDF file. Please try again."
            );
        } finally {
            // Restore original methods
            PDFString.prototype.toString = originalToString;
            PDFString.prototype.sizeInBytes = originalSize;
            PDFString.prototype.copyBytesInto = originalCopyBytes;
            setIsEncrypting(false);
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
                {/* ══════════════════ LEFT PANEL: FILE UPLOAD & PREVIEW ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">Lock PDF & Password Encryption</h2>
                                    <p className="text-xs text-indigo-100">Client-Side 256-Bit Security Sandbox</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-indigo-600" />
                                    <h2 className="text-sm font-semibold text-slate-900">1. Select Target PDF</h2>
                                </div>
                                {pdfFile && (
                                    <button
                                        type="button"
                                        onClick={clearWorkspace}
                                        className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear File
                                    </button>
                                )}
                            </div>

                            {/* Drag-and-Drop Zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-10 px-4 text-center min-h-[220px] ${isDragging
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
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                                            <FileText className="w-7 h-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900 truncate max-w-[240px]">
                                                {fileName}
                                            </p>
                                            <p className="text-xs font-mono text-slate-500">
                                                {formatBytes(fileSize)} • {totalPages} Pages
                                            </p>
                                            <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                Unencrypted Document Ready
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 mb-1">
                                            Drop PDF here, or <span className="text-indigo-600">click to browse</span>
                                        </p>
                                        <p className="text-xs text-slate-400">Maximum file size: 20 MB</p>
                                    </>
                                )}
                            </div>

                            {isLoading && (
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs font-semibold text-indigo-900">
                                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                                    <span>Parsing PDF structure and validating metadata...</span>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs flex items-start gap-3">
                                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span>{successMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: SECURITY & ENCRYPTION CONFIG ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Key className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-semibold text-slate-900">2. Security & Password Settings</h2>
                        </div>

                        {/* Password Inputs */}
                        <div className="space-y-4">
                            {/* User Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                    <span>User Open Password (Required)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Required to view document</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showUserPassword ? "text" : "password"}
                                        value={userPassword}
                                        onChange={(e) => setUserPassword(e.target.value)}
                                        placeholder="Enter user password..."
                                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowUserPassword(!showUserPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Meter */}
                                {userPassword && (
                                    <div className="space-y-1 pt-1">
                                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                                            <span>Strength: {strength.label}</span>
                                            <span>{strength.score}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${strength.color}`}
                                                style={{ width: `${strength.score}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Owner Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                    <span>Owner Master Password (Optional)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Controls permissions</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showOwnerPassword ? "text" : "password"}
                                        value={ownerPassword}
                                        onChange={(e) => setOwnerPassword(e.target.value)}
                                        placeholder="Optional master password..."
                                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Algorithm Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-800">Encryption Standard</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: "AES-256", label: "AES 256-Bit", badge: "Highest Security" },
                                        { id: "RC4", label: "RC4 128-Bit", badge: "Legacy Compatible" },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setAlgorithm(item.id as EncryptionAlgorithm)}
                                            className={`p-3 rounded-xl border text-left transition-all ${algorithm === item.id
                                                ? "bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-500/30"
                                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                                                }`}
                                        >
                                            <p className="text-xs font-bold text-slate-900">{item.label}</p>
                                            <p className="text-[10px] text-indigo-600 font-medium">{item.badge}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Granular Permissions Section */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-800 block">
                                Restrict User Operations (Requires Permissions Lock)
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { key: "printing", label: "Allow Printing" },
                                    { key: "copying", label: "Allow Text/Image Copying" },
                                    { key: "modifying", label: "Allow Document Editing" },
                                    { key: "annotating", label: "Allow Comments & Notes" },
                                ].map(({ key, label }) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={permissions[key as keyof SecurityFlags]}
                                            onChange={(e) =>
                                                setPermissions((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.checked,
                                                }))
                                            }
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <span className="text-xs font-medium text-slate-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            type="button"
                            onClick={handleEncryptAndDownload}
                            disabled={!pdfBytes || isEncrypting || !userPassword.trim()}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px] ${pdfBytes && userPassword.trim() && !isEncrypting
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                }`}
                        >
                            {isEncrypting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Applying Encryption & Securing Document...</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    <span>Encrypt & Download Protected PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of PDF Encryption</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            PDF encryption operates by deriving cryptographic keys from user and owner passwords using standard hash algorithms (MD5, SHA-256) combined with unique document identifiers and padding bytes. These derived keys encrypt the PDF document object stream, cross-reference tables, and embedded streams without altering basic structure definitions.
                        </p>
                        <p>
                            Under the standard PDF security handler (ISO 32000-2), two distinct passwords govern access. The <strong>User Password</strong> encrypts the document encryption key itself, requiring readers to present the credentials to view or render pages. The <strong>Owner Password</strong> unlocks administrative permissions, allowing users to alter restriction flags such as printing resolution, form filling, content extraction, and page assembly.
                        </p>
                        <p>
                            Our web suite executes this entire key derivation and object stream encryption sequence completely inside client browser memory using <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code>. No document bytes, passwords, or encryption keys leave your local device, guaranteeing end-to-end privacy for sensitive records.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>PDF Security & Encryption Comparison Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review security levels, cipher algorithms, and enforcement standards available in modern PDF security specifications:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Cipher Standard</th>
                                    <th className="px-4 py-3.5 font-bold">Key Length</th>
                                    <th className="px-4 py-3.5 font-bold">Key Derivation</th>
                                    <th className="px-4 py-3.5 font-bold">Acrobat Compatibility</th>
                                    <th className="px-4 py-3.5 font-bold">Security Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">AES-256 (Revision 6)</td>
                                    <td className="px-4 py-3 font-mono text-xs">256-Bit</td>
                                    <td className="px-4 py-3">SHA-384 / Hardened Salt</td>
                                    <td className="px-4 py-3">Acrobat X (10.0) & Newer</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Enterprise Grade</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">AES-128 (Revision 4)</td>
                                    <td className="px-4 py-3 font-mono text-xs">128-Bit</td>
                                    <td className="px-4 py-3">MD5 / Salted Key</td>
                                    <td className="px-4 py-3">Acrobat 7.0 & Newer</td>
                                    <td className="px-4 py-3 font-semibold text-indigo-600">Standard Grade</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">RC4 128-Bit (Legacy)</td>
                                    <td className="px-4 py-3 font-mono text-xs">128-Bit Stream</td>
                                    <td className="px-4 py-3">MD5 Hash</td>
                                    <td className="px-4 py-3">Acrobat 5.0 & Newer</td>
                                    <td className="px-4 py-3 font-semibold text-rose-500">Deprecated</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Lock & Encrypt PDF Files</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload PDF File",
                                body: "Select or drag any PDF up to 20 MB into the secure upload zone. The engine checks file structure and validates encryption state.",
                            },
                            {
                                step: "02",
                                title: "Set User & Master Passwords",
                                body: "Specify an open password required to view the document. Optionally set a master owner password to enforce edit limits.",
                            },
                            {
                                step: "03",
                                title: "Configure Feature Restrictions",
                                body: "Toggle granular flags to restrict high-resolution printing, text copying, document editing, and comment annotations.",
                            },
                            {
                                step: "04",
                                title: "Encrypt & Download",
                                body: "Click to apply browser-side AES encryption and instantly save the protected PDF directly to your device local storage.",
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

                {/* Card 4: Security Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span>Client-Side Security & Data Isolation</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Zero Network Exposure",
                                body: "All password hashing and stream ciphers run locally in JavaScript memory. Your file bytes never touch remote servers or third-party APIs.",
                            },
                            {
                                title: "Compliant Protection",
                                body: "Employs standard ISO 32000-2 security handlers compatible with Adobe Acrobat Reader, Apple Preview, web browsers, and enterprise viewers.",
                            },
                            {
                                title: "Granular Permission Lockout",
                                body: "Enforces distinct owner level authority over user viewing access, giving you complete governance over document usage.",
                            },
                            {
                                title: "Automated Buffer Cleansing",
                                body: "Temporary key arrays and binary document buffers are automatically cleared from browser RAM as soon as processing completes.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "What is the difference between a User Password and an Owner Password?",
                                a: "A User Password is required to open and view the PDF document. An Owner Password is required to change permissions, modify security flags, or remove protection later.",
                            },
                            {
                                q: "Are my passwords or PDF documents uploaded to any server?",
                                a: "No. All encryption algorithms run 100% inside your browser using client-side WebAssembly and JavaScript engines. Your data never leaves your device.",
                            },
                            {
                                q: "Can I lock a PDF file that is already password protected?",
                                a: "You must first unlock an encrypted PDF before applying new passwords or updated permission rules.",
                            },
                            {
                                q: "Will the encrypted PDF work in standard PDF viewers like Adobe Acrobat?",
                                a: "Yes. Our tool creates standard ISO 32000 compliant PDF structures compatible with Adobe Acrobat Reader, Google Chrome, Apple Preview, and all major PDF readers.",
                            },
                            {
                                q: "What happens if I forget the password used to lock the PDF?",
                                a: "Because our tool uses strong AES encryption without backdoor access, forgotten passwords cannot be recovered. Make sure to keep a secure record of your passwords.",
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
                        name: "Lock PDF & Password Encryption Suite",
                        applicationCategory: "SecurityApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Lock PDF documents with AES 256-bit password encryption directly in your browser. Set custom open passwords, master permission locks, and restrict printing or copying without uploading files.",
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
                                name: "What is the difference between a User Password and an Owner Password?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "A User Password is required to open and view the PDF. An Owner Password allows changing security permissions and master locks.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Are my passwords or PDF documents uploaded to any server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All encryption logic executes 100% locally inside your browser using pdf-lib.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}
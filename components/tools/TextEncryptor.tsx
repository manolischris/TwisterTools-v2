"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Lock,
    Unlock,
    Key,
    ShieldCheck,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Eye,
    EyeOff,
    AlertTriangle,
    Sliders,
    Shield,
    HelpCircle,
    Binary,
    Cpu,
    Layers,
    Terminal,
    FileText,
    LockKeyhole,
} from "lucide-react";

type EncryptionAlgorithm = "AES-GCM" | "Caesar";

export default function TextEncryptor() {
    // ── Core State ──
    const [algorithm, setAlgorithm] = useState<EncryptionAlgorithm>("AES-GCM");
    const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [caesarShift, setCaesarShift] = useState(3);
    const [showSecretKey, setShowSecretKey] = useState(false);

    // ── UI Feedback State ──
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ── Metric Counters ──
    const [inputCharCount, setInputCharCount] = useState(0);
    const [outputCharCount, setOutputCharCount] = useState(0);

    // ── Helper: Buffer to Base64 & Base64 to Buffer ──
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    // ── Web Crypto API: Key Derivation (PBKDF2) & AES-GCM ──
    const deriveKey = async (
        passphrase: string,
        salt: Uint8Array
    ): Promise<CryptoKey> => {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(passphrase),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt as unknown as BufferSource,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    };

    const encryptAesGcm = async (
        text: string,
        pass: string
    ): Promise<string> => {
        const enc = new TextEncoder();
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const cryptoKey = await deriveKey(pass, salt);

        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            enc.encode(text)
        );

        // Concatenate Salt (16B) + IV (12B) + Ciphertext
        const combined = new Uint8Array(
            salt.length + iv.length + ciphertextBuffer.byteLength
        );
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(ciphertextBuffer), salt.length + iv.length);

        return arrayBufferToBase64(combined.buffer);
    };

    const decryptAesGcm = async (
        cipherBase64: string,
        pass: string
    ): Promise<string> => {
        const combinedBuffer = base64ToArrayBuffer(cipherBase64.trim());
        const combined = new Uint8Array(combinedBuffer);

        if (combined.length < 28) {
            throw new Error("Invalid ciphertext structure or length.");
        }

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const ciphertext = combined.slice(28);

        const cryptoKey = await deriveKey(pass, salt);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            ciphertext
        );

        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
    };

    // ── Caesar Cipher Engine ──
    const processCaesar = (
        text: string,
        shift: number,
        decrypt = false
    ): string => {
        let effectiveShift = shift % 26;
        if (decrypt) {
            effectiveShift = (26 - effectiveShift) % 26;
        }

        return text
            .split("")
            .map((char) => {
                const code = char.charCodeAt(0);
                // Uppercase letters
                if (code >= 65 && code <= 90) {
                    return String.fromCharCode(
                        ((code - 65 + effectiveShift) % 26) + 65
                    );
                }
                // Lowercase letters
                if (code >= 97 && code <= 122) {
                    return String.fromCharCode(
                        ((code - 97 + effectiveShift) % 26) + 97
                    );
                }
                return char;
            })
            .join("");
    };

    // ── Cryptographic Processing Coordinator ──
    const handleProcess = useCallback(async () => {
        setError(null);
        if (!inputText) {
            setOutputText("");
            setInputCharCount(0);
            setOutputCharCount(0);
            return;
        }

        setInputCharCount(inputText.length);
        setIsProcessing(true);

        try {
            let result = "";
            if (algorithm === "AES-GCM") {
                if (!secretKey) {
                    setError(
                        "A secret passphrase is required for AES-256 encryption & decryption."
                    );
                    setOutputText("");
                    setOutputCharCount(0);
                    setIsProcessing(false);
                    return;
                }
                if (mode === "encrypt") {
                    result = await encryptAesGcm(inputText, secretKey);
                } else {
                    result = await decryptAesGcm(inputText, secretKey);
                }
            } else if (algorithm === "Caesar") {
                result = processCaesar(inputText, caesarShift, mode === "decrypt");
            }

            setOutputText(result);
            setOutputCharCount(result.length);
        } catch (err) {
            setError(
                mode === "decrypt"
                    ? "Decryption failed. Please check your secret key, shift value, or input payload."
                    : "Encryption failed. An unexpected computational error occurred."
            );
            setOutputText("");
            setOutputCharCount(0);
        } finally {
            setIsProcessing(false);
        }
    }, [inputText, secretKey, caesarShift, algorithm, mode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleProcess();
        }, 0);
        return () => clearTimeout(timer);
    }, [handleProcess]);

    // ── Passphrase Utilities ──
    const generateRandomKey = () => {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
        const array = new Uint8Array(24);
        window.crypto.getRandomValues(array);
        let generated = "";
        for (let i = 0; i < array.length; i++) {
            generated += chars[array[i] % chars.length];
        }
        setSecretKey(generated);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    const clearWorkspace = () => {
        setInputText("");
        setOutputText("");
        setSecretKey("");
        setError(null);
        setInputCharCount(0);
        setOutputCharCount(0);
    };

    const loadSample = () => {
        if (algorithm === "AES-GCM") {
            if (mode === "encrypt") {
                setInputText(
                    "Top Secret Command Directive: Launch security protocols immediately at 0800 hours."
                );
                setSecretKey("CyberSecurityPassphrase2026!");
            } else {
                setSecretKey("CyberSecurityPassphrase2026!");
                setInputText(
                    "P3x8L/8S0m/qV04vJ/4wU9/5+sD23c5N9f7/1L6+v83S... [Sample Encrypted Base64]"
                );
            }
        } else {
            if (mode === "encrypt") {
                setInputText(
                    "Meet me at the Roman Forum at midnight for the rendezvous."
                );
                setCaesarShift(3);
            } else {
                setInputText(
                    "Peeq ph dw wkh Urpdqiruxp dw plgqljkw iru wkh uhqghcyrxv."
                );
                setCaesarShift(3);
            }
        }
    };

    return (
        <div className="w-full space-y-8">
            {/* ── Two-Column Dashboard Workspace (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & CONFIG ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Lock className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">
                                    Encryption & Decryption Suite
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Algorithm & Mode Toggles */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Select Cryptographic Standard
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setAlgorithm("AES-GCM");
                                            setError(null);
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${algorithm === "AES-GCM"
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        AES-256-GCM
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAlgorithm("Caesar");
                                            setError(null);
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${algorithm === "Caesar"
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <Sliders className="w-4 h-4" />
                                        Caesar Cipher
                                    </button>
                                </div>
                            </div>

                            {/* Mode Switch (Encrypt / Decrypt) */}
                            <div className="flex rounded-xl bg-slate-100 p-1">
                                <button
                                    onClick={() => {
                                        setMode("encrypt");
                                        setError(null);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${mode === "encrypt"
                                            ? "bg-white text-indigo-600 shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-800"
                                        }`}
                                >
                                    <Lock className="w-4 h-4" />
                                    Encrypt
                                </button>
                                <button
                                    onClick={() => {
                                        setMode("decrypt");
                                        setError(null);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${mode === "decrypt"
                                            ? "bg-white text-indigo-600 shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-800"
                                        }`}
                                >
                                    <Unlock className="w-4 h-4" />
                                    Decrypt
                                </button>
                            </div>

                            {/* Cryptographic Key / Shift Inputs */}
                            {algorithm === "AES-GCM" ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="secret-key-input"
                                            className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                                        >
                                            <Key className="w-3.5 h-3.5 text-indigo-600" />
                                            Secret Passphrase
                                        </label>
                                        <button
                                            type="button"
                                            onClick={generateRandomKey}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Generate Key
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="secret-key-input"
                                            type={showSecretKey ? "text" : "password"}
                                            value={secretKey}
                                            onChange={(e) => setSecretKey(e.target.value)}
                                            placeholder="Enter a strong passphrase..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSecretKey(!showSecretKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showSecretKey ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label
                                        htmlFor="caesar-shift-input"
                                        className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                                    >
                                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                        Alphabet Shift Value (0 - 25)
                                    </label>
                                    <input
                                        id="caesar-shift-input"
                                        type="number"
                                        min="0"
                                        max="25"
                                        value={caesarShift.toString()}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, "");
                                            setCaesarShift(
                                                val === ""
                                                    ? 0
                                                    : Math.min(25, Math.max(0, parseInt(val, 10) || 0))
                                            );
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                                    />
                                </div>
                            )}

                            {/* Input Text Area */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="text-input-area"
                                    className="text-xs font-semibold text-slate-700"
                                >
                                    {mode === "encrypt"
                                        ? "Plaintext Input Payload"
                                        : "Encrypted Ciphertext Payload"}
                                </label>
                                <textarea
                                    id="text-input-area"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={
                                        mode === "encrypt"
                                            ? "Enter or paste your plain sensitive text here..."
                                            : "Enter or paste encrypted ciphertext base64 data here..."
                                    }
                                    className="font-mono text-sm h-[260px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>

                            {/* Toolbar Controls */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={loadSample}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Load Sample
                                </button>
                                <button
                                    onClick={clearWorkspace}
                                    disabled={!inputText && !secretKey}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Workspace
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: OUTPUT & METRICS ══════════════════ */}
                <div className="space-y-5">
                    <div className="sticky top-4 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                            {/* Header Bar */}
                            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-indigo-200" />
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {mode === "encrypt"
                                            ? "Encrypted Cipher Result"
                                            : "Decrypted Plaintext Result"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Error Banner */}
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Output Container */}
                                <div className="relative">
                                    <textarea
                                        id="text-output-area"
                                        value={outputText}
                                        readOnly
                                        onClick={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.select();
                                        }}
                                        placeholder={
                                            isProcessing
                                                ? "Computing cryptographic transformation..."
                                                : mode === "encrypt"
                                                    ? "Your encrypted ciphertext will appear here..."
                                                    : "Your decrypted message will appear here..."
                                        }
                                        className="font-mono text-sm h-[365px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none cursor-pointer"
                                    />
                                </div>

                                {/* Metrics Card */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Input Payload
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {inputCharCount.toLocaleString()} chars
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Output Payload
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {outputCharCount.toLocaleString()} chars
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2 sm:col-span-1">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Security Engine
                                        </p>
                                        <p className="text-sm font-mono font-bold text-indigo-600">
                                            {algorithm === "AES-GCM" ? "AES-256-GCM" : "Caesar Shift"}
                                        </p>
                                    </div>
                                </div>

                                {/* Copy Action */}
                                <button
                                    onClick={() => outputText && copyToClipboard(outputText)}
                                    disabled={!outputText}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${outputText
                                            ? copied
                                                ? "bg-green-500 text-white shadow-md shadow-green-200"
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied Output to Clipboard!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy Output Text
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK (INFO-RICH & SEARCH ENGINE OPTIMIZED)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Core Architectural Foundations & Security Philosophy */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>
                            Modern Text Encryption: Foundations, Security, and Compliance
                        </span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            In an era defined by ubiquitous data exchange and increasing automated threat vectors, protecting unencrypted sensitive text—such as API secrets, database credentials, personally identifiable information (PII), or private communications—is a critical imperative. Text encryption transforms human-readable plaintext into unreadable ciphertext through mathematical transformations, safeguarding data at rest and during client-side transit.
                        </p>
                        <p>
                            This suite provides two distinct, highly optimized encryption engines designed for different usage profiles: <strong>AES-256-GCM</strong> for zero-trust enterprise security and the <strong>Caesar Cipher</strong> for educational cipher analysis, mathematical demonstration, and basic text masking. By executing cryptographic operations entirely within the browser via Web APIs (`window.crypto.subtle`), the tool ensures that plaintexts, secret passphrases, and generated ciphertexts never hit an external server network.
                        </p>
                        <p>
                            Adhering to strict zero-knowledge principles, this application satisfies key security standards required by modern regulatory frameworks like GDPR, HIPAA, and PCI-DSS, ensuring client-side execution boundaries remain completely isolated.
                        </p>
                    </div>
                </div>

                {/* Card 2: Deep Dive into AES-256-GCM Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <LockKeyhole className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>
                            Deep Dive: Advanced Encryption Standard in Galois/Counter Mode (AES-256-GCM)
                        </span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The Advanced Encryption Standard (AES) is a symmetric block cipher established by the National Institute of Standards and Technology (NIST) in 2001. Operating on fixed 128-bit blocks of data, AES-256 utilizes a key length of 256 bits, requiring 14 transformation rounds of substitution, permutation, and key mixing. When combined with Galois/Counter Mode (GCM), AES provides both data confidentiality and built-in message authentication (Authenticated Encryption with Associated Data, or AEAD).
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    1. Key Derivation (PBKDF2)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Passphrases are transformed into 256-bit cryptographic keys using PBKDF2 with 100,000 iterations of SHA-256 and a random 16-byte salt, rendering brute-force dictionary attacks computationally infeasible.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    2. Random Initialization Vector (IV)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Every encryption operation generates a unique 12-byte (96-bit) IV using CSPRNG (`window.crypto.getRandomValues`). This guarantees distinct output ciphertexts even when encrypting identical text repeatedly.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    3. Galois Authentication Tag
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    AES-GCM computes a 128-bit authentication tag over the ciphertext. During decryption, any byte-level alteration triggers an instant authentication failure, preventing ciphertext tampering attacks.
                                </p>
                            </div>
                        </div>

                        <p>
                            The output generated by this tool concatenates `Salt (16 bytes) + IV (12 bytes) + Ciphertext + Auth Tag`, encoded as a standard Base64 string for effortless storage, transmission, and cross-platform compatibility.
                        </p>
                    </div>
                </div>

                {/* Card 3: Deep Dive into Caesar Cipher & Historical Cryptography */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>
                            Classical Cryptography: The Caesar Shift Cipher Mechanics
                        </span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The Caesar Cipher is one of the earliest and simplest monoalphabetic substitution ciphers. Named after Julius Caesar, who used it with a shift of three to protect military messages, the algorithm shifts every letter in the plaintext by a fixed offset `K` along the alphabet ring.
                        </p>
                        <p className="font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800">
                            Mathematical Formulation: <br />
                            Encryption: E(x) = (x + k) mod 26 <br />
                            Decryption: D(x) = (x - k) mod 26
                        </p>
                        <p>
                            While trivially breakable using frequency analysis or brute-force testing of all 25 possible shifts, the Caesar Cipher remains an essential educational tool for understanding character encoding, ASCII mapping, and modular arithmetic in computer science curricula.
                        </p>
                    </div>
                </div>

                {/* Card 4: Technical Comparison Matrix */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Binary className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>
                            Comparative Matrix: AES-256-GCM vs. Caesar Cipher
                        </span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
                        Detailed evaluation of structural parameters, computational complexity, security boundaries, and appropriate operational environments.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="text-left px-4 py-3 text-sm font-semibold">
                                        Feature / Dimension
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">
                                        AES-256-GCM
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">
                                        Caesar Cipher
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
                                        Cipher Family
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono">
                                        Symmetric Block Cipher (AEAD)
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono">
                                        Monoalphabetic Substitution
                                    </td>
                                </tr>
                                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
                                        Key Size / Space
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono">
                                        256 bits (2^256 combinations)
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono">
                                        5 bits (25 valid shifts)
                                    </td>
                                </tr>
                                <tr className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
                                        Data Integrity Verification
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                        Yes (Built-in Auth Tag)
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                        No
                                    </td>
                                </tr>
                                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
                                        Vulnerability Profile
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                        Immune to known attacks when key is kept secret
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                        Vulnerable to frequency analysis & brute force
                                    </td>
                                </tr>
                                <tr className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
                                        Ideal Use Cases
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                        Production systems, confidential notes, tokens
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                        Academic learning, simple ROT13-style masking
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 5: Step-by-Step Practical Examples */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Practical Implementation Examples & Workflows</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Workflow 1: Securing API Credentials (AES-256)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                1. Select <strong>AES-256-GCM</strong> mode.<br />
                                2. Click <strong>Generate Key</strong> to produce a strong 24-character secret passphrase.<br />
                                3. Paste raw environment variables or API keys into the input workspace.<br />
                                4. Copy the resulting Base64 string for safe distribution or offline storage.
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                Workflow 2: Educational Cipher Testing (Caesar)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                1. Select <strong>Caesar Cipher</strong> mode.<br />
                                2. Set the shift offset value (e.g., `Shift = 13` for standard ROT13 behavior).<br />
                                3. Input plaintext to visualize real-time character rotation.<br />
                                4. Switch to <strong>Decrypt</strong> mode to verify reverse shift reconstruction.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 6: Frequently Asked Questions (Static Non-Accordion) */}
                <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions (FAQ)</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "Is my secret key or plaintext ever transmitted over the network?",
                                a: "No. All encryption and decryption logic executes entirely within your browser runtime using standard Web Crypto APIs (`window.crypto.subtle`). No input strings, passphrases, or output ciphertexts leave your local hardware environment.",
                            },
                            {
                                q: "Why does AES-GCM output a different ciphertext for the same text and key?",
                                a: "Our AES-256-GCM engine generates a fresh 16-byte PBKDF2 salt and a random 12-byte Initialization Vector (IV) for every encryption run via CSPRNG. This randomness ensures semantic security, preventing attackers from identifying repeated plaintexts.",
                            },
                            {
                                q: "What happens if I lose my secret key for an AES encrypted message?",
                                a: "AES-256 is mathematically unbreakable using current computational infrastructure. Without the exact passphrase, recovering the original plaintext is impossible as there are no master keys or backdoor mechanisms.",
                            },
                            {
                                q: "How does the tool handle non-ASCII characters and foreign alphabets in Caesar mode?",
                                a: "In Caesar Cipher mode, the shift transformation applies strictly to standard English alphabetic characters (A-Z, a-z). Numbers, punctuation, spaces, and foreign symbols remain unshifted to preserve structural context.",
                            },
                            {
                                q: "Is AES-256-GCM quantum-resistant?",
                                a: "AES-256 offers strong quantum resistance. While Grover's algorithm effectively halves symmetric key strength, a 256-bit key maintains 128 bits of security against quantum attacks, which remains beyond foreseeable computing power.",
                            },
                        ].map(({ q, a }) => (
                            <div
                                key={q}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    {q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">
                                    {a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Structured Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Text Encryption & Decryption Suite",
                        applicationCategory: "SecurityApplication",
                        operatingSystem: "All",
                        description:
                            "Client-side text encryption suite featuring AES-256-GCM authenticated encryption and Caesar cipher algorithms. 100% private browser processing with zero server network calls.",
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
                                name: "Is my secret key or plaintext ever transmitted over the network?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All encryption and decryption logic executes entirely within your browser runtime using standard Web Crypto APIs.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why does AES-GCM output a different ciphertext for the same text and key?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Our AES-256-GCM engine generates a fresh 16-byte PBKDF2 salt and a random 12-byte Initialization Vector (IV) for every encryption run.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What happens if I lose my secret key for an AES encrypted message?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "AES-256 is mathematically unbreakable using current computational infrastructure. Without the exact passphrase, recovering the original plaintext is impossible.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}
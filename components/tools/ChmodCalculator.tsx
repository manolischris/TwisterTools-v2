"use client";

import React, { useState, useMemo } from "react";
import {
    Shield,
    Copy,
    Check,
    RotateCw,
    Terminal,
    FileCode,
    Sliders,
    CheckSquare,
    Square,
    Lock,
    Unlock,
    KeyRound,
    FileText,
    Folder,
    BookOpen,
    HelpCircle,
    Cpu,
    Layers,
    AlertTriangle,
    Sparkles,
    Info
} from "lucide-react";

type Scope = "owner" | "group" | "others";
type Permission = "read" | "write" | "execute";
type SpecialBit = "setuid" | "setgid" | "sticky";

interface PermissionState {
    owner: { read: boolean; write: boolean; execute: boolean };
    group: { read: boolean; write: boolean; execute: boolean };
    others: { read: boolean; write: boolean; execute: boolean };
    special: { setuid: boolean; setgid: boolean; sticky: boolean };
}

interface CommonPreset {
    octal: string;
    symbolic: string;
    name: string;
    description: string;
    scope: "file" | "directory" | "sensitive";
}

const COMMON_PRESETS: CommonPreset[] = [
    {
        octal: "0755",
        symbolic: "rwxr-xr-x",
        name: "Standard Executable / Directory",
        description: "Full owner access; group and others can read and enter/execute.",
        scope: "directory"
    },
    {
        octal: "0644",
        symbolic: "rw-r--r--",
        name: "Standard Public File",
        description: "Owner can read/write; group and others can only read (HTML, CSS, images).",
        scope: "file"
    },
    {
        octal: "0700",
        symbolic: "rwx------",
        name: "Private Script / Directory",
        description: "Strictly isolated to owner only. No permissions for group or others.",
        scope: "directory"
    },
    {
        octal: "0600",
        symbolic: "rw-------",
        name: "Private Sensitive File (.env, SSH Keys)",
        description: "Strict owner read/write. Required for id_rsa and production secrets.",
        scope: "sensitive"
    },
    {
        octal: "0777",
        symbolic: "rwxrwxrwx",
        name: "Full Unrestricted Access",
        description: "Completely open read/write/execute for all users. High security risk.",
        scope: "file"
    },
    {
        octal: "0664",
        symbolic: "rw-rw-r--",
        name: "Shared Group Workspace File",
        description: "Owner and group can edit; others have read-only access.",
        scope: "file"
    },
    {
        octal: "0775",
        symbolic: "rwxrwxr-x",
        name: "Shared Group Directory",
        description: "Owner and team group members can add/remove files; others read-only.",
        scope: "directory"
    },
    {
        octal: "0400",
        symbolic: "r--------",
        name: "Read-Only Key / Certificate",
        description: "Immutable read access strictly for file owner.",
        scope: "sensitive"
    },
    {
        octal: "1777",
        symbolic: "rwxrwxrwt",
        name: "Sticky Public Directory (/tmp)",
        description: "All users can write, but only file owners can delete their own files.",
        scope: "directory"
    },
    {
        octal: "4755",
        symbolic: "rwsr-xr-x",
        name: "SetUID Root Executable (passwd, sudo)",
        description: "Executes with file owner permissions regardless of calling user.",
        scope: "sensitive"
    }
];

export default function ChmodCalculator() {
    const [permissions, setPermissions] = useState<PermissionState>({
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
        special: { setuid: false, setgid: false, sticky: false }
    });

    const [targetPath, setTargetPath] = useState<string>("/var/www/html/app.sh");
    const [isRecursive, setIsRecursive] = useState<boolean>(false);
    const [isVerbose, setIsVerbose] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    // Toggle individual standard permission
    const togglePermission = (scope: Scope, perm: Permission) => {
        setPermissions((prev) => ({
            ...prev,
            [scope]: {
                ...prev[scope],
                [perm]: !prev[scope][perm]
            }
        }));
    };

    // Toggle special permission bit
    const toggleSpecial = (bit: SpecialBit) => {
        setPermissions((prev) => ({
            ...prev,
            special: {
                ...prev.special,
                [bit]: !prev.special[bit]
            }
        }));
    };

    // Calculate scope value: r=4, w=2, x=1
    const getScopeOctal = (scope: Scope): number => {
        const s = permissions[scope];
        return (s.read ? 4 : 0) + (s.write ? 2 : 0) + (s.execute ? 1 : 0);
    };

    // Calculate special bit octal: setuid=4, setgid=2, sticky=1
    const getSpecialOctal = (): number => {
        const sp = permissions.special;
        return (sp.setuid ? 4 : 0) + (sp.setgid ? 2 : 0) + (sp.sticky ? 1 : 0);
    };

    // Compute 3-digit and 4-digit octal representations
    const standardOctal = useMemo(() => {
        return `${getScopeOctal("owner")}${getScopeOctal("group")}${getScopeOctal("others")}`;
    }, [permissions]);

    const fullOctal = useMemo(() => {
        const special = getSpecialOctal();
        return `${special}${standardOctal}`;
    }, [permissions, standardOctal]);

    // Compute symbolic representation (e.g., -rwxr-xr-x or rwsr-sr-t)
    const symbolicNotation = useMemo(() => {
        const getSymbol = (
            scope: Scope,
            execSpecial: boolean,
            specialCharUpper: string,
            specialCharLower: string
        ) => {
            const s = permissions[scope];
            const r = s.read ? "r" : "-";
            const w = s.write ? "w" : "-";
            let x = "-";

            if (execSpecial) {
                x = s.execute ? specialCharLower : specialCharUpper;
            } else {
                x = s.execute ? "x" : "-";
            }

            return `${r}${w}${x}`;
        };

        const o = getSymbol("owner", permissions.special.setuid, "S", "s");
        const g = getSymbol("group", permissions.special.setgid, "S", "s");
        const ot = getSymbol("others", permissions.special.sticky, "T", "t");

        return `${o}${g}${ot}`;
    }, [permissions]);

    // Compute binary representation
    const binaryNotation = useMemo(() => {
        const toBin = (val: number) => val.toString(2).padStart(3, "0");
        const o = toBin(getScopeOctal("owner"));
        const g = toBin(getScopeOctal("group"));
        const ot = toBin(getScopeOctal("others"));
        return `${o} ${g} ${ot}`;
    }, [permissions]);

    // Handle direct 3 or 4 digit Octal Input
    const handleOctalInput = (inputVal: string) => {
        const cleaned = inputVal.replace(/[^0-7]/g, "").slice(0, 4);
        if (!cleaned) return;

        let s = 0;
        let u = 0;
        let g = 0;
        let o = 0;

        if (cleaned.length === 4) {
            s = parseInt(cleaned[0], 10);
            u = parseInt(cleaned[1], 10);
            g = parseInt(cleaned[2], 10);
            o = parseInt(cleaned[3], 10);
        } else if (cleaned.length === 3) {
            u = parseInt(cleaned[0], 10);
            g = parseInt(cleaned[1], 10);
            o = parseInt(cleaned[2], 10);
        } else if (cleaned.length === 2) {
            u = parseInt(cleaned[0], 10);
            g = parseInt(cleaned[1], 10);
        } else if (cleaned.length === 1) {
            u = parseInt(cleaned[0], 10);
        }

        setPermissions({
            owner: {
                read: (u & 4) === 4,
                write: (u & 2) === 2,
                execute: (u & 1) === 1
            },
            group: {
                read: (g & 4) === 4,
                write: (g & 2) === 2,
                execute: (g & 1) === 1
            },
            others: {
                read: (o & 4) === 4,
                write: (o & 2) === 2,
                execute: (o & 1) === 1
            },
            special: {
                setuid: (s & 4) === 4,
                setgid: (s & 2) === 2,
                sticky: (s & 1) === 1
            }
        });
    };

    // Apply a preset
    const applyPreset = (preset: CommonPreset) => {
        handleOctalInput(preset.octal);
    };

    // Reset to default 0755
    const handleReset = () => {
        handleOctalInput("0755");
        setIsRecursive(false);
        setIsVerbose(false);
    };

    // Generate complete bash command
    const generatedCommand = useMemo(() => {
        const flags = `${isRecursive ? " -R" : ""}${isVerbose ? " -v" : ""}`;
        const cleanOctal = getSpecialOctal() > 0 ? fullOctal : standardOctal;
        return `chmod${flags} ${cleanOctal} ${targetPath.trim() || "<file_path>"}`;
    }, [isRecursive, isVerbose, getSpecialOctal, fullOctal, standardOctal, targetPath]);

    // Generate ugo symbolic command
    const generatedUgoCommand = useMemo(() => {
        const flags = `${isRecursive ? " -R" : ""}${isVerbose ? " -v" : ""}`;
        const getUgoStr = (scopeChar: string, scope: Scope) => {
            const s = permissions[scope];
            const perms = `${s.read ? "r" : ""}${s.write ? "w" : ""}${s.execute ? "x" : ""}`;
            return perms ? `${scopeChar}=${perms}` : `${scopeChar}-rwx`;
        };

        const parts = [
            getUgoStr("u", "owner"),
            getUgoStr("g", "group"),
            getUgoStr("o", "others")
        ].join(",");

        return `chmod${flags} ${parts} ${targetPath.trim() || "<file_path>"}`;
    }, [isRecursive, isVerbose, permissions, targetPath]);

    // Copy helper
    const copyToClipboard = (text: string, formatId: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setCopiedFormat(formatId);
        setTimeout(() => {
            setCopied(false);
            setCopiedFormat(null);
        }, 2000);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Chmod Permissions Calculator & Command Generator",
        "url": "https://twistertools.com/tools/developer-tools/chmod-calculator",
        "description": "Calculate Linux and Unix chmod permissions visually. Convert between octal (numeric), symbolic (rwx), and binary notation with SetUID, SetGID, and Sticky Bit modifiers.",
        "applicationCategory": "DeveloperApplication",
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
                "name": "How is the chmod octal permission number calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Linux permissions are calculated by adding base weights for three operations: Read = 4, Write = 2, and Execute = 1. A permission score is calculated individually for Owner (User), Group, and Others. For example, Read + Write = 4 + 2 = 6; Read + Execute = 4 + 1 = 5. Combining these yields standard 3-digit notation such as 755 (rwxr-xr-x) or 644 (rw-r--r--)."
                }
            },
            {
                "@type": "Question",
                "name": "What are the SetUID (4000), SetGID (2000), and Sticky Bit (1000) modifiers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Special permission bits represent the leading 4th digit in chmod octal notation. SetUID (4) allows an executable to run with the permissions of the file owner (e.g. root for passwd). SetGID (2) makes files inherit the group ownership of their parent directory. The Sticky Bit (1) prevents users from deleting or renaming files inside a shared directory unless they are the file owner, as used on /tmp."
                }
            },
            {
                "@type": "Question",
                "name": "What is the security difference between chmod 777 and chmod 755?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Chmod 777 grants full Read, Write, and Execute access to everyone on the system, creating severe security vulnerabilities such as malicious file tampering and unauthorized script execution. In contrast, chmod 755 restricts write permissions strictly to the owner while allowing group members and external users to only view and execute the resource."
                }
            },
            {
                "@type": "Question",
                "name": "Why do directory permissions require the Execute bit (1)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For directories in Linux/Unix, the Execute (x) permission bit represents traversal (search) access. Without execute access on a directory, a user cannot 'cd' into it or access any files inside, even if the user has Read permissions on the directory or the individual files within."
                }
            },
            {
                "@type": "Question",
                "name": "What permissions should be used for SSH private keys and .env files?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "SSH private keys (~/.ssh/id_rsa or id_ed25519) and production environment secret files (.env) must be secured with chmod 600 (rw-------) or chmod 400 (r--------). The SSH client daemon actively rejects private key files if Group or Others have any read or write permissions."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-8">
            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 50/50 WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* LEFT WORKSPACE PANEL: Interactive Permissions Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Visual Permissions Grid
                            </h2>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                Reset (0755)
                            </button>
                        </div>

                        {/* Standard 3x3 Checkbox Grid */}
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[280px]">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="pb-3 text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                                                Read (4)
                                            </th>
                                            <th className="pb-3 text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                                                Write (2)
                                            </th>
                                            <th className="pb-3 text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
                                                Execute (1)
                                            </th>
                                            <th className="pb-3 text-xs font-bold text-indigo-600 text-center uppercase tracking-wider">
                                                Sum
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* Owner Row */}
                                        <tr>
                                            <td className="py-3.5 pr-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">Owner (u)</span>
                                                    <span className="text-[11px] text-slate-500">File Creator</span>
                                                </div>
                                            </td>
                                            {(["read", "write", "execute"] as Permission[]).map((p) => {
                                                const checked = permissions.owner[p];
                                                return (
                                                    <td key={p} className="py-3.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePermission("owner", p)}
                                                            className={`p-2 rounded-xl transition inline-flex items-center justify-center cursor-pointer ${checked
                                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                                }`}
                                                            aria-label={`Owner ${p}`}
                                                        >
                                                            {checked ? (
                                                                <CheckSquare className="w-4 h-4" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3.5 text-center">
                                                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200">
                                                    {getScopeOctal("owner")}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Group Row */}
                                        <tr>
                                            <td className="py-3.5 pr-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">Group (g)</span>
                                                    <span className="text-[11px] text-slate-500">Group Members</span>
                                                </div>
                                            </td>
                                            {(["read", "write", "execute"] as Permission[]).map((p) => {
                                                const checked = permissions.group[p];
                                                return (
                                                    <td key={p} className="py-3.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePermission("group", p)}
                                                            className={`p-2 rounded-xl transition inline-flex items-center justify-center cursor-pointer ${checked
                                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                                }`}
                                                            aria-label={`Group ${p}`}
                                                        >
                                                            {checked ? (
                                                                <CheckSquare className="w-4 h-4" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3.5 text-center">
                                                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200">
                                                    {getScopeOctal("group")}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Others Row */}
                                        <tr>
                                            <td className="py-3.5 pr-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900">Others (o)</span>
                                                    <span className="text-[11px] text-slate-500">Public Users</span>
                                                </div>
                                            </td>
                                            {(["read", "write", "execute"] as Permission[]).map((p) => {
                                                const checked = permissions.others[p];
                                                return (
                                                    <td key={p} className="py-3.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePermission("others", p)}
                                                            className={`p-2 rounded-xl transition inline-flex items-center justify-center cursor-pointer ${checked
                                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                                }`}
                                                            aria-label={`Others ${p}`}
                                                        >
                                                            {checked ? (
                                                                <CheckSquare className="w-4 h-4" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3.5 text-center">
                                                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200">
                                                    {getScopeOctal("others")}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Special Permissions Flags (SetUID, SetGID, Sticky Bit) */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <KeyRound className="w-4 h-4 text-indigo-600" />
                                    Special Execution Bits (Leading Octal Digit)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {/* SetUID */}
                                    <button
                                        type="button"
                                        onClick={() => toggleSpecial("setuid")}
                                        className={`p-3 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${permissions.special.setuid
                                                ? "bg-amber-50 border-amber-300 text-amber-900"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">SetUID (4)</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Exec as Owner</div>
                                        </div>
                                        {permissions.special.setuid ? (
                                            <CheckSquare className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        )}
                                    </button>

                                    {/* SetGID */}
                                    <button
                                        type="button"
                                        onClick={() => toggleSpecial("setgid")}
                                        className={`p-3 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${permissions.special.setgid
                                                ? "bg-amber-50 border-amber-300 text-amber-900"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">SetGID (2)</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Inherit Group</div>
                                        </div>
                                        {permissions.special.setgid ? (
                                            <CheckSquare className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        )}
                                    </button>

                                    {/* Sticky Bit */}
                                    <button
                                        type="button"
                                        onClick={() => toggleSpecial("sticky")}
                                        className={`p-3 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${permissions.special.sticky
                                                ? "bg-amber-50 border-amber-300 text-amber-900"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">Sticky Bit (1)</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Owner Delete Only</div>
                                        </div>
                                        {permissions.special.sticky ? (
                                            <CheckSquare className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Target File & CLI Flags */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Target File or Directory Path
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={targetPath}
                                        onChange={(e) => setTargetPath(e.target.value)}
                                        placeholder="/path/to/target/file.sh"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4 pt-1">
                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isRecursive}
                                            onChange={(e) => setIsRecursive(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-700">-R (Recursive)</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isVerbose}
                                            onChange={(e) => setIsVerbose(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-slate-700">-v (Verbose Output)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Common Preset Profiles
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">1-Click Setup</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {COMMON_PRESETS.slice(0, 4).map((p) => (
                                <button
                                    key={p.octal}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition text-left border cursor-pointer ${(getSpecialOctal() > 0 ? fullOctal : standardOctal) === p.octal ||
                                            standardOctal === p.octal.replace(/^0/, "")
                                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    <div className="font-mono text-indigo-600 font-bold">{p.octal}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{p.name.split(" ")[0]}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT WORKSPACE PANEL: Calculated Outputs & CLI Terminal Generator */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600" />
                                Calculated Values & Terminal Command
                            </h2>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Live POSIX Matrix
                            </span>
                        </div>

                        {/* Direct Octal Numeric Input & Big Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Octal Box */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Octal (Numeric)
                                </span>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={getSpecialOctal() > 0 ? fullOctal : standardOctal}
                                        onChange={(e) => handleOctalInput(e.target.value)}
                                        className="w-full text-xl sm:text-2xl font-mono font-extrabold text-indigo-600 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Symbolic Notation Box */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Symbolic
                                </span>
                                <div className="mt-2 text-sm sm:text-base font-mono font-extrabold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center truncate">
                                    -{symbolicNotation}
                                </div>
                            </div>

                            {/* Binary Representation */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Binary Bits
                                </span>
                                <div className="mt-2 text-[11px] sm:text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-1.5 py-2 text-center truncate">
                                    {binaryNotation}
                                </div>
                            </div>
                        </div>

                        {/* Terminal Command Output Panel */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Terminal className="w-4 h-4 text-indigo-600" />
                                    Primary Bash Command (Octal)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(generatedCommand, "primary")}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                >
                                    {copied && copiedFormat === "primary" ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-emerald-600">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800 shadow-inner flex items-center justify-between gap-2">
                                <code>$ {generatedCommand}</code>
                            </div>
                        </div>

                        {/* Alternative Symbolic CLI Output */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileCode className="w-4 h-4 text-indigo-600" />
                                    Alternative Symbolic Command (ugo)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(generatedUgoCommand, "ugo")}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                >
                                    {copied && copiedFormat === "ugo" ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-emerald-600">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-slate-900 text-indigo-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                                <code>$ {generatedUgoCommand}</code>
                            </div>
                        </div>

                        {/* Security Audit Badge */}
                        <div
                            className={`p-3.5 rounded-xl border flex items-start gap-3 ${standardOctal === "777"
                                    ? "bg-rose-50 border-rose-200 text-rose-900"
                                    : standardOctal === "700" || standardOctal === "600" || standardOctal === "400"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                        : "bg-indigo-50/60 border-indigo-100 text-indigo-950"
                                }`}
                        >
                            {standardOctal === "777" ? (
                                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                            ) : standardOctal === "700" || standardOctal === "600" ? (
                                <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="text-xs leading-relaxed">
                                <span className="font-bold block mb-0.5">
                                    {standardOctal === "777"
                                        ? "Security Warning: 777 Grants Universal Write Access"
                                        : standardOctal === "600" || standardOctal === "400"
                                            ? "High Security: Isolated Strict Owner Permissions"
                                            : `Active Policy: ${standardOctal} (${symbolicNotation})`}
                                </span>
                                {standardOctal === "777"
                                    ? "Anyone with system access can rewrite or delete this file. Never use 777 in production environments or web roots."
                                    : standardOctal === "600"
                                        ? "Strictly isolated read/write for the file owner. Ideal for SSH private keys, AWS credentials, and .env configuration files."
                                        : "Standard POSIX discretionary access control permissions configured."}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => copyToClipboard(generatedCommand, "primary")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied && copiedFormat === "primary" ? (
                                <Check className="w-4 h-4 text-emerald-300" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                            {copied && copiedFormat === "primary" ? "Copied Chmod Command!" : "Copy Chmod Command"}
                        </button>
                        <button
                            type="button"
                            onClick={() => copyToClipboard(symbolicNotation, "symbolic-btn")}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition border border-slate-200 cursor-pointer"
                        >
                            <FileCode className="w-4 h-4" />
                            {copied && copiedFormat === "symbolic-btn" ? "Copied!" : "Copy Symbolic"}
                        </button>
                    </div>
                </div>
            </div>

            {/* COMPREHENSIVE PRESET LIBRARY TABLE CARD */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                POSIX & Linux Chmod Permission Preset Matrix
                            </h2>
                            <p className="text-slate-500 text-xs sm:text-sm">
                                Industry-standard permission configurations for web servers, scripts, and sensitive keys.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                            <tr>
                                <th className="p-3">Octal</th>
                                <th className="p-3">Symbolic</th>
                                <th className="p-3">Target Profile</th>
                                <th className="p-3 hidden sm:table-cell">Security Scope & Context</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                            {COMMON_PRESETS.map((preset) => (
                                <tr key={preset.octal} className="hover:bg-slate-50 transition">
                                    <td className="p-3 font-mono font-bold text-indigo-600">{preset.octal}</td>
                                    <td className="p-3 font-mono text-slate-800">-{preset.symbolic}</td>
                                    <td className="p-3 font-bold text-slate-900">{preset.name}</td>
                                    <td className="p-3 text-slate-600 hidden sm:table-cell">{preset.description}</td>
                                    <td className="p-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer border border-indigo-200"
                                        >
                                            Apply
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Deep-Dive on Discretionary Access Control */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Unix & Linux File Permission Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Linux and POSIX-compliant operating systems utilize a Discretionary Access Control (DAC) security architecture to govern how users and system services interact with files and directories. Every file system node maintains a 12-bit mode structure containing permission triplets for three distinct user scopes: the file <strong>Owner (User)</strong>, the assigned <strong>Group</strong>, and all <strong>Others (World)</strong>.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-indigo-600" /> Read Permission (r = 4)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                For standard files, enables reading or opening file contents. For directories, enables listing folder contents via commands like <code>ls</code>.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <FileCode className="w-4 h-4 text-indigo-600" /> Write Permission (w = 2)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                For files, allows modifying, saving, or truncating contents. For directories, grants rights to create, delete, and rename files within the folder.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Execute Permission (x = 1)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                For files, enables execution as a binary or shell script. For directories, acts as the search/traverse bit required to enter with <code>cd</code>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Special Permissions: SetUID, SetGID & Sticky Bit */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Special Permissions: SetUID (4000), SetGID (2000), and Sticky Bit (1000)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Beyond standard read, write, and execute bits, POSIX systems define three special privilege flags represented by the leading fourth octal digit:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">SetUID (4000)</span>
                                <span className="text-xs font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                                    rwsr-xr-x
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                When executed, the process runs with the effective privileges of the file owner rather than the caller. Essential for utilities like <code>passwd</code>.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">SetGID (2000)</span>
                                <span className="text-xs font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                                    rwxr-sr-x
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                When applied to a directory, newly created files automatically inherit the parent directory&apos;s group rather than the user&apos;s primary group.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">Sticky Bit (1000)</span>
                                <span className="text-xs font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                                    rwxrwxrwt
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Applied to public shared directories like <code>/tmp</code>. All users can write files, but only the file owner or root can delete or rename them.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Octal vs. Symbolic Command Syntax Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Chmod Command Syntax: Octal (Absolute) vs. Symbolic (Relative)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <code>chmod</code> command accepts two distinct input syntaxes: <strong>Octal Numeric Mode</strong> and <strong>Symbolic Character Mode</strong>.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-indigo-600" /> 1. Octal (Absolute) Notation
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Overwrites the entire permission bitmask directly with a 3-digit or 4-digit octal number.
                            </p>
                            <pre className="bg-slate-950 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`# Set exact 755 permissions on a directory
chmod 755 /var/www/html

# Set recursive 644 on all public web assets
chmod -R 644 /var/www/html/*.html`}
                            </pre>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> 2. Symbolic (Relative) Notation
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Adds (+), removes (-), or sets (=) specific permission bits without affecting unmodified flags.
                            </p>
                            <pre className="bg-slate-950 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`# Add execute permission to file owner only
chmod u+x deploy.sh

# Remove write permissions from group and others
chmod go-w sensitive-config.json`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 4: Web Server & SSH Security Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Hardening: Web Server & SSH Permission Recipes
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">
                                Web Roots (Nginx / Apache / WordPress / Laravel)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Standard practice requires directories to be <code>755</code> (traversal + read) and static files to be <code>644</code> (read-only for web server daemon):
                            </p>
                            <div className="bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                find /var/www/html -type d -exec chmod 755 { } \; && find /var/www/html -type f -exec chmod 644 { } \;
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">
                                SSH Directory & Private Keys (~/.ssh)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                OpenSSH enforces strict discretionary checking. Private keys must be restricted to <code>600</code> or <code>400</code>; public keys are <code>644</code>:
                            </p>
                            <div className="bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_rsa ~/.ssh/authorized_keys && chmod 644 ~/.ssh/*.pub
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
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
                                How is the chmod octal permission number calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Linux permissions are calculated by adding base weights for three operations: Read = 4, Write = 2, and Execute = 1. A permission score is calculated individually for Owner (User), Group, and Others. For example, Read + Write = 4 + 2 = 6; Read + Execute = 4 + 1 = 5. Combining these yields standard 3-digit notation such as 755 (rwxr-xr-x) or 644 (rw-r--r--).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the SetUID (4000), SetGID (2000), and Sticky Bit (1000) modifiers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Special permission bits represent the leading 4th digit in chmod octal notation. SetUID (4) allows an executable to run with the permissions of the file owner (e.g. root for passwd). SetGID (2) makes files inherit the group ownership of their parent directory. The Sticky Bit (1) prevents users from deleting or renaming files inside a shared directory unless they are the file owner, as used on /tmp.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the security difference between chmod 777 and chmod 755?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Chmod 777 grants full Read, Write, and Execute access to everyone on the system, creating severe security vulnerabilities such as malicious file tampering and unauthorized script execution. In contrast, chmod 755 restricts write permissions strictly to the owner while allowing group members and external users to only view and execute the resource.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do directory permissions require the Execute bit (1)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For directories in Linux/Unix, the Execute (x) permission bit represents traversal (search) access. Without execute access on a directory, a user cannot &apos;cd&apos; into it or access any files inside, even if the user has Read permissions on the directory or the individual files within.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What permissions should be used for SSH private keys and .env files?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                SSH private keys (~/.ssh/id_rsa or id_ed25519) and production environment secret files (.env) must be secured with chmod 600 (rw-------) or chmod 400 (r--------). The SSH client daemon actively rejects private key files if Group or Others have any read or write permissions.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
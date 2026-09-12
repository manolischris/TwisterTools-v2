"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Terminal,
    Copy,
    Check,
    Trash2,
    Code2,
    ArrowRightLeft,
    Sparkles,
    ShieldCheck,
    Sliders,
    Layers,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    Cpu,
    ExternalLink,
    FileCode,
    Settings2,
    AlertCircle
} from "lucide-react";

type TargetLanguage =
    | "python-requests"
    | "python-httpx"
    | "js-fetch"
    | "js-axios"
    | "node-fetch"
    | "php-curl"
    | "go-http";

interface ParsedCurl {
    method: string;
    url: string;
    headers: Record<string, string>;
    data: string | null;
    isJson: boolean;
    auth: { username?: string; password?: string; bearer?: string } | null;
    insecure: boolean;
    compressed: boolean;
}

const SAMPLE_CURLS = {
    postJson: `curl -X POST "https://api.example.com/v1/users" \\
  -H "Authorization: Bearer sec_tok_9988776655" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{"name": "Jane Doe", "email": "jane@twistertools.com", "role": "engineer"}'`,
    getAuth: `curl -G "https://api.github.com/repos/twistertools/core/issues" \\
  -u "developer:ghp_9876543210zyxwvuts" \\
  -H "User-Agent: TwisterTools-Client/2.0" \\
  -H "Accept: application/vnd.github.v3+json" \\
  -d "state=open" \\
  -d "per_page=25"`,
    formData: `curl -X POST "https://api.stripe.com/v1/charges" \\
  -u "sk_test_SAMPLE_KEY_TOKEN:" \\
  -d "amount=2000" \\
  -d "currency=usd" \\
  -d "description=Developer+Plan+Subscription"`
};

// Tokenizer & Parser for POSIX cURL commands
function parseCurlCommand(raw: string): { parsed: ParsedCurl | null; error: string | null } {
    if (!raw.trim()) {
        return { parsed: null, error: null };
    }

    const cleanInput = raw
        .replace(/\\\r?\n/g, " ")
        .replace(/\n/g, " ")
        .trim();

    if (!cleanInput.toLowerCase().startsWith("curl")) {
        return {
            parsed: null,
            error: "Command must start with 'curl'. Paste a standard bash/terminal cURL snippet."
        };
    }

    const tokens: string[] = [];
    let current = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escape = false;

    for (let i = 0; i < cleanInput.length; i++) {
        const char = cleanInput[i];

        if (escape) {
            current += char;
            escape = false;
            continue;
        }

        if (char === "\\") {
            escape = true;
            continue;
        }

        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            continue;
        }

        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            continue;
        }

        if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
            if (current.length > 0) {
                tokens.push(current);
                current = "";
            }
            continue;
        }

        current += char;
    }

    if (current.length > 0) {
        tokens.push(current);
    }

    // Drop leading 'curl'
    tokens.shift();

    let method = "";
    let url = "";
    const headers: Record<string, string> = {};
    const dataParts: string[] = [];
    let auth: { username?: string; password?: string; bearer?: string } | null = null;
    let insecure = false;
    let compressed = false;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token === "-X" || token === "--request") {
            i++;
            if (i < tokens.length) method = tokens[i].toUpperCase();
        } else if (token === "-H" || token === "--header") {
            i++;
            if (i < tokens.length) {
                const headerLine = tokens[i];
                const colonIdx = headerLine.indexOf(":");
                if (colonIdx > 0) {
                    const k = headerLine.slice(0, colonIdx).trim();
                    const v = headerLine.slice(colonIdx + 1).trim();
                    headers[k] = v;

                    if (k.toLowerCase() === "authorization" && v.toLowerCase().startsWith("bearer ")) {
                        auth = { bearer: v.substring(7).trim() };
                    }
                }
            }
        } else if (
            token === "-d" ||
            token === "--data" ||
            token === "--data-raw" ||
            token === "--data-ascii" ||
            token === "--data-binary"
        ) {
            i++;
            if (i < tokens.length) {
                dataParts.push(tokens[i]);
            }
        } else if (token === "-u" || token === "--user") {
            i++;
            if (i < tokens.length) {
                const userpass = tokens[i];
                const col = userpass.indexOf(":");
                if (col !== -1) {
                    auth = {
                        username: userpass.slice(0, col),
                        password: userpass.slice(col + 1)
                    };
                } else {
                    auth = { username: userpass, password: "" };
                }
            }
        } else if (token === "-k" || token === "--insecure") {
            insecure = true;
        } else if (token === "--compressed") {
            compressed = true;
        } else if (token === "-G" || token === "--get") {
            if (!method) method = "GET";
        } else if (!token.startsWith("-") && !url) {
            url = token;
        }
    }

    if (!url) {
        return { parsed: null, error: "Unable to detect a valid target URL from cURL syntax." };
    }

    // Default method rules
    if (!method) {
        method = dataParts.length > 0 ? "POST" : "GET";
    }

    // Normalize combined data
    let dataPayload: string | null = null;
    let isJson = false;

    if (dataParts.length > 0) {
        dataPayload = dataParts.join("&");
        const ct = Object.keys(headers).find((k) => k.toLowerCase() === "content-type");
        const ctypeVal = ct ? headers[ct] : "";

        if (ctypeVal.includes("application/json") || dataPayload.trim().startsWith("{") || dataPayload.trim().startsWith("[")) {
            try {
                JSON.parse(dataPayload);
                isJson = true;
            } catch {
                isJson = false;
            }
        }
    }

    return {
        parsed: {
            method,
            url,
            headers,
            data: dataPayload,
            isJson,
            auth,
            insecure,
            compressed
        },
        error: null
    };
}

// Code Generators
function generatePythonRequests(p: ParsedCurl, indentSpaces: number, includeComments: boolean): string {
    const pad = " ".repeat(indentSpaces);
    const lines: string[] = ["import requests", ""];

    if (includeComments) {
        lines.push("# Generated by TwisterTools cURL Translator");
    }

    lines.push(`url = "${p.url}"`, "");

    // Headers
    const headerKeys = Object.keys(p.headers);
    if (headerKeys.length > 0) {
        lines.push("headers = {");
        headerKeys.forEach((key, idx) => {
            const comma = idx === headerKeys.length - 1 ? "" : ",";
            lines.push(`${pad}"${key}": "${p.headers[key]}"${comma}`);
        });
        lines.push("}", "");
    }

    // Data / JSON Payload
    if (p.data) {
        if (p.isJson) {
            try {
                const parsedJson = JSON.parse(p.data);
                lines.push(`payload = ${JSON.stringify(parsedJson, null, indentSpaces)}`, "");
            } catch {
                lines.push(`payload = """${p.data}"""`, "");
            }
        } else {
            lines.push(`payload = """${p.data}"""`, "");
        }
    }

    // Basic Auth
    if (p.auth && p.auth.username !== undefined) {
        lines.push(`auth = ("${p.auth.username}", "${p.auth.password || ""}")`, "");
    }

    // Call Construction
    const args: string[] = [`"${p.method}"`, "url"];
    if (headerKeys.length > 0) args.push("headers=headers");
    if (p.data) {
        if (p.isJson) args.push("json=payload");
        else args.push("data=payload");
    }
    if (p.auth && p.auth.username !== undefined) args.push("auth=auth");
    if (p.insecure) args.push("verify=False");

    lines.push(`response = requests.request(${args.join(", ")})`, "");
    lines.push("print(f\"Status Code: {response.status_code}\")");
    lines.push("try:");
    lines.push(`${pad}print(response.json())`);
    lines.push("except Exception:");
    lines.push(`${pad}print(response.text)`);

    return lines.join("\n");
}

function generatePythonHttpx(p: ParsedCurl, indentSpaces: number, includeComments: boolean): string {
    const pad = " ".repeat(indentSpaces);
    const lines: string[] = ["import httpx", ""];

    if (includeComments) {
        lines.push("# Asynchronous / Synchronous client via HTTPX");
    }

    lines.push(`url = "${p.url}"`, "");

    const headerKeys = Object.keys(p.headers);
    if (headerKeys.length > 0) {
        lines.push("headers = {");
        headerKeys.forEach((key, idx) => {
            const comma = idx === headerKeys.length - 1 ? "" : ",";
            lines.push(`${pad}"${key}": "${p.headers[key]}"${comma}`);
        });
        lines.push("}", "");
    }

    if (p.data) {
        if (p.isJson) {
            try {
                const parsedJson = JSON.parse(p.data);
                lines.push(`payload = ${JSON.stringify(parsedJson, null, indentSpaces)}`, "");
            } catch {
                lines.push(`payload = """${p.data}"""`, "");
            }
        } else {
            lines.push(`payload = """${p.data}"""`, "");
        }
    }

    const args: string[] = [`"${p.method}"`, "url"];
    if (headerKeys.length > 0) args.push("headers=headers");
    if (p.data) {
        if (p.isJson) args.push("json=payload");
        else args.push("content=payload");
    }
    if (p.auth && p.auth.username !== undefined) {
        args.push(`auth=("${p.auth.username}", "${p.auth.password || ""}")`);
    }
    if (p.insecure) args.push("verify=False");

    lines.push("with httpx.Client() as client:");
    lines.push(`${pad}response = client.request(${args.join(", ")})`);
    lines.push(`${pad}print(response.status_code)`);
    lines.push(`${pad}print(response.text)`);

    return lines.join("\n");
}

function generateJsFetch(p: ParsedCurl, indentSpaces: number, includeComments: boolean): string {
    const pad = " ".repeat(indentSpaces);
    const lines: string[] = [];

    if (includeComments) {
        lines.push("// Modern Browser & Node.js Native Fetch Request");
    }

    lines.push(`const url = '${p.url}';`, "");

    const optionsObj: string[] = [];
    optionsObj.push(`method: '${p.method}'`);

    const headerKeys = Object.keys(p.headers);
    if (headerKeys.length > 0 || (p.auth && p.auth.username !== undefined)) {
        optionsObj.push("headers: {");
        headerKeys.forEach((key) => {
            optionsObj.push(`${pad}'${key}': '${p.headers[key]}',`);
        });

        if (p.auth && p.auth.username !== undefined) {
            const b64 =
                typeof window !== "undefined"
                    ? window.btoa(`${p.auth.username}:${p.auth.password || ""}`)
                    : "BASE64_AUTH_CREDENTIALS";
            optionsObj.push(`${pad}'Authorization': 'Basic ${b64}',`);
        }

        optionsObj.push("}");
    }

    if (p.data) {
        if (p.isJson) {
            try {
                const parsed = JSON.parse(p.data);
                optionsObj.push(`body: JSON.stringify(${JSON.stringify(parsed, null, indentSpaces)})`);
            } catch {
                optionsObj.push(`body: JSON.stringify(${p.data})`);
            }
        } else {
            optionsObj.push(`body: '${p.data}'`);
        }
    }

    lines.push("const options = {");
    optionsObj.forEach((row, i) => {
        const trailing = i === optionsObj.length - 1 || row.endsWith("{") ? "" : ",";
        lines.push(`${pad}${row}${trailing}`);
    });
    lines.push("};", "");

    lines.push("try {");
    lines.push(`${pad}const response = await fetch(url, options);`);
    lines.push(`${pad}const data = await response.json();`);
    lines.push(`${pad}console.log('Success:', data);`);
    lines.push("} catch (error) {");
    lines.push(`${pad}console.error('Fetch error:', error);`);
    lines.push("}");

    return lines.join("\n");
}

function generateJsAxios(p: ParsedCurl, indentSpaces: number, includeComments: boolean): string {
    const pad = " ".repeat(indentSpaces);
    const lines: string[] = ["import axios from 'axios';", ""];

    if (includeComments) {
        lines.push("// Axios Promise-based HTTP client");
    }

    const configLines: string[] = [];
    configLines.push(`method: '${p.method.toLowerCase()}'`);
    configLines.push(`url: '${p.url}'`);

    const headerKeys = Object.keys(p.headers);
    if (headerKeys.length > 0) {
        configLines.push("headers: {");
        headerKeys.forEach((key) => {
            configLines.push(`${pad}'${key}': '${p.headers[key]}',`);
        });
        configLines.push("}");
    }

    if (p.auth && p.auth.username !== undefined) {
        configLines.push("auth: {");
        configLines.push(`${pad}username: '${p.auth.username}',`);
        configLines.push(`${pad}password: '${p.auth.password || ""}'`);
        configLines.push("}");
    }

    if (p.data) {
        if (p.isJson) {
            try {
                const parsed = JSON.parse(p.data);
                configLines.push(`data: ${JSON.stringify(parsed, null, indentSpaces)}`);
            } catch {
                configLines.push(`data: '${p.data}'`);
            }
        } else {
            configLines.push(`data: '${p.data}'`);
        }
    }

    lines.push("const config = {");
    configLines.forEach((row, idx) => {
        const trailing = idx === configLines.length - 1 || row.endsWith("{") ? "" : ",";
        lines.push(`${pad}${row}${trailing}`);
    });
    lines.push("};", "");

    lines.push("try {");
    lines.push(`${pad}const response = await axios(config);`);
    lines.push(`${pad}console.log(response.status, response.data);`);
    lines.push("} catch (err) {");
    lines.push(`${pad}console.error(err);`);
    lines.push("}");

    return lines.join("\n");
}

function generatePhpCurl(p: ParsedCurl, indentSpaces: number, includeComments: boolean): string {
    const pad = " ".repeat(indentSpaces);
    const lines: string[] = ["<?php", ""];

    if (includeComments) {
        lines.push("// PHP libcurl native execution snippet");
    }

    lines.push("$curl = curl_init();", "");

    const headerKeys = Object.keys(p.headers);
    if (headerKeys.length > 0) {
        lines.push("$headers = [");
        headerKeys.forEach((key) => {
            lines.push(`${pad}"${key}: ${p.headers[key]}",`);
        });
        lines.push("];", "");
    }

    lines.push("curl_setopt_array($curl, [");
    lines.push(`${pad}CURLOPT_URL => "${p.url}",`);
    lines.push(`${pad}CURLOPT_RETURNTRANSFER => true,`);
    lines.push(`${pad}CURLOPT_CUSTOMREQUEST => "${p.method}",`);

    if (headerKeys.length > 0) {
        lines.push(`${pad}CURLOPT_HTTPHEADER => $headers,`);
    }

    if (p.data) {
        lines.push(`${pad}CURLOPT_POSTFIELDS => '${p.data}',`);
    }

    if (p.insecure) {
        lines.push(`${pad}CURLOPT_SSL_VERIFYPEER => false,`);
    }

    if (p.auth && p.auth.username !== undefined) {
        lines.push(`${pad}CURLOPT_USERPWD => "${p.auth.username}:${p.auth.password || ""}",`);
    }

    lines.push("]);", "");
    lines.push("$response = curl_exec($curl);");
    lines.push("$err = curl_error($curl);");
    lines.push("curl_close($curl);", "");
    lines.push("if ($err) {");
    lines.push(`${pad}echo "cURL Error: " . $err;`);
    lines.push("} else {");
    lines.push(`${pad}echo $response;`);
    lines.push("}");

    return lines.join("\n");
}

function generateGoHttp(p: ParsedCurl, indentSpaces: number, includeComments: boolean): string {
    const pad = " ".repeat(indentSpaces);
    const lines: string[] = [
        "package main",
        "",
        "import (",
        `${pad}"fmt"`,
        `${pad}"io"`,
        `${pad}"net/http"`,
        ...(p.data ? [`${pad}"strings"`] : []),
        ")",
        "",
        "func main() {"
    ];

    if (includeComments) {
        lines.push(`${pad}// Standard Library net/http implementation`);
    }

    lines.push(`${pad}url := "${p.url}"`);

    if (p.data) {
        lines.push(`${pad}payload := strings.NewReader(\`${p.data}\`)`);
        lines.push(`${pad}req, err := http.NewRequest("${p.method}", url, payload)`);
    } else {
        lines.push(`${pad}req, err := http.NewRequest("${p.method}", url, nil)`);
    }

    lines.push(`${pad}if err != nil {`);
    lines.push(`${pad}${pad}panic(err)`);
    lines.push(`${pad}}`, "");

    Object.keys(p.headers).forEach((key) => {
        lines.push(`${pad}req.Header.Add("${key}", "${p.headers[key]}")`);
    });

    if (p.auth && p.auth.username !== undefined) {
        lines.push(`${pad}req.SetBasicAuth("${p.auth.username}", "${p.auth.password || ""}")`);
    }

    lines.push("", `${pad}client := &http.Client{}`);
    lines.push(`${pad}res, err := client.Do(req)`);
    lines.push(`${pad}if err != nil {`);
    lines.push(`${pad}${pad}panic(err)`);
    lines.push(`${pad}}`);
    lines.push(`${pad}defer res.Body.Close()`, "");
    lines.push(`${pad}body, _ := io.ReadAll(res.Body)`);
    lines.push(`${pad}fmt.Println(res.Status)`);
    lines.push(`${pad}fmt.Println(string(body))`);
    lines.push("}");

    return lines.join("\n");
}

export default function CurlToFetchConverter() {
    const [rawCurl, setRawCurl] = useState<string>(SAMPLE_CURLS.postJson);
    const [targetLang, setTargetLang] = useState<TargetLanguage>("python-requests");
    const [indentSpaces, setIndentSpaces] = useState<number>(2);
    const [includeComments, setIncludeComments] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    const curlInputId = useId();
    const langSelectId = useId();

    const { parsed, error } = useMemo(() => {
        return parseCurlCommand(rawCurl);
    }, [rawCurl]);

    const generatedCode = useMemo(() => {
        if (!parsed) return "";

        switch (targetLang) {
            case "python-requests":
                return generatePythonRequests(parsed, indentSpaces, includeComments);
            case "python-httpx":
                return generatePythonHttpx(parsed, indentSpaces, includeComments);
            case "js-fetch":
                return generateJsFetch(parsed, indentSpaces, includeComments);
            case "js-axios":
                return generateJsAxios(parsed, indentSpaces, includeComments);
            case "node-fetch":
                return `import fetch from 'node-fetch';\n\n${generateJsFetch(parsed, indentSpaces, includeComments)}`;
            case "php-curl":
                return generatePhpCurl(parsed, indentSpaces, includeComments);
            case "go-http":
                return generateGoHttp(parsed, indentSpaces, includeComments);
            default:
                return "";
        }
    }, [parsed, targetLang, indentSpaces, includeComments]);

    const handleCopy = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setRawCurl("");
    };

    const loadSample = (key: keyof typeof SAMPLE_CURLS) => {
        setRawCurl(SAMPLE_CURLS[key]);
    };

    // Metadata stats
    const headerCount = parsed ? Object.keys(parsed.headers).length : 0;
    const hasBody = Boolean(parsed && parsed.data);
    const methodDisplay = parsed ? parsed.method : "N/A";

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "cURL Command to Python and JavaScript Fetch Syntax Translator",
        "url": "https://twistertools.com/tools/developer-tools/curl-to-fetch-converter",
        "description": "Convert complex terminal cURL commands into clean Python Requests, HTTPX, JavaScript Fetch, Axios, Node.js, PHP cURL, and Go HTTP code in seconds. Browser-native, client-side, and secure.",
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
                "name": "Are my API keys and Authorization tokens safe when converting cURL commands here?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, completely. TwisterTools operates 100% browser-native using local client-side parsing logic. Your pasted headers, private tokens, bearer keys, and sensitive payloads are never dispatched to any backend server or external API."
                }
            },
            {
                "@type": "Question",
                "name": "How does this translator handle multiline bash backslashes (\\)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The POSIX parser sanitizes continuous line escape characters, stripping backslashes accompanied by CRLF or LF line breaks, normalizing all arguments into a clean sequential token array without breaking URLs or raw JSON payloads."
                }
            },
            {
                "@type": "Question",
                "name": "Why does native fetch in the browser fail with CORS errors while the cURL command succeeded?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "cURL executes directly in your local terminal environment without the browser's Cross-Origin Resource Sharing (CORS) sandbox. When you execute the generated JavaScript fetch snippet in a client web app, the remote API server must explicitly send appropriate 'Access-Control-Allow-Origin' HTTP headers."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool support basic authentication flags (-u username:password)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The parser recognizes -u and --user flags, automatically mapping them to native tuples in Python Requests/HTTPX, base64-encoded Authorization headers for JavaScript fetch, and dedicated auth configuration objects in Axios."
                }
            },
            {
                "@type": "Question",
                "name": "Can I convert JSON POST bodies containing nested quotes and objects?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The parser handles both single-quote and double-quote boundaries, validating JSON syntax and allowing formatted object reconstruction in the target programming language."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 12-Column Symmetrical Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Input Workspace (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Input cURL Command
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadSample("postJson")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                POST JSON
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("getAuth")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                GET Auth
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("formData")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Form Post
                            </button>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="space-y-2">
                        <label htmlFor={curlInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Paste raw bash or terminal cURL syntax below:
                        </label>
                        <textarea
                            id={curlInputId}
                            rows={12}
                            aria-label="cURL Command Input"
                            value={rawCurl}
                            onChange={(e) => setRawCurl(e.target.value)}
                            placeholder='curl -X POST "https://api.example.com/data" -H "Content-Type: application/json" -d "{\"key\":\"value\"}"'
                            className="w-full p-3.5 sm:p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[220px]"
                        />

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => loadSample("postJson")}
                                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Sample cURL
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear Input
                            </button>
                        </div>
                    </div>

                    {/* Parsed Inspection Metadata */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Detected Request Parameters:
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Method
                                </span>
                                <p className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {methodDisplay}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Headers
                                </span>
                                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                    {headerCount} Detected
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Payload
                                </span>
                                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                    {hasBody ? (parsed?.isJson ? "JSON" : "Raw Data") : "None"}
                                </p>
                            </div>
                        </div>

                        {parsed?.url && (
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-2">
                                <Code2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                        Target Endpoint
                                    </span>
                                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all">
                                        {parsed.url}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Output Workspace (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Translated Code
                            </h2>
                        </div>

                        {/* Language Selector Dropdown */}
                        <div className="flex items-center gap-2">
                            <label htmlFor={langSelectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 sr-only">
                                Target Language
                            </label>
                            <select
                                id={langSelectId}
                                aria-label="Target programming language for code translation"
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value as TargetLanguage)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="python-requests">Python (requests)</option>
                                <option value="python-httpx">Python (httpx)</option>
                                <option value="js-fetch">JavaScript (fetch)</option>
                                <option value="js-axios">JavaScript (axios)</option>
                                <option value="node-fetch">Node.js (node-fetch)</option>
                                <option value="php-curl">PHP (libcurl)</option>
                                <option value="go-http">Go (net/http)</option>
                            </select>
                        </div>
                    </div>

                    {/* Output Code Container */}
                    <div className="space-y-2">
                        <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-950">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 text-xs font-mono text-slate-400">
                                <span>{targetLang.toUpperCase()}</span>
                                <span>UTF-8 Script</span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto min-h-[260px] max-h-[420px] leading-relaxed select-text">
                                {generatedCode || "// Paste a valid cURL command on the left to generate translated syntax."}
                            </pre>
                        </div>

                        {/* Formatting Controls */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <Sliders className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Indentation:</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => setIndentSpaces(2)}
                                        className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${indentSpaces === 2 ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                                    >
                                        2sp
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIndentSpaces(4)}
                                        className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${indentSpaces === 4 ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                                    >
                                        4sp
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeComments}
                                    onChange={(e) => setIncludeComments(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inline Comments</span>
                            </label>
                        </div>

                        {/* Primary Copy Action */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!generatedCode}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied Code to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Translated Script</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Client-Side Security Assurance Banner */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Zero Data Ingestion Guarantee:</strong> TwisterTools parses and converts your cURL terminal commands 100% locally within your browser using JavaScript tokenizer logic. Authorization tokens, secret API credentials, cookies, and production payload data are never transmitted over the internet or logged to any server.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Execution and Parsing Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Architectural Overview: Translating POSIX cURL to Enterprise Runtime Code
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Client URL (<code className="font-mono text-indigo-600 dark:text-indigo-400">curl</code>) is the global gold standard for debugging, documenting, and testing network endpoints. However, moving network calls from a command-line terminal into production backend codebases, automated integration suites, or client-side frontends requires accurate syntax translation. TwisterTools implements a deterministic state machine tokenizer to unpack multi-flag terminal commands:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Token Normalization
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Escaped newlines (<code className="font-mono text-indigo-600 dark:text-indigo-400">\</code>) and double/single quote boundaries are tokenized without regex breakage, isolating command flags such as <code className="font-mono text-indigo-600 dark:text-indigo-400">-H</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">-X</code>, and <code className="font-mono text-indigo-600 dark:text-indigo-400">-d</code>.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Header & Auth Extraction
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                HTTP headers are converted into native dictionary or object keys, while <code className="font-mono text-indigo-600 dark:text-indigo-400">-u user:pass</code> flags are automatically mapped to native authentication tuples or encoded Base64 headers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Language Idioms
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The generator formats code following official language idioms: Python PEP 8 dictionaries, JavaScript <code className="font-mono text-indigo-600 dark:text-indigo-400">async/await</code> conventions, and Go struct patterns.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Language Features Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Matrix: HTTP Client Libraries Across Modern Stacks
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct HTTP client library is critical for network performance, connection pooling, timeout handling, and developer ergonomics:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Client Library</th>
                                    <th className="p-3">Environment</th>
                                    <th className="p-3">Async Support</th>
                                    <th className="p-3">Dependency Overhead</th>
                                    <th className="p-3">Optimal Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Python Requests</td>
                                    <td className="p-3">Python 3.8+</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Synchronous Only</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">pip install requests</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Scripts, Automation & Data Science</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Python HTTPX</td>
                                    <td className="p-3">Python 3.8+</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Sync + Async (asyncio)</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">pip install httpx</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">FastAPI & High-Throughput Microservices</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">JavaScript Fetch</td>
                                    <td className="p-3">Browser & Node 18+</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Native Promises</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Zero (Built-in)</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Modern Web Apps & Lightweight Lambdas</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Axios</td>
                                    <td className="p-3">Universal JS</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Native Promises</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">npm install axios</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Complex Interceptors & Auto JSON Parsing</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Go net/http</td>
                                    <td className="p-3">Go 1.18+</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Goroutine-native</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Zero (Standard Library)</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Concurrent Low-Latency Services</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Troubleshooting Common Migration Traps */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Practical Engineering: Navigating cURL to Code Migration Gotchas
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        When developers transition working cURL terminal snippets into production runtime code, slight behavioral discrepancies often cause unexpected 4xx or 5xx status codes:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Set Explicit Content-Type Headers:</strong> Never assume the server infers JSON formatting. Always include <code className="font-mono text-indigo-600 dark:text-indigo-400">Content-Type: application/json</code> when passing stringified payloads.
                                </li>
                                <li>
                                    • <strong>Configure Request Timeouts:</strong> Terminal cURL will wait indefinitely or use default OS socket limits. Production Python and Node code should explicitly specify request timeouts (e.g. 5 to 10 seconds).
                                </li>
                                <li>
                                    • <strong>Check HTTP Error Statuses:</strong> Unlike Python Requests which raises on <code className="font-mono text-indigo-600 dark:text-indigo-400">raise_for_status()</code>, browser <code className="font-mono text-indigo-600 dark:text-indigo-400">fetch()</code> does not reject promises on HTTP 404 or 500 errors. Verify <code className="font-mono text-indigo-600 dark:text-indigo-400">response.ok</code> manually.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" /> Frequent Migration Pitfalls
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>The CORS Sandbox Trap:</strong> Terminal cURL commands ignore browser Cross-Origin restrictions. Executing the same call via frontend JavaScript fetch may throw CORS exceptions unless backend origins are allowlisted.
                                </li>
                                <li>
                                    • <strong>Double URL-Encoding:</strong> If your cURL URL contains pre-encoded query strings (<code className="font-mono text-indigo-600 dark:text-indigo-400">%20</code>), avoid double-encoding them when passing parameter maps into Python or Axios.
                                </li>
                                <li>
                                    • <strong>Unsanitized Multiline Backslashes:</strong> Copying commands from shell histories containing unescaped line breaks will truncate arguments unless passed through TwisterTools tokenization.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Are my API keys and Authorization tokens safe when converting cURL commands here?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes, completely. TwisterTools operates 100% browser-native using local client-side parsing logic. Your pasted headers, private tokens, bearer keys, and sensitive payloads are never dispatched to any backend server or external API.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does this translator handle multiline bash backslashes (\)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The POSIX parser sanitizes continuous line escape characters, stripping backslashes accompanied by CRLF or LF line breaks, normalizing all arguments into a clean sequential token array without breaking URLs or raw JSON payloads.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does native fetch in the browser fail with CORS errors while the cURL command succeeded?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                cURL executes directly in your local terminal environment without the browser&apos;s Cross-Origin Resource Sharing (CORS) sandbox. When you execute the generated JavaScript fetch snippet in a client web app, the remote API server must explicitly send appropriate &apos;Access-Control-Allow-Origin&apos; HTTP headers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool support basic authentication flags (-u username:password)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The parser recognizes -u and --user flags, automatically mapping them to native tuples in Python Requests/HTTPX, base64-encoded Authorization headers for JavaScript fetch, and dedicated auth configuration objects in Axios.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I convert JSON POST bodies containing nested quotes and objects?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The parser handles both single-quote and double-quote boundaries, validating JSON syntax and allowing formatted object reconstruction in the target programming language.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
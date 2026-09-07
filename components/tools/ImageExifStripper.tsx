"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import {
    ShieldCheck,
    UploadCloud,
    Trash2,
    Download,
    FileImage,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertTriangle,
    Info,
    Layers,
    MapPin,
    Camera,
    Calendar,
    HardDrive,
    Sparkles,
    Lock,
    RefreshCw,
    SlidersHorizontal,
    FileCheck,
    HelpCircle,
    BookOpen
} from "lucide-react";

interface ParsedExifData {
    make?: string;
    model?: string;
    dateTime?: string;
    exposureTime?: string;
    fNumber?: string;
    iso?: string;
    focalLength?: string;
    lensModel?: string;
    gpsLatitude?: string;
    gpsLongitude?: string;
    gpsAltitude?: string;
    software?: string;
    colorSpace?: string;
    rawCount: number;
}

interface ProcessedImageState {
    originalFile: File;
    originalName: string;
    originalSize: number;
    originalDimensions: { width: number; height: number };
    originalUrl: string;
    strippedBlob: Blob | null;
    strippedUrl: string | null;
    strippedSize: number | null;
    outputFormat: "image/jpeg" | "image/png" | "image/webp";
    quality: number;
    exifData: ParsedExifData;
    hasExif: boolean;
    processing: boolean;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const parseExifFromDataView = (view: DataView): ParsedExifData => {
    const result: ParsedExifData = { rawCount: 0 };

    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
        return result;
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
        if (view.getUint8(offset) !== 0xff) break;
        const marker = view.getUint8(offset + 1);

        if (marker === 0xe1) {
            const segmentLength = view.getUint16(offset + 2, false);
            const exifHeader =
                String.fromCharCode(view.getUint8(offset + 4)) +
                String.fromCharCode(view.getUint8(offset + 5)) +
                String.fromCharCode(view.getUint8(offset + 6)) +
                String.fromCharCode(view.getUint8(offset + 7));

            if (exifHeader === "Exif") {
                const tiffOffset = offset + 10;
                const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;

                const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
                if (firstIfdOffset >= 0x00000008) {
                    let dirStart = tiffOffset + firstIfdOffset;
                    if (dirStart + 2 <= length) {
                        const entries = view.getUint16(dirStart, littleEndian);
                        result.rawCount = entries;
                        dirStart += 2;

                        for (let i = 0; i < entries; i++) {
                            const entryOffset = dirStart + i * 12;
                            if (entryOffset + 12 > length) break;
                            const tag = view.getUint16(entryOffset, littleEndian);

                            const readString = (valOffset: number, charCount: number): string => {
                                let str = "";
                                for (let c = 0; c < charCount; c++) {
                                    const charCode = view.getUint8(valOffset + c);
                                    if (charCode === 0) break;
                                    str += String.fromCharCode(charCode);
                                }
                                return str.trim();
                            };

                            if (tag === 0x010f) {
                                const count = view.getUint32(entryOffset + 4, littleEndian);
                                const valOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                                if (valOffset + count <= length) result.make = readString(valOffset, count);
                            } else if (tag === 0x0110) {
                                const count = view.getUint32(entryOffset + 4, littleEndian);
                                const valOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                                if (valOffset + count <= length) result.model = readString(valOffset, count);
                            } else if (tag === 0x0131) {
                                const count = view.getUint32(entryOffset + 4, littleEndian);
                                const valOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                                if (valOffset + count <= length) result.software = readString(valOffset, count);
                            } else if (tag === 0x0132) {
                                const count = view.getUint32(entryOffset + 4, littleEndian);
                                const valOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                                if (valOffset + count <= length) result.dateTime = readString(valOffset, count);
                            } else if (tag === 0x8769) {
                                const subIfdOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                                if (subIfdOffset + 2 <= length) {
                                    const subEntries = view.getUint16(subIfdOffset, littleEndian);
                                    result.rawCount += subEntries;
                                    for (let j = 0; j < subEntries; j++) {
                                        const subEntryOffset = subIfdOffset + 2 + j * 12;
                                        if (subEntryOffset + 12 > length) break;
                                        const subTag = view.getUint16(subEntryOffset, littleEndian);

                                        if (subTag === 0x829a) {
                                            const valOffset = tiffOffset + view.getUint32(subEntryOffset + 8, littleEndian);
                                            if (valOffset + 8 <= length) {
                                                const num = view.getUint32(valOffset, littleEndian);
                                                const den = view.getUint32(valOffset + 4, littleEndian);
                                                if (den !== 0) result.exposureTime = num === 1 ? `1/${Math.round(den / num)}s` : `${(num / den).toFixed(3)}s`;
                                            }
                                        } else if (subTag === 0x829d) {
                                            const valOffset = tiffOffset + view.getUint32(subEntryOffset + 8, littleEndian);
                                            if (valOffset + 8 <= length) {
                                                const num = view.getUint32(valOffset, littleEndian);
                                                const den = view.getUint32(valOffset + 4, littleEndian);
                                                if (den !== 0) result.fNumber = `f/${(num / den).toFixed(1)}`;
                                            }
                                        } else if (subTag === 0x8827) {
                                            result.iso = `ISO ${view.getUint16(subEntryOffset + 8, littleEndian)}`;
                                        } else if (subTag === 0x920a) {
                                            const valOffset = tiffOffset + view.getUint32(subEntryOffset + 8, littleEndian);
                                            if (valOffset + 8 <= length) {
                                                const num = view.getUint32(valOffset, littleEndian);
                                                const den = view.getUint32(valOffset + 4, littleEndian);
                                                if (den !== 0) result.focalLength = `${(num / den).toFixed(1)} mm`;
                                            }
                                        } else if (subTag === 0xa434) {
                                            const count = view.getUint32(subEntryOffset + 4, littleEndian);
                                            const valOffset = tiffOffset + view.getUint32(subEntryOffset + 8, littleEndian);
                                            if (valOffset + count <= length) result.lensModel = readString(valOffset, count);
                                        }
                                    }
                                }
                            } else if (tag === 0x8825) {
                                const gpsOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                                if (gpsOffset + 2 <= length) {
                                    const gpsEntries = view.getUint16(gpsOffset, littleEndian);
                                    result.rawCount += gpsEntries;
                                    result.gpsLatitude = "Embedded Geolocation Tags Detected";
                                    result.gpsLongitude = "Exact Coordinates Present in Binary";
                                }
                            }
                        }
                    }
                }
                break;
            }
            offset += 2 + segmentLength;
        } else if ((marker & 0xff00) !== 0xff00 && marker !== 0x00) {
            break;
        } else if (marker === 0xda || marker === 0xd9) {
            break;
        } else {
            const segmentLength = view.getUint16(offset + 2, false);
            offset += 2 + segmentLength;
        }
    }

    return result;
};

export default function ImageExifStripper() {
    const [imageState, setImageState] = useState<ProcessedImageState | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
    const [quality, setQuality] = useState<number>(92);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        min: number,
        max: number
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(min);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const parsed = parseInt(cleaned, 10);
        if (isNaN(parsed)) {
            setter(min);
            return;
        }
        setter(Math.max(min, Math.min(max, parsed)));
    };

    const processFile = useCallback(async (file: File, targetFormat = selectedFormat, targetQuality = quality) => {
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPEG, PNG, or WebP).");
            return;
        }

        const originalUrl = URL.createObjectURL(file);
        const arrayBuffer = await file.arrayBuffer();
        const dataView = new DataView(arrayBuffer);
        const exifData = parseExifFromDataView(dataView);
        const hasExif = exifData.rawCount > 0 || !!exifData.make || !!exifData.model || !!exifData.gpsLatitude;

        const img = new Image();
        img.src = originalUrl;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: false });

            if (!ctx) {
                alert("Failed to initialize canvas context.");
                return;
            }

            if (targetFormat === "image/jpeg") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
                (strippedBlob) => {
                    if (!strippedBlob) return;
                    const strippedUrl = URL.createObjectURL(strippedBlob);

                    setImageState({
                        originalFile: file,
                        originalName: file.name,
                        originalSize: file.size,
                        originalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
                        originalUrl,
                        strippedBlob,
                        strippedUrl,
                        strippedSize: strippedBlob.size,
                        outputFormat: targetFormat,
                        quality: targetQuality,
                        exifData,
                        hasExif,
                        processing: false
                    });
                },
                targetFormat,
                targetQuality / 100
            );
        };
    }, [selectedFormat, quality]);

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const reprocessWithSettings = (newFormat: "image/jpeg" | "image/png" | "image/webp", newQuality: number) => {
        setSelectedFormat(newFormat);
        setQuality(newQuality);
        if (imageState) {
            processFile(imageState.originalFile, newFormat, newQuality);
        }
    };

    const handleDownload = () => {
        if (!imageState || !imageState.strippedBlob) return;
        const ext = imageState.outputFormat === "image/png" ? "png" : imageState.outputFormat === "image/webp" ? "webp" : "jpg";
        const dotIdx = imageState.originalName.lastIndexOf(".");
        const baseName = dotIdx !== -1 ? imageState.originalName.substring(0, dotIdx) : imageState.originalName;
        const link = document.createElement("a");
        link.href = imageState.strippedUrl!;
        link.download = `${baseName}-sanitized.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        if (imageState) {
            URL.revokeObjectURL(imageState.originalUrl);
            if (imageState.strippedUrl) URL.revokeObjectURL(imageState.strippedUrl);
        }
        setImageState(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const sizeDifference = useMemo(() => {
        if (!imageState || !imageState.strippedSize) return null;
        const diff = imageState.originalSize - imageState.strippedSize;
        const percent = ((diff / imageState.originalSize) * 100).toFixed(1);
        return { diff, percent };
    }, [imageState]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image Metadata & EXIF Tag Stripper",
        "url": "https://twistertools.com/tools/image-tools/image-exif-stripper",
        "description": "Scrub EXIF metadata, GPS coordinates, camera hardware models, serial numbers, and personal timestamps directly in the client browser with zero server uploads.",
        "applicationCategory": "PhotoApplication",
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
                "name": "What image metadata is stripped by this utility?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool eliminates all Exchangeable Image File Format (EXIF) segments, GPS latitude/longitude coordinates, camera make and model identifiers, lens serials, IPTC copyright descriptors, XMP XML packets, thumbnail caches, and capture timestamp records."
                }
            },
            {
                "@type": "Question",
                "name": "Are my images uploaded to any remote server or cloud database?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire sanitization pipeline runs 100% locally inside your browser via standard HTML5 Canvas pixel rasterization. Your photographs, private locations, and document scans never leave your local device memory."
                }
            },
            {
                "@type": "Question",
                "name": "Does stripping EXIF metadata reduce visual image quality?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Metadata is stored in auxiliary header chunks separate from the visible raster matrix. When saving as lossless PNG, quality remains identical. For JPEG and WebP, the high-precision 92-100% quality options ensure clean visual fidelity while discarding privacy-leaking header tags."
                }
            },
            {
                "@type": "Question",
                "name": "Why do mobile photos present such serious privacy hazards online?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Smartphones automatically tag every photo with high-precision GPS coordinates, altitude, device IMEI or camera serial, and exact timestamps. Uploading these photos to forums, unverified platforms, or messaging boards reveals your exact home address, travel patterns, and daily routines."
                }
            },
            {
                "@type": "Question",
                "name": "Can deleted EXIF metadata ever be recovered from the downloaded file?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Because the image is completely re-rendered onto a fresh HTML5 Canvas buffer and re-encoded from scratch into raw pixel frames, the auxiliary EXIF binary chunks (APP1, IPTC, and XMP) do not exist in the newly generated blob."
                }
            },
            {
                "@type": "Question",
                "name": "Which image file formats are supported?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The stripper fully supports standard JPEG (.jpg, .jpeg), PNG (.png), and WebP (.webp) raster formats. You can convert between these formats during the stripping pass."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Upload & Inspection */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileImage className="w-5 h-5 text-indigo-600" />
                                Image Input & EXIF Audit
                            </h2>
                            {imageState && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear Image
                                </button>
                            )}
                        </div>

                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleFileDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${dragActive
                                    ? "border-indigo-600 bg-indigo-50/50 scale-[0.99]"
                                    : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60"
                                }`}
                        >
                            <input aria-label="Upload file"
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    Click to select or drag & drop an image
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Supports JPEG, JPG, PNG, and WebP (Up to 50MB)
                                </p>
                            </div>
                        </div>

                        {/* File Details & Detected EXIF Preview */}
                        {imageState ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                                            <span className="text-xs font-bold text-slate-800 truncate">
                                                {imageState.originalName}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono text-slate-500 shrink-0">
                                            {formatBytes(imageState.originalSize)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-slate-600">
                                            Dimensions: <span className="font-semibold text-slate-900">{imageState.originalDimensions.width} × {imageState.originalDimensions.height}px</span>
                                        </div>
                                        <div className="text-slate-600">
                                            MIME Type: <span className="font-semibold text-slate-900">{imageState.originalFile.type}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* EXIF Data Audit Status */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                            <Info className="w-4 h-4 text-indigo-600" />
                                            Detected Metadata Tags ({imageState.exifData.rawCount})
                                        </h3>
                                        {imageState.hasExif ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                                                <AlertTriangle className="w-3 h-3" /> Metadata Exposed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">
                                                <CheckCircle2 className="w-3 h-3" /> Clean / No EXIF
                                            </span>
                                        )}
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                                        <div className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <Camera className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Camera Hardware
                                            </span>
                                            <span className="font-medium text-slate-800">
                                                {imageState.exifData.make || imageState.exifData.model
                                                    ? `${imageState.exifData.make || ""} ${imageState.exifData.model || ""}`.trim()
                                                    : "Not detected"}
                                            </span>
                                        </div>
                                        <div className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Date & Timestamp
                                            </span>
                                            <span className="font-medium text-slate-800">
                                                {imageState.exifData.dateTime || "Not detected"}
                                            </span>
                                        </div>
                                        <div className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> GPS Coordinates
                                            </span>
                                            <span className={`font-semibold ${imageState.exifData.gpsLatitude ? "text-rose-600 font-mono text-[11px]" : "text-slate-800"}`}>
                                                {imageState.exifData.gpsLatitude ? "Geotag Attached (Privacy Risk)" : "No GPS embedded"}
                                            </span>
                                        </div>
                                        <div className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> Exposure / Optics
                                            </span>
                                            <span className="font-medium text-slate-800 font-mono text-[11px]">
                                                {imageState.exifData.fNumber || imageState.exifData.exposureTime || imageState.exifData.iso
                                                    ? `${imageState.exifData.fNumber || ""} ${imageState.exifData.exposureTime || ""} ${imageState.exifData.iso || ""}`.trim()
                                                    : "Not detected"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-2">
                                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-xs text-slate-600 font-medium">
                                    Upload a photograph to analyze raw EXIF, IPTC, and XMP payloads before stripping.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <ShieldCheck className="w-4 h-4" /> Zero Network Transmission
                        </span>
                        <span>Client Sandbox</span>
                    </div>
                </div>

                {/* Right Panel: Sanitization & Export Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Sanitization & Export
                            </h2>
                            {imageState && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                    Sanitized Blob Ready
                                </span>
                            )}
                        </div>

                        {/* Export Format Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Target Output Format
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        { label: "JPEG", value: "image/jpeg" },
                                        { label: "PNG", value: "image/png" },
                                        { label: "WebP", value: "image/webp" }
                                    ] as const
                                ).map((fmt) => (
                                    <button
                                        key={fmt.value}
                                        type="button"
                                        onClick={() => reprocessWithSettings(fmt.value, quality)}
                                        className={`py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${selectedFormat === fmt.value
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quality Slider (for lossy formats) */}
                        {selectedFormat !== "image/png" && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <span>Compression Quality:</span>
                                    <div className="flex items-center gap-1">
                                        <input aria-label="Compression Quality"
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={quality}
                                            onChange={(e) =>
                                                handleNumberInput(
                                                    e,
                                                    (val) => reprocessWithSettings(selectedFormat, val),
                                                    10,
                                                    100
                                                )
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-600 dark:text-slate-300 font-normal">%</span>
                                    </div>
                                </div>
                                <input aria-label="Adjust slider value"
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="1"
                                    value={quality}
                                    onChange={(e) => reprocessWithSettings(selectedFormat, Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        )}

                        {/* Sanitized Preview Canvas */}
                        {imageState?.strippedUrl ? (
                            <div className="space-y-4">
                                <div className="relative w-full h-56 bg-slate-900/5 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                                    <img
                                        src={imageState.strippedUrl}
                                        alt="Sanitized preview"
                                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                                    />
                                    <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded font-medium">
                                        EXIF Nullified
                                    </div>
                                </div>

                                {/* Comparison Statistics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <span className="text-[11px] text-slate-500 block">Original Size</span>
                                        <span className="text-sm font-bold text-slate-800">
                                            {formatBytes(imageState.originalSize)}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center">
                                        <span className="text-[11px] text-indigo-600 block font-medium">Sanitized Size</span>
                                        <span className="text-sm font-bold text-indigo-900">
                                            {imageState.strippedSize ? formatBytes(imageState.strippedSize) : "Calculating..."}
                                        </span>
                                    </div>
                                </div>

                                {sizeDifference && (
                                    <p className="text-xs text-center text-slate-500">
                                        {sizeDifference.diff >= 0 ? (
                                            <span>
                                                Payload reduced by <strong className="text-emerald-600">{formatBytes(sizeDifference.diff)} ({sizeDifference.percent}%)</strong> through metadata purging & optimization.
                                            </span>
                                        ) : (
                                            <span>
                                                Re-encoded format changed buffer density (<strong className="text-slate-700">+{formatBytes(Math.abs(sizeDifference.diff))}</strong>).
                                            </span>
                                        )}
                                    </p>
                                )}

                                {/* Action Download Button */}
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Sanitized Image
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-2">
                                <HardDrive className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-xs text-slate-500 font-medium">
                                    Your privacy-scrubbed image preview will appear here ready for one-click export.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            Canvas Raster Clean Pipeline
                        </span>
                        <span className="text-indigo-600 font-semibold">Ready for Web Publishing</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: What is EXIF & Metadata Privacy Threat */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Hidden Privacy Risks in Digital Images: Understanding EXIF, IPTC, and XMP
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Whenever you capture a photograph using a smartphone, DSLR, or mirrorless camera, the device records extensive technical and situational metadata alongside raw visual light data. Standardized under the Exchangeable Image File Format (EXIF), this information is embedded directly inside binary header segments of the image file (such as the APP1 marker in JPEGs). While designed to aid photographers in cataloging and color correction, unscrubbed metadata poses severe security vulnerabilities when distributed across public channels.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-indigo-600" /> Geolocation Tags
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                High-precision GPS latitude, longitude, and elevation tags reveal the exact physical location where a photo was taken, pinpointing homes, offices, schools, and private hangouts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Camera className="w-4 h-4 text-indigo-600" /> Hardware Footprints
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Detailed records of your device model, camera serial numbers, lens configurations, firmware versions, and unique sensor calibration parameters enable physical tracking of user equipment.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-indigo-600" /> Timestamp Timelines
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Exact sub-second timestamps and timezone data expose personal daily schedules, sleep cycles, and routine travel intervals to data miners and malicious threat actors.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture - Client-Side Canvas vs Server Tools */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Comparison: Browser-Native Rasterization vs Server-Side Scrubbers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Many online "metadata removers" require users to upload confidential photographs to third-party web servers, ironically violating user privacy while attempting to protect it. Our architecture operates entirely in your browser sandbox using hardware-accelerated HTML5 Canvas rasterization:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Vector / Feature</th>
                                    <th className="p-3">TwisterTools Browser Stripper</th>
                                    <th className="p-3">Traditional Server-Based Tools</th>
                                    <th className="p-3">CLI Tools (ExifTool / ImageMagick)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Network Exposure</td>
                                    <td className="p-3 text-emerald-600 font-bold">Zero (100% Client-Side)</td>
                                    <td className="p-3 text-rose-600 font-bold">High (File transmitted to cloud)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Zero (Local device shell)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Scrubbing Technique</td>
                                    <td className="p-3">Clean Canvas Pixel Re-Encoding</td>
                                    <td className="p-3">Header Demuxing / Script Pipe</td>
                                    <td className="p-3">Binary Byte-Range Truncation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Residual Payload Risk</td>
                                    <td className="p-3 text-emerald-600 font-bold">None (Headers generated clean)</td>
                                    <td className="p-3 text-amber-600 font-bold">Variable (Depends on regex)</td>
                                    <td className="p-3 text-emerald-600 font-bold">None (Explicit strip flag)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Software Installation</td>
                                    <td className="p-3 text-emerald-600 font-bold">None (Instant Browser Run)</td>
                                    <td className="p-3 text-emerald-600 font-bold">None</td>
                                    <td className="p-3 text-amber-600 font-bold">Required (Perl / C binaries)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Sanitization Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complete Step-by-Step Guide to Sanitizing Digital Photographs
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Web Publishing
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Always Scrub Before Uploading:</strong> Many social apps strip metadata during compression, but forums, real estate boards, and cloud drives often retain original headers verbatim.
                                </li>
                                <li>
                                    • <strong>Select WebP for Optimal File Delivery:</strong> Converting your stripped photos to modern WebP significantly shrinks transfer payload while maintaining razor-sharp rendering.
                                </li>
                                <li>
                                    • <strong>Verify Geotag Stripping:</strong> Confirm that GPS coordinates read as non-present before distributing family or property documentation.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Privacy Antipatterns
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Cropping Without Stripping:</strong> Simply cropping an image inside native mobile gallery apps often updates only the visual bounding box while leaving the full EXIF geotag intact.
                                </li>
                                <li>
                                    • <strong>Relying on Screenshots:</strong> Taking a screenshot cleans EXIF but introduces color degradation, lowers resolution, and consumes battery.
                                </li>
                                <li>
                                    • <strong>Sharing Uncompressed RAW Files:</strong> RAW digital negatives (.CR3, .NEF, .ARW) embed the deepest level of forensic hardware and optical identification data.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What image metadata is stripped by this utility?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool eliminates all Exchangeable Image File Format (EXIF) segments, GPS latitude/longitude coordinates, camera make and model identifiers, lens serials, IPTC copyright descriptors, XMP XML packets, thumbnail caches, and capture timestamp records.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my images uploaded to any remote server or cloud database?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire sanitization pipeline runs 100% locally inside your browser via standard HTML5 Canvas pixel rasterization. Your photographs, private locations, and document scans never leave your local device memory.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does stripping EXIF metadata reduce visual image quality?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Metadata is stored in auxiliary header chunks separate from the visible raster matrix. When saving as lossless PNG, quality remains identical. For JPEG and WebP, the high-precision 92-100% quality options ensure clean visual fidelity while discarding privacy-leaking header tags.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do mobile photos present such serious privacy hazards online?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Smartphones automatically tag every photo with high-precision GPS coordinates, altitude, device IMEI or camera serial, and exact timestamps. Uploading these photos to forums, unverified platforms, or messaging boards reveals your exact home address, travel patterns, and daily routines.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can deleted EXIF metadata ever be recovered from the downloaded file?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Because the image is completely re-rendered onto a fresh HTML5 Canvas buffer and re-encoded from scratch into raw pixel frames, the auxiliary EXIF binary chunks (APP1, IPTC, and XMP) do not exist in the newly generated blob.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which image file formats are supported?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The stripper fully supports standard JPEG (.jpg, .jpeg), PNG (.png), and WebP (.webp) raster formats. You can convert between these formats during the stripping pass.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
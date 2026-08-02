/*
 * PREMIUM QR CODE GENERATOR - QRCODE MONKEY COMPETITOR
 * 
 * DESIGN PHILOSOPHY:
 * - Asymmetrical 2-column dashboard (8/4 split on desktop)
 * - Left: Collapsible accordion tabs for organized controls
 * - Right: Sticky floating preview card with premium aesthetics
 * - Modern color palette with high-contrast elements
 * - Professional visual hierarchy and spacing
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Download,
  Link,
  Palette,
  Upload,
  Wifi,
  Mail,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CreditCard,
  Phone,
  Share2,
} from "lucide-react";
import QRCode from "qrcode";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type TemplateType = "url" | "text" | "wifi" | "vcard" | "email" | "sms" | "business-card" | "whatsapp" | "phone";
type DotStyle = "square" | "rounded";

interface AccordionSection {
  id: string;
  title: string;
  step: number;
  isOpen: boolean;
}

export default function QrCodeGenerator() {
  // Accordion state
  const [accordionSections, setAccordionSections] = useState<AccordionSection[]>([
    { id: "content", title: "Choose Content Type", step: 1, isOpen: true },
    { id: "colors", title: "Custom Colors", step: 2, isOpen: false },
    { id: "design", title: "Design Styles", step: 3, isOpen: false },
    { id: "logo", title: "Add Logo", step: 4, isOpen: false },
  ]);

  // Template system
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("url");

  // Core state
  const [inputText, setInputText] = useState("https://www.twistertools.com");
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [useGradient, setUseGradient] = useState(false);
  const [gradientStartColor, setGradientStartColor] = useState("#000000");
  const [gradientEndColor, setGradientEndColor] = useState("#4f46e5");
  const [errorCorrectionLevel, setErrorCorrectionLevel] =
    useState<ErrorCorrectionLevel>("H");
  const [qrSize, setQrSize] = useState(400);
  const [exportSize, setExportSize] = useState(600);
  const [dotStyle, setDotStyle] = useState<DotStyle>("square");

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");

  // QR code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // WiFi specific fields
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState("WPA");

  // Email specific fields
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  // SMS specific fields
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  // vCard specific fields
  const [vcardName, setVcardName] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");

  // Business Card specific fields
  const [businessName, setBusinessName] = useState("");
  const [businessTitle, setBusinessTitle] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // WhatsApp specific fields
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  // Phone specific fields
  const [phoneNumber, setPhoneNumber] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollOptions = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 160 : -160, behavior: "smooth" });
  };

  // Toggle accordion section
  const toggleAccordion = (sectionId: string) => {
    setAccordionSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  // Handle template selection
  const handleTemplateChange = (templateId: TemplateType) => {
    setSelectedTemplate(templateId);
    
    // Reset fields
    if (templateId === "url") {
      setInputText("https://www.twistertools.com");
    } else if (templateId === "text") {
      setInputText("Your custom text here");
    } else {
      setInputText("");
      setWifiSSID("");
      setWifiPassword("");
      setEmailAddress("");
      setEmailSubject("");
      setSmsPhone("");
      setSmsMessage("");
      setVcardName("");
      setVcardPhone("");
      setVcardEmail("");
      setVcardOrg("");
      setBusinessName("");
      setBusinessTitle("");
      setBusinessPhone("");
      setBusinessEmail("");
      setBusinessWebsite("");
      setBusinessAddress("");
      setWhatsappPhone("");
      setWhatsappMessage("");
      setPhoneNumber("");
    }
  };

  // Generate template-specific content
  const getTemplateContent = (): string => {
    switch (selectedTemplate) {
      case "wifi":
        if (!wifiSSID) return "";
        return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};;`;
      case "email":
        if (!emailAddress) return "";
        return `mailto:${emailAddress}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}`;
      case "sms":
        if (!smsPhone) return "";
        const phone = smsPhone.replace(/[^0-9]/g, "");
        return `sms:${phone}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ""}`;
      case "whatsapp":
        if (!whatsappPhone) return "";
        const whatsappNum = whatsappPhone.replace(/[^0-9]/g, "");
        return `https://wa.me/${whatsappNum}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""}`;
      case "phone":
        if (!phoneNumber) return "";
        return `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
      case "vcard":
        if (!vcardName) return "";
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\n${vcardPhone ? `TEL:${vcardPhone}\n` : ""}${vcardEmail ? `EMAIL:${vcardEmail}\n` : ""}${vcardOrg ? `ORG:${vcardOrg}\n` : ""}END:VCARD`;
      case "business-card":
        if (!businessName) return "";
        return `BEGIN:VCARD\nVERSION:4.0\nFN:${businessName}\n${businessTitle ? `TITLE:${businessTitle}\n` : ""}${businessPhone ? `TEL:${businessPhone}\n` : ""}${businessEmail ? `EMAIL:${businessEmail}\n` : ""}${businessWebsite ? `URL:${businessWebsite}\n` : ""}${businessAddress ? `ADR:;;${businessAddress};;;\n` : ""}END:VCARD`;
      default:
        return inputText;
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate QR code with logo overlay and gradient support
  useEffect(() => {
    const generateQRCode = async () => {
      const content = getTemplateContent();
      if (!content.trim()) {
        setQrCodeDataUrl("");
        return;
      }

      setIsGenerating(true);
      try {
        // Determine background color
        const bgColor = transparentBackground ? "transparent" : backgroundColor;
        
        // For gradient or rounded dots, we need custom canvas rendering
        const needsCustomRendering = useGradient || dotStyle === "rounded" || transparentBackground;
        
        if (!needsCustomRendering && !logoDataUrl) {
          // Simple case - use library directly
          const baseQRUrl = await QRCode.toDataURL(content, {
            errorCorrectionLevel,
            width: qrSize,
            margin: 2,
            color: {
              dark: foregroundColor,
              light: backgroundColor,
            },
          });
          setQrCodeDataUrl(baseQRUrl);
          setIsGenerating(false);
          return;
        }

        // Custom canvas rendering for gradients, rounded dots, transparent bg, or logo
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsGenerating(false);
          return;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setIsGenerating(false);
          return;
        }

        // Set canvas size
        canvas.width = qrSize;
        canvas.height = qrSize;

        // Clear canvas with transparency support
        ctx.clearRect(0, 0, qrSize, qrSize);
        
        // Draw background if not transparent
        if (!transparentBackground) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, qrSize, qrSize);
        }

        // ── Gradient + square dots (no logo): source-in compositing path ────────────
        // The library renders the QR module shapes (pixel-for-pixel identical to the
        // non-gradient path), then the gradient is applied ONLY to those module pixels
        // via source-in compositing on an off-screen canvas.
        // This guarantees zero visible size change when toggling the gradient on/off.
        if (useGradient && dotStyle !== "rounded" && !logoDataUrl) {
          // Library renders QR with standard black-on-white (only hex colors are valid)
          const baseQRUrl = await QRCode.toDataURL(content, {
            errorCorrectionLevel,
            width: qrSize,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });

          // Off-screen canvas: hold module shapes and apply gradient to them
          const offCanvas = document.createElement("canvas");
          offCanvas.width = qrSize;
          offCanvas.height = qrSize;
          const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
          if (!offCtx) { setIsGenerating(false); return; }

          const qrImg = new Image();
          await new Promise<void>((resolve) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = () => resolve();
            qrImg.src = baseQRUrl;
          });

          // Step 1: Draw library-rendered module shapes (black on white)
          offCtx.drawImage(qrImg, 0, 0, qrSize, qrSize);

          // Step 2: Convert white (background) pixels to transparent so source-in works.
          // Uses luminance so any anti-aliased edge pixels are handled gracefully.
          const imgData = offCtx.getImageData(0, 0, qrSize, qrSize);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const luminance = (d[i] + d[i + 1] + d[i + 2]) / 3;
            d[i + 3] = Math.round(255 - luminance); // dark → opaque, light → transparent
          }
          offCtx.putImageData(imgData, 0, 0);

          // Step 3: source-in → gradient only paints over opaque (module) pixels
          const gradient = offCtx.createLinearGradient(0, 0, qrSize, qrSize);
          gradient.addColorStop(0, gradientStartColor);
          gradient.addColorStop(1, gradientEndColor);
          offCtx.globalCompositeOperation = "source-in";
          offCtx.fillStyle = gradient;
          offCtx.fillRect(0, 0, qrSize, qrSize);
          offCtx.globalCompositeOperation = "source-over";

          // Step 4: Composite gradient-colored modules onto main canvas (with background)
          ctx.drawImage(offCanvas, 0, 0);

          setQrCodeDataUrl(canvas.toDataURL("image/png"));
          setIsGenerating(false);
          return;
        }
        // ─────────────────────────────────────────────────────────────────────────────

        // Generate base QR data for manual module rendering (rounded dots / logo / transparent bg)
        const qrData = await QRCode.create(content, { errorCorrectionLevel });
        const qrMatrix = qrData.modules.data;
        const qrSize_modules = qrData.modules.size;
        
        // Calculate cell size to match the library renderer's margin:2 quiet zone exactly.
        const marginModules = 2; // must match `margin: 2` passed to QRCode.toDataURL
        const cellSize = qrSize / (qrSize_modules + 2 * marginModules);
        const paddingOffset = marginModules * cellSize;

        // Set fill style (gradient or solid)
        if (useGradient) {
          const gradient = ctx.createLinearGradient(0, 0, qrSize, qrSize);
          gradient.addColorStop(0, gradientStartColor);
          gradient.addColorStop(1, gradientEndColor);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = foregroundColor;
        }
        
        // Draw QR code modules with dot style.
        // Pixel-snap: floor top-left, ceil bottom-right → no sub-pixel gaps between modules.
        for (let row = 0; row < qrSize_modules; row++) {
          for (let col = 0; col < qrSize_modules; col++) {
            const index = row * qrSize_modules + col;
            if (qrMatrix[index]) {
              const x0 = Math.floor(paddingOffset + col * cellSize);
              const y0 = Math.floor(paddingOffset + row * cellSize);
              const x1 = Math.ceil(paddingOffset + (col + 1) * cellSize);
              const y1 = Math.ceil(paddingOffset + (row + 1) * cellSize);
              const w = x1 - x0;
              const h = y1 - y0;

              if (dotStyle === "rounded") {
                ctx.beginPath();
                ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) / 2.2, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillRect(x0, y0, w, h);
              }
            }
          }
        }

        // Add logo if present
        if (logoDataUrl) {
          const logoImage = new Image();
          logoImage.onload = () => {
            const logoSize = qrSize * 0.25;
            const logoX = (qrSize - logoSize) / 2;
            const logoY = (qrSize - logoSize) / 2;

            // Draw white background for logo
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2 + 10, 0, Math.PI * 2);
            ctx.fill();

            // Draw logo
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

            setQrCodeDataUrl(canvas.toDataURL("image/png"));
            setIsGenerating(false);
          };
          logoImage.onerror = () => {
            setQrCodeDataUrl(canvas.toDataURL("image/png"));
            setIsGenerating(false);
          };
          logoImage.src = logoDataUrl;
        } else {
          setQrCodeDataUrl(canvas.toDataURL("image/png"));
          setIsGenerating(false);
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [
    inputText,
    foregroundColor,
    backgroundColor,
    transparentBackground,
    useGradient,
    gradientStartColor,
    gradientEndColor,
    errorCorrectionLevel,
    qrSize,
    dotStyle,
    logoDataUrl,
    selectedTemplate,
    wifiSSID,
    wifiPassword,
    wifiEncryption,
    emailAddress,
    emailSubject,
    smsPhone,
    smsMessage,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    businessName,
    businessTitle,
    businessPhone,
    businessEmail,
    businessWebsite,
    businessAddress,
    whatsappPhone,
    whatsappMessage,
    phoneNumber,
  ]);

  // Download as PNG with export size
  const downloadPNG = async () => {
    if (!qrCodeDataUrl) return;
    
    const content = getTemplateContent();
    if (!content.trim()) return;

    try {
      // Generate high-res version for export
      const exportCanvas = document.createElement("canvas");
      const exportCtx = exportCanvas.getContext("2d", { willReadFrequently: true });
      if (!exportCtx) return;

      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;

      // Clear canvas
      exportCtx.clearRect(0, 0, exportSize, exportSize);
      
      // Draw background if not transparent
      if (!transparentBackground) {
        exportCtx.fillStyle = backgroundColor;
        exportCtx.fillRect(0, 0, exportSize, exportSize);
      }

      // Generate QR data
      const qrData = await QRCode.create(content, { errorCorrectionLevel });
      const qrMatrix = qrData.modules.data;
      const qrSize_modules = qrData.modules.size;
      
      // Calculate cell size with margin
      const margin = 8;
      const cellSize = (exportSize - margin * 2) / qrSize_modules;
      
      // Apply gradient to QR code pixels only
      if (useGradient) {
        const gradient = exportCtx.createLinearGradient(0, 0, exportSize, exportSize);
        gradient.addColorStop(0, gradientStartColor);
        gradient.addColorStop(1, gradientEndColor);
        exportCtx.fillStyle = gradient;
      } else {
        exportCtx.fillStyle = foregroundColor;
      }
      
      // Draw QR code modules with dot style
      for (let row = 0; row < qrSize_modules; row++) {
        for (let col = 0; col < qrSize_modules; col++) {
          const index = row * qrSize_modules + col;
          if (qrMatrix[index]) {
            const x = margin + col * cellSize;
            const y = margin + row * cellSize;
            
            if (dotStyle === "rounded") {
              // Draw rounded dots
              exportCtx.beginPath();
              exportCtx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2.2, 0, Math.PI * 2);
              exportCtx.fill();
            } else {
              // Draw square dots
              exportCtx.fillRect(x, y, cellSize, cellSize);
            }
          }
        }
      }

      // Add logo if present
      if (logoDataUrl) {
        const logoImage = new Image();
        logoImage.onload = () => {
          const logoSize = exportSize * 0.25;
          const logoX = (exportSize - logoSize) / 2;
          const logoY = (exportSize - logoSize) / 2;

          exportCtx.fillStyle = "#ffffff";
          exportCtx.beginPath();
          exportCtx.arc(exportSize / 2, exportSize / 2, logoSize / 2 + 10, 0, Math.PI * 2);
          exportCtx.fill();
          exportCtx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

          const link = document.createElement("a");
          link.download = `twistertools-qr-${exportSize}px-${Date.now()}.png`;
          link.href = exportCanvas.toDataURL("image/png");
          link.click();
        };
        logoImage.src = logoDataUrl;
      } else {
        const link = document.createElement("a");
        link.download = `twistertools-qr-${exportSize}px-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL("image/png");
        link.click();
      }
    } catch (error) {
      console.error("Error downloading PNG:", error);
      // Fallback to current preview
      const link = document.createElement("a");
      link.download = `twistertools-qr-${Date.now()}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  // Download as SVG
  const downloadSVG = async () => {
    const content = getTemplateContent();
    if (!content.trim()) return;

    try {
      const svgString = await QRCode.toString(content, {
        type: "svg",
        errorCorrectionLevel,
        width: exportSize,
        margin: 2,
        color: {
          dark: useGradient ? gradientStartColor : foregroundColor,
          light: backgroundColor,
        },
      });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `twistertools-qr-${exportSize}px-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating SVG:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      {/* LEFT PANEL: Controls (8 columns) */}
      <div className="lg:col-span-8 space-y-4">
        {/* ACCORDION SECTION 1: Content Type */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => toggleAccordion("content")}
            className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground">Choose Content Type</h3>
            </div>
            {accordionSections.find((s) => s.id === "content")?.isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {accordionSections.find((s) => s.id === "content")?.isOpen && (
            <div className="space-y-6 p-4 sm:p-6">
              {/* Template Selector - 8-option horizontal scroll with arrow controls */}
              <div className="relative">
                {/* Left arrow — large, high-usability */}
                <button
                  onClick={() => scrollOptions("left")}
                  aria-label="Scroll left"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-all -ml-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Scrollable row — discreet thin scrollbar (slate-200 track) */}
                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-3 pb-1 w-full px-4"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}
                >
                  {/* URL */}
                  <button
                    onClick={() => handleTemplateChange("url")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "url"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <Link className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5">URL</span>
                  </button>

                  {/* Biz Card (vCard 4.0) */}
                  <button
                    onClick={() => handleTemplateChange("business-card")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "business-card"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5 text-center leading-tight">Biz Card</span>
                  </button>

                  {/* Text */}
                  <button
                    onClick={() => handleTemplateChange("text")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "text"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5">Text</span>
                  </button>

                  {/* WiFi */}
                  <button
                    onClick={() => handleTemplateChange("wifi")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "wifi"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <Wifi className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5">WiFi</span>
                  </button>

                  {/* Email */}
                  <button
                    onClick={() => handleTemplateChange("email")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "email"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <Mail className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5">Email</span>
                  </button>

                  {/* SMS */}
                  <button
                    onClick={() => handleTemplateChange("sms")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "sms"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5">SMS</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => handleTemplateChange("whatsapp")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "whatsapp"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <Share2 className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5 text-center leading-tight">WhatsApp</span>
                  </button>

                  {/* Phone */}
                  <button
                    onClick={() => handleTemplateChange("phone")}
                    className={`w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border transition-all ${
                      selectedTemplate === "phone"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-md"
                        : "border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <Phone className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1.5">Phone</span>
                  </button>
                </div>

                {/* Right arrow — large, high-usability */}
                <button
                  onClick={() => scrollOptions("right")}
                  aria-label="Scroll right"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-all -mr-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Dynamic Input Forms */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                {selectedTemplate === "url" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                )}

                {selectedTemplate === "text" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Plain Text
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter any text..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y transition-all"
                    />
                  </div>
                )}

                {selectedTemplate === "wifi" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Network Name (SSID)
                      </label>
                      <input
                        type="text"
                        value={wifiSSID}
                        onChange={(e) => setWifiSSID(e.target.value)}
                        placeholder="MyWiFiNetwork"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Password
                      </label>
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="WiFiPassword123"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Encryption
                      </label>
                      <select
                        value={wifiEncryption}
                        onChange={(e) => setWifiEncryption(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">No Password</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedTemplate === "vcard" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={vcardName}
                        onChange={(e) => setVcardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={vcardPhone}
                        onChange={(e) => setVcardPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={vcardEmail}
                        onChange={(e) => setVcardEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={vcardOrg}
                        onChange={(e) => setVcardOrg(e.target.value)}
                        placeholder="Company Name"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === "email" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="contact@example.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Subject (Optional)
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Hello!"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === "sms" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Hello! I'd like to..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-y transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === "business-card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={businessTitle}
                        onChange={(e) => setBusinessTitle(e.target.value)}
                        placeholder="CEO & Founder"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={businessWebsite}
                        onChange={(e) => setBusinessWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Address
                      </label>
                      <input
                        type="text"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="123 Main St, City, Country"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === "whatsapp" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number (with country code)
                      </label>
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Pre-filled Message (Optional)
                      </label>
                      <textarea
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        placeholder="Hello! I'd like to connect..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-y transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedTemplate === "phone" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION SECTION 2: Custom Colors */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => toggleAccordion("colors")}
            className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground">Custom Colors</h3>
            </div>
            {accordionSections.find((s) => s.id === "colors")?.isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {accordionSections.find((s) => s.id === "colors")?.isOpen && (
            <div className="space-y-6 p-4 sm:p-6">
              {/* Gradient Toggle */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-foreground">Use Linear Gradient</span>
                  <input
                    type="checkbox"
                    checked={useGradient}
                    onChange={(e) => setUseGradient(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* Solid Color Mode */}
              {!useGradient && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Foreground Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-14 h-14 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-slate-200 dark:border-slate-600"
                      />
                      <input
                        type="text"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        disabled={transparentBackground}
                        className="w-14 h-14 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        disabled={transparentBackground}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="#ffffff"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={transparentBackground}
                          onChange={(e) => setTransparentBackground(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm text-foreground">Transparent Background</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Gradient Mode: start + end side-by-side, background full-width below */}
              {useGradient && (
                <div className="space-y-6">
                  {/* Row 1: Start Color + End Color (2-col grid, mirrors solid mode) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Gradient Start Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={gradientStartColor}
                          onChange={(e) => setGradientStartColor(e.target.value)}
                          className="w-14 h-14 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-slate-200 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={gradientStartColor}
                          onChange={(e) => setGradientStartColor(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Gradient End Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={gradientEndColor}
                          onChange={(e) => setGradientEndColor(e.target.value)}
                          className="w-14 h-14 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-slate-200 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={gradientEndColor}
                          onChange={(e) => setGradientEndColor(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                          placeholder="#4f46e5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Background Color — full width */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        disabled={transparentBackground}
                        className="w-14 h-14 flex-shrink-0 cursor-pointer overflow-hidden border-2 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        disabled={transparentBackground}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="#ffffff"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={transparentBackground}
                          onChange={(e) => setTransparentBackground(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm text-foreground">Transparent Background</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-lg p-4">
                <p className="text-sm text-indigo-900 dark:text-indigo-200">
                  <strong>Tip:</strong> Maintain high contrast (3:1 minimum) for reliable scanning
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION SECTION 3: Design Styles */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => toggleAccordion("design")}
            className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold text-foreground">Design Styles</h3>
            </div>
            {accordionSections.find((s) => s.id === "design")?.isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {accordionSections.find((s) => s.id === "design")?.isOpen && (
            <div className="space-y-6 p-4 sm:p-6">
              {/* Dot Style */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Dot Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDotStyle("square")}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      dotStyle === "square"
                        ? "border-primary bg-primary/10 text-primary shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div className="w-6 h-6 bg-current rounded-sm" />
                    <span className="font-medium">Square</span>
                  </button>
                  <button
                    onClick={() => setDotStyle("rounded")}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      dotStyle === "rounded"
                        ? "border-primary bg-primary/10 text-primary shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div className="w-6 h-6 bg-current rounded-full" />
                    <span className="font-medium">Rounded</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Instantly updates preview and downloaded image
                </p>
              </div>

              {/* Error Correction */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Error Correction Level
                </label>
                <select
                  value={errorCorrectionLevel}
                  onChange={(e) =>
                    setErrorCorrectionLevel(e.target.value as ErrorCorrectionLevel)
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
                >
                  <option value="L">Low (7%) - Clean environments</option>
                  <option value="M">Medium (15%) - Standard use</option>
                  <option value="Q">Quartile (25%) - Outdoor/product packaging</option>
                  <option value="H">High (30%) - With logo or damage-prone</option>
                </select>
                <p className="text-xs text-muted-foreground mt-3">
                  Higher levels allow scanning even when partially damaged
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACCORDION SECTION 4: Add Logo */}
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => toggleAccordion("logo")}
            className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                4
              </div>
              <h3 className="text-lg font-semibold text-foreground">Add Logo (Optional)</h3>
            </div>
            {accordionSections.find((s) => s.id === "logo")?.isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {accordionSections.find((s) => s.id === "logo")?.isOpen && (
            <div className="p-4 sm:p-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your logo to brand your QR code. Use High (H) error correction for best results.
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <Upload className="w-4 h-4" />
                    {logoFile ? "Change Logo" : "Upload Logo"}
                  </button>
                  {logoFile && (
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setLogoDataUrl("");
                        if (logoInputRef.current) logoInputRef.current.value = "";
                      }}
                      className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
                {logoFile && logoDataUrl && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                    <img
                      src={logoDataUrl}
                      alt="Logo preview"
                      className="w-14 h-14 object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {logoFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Preview & Download (4 columns) */}
      <div className="lg:col-span-4">
        <div className="sticky top-24">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Preview</h3>
            </div>

            {/* QR Code Display - hard-locked 288px×288px, no resize on re-render */}
            <div className="relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6 flex items-center justify-center">
              <div
                className="flex items-center justify-center rounded-lg overflow-hidden"
                style={{ width: "288px", height: "288px", minWidth: "288px", minHeight: "288px", flexShrink: 0 }}
              >
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Generated QR Code"
                    style={{ width: "288px", height: "288px", imageRendering: "crisp-edges", display: "block" }}
                  />
                ) : (
                  <div className="text-center text-slate-500 dark:text-slate-400">
                    <QrCode className="w-20 h-20 opacity-20 mx-auto mb-3" />
                    <p className="text-sm">Enter content to generate QR code</p>
                  </div>
                )}
              </div>
              {isGenerating && (
                <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Export Size Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
                Export Size: {exportSize}px
              </label>
              <input
                type="range"
                min="400"
                max="1200"
                step="100"
                value={exportSize}
                onChange={(e) => setExportSize(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-2">
                <span>400px</span>
                <span>1200px</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Download resolution (preview remains fixed)
              </p>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <button
                onClick={downloadPNG}
                disabled={!qrCodeDataUrl}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:hover:bg-indigo-600"
              >
                <Download className="w-5 h-5" />
                Download PNG ({exportSize}px)
              </button>
              <button
                onClick={downloadSVG}
                disabled={!qrCodeDataUrl || logoFile !== null || useGradient}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:hover:bg-purple-600"
              >
                <Download className="w-5 h-5" />
                Download SVG ({exportSize}px)
              </button>
              {(logoFile || useGradient) && (
                <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                  SVG export unavailable with {logoFile && useGradient ? "logo and gradient" : logoFile ? "logo overlay" : "gradient colors"}
                </p>
              )}
            </div>

            {/* Pro Tips */}
            <div className="mt-6 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="space-y-2 text-xs text-indigo-800 dark:text-indigo-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 dark:bg-indigo-400 flex-shrink-0 mt-1" />
                  <span>Use High (H) error correction with logos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 dark:bg-indigo-400 flex-shrink-0 mt-1" />
                  <span>Test on multiple devices before printing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 dark:bg-indigo-400 flex-shrink-0 mt-1" />
                  <span>Maintain 3:1 contrast ratio minimum</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 dark:bg-indigo-400 flex-shrink-0 mt-1" />
                  <span>Choose 800px+ export size for print materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 dark:bg-indigo-400 flex-shrink-0 mt-1" />
                  <span>Preview shows fixed 320px for stability</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for custom rendering (gradient, rounded dots, logo overlay) */}
      {/* width/height HTML attributes explicitly set to qrSize so the backing store is always square */}
      <canvas
        ref={canvasRef}
        width={qrSize}
        height={qrSize}
        style={{ width: `${qrSize}px`, height: `${qrSize}px`, display: "none" }}
      />
    </div>
  );
}

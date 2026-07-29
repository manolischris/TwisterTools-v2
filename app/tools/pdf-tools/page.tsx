import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileCheck2, ShieldCheck, RefreshCw, Lock, Palette, HelpCircle, FileImage, FileType2, Hash, Edit3, FileCode } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";

export const metadata: Metadata = {
  title: "PDF & Document Utilities",
  description: "Free online PDF tools. Merge PDFs, convert images to PDF, encrypt/decrypt PDFs, and extract text from PDFs locally.",
  alternates: {
    canonical: "https://www.twistertools.com/tools/pdf-tools",
  },
  openGraph: {
    title: "PDF & Document Utilities - TwisterTools",
    description: "Free online PDF tools. Merge PDFs, convert images to PDF, encrypt/decrypt PDFs, and extract text from PDFs locally.",
    url: "https://www.twistertools.com/tools/pdf-tools",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/categories/pdf-tools.jpg",
        width: 1200,
        height: 630,
        alt: "PDF Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF & Document Utilities - TwisterTools",
    description: "Free online PDF tools. Merge PDFs, convert images to PDF, encrypt/decrypt PDFs, and extract text from PDFs locally.",
    images: ["https://www.twistertools.com/images/categories/pdf-tools.jpg"],
  },
};

const pdfMetadata = {
  name: "PDF Tools",
  icon: "FileCheck2",
  description: "Convert, merge, compress, watermark, and organize PDF documents securely in your browser.",
  detailedGuide: "Process and edit your PDF files client-side without uploading them to external servers. High privacy, fast conversion.",
  cards: [
    {
      title: "100% Offline PDF Utilities",
      icon: "ShieldCheck",
      content: "Our PDF tools run entirely within your browser using client-side JavaScript. Your files are processed locally and are never uploaded to any remote servers, maintaining complete confidentiality of sensitive documents."
    },
    {
      title: "Symmetrical Format Conversion",
      icon: "RefreshCw",
      content: "Convert Word documents, text files, and images (JPG, PNG, GIF, BMP, TIFF) to PDF instantly. Convert PDFs to ZIP archives or extract text contents with simple one-click controls."
    },
    {
      title: "Document Protection & Management",
      icon: "Lock",
      content: "Encrypt your PDF documents with secure passwords or remove existing password protections. Merge multiple files into a single unified document or organize and rearrange pages."
    },
    {
      title: "Visual Enhancement & Watermarking",
      icon: "Palette",
      content: "Apply text or image-based watermarks to PDF pages. Adjust transparency, positioning, and rotation to protect your intellectual property before sharing."
    }
  ],
  faqs: [
    {
      q: "Are my PDF files uploaded to your servers for processing?",
      a: "No. All PDF generation, merging, conversion, and watermarking actions are executed locally on your computer's browser thread. No document data is transmitted."
    },
    {
      q: "What is the file size limit for PDF processing?",
      a: "Since conversion runs in the browser, performance is determined by your system's RAM. We recommend processing files under 30 MB for the best experience."
    },
    {
      q: "Is password encryption secure?",
      a: "Yes. PDF locking uses standard AES encryption implemented natively in local WebAssembly modules, ensuring your passwords and documents are secure."
    }
  ]
};

export default function PdfToolsCategoryPage() {
  // Tools are dynamically registered and populated via lib/tools-registry.json.
  // This automatically integrates the 'Lock PDF & Password Encryption' tool entry (lock-pdf).
  const categoryTools = toolsRegistry.filter(
    (tool) => tool.category === "pdf-tools"
  ).map((tool) => {
    if (tool.id === "text-to-pdf") {
      return { ...tool, badge: undefined };
    }
    if (tool.id === "add-pdf-page-numbers") {
      return {
        ...tool,
        title: "Add PDF Page Numbers & Header/Footer Stamps",
        description: "Stamp custom page numbers, headers, and footers onto PDF pages with full alignment and font controls.",
        iconName: "Hash"
      };
    }
    if (tool.id === "pdf-to-png") {
      return {
        ...tool,
        title: "PDF to PNG Converter",
        description: "Extract crisp, high-resolution PNG images from PDF pages with full transparency support and customizable DPI scale.",
        iconName: "FileImage"
      };
    }
    if (tool.id === "html-to-pdf") {
      return {
        ...tool,
        title: "HTML to PDF Webpage Compiler",
        description: "Compile raw HTML code, CSS stylesheets, and DOM layouts into vector PDF files.",
        iconName: "Code"
      };
    }
    if (tool.id === "extract-pdf-images") {
      return {
        ...tool,
        title: "Extract PDF Images",
        description: "Extract embedded raw images and photos from PDF files at full original resolution.",
        iconName: "FileImage"
      };
    }
    if (tool.id === "pdf-metadata-editor") {
      return {
        ...tool,
        title: "PDF Metadata Editor",
        description: "Edit PDF titles, author information, subjects, and keywords client-side.",
        iconName: "Edit3"
      };
    }
    if (tool.id === "crop-pdf") {
      return {
        ...tool,
        title: "Crop PDF Pages",
        description: "Trim margins and crop custom page areas client-side with zero quality loss.",
        iconName: "Crop"
      };
    }
    if (tool.id === "reorder-pdf-pages") {
      return {
        ...tool,
        title: "Reorder & Reverse PDF Pages",
        description: "Organize PDF page sequences, reverse page order, or rotate individual pages.",
        iconName: "ListOrdered"
      };
    }
    if (tool.id === "pdf-to-text") {
      return {
        ...tool,
        title: "PDF to Plain Text Extractor",
        description: "Extract clean plain text from PDF files directly in your web browser.",
        iconName: "FileText"
      };
    }
    if (tool.id === "pdf-to-markdown") {
      return {
        ...tool,
        title: "PDF to Markdown",
        description: "Extract and compile PDF content into clean, structured Markdown text.",
        iconName: "FileCode"
      };
    }
    return tool;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 text-slate-800 dark:text-slate-200">
      {/* Header: Slate-to-Indigo Title Bar */}
      <header className="relative overflow-hidden bg-slate-900 text-white border-b border-indigo-700/50">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/og-hero.jpg"
            alt="TwisterTools Background Visual"
            fill
            priority
            className="object-cover object-center opacity-50 mix-blend-luminosity"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Navigation Breadcrumbs */}
          <div className="flex items-center gap-2 text-indigo-100 text-xs md:text-sm font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors">
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">
              {pdfMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <FileCheck2 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {pdfMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-3xl leading-relaxed">
                {pdfMetadata.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* Dynamic Search grid component */}
        <CategoryToolSearchGrid
          tools={categoryTools}
          categorySlug="pdf-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pdfMetadata.cards.map((card, idx) => {
              // Map dynamic icons
              const CardIcon =
                card.icon === "ShieldCheck" ? ShieldCheck :
                card.icon === "RefreshCw" ? RefreshCw :
                card.icon === "Lock" ? Lock : Palette;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Full-width FAQ SEO Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {pdfMetadata.faqs.map((faq, idx) => (
                <div key={idx} className="space-y-2">
                  <dt className="font-semibold text-slate-900 dark:text-white text-sm">
                    {faq.q}
                  </dt>
                  <dd className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata, NextPage } from "next";
import Link from "next/link";
import { Hash } from "lucide-react";
import AddPdfPageNumbers from "@/components/tools/AddPdfPageNumbers";
import RelatedTools from "@/components/RelatedTools";

export const metadata: Metadata = {
  title: "Add PDF Page Numbers & Header/Footer Stamps | Free Online Tool",
  description:
    "Stamp page numbers, headers, and custom footers on your PDF documents with customizable fonts, colors, and positioning. 100% client-side and free.",
  keywords: [
    "add page numbers to pdf",
    "pdf page number tool",
    "pdf header footer",
    "stamp pdf pages",
    "pdf page numbers",
    "pdf footer tool",
    "pdf header tool",
    "number pdf pages",
    "free pdf page number tool",
    "client-side pdf stamp",
    "twistertools",
  ],
  openGraph: {
    title: "Add PDF Page Numbers & Header/Footer Stamps | TwisterTools",
    description:
      "Stamp page numbers, headers, and custom footers on your PDF documents with customizable fonts, colors, and positioning.",
    url: "https://www.twistertools.com/tools/pdf-tools/add-pdf-page-numbers",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/tools/pdf-tools/add-pdf-page-numbers.jpg",
        width: 1200,
        height: 630,
        alt: "Add PDF Page Numbers & Header/Footer Stamps Tool on TwisterTools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Add PDF Page Numbers & Header/Footer Stamps | TwisterTools",
    description:
      "Stamp page numbers, headers, and custom footers on your PDF documents with customizable fonts, colors, and positioning.",
    images: [
      "https://www.twistertools.com/images/tools/pdf-tools/add-pdf-page-numbers.jpg",
    ],
  },
  alternates: {
    canonical: "https://www.twistertools.com/tools/pdf-tools/add-pdf-page-numbers",
  },
};

const AddPdfPageNumbersPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/tools/pdf-tools"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                PDF & Document Utilities
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white">
                Add PDF Page Numbers & Header/Footer Stamps
              </span>
            </div>

            {/* Tool Title & Description */}
            <div className="flex items-start gap-3 mt-2">
              <div className="w-14 h-14 rounded-2xl flex self-stretch items-center justify-center flex-shrink-0 bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Hash className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  Add PDF Page Numbers & Header/Footer Stamps
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                  Stamp page numbers, headers, and custom footers on your PDF documents with customizable fonts, colors, and positioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Interactive Tool Interface */}
          <AddPdfPageNumbers />

          {/* SEO Content Section */}
          <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <span>How to Add Page Numbers to PDF Documents</span>
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Adding page numbers to PDF documents is essential for professional presentations, academic papers, legal documents, and business reports. Our free online tool lets you stamp page numbers, headers, footers, and custom text onto PDF pages entirely in your browser — no uploads to external servers, no registration, and no file size limits beyond your device's capabilities.
              </p>
              <p>
                Choose from four stamp modes — <strong>Page Numbers</strong> for sequential numbering, <strong>Header</strong> for top-of-page text, <strong>Footer</strong> for bottom-of-page content, or <strong>Custom Text</strong> for watermark-style stamps. Each mode supports full customization including font family (Helvetica, Times Roman, Courier), font size, bold/italic styling, text color, opacity, and precise positioning.
              </p>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <span>Step-by-Step Guide</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { num: "01", title: "Upload Your PDF", body: "Drag and drop a PDF file or click to browse. The tool supports files up to 30 MB and processes them entirely in your browser." },
                { num: "02", title: "Choose a Stamp Mode", body: "Select from Page Numbers, Header, Footer, or Custom Text. Each mode offers unique formatting and positioning options." },
                { num: "03", title: "Configure the Style", body: "Pick font family, size, bold/italic styling, color, opacity, and alignment. Preview changes in real time on any page." },
                { num: "04", title: "Set Positioning", body: "Choose horizontal alignment (left, center, right) and vertical position (top, middle, bottom) with adjustable margins." },
                { num: "05", title: "Preview Before Export", body: "Use the live preview panel to verify stamp placement on any page of your document before finalizing." },
                { num: "06", title: "Download Stamped PDF", body: "Click Download to save your numbered PDF. All processing is local — your files never leave your device." },
              ].map(({ num, title, body }) => (
                <div key={num} className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold tracking-wide">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <span>Common Use Cases</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { title: "Academic Papers & Theses", body: "Add sequential page numbers to research papers, dissertations, and academic submissions that require standardized page numbering formats." },
                { title: "Legal Document Preparation", body: "Stamp page numbers and confidential headers on contracts, affidavits, and legal briefs for professional presentation and easy reference." },
                { title: "Business Reports & Proposals", body: "Enhance corporate documents with custom headers containing company names, document titles, and page numbers for polished branding." },
                { title: "eBook & Manuscript Formatting", body: "Apply consistent page numbering across book manuscripts, eBook drafts, and self-published materials before final production." },
                { title: "Invoice & Receipt Management", body: "Number invoice batches and add footer disclaimers or payment terms to PDF receipts and financial documents." },
                { title: "Document Archiving", body: "When scanning and consolidating paper documents into PDFs, add page numbers and archive reference headers for organized filing." },
              ].map(({ title, body }) => (
                <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-5">
              {[
                {
                  q: "Are my PDF files uploaded to your server for processing?",
                  a: "No. All PDF processing happens locally in your browser using the pdf-lib library. Your files are never uploaded to any server, ensuring complete privacy and confidentiality of your documents.",
                },
                {
                  q: "What stamp modes are available?",
                  a: "The tool offers four modes: Page Numbers (sequential numbering with customizable format), Header (top-of-page text), Footer (bottom-of-page text), and Custom Text (any text at any position, ideal for draft watermarks or confidentiality stamps).",
                },
                {
                  q: "Can I customize fonts and colors?",
                  a: "Yes. Choose from Helvetica, Times Roman, and Courier font families with bold and italic variants. You can set any font size from 6 to 120, pick any text color using the color picker, and adjust opacity for watermark effects.",
                },
                {
                  q: "What page number formats are supported?",
                  a: "You can use formats like 'Page {n}' (Page 1), '{n} / {total}' (1 / 15), '— {n} —', or create custom format strings using {'{n}'} for the current page number and {'{total}'} for the total page count.",
                },
                {
                  q: "Is there a file size limit?",
                  a: "The tool accepts PDF files up to 30 MB. Performance may vary depending on your device's available memory and the complexity of the PDF. Larger files may require more processing time.",
                },
                {
                  q: "Can I adjust the position of the stamps?",
                  a: "Absolutely. Choose horizontal alignment (left, center, or right) and vertical position (top, middle, or bottom). Fine-tune placement with adjustable X and Y margin values for pixel-perfect positioning.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                    {q}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Why Use Our PDF Page Number Tool?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "100% Client-Side Processing", body: "All PDF manipulation happens in your browser with zero server uploads. Your documents remain completely private and confidential." },
                { title: "Multiple Stamp Modes", body: "Four versatile modes — Page Numbers, Header, Footer, and Custom Text — cover every document stamping need." },
                { title: "Full Customization", body: "Control every aspect: font family, size, bold/italic styles, color, opacity, horizontal and vertical positioning with fine-grained margins." },
                { title: "Live Preview", body: "See stamp placement in real time on any page of your document before downloading the final result." },
                { title: "Quick Presets", body: "One-click presets for common configurations: bottom page numbers, page X of Y format, document headers, footers, and draft watermarks." },
                { title: "Completely Free", body: "No registration, no hidden costs, no usage limits. All features including advanced customization are available entirely free." },
              ].map(({ title, body }) => (
                <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-200 flex-shrink-0 mt-1.5"></span>
                  <div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="text-indigo-200 text-sm mt-1 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Social Sharing Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                Found this tool helpful?{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Share it with others!
                </span>
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative group">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://www.twistertools.com/tools/pdf-tools/add-pdf-page-numbers")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1877f2] hover:bg-[#0c63d4] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on Facebook
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>
                <div className="relative group">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://www.twistertools.com/tools/pdf-tools/add-pdf-page-numbers")}&text=${encodeURIComponent("Stamp page numbers, headers, and custom footers on your PDF documents with customizable fonts, colors, and positioning.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X (Twitter)"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1da1f2] hover:bg-[#0c8bd9] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on X
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>
                <div className="relative group">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.twistertools.com/tools/pdf-tools/add-pdf-page-numbers")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0077b5] hover:bg-[#005885] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on LinkedIn
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Tools */}
          <RelatedTools currentSlug="add-pdf-page-numbers" currentCategory="pdf-tools" />
        </div>
      </div>
    </div>
  );
};

export default AddPdfPageNumbersPage;
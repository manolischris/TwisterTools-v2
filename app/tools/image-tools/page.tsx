import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon, ShieldCheck, Minimize2, Palette, Globe, HelpCircle, FileCode } from "lucide-react";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const category = "image-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Image Editing, Compression & Conversion Tools",
    description:
      "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
    keywords: [
      "image compressor",
      "image resizer",
      "heic to jpg",
      "svg converter",
      "favicon generator",
      "base64 to image converter",
      "twistertools"
    ],
    alternates: {
      canonical: "https://www.twistertools.com/tools/image-tools"
    },
    openGraph: {
      title: "Image Editing, Compression & Conversion Tools - TwisterTools",
      description:
        "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
      url: "https://www.twistertools.com/tools/image-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Image Editing, Compression & Conversion Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Image Editing, Compression & Conversion Tools - TwisterTools",
      description:
        "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
      images: [featuredImage],
    },
  };
}

const imageMetadata = {
  name: "Image Editing, Compression & Conversion Tools",
  description:
    "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
  detailedGuide:
    "Crop, resize, compress, and check aspect ratios locally on your device without upload delays.",
  cards: [
    {
      title: "100% Private Local Image Processing",
      icon: "Image",
      content:
        "We run all graphic operations inside your browser's HTML5 Canvas, WebGL, or WebAssembly sandbox. This means your images are never sent to a cloud server, ensuring privacy for personal photos."
    },
    {
      title: "High-Ratio Image Compression",
      icon: "Minimize2",
      content:
        "Reduce image file sizes for PNG, JPG, WebP, and GIF formats. Adjust quality scales, compare file sizes in real-time, and download compressed files with maximum visual clarity."
    },
    {
      title: "SVG Vector Converter & Rasterizer",
      icon: "Palette",
      content:
        "Convert SVG vector files into high-resolution PNG, JPG, or WebP raster formats. Or vectorize simple images into clean vector paths using local canvas edge detection."
    },
    {
      title: "Favicon & PWA Asset Generator",
      icon: "Globe",
      content:
        "Create favicon files (.ico) and PWA icon sets from any image. Export multi-resolution sizes from 16x16 up to 512x512 with proper manifest files in a single zip package."
    }
  ],
  faqs: [
    {
      q: "Are my uploaded photos safe?",
      a: "Absolutely. Images are processed locally on your hardware. We do not run image storage backends, meaning your files are never uploaded or stored online."
    },
    {
      q: "What is HEIC and can I convert it here?",
      a: "HEIC is Apple's high-efficiency image format. Yes, our HEIC-to-JPG tool translates these files directly in the browser so they can be viewed on non-Apple devices."
    },
    {
      q: "Does compressing images reduce their dimensions?",
      a: "Not by default. Compression optimizes color palettes and reduces metadata. However, you can use our Image Resizer card if you wish to adjust the pixel width and height."
    }
  ]
};

export default function ImageToolsCategoryPage() {
  const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
  const toolsRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Array<any>;

  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "image-tools")
    .map((tool) => {
      if (tool.id === "gradient-wallpaper-generator") {
        return {
          ...tool,
          title: "Canvas Color Gradient Generator & High-Res PNG Exporter",
          description: "Design linear, radial, and conic gradients with custom stops and export uncompressed 4K UHD PNG wallpapers.",
          iconName: "Palette"
        };
      }
      if (tool.id === "image-dpi-print-calculator") {
        return {
          ...tool,
          title: "Image DPI to Physical Print Dimension Calculator",
          description: "Convert pixel resolutions to physical paper dimensions across custom DPI densities and human viewing distance thresholds.",
          iconName: "Printer"
        };
      }
      if (tool.id === "base64-to-image-converter") {
        return {
          ...tool,
          title: "Base64 to Image Decoder & Instant PNG/JPG Exporter",
          description: "Decode base64 strings and data URIs into high-resolution PNG, JPG, or WebP files.",
          iconName: "FileCode"
        };
      }
      if (tool.id === "image-to-base64-converter") {
        return {
          ...tool,
          title: "Image to Base64 String Data URI Encoder",
          description: "Encode PNG, JPG, WebP, SVG, and GIF images into RFC 4648 Base64 strings and Data URIs with zero server uploads.",
          iconName: "FileCode"
        };
      }
      return tool;
    })
    .sort((a, b) => {
      const aFeatured = a.isFeatured ? 1 : 0;
      const bFeatured = b.isFeatured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return b.originalIndex - a.originalIndex;
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
          <div className="flex items-center gap-1 text-indigo-100 text-xs md:text-sm font-medium flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link
              href="/"
              className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/tools"
              className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
            >
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              {imageMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {imageMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-full leading-relaxed">
                {imageMetadata.description}
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
          categorySlug="image-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {imageMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "Image"
                  ? ImageIcon
                  : card.icon === "Minimize2"
                  ? Minimize2
                  : card.icon === "Palette"
                  ? Palette
                  : Globe;

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
              {imageMetadata.faqs.map((faq, idx) => (
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

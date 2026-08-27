import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Binary, ShieldCheck, Sigma, HelpCircle } from "lucide-react";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const category = "math-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Math, Geometry & STEM Science Utilities",
    description: "Interactive geometry solvers, physics mechanics formulas, thermodynamic atmospheric calculators, and precision STEM calculation engines.",
    keywords: [
      "geometry calculator",
      "math solver",
      "triangle solver",
      "circle calculator",
      "vector calculator",
      "math tools",
      "stem tools",
      "twistertools"
    ],
    alternates: {
      canonical: "https://www.twistertools.com/tools/math-tools"
    },
    openGraph: {
      title: "Math, Geometry & STEM Science Utilities - TwisterTools",
      description: "Interactive geometry solvers, physics mechanics formulas, thermodynamic atmospheric calculators, and precision STEM calculation engines.",
      url: "https://www.twistertools.com/tools/math-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Math, Geometry & STEM Science Utilities"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "Math, Geometry & STEM Science Utilities - TwisterTools",
      description: "Interactive geometry solvers, physics mechanics formulas, thermodynamic atmospheric calculators, and precision STEM calculation engines.",
      images: [featuredImage]
    }
  };
}

const mathMetadata = {
  name: "Math, Geometry & STEM Science Utilities",
  description: "Interactive geometry solvers, physics mechanics formulas, thermodynamic atmospheric calculators, and precision STEM calculation engines.",
  detailedGuide: "Solve complex STEM problems, compute geometric properties, and run physics or thermodynamics formulas entirely in your browser with high-precision outputs.",
  cards: [
    {
      title: "Precision Geometry & Trigonometry Solvers",
      icon: Binary,
      content: "Compute side lengths, angles, areas, perimeters, and volumes for all standard geometric shapes — triangles, circles, polygons, and 3D solids. All calculations use IEEE 754 double-precision arithmetic with up to 15 significant figures of accuracy."
    },
    {
      title: "Physics Mechanics & Kinematics Engines",
      icon: Sigma,
      content: "Solve classical mechanics problems involving velocity, acceleration, force, torque, momentum, and energy. Enter known variables and instantly compute unknown quantities using fundamental Newtonian physics equations."
    },
    {
      title: "100% Offline & Privacy-First Computation",
      icon: ShieldCheck,
      content: "Every STEM formula, matrix operation, and numeric derivation runs locally on your own hardware using optimized client-side algorithms. No equations, variables, or computed results are transmitted to any server."
    }
  ],
  faqs: [
    {
      q: "Are the calculations performed on a server?",
      a: "No, all mathematics, trigonometry, and graphing calculations run completely client-side in your web browser. No inputs or formulas are sent to our servers, ensuring total privacy."
    },
    {
      q: "What units are supported in the geometric calculators?",
      a: "Our calculators are unit-agnostic. You can input values in meters, feet, inches, centimeters, or any other linear unit, and the resulting area/volume outputs will match in square or cubic versions of those units."
    }
  ]
};

export default function MathToolsCategoryPage() {
  const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
  const toolsRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Array<any>;

  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "math-tools")
    .map((tool) => {
      if (tool.id === "triangle-geometry-calculator") {
        return {
          ...tool,
          title: "Triangle Area, Hypotenuse & Law of Cosines Solver",
          description: "Solve SSS, SAS, ASA, AAS, SSA, and right triangles with real-time SVG geometry plotting and trigonometric proofs.",
          iconName: "Triangle"
        };
      }
      if (tool.id === "circle-geometry-calculator") {
        return {
          ...tool,
          title: "Circle Circumference, Arc Length & Sector Area Calculator",
          description: "Solve circle radius, circumference, area, arc length, chord, and sector parameters with real-time vector visualization.",
          iconName: "Circle"
        };
      }
      if (tool.id === "3d-volume-calculator") {
        return {
          ...tool,
          title: "3D Volume & Surface Area Calculator",
          description: "Calculate volume, total surface area, and fluid capacity for cylinders, cones, and spheres with live 3D visual projection.",
          iconName: "Box"
        };
      }
      if (tool.id === "pythagorean-calculator") {
        return {
          ...tool,
          title: "Pythagorean Theorem & Distance Formula Calculator",
          description: "Solve right triangle hypotenuse, legs, area, perimeter, and compute 2D/3D Euclidean coordinate distances with radical simplification.",
          iconName: "Triangle"
        };
      }
      if (tool.id === "density-mass-volume-calculator") {
        return {
          ...tool,
          title: "Density, Mass & Volume Physical State Calculator",
          description: "Calculate density, mass, and volume with 40+ material presets, specific gravity, and buoyancy simulation.",
          iconName: "Scale"
        };
      }
      if (tool.id === "velocity-acceleration-calculator") {
        return {
          ...tool,
          title: "Velocity, Acceleration & Stopping Distance Calculator",
          description: "Compute braking distance, deceleration G-force, perception reaction, and friction dynamics.",
          iconName: "Gauge"
        };
      }
      if (tool.id === "heat-index-calculator") {
        return {
          ...tool,
          title: "Heat Index, Humidity & Real-Feel Temperature Estimator",
          description: "Calculate NOAA apparent heat index, Canadian Humidex, dew point, and thermal stress danger categories.",
          iconName: "Flame"
        };
      }
      if (tool.id === "wind-chill-calculator") {
        return {
          ...tool,
          title: "Wind Chill & Frostbite Estimator",
          description: "Compute feels-like wind chill index, skin convective heat loss rate, and frostbite onset windows.",
          iconName: "Wind"
        };
      }
      if (tool.id === "dew-point-calculator") {
        return {
          ...tool,
          title: "Dew Point & Relative Humidity Equilibrium Calculator",
          description: "Thermodynamic solver for dew point, relative humidity, vapor pressure deficit (VPD), enthalpy, and surface condensation thresholds.",
          iconName: "Droplets"
        };
      }
      if (tool.id === "decibel-attenuation-calculator") {
        return {
          ...tool,
          title: "Sound Decibel (dB) Distance & Attenuation Calculator",
          description: "Compute decibel attenuation (dB SPL), sound intensity, pressure in Pascals, and OSHA noise exposure limits across distances.",
          iconName: "Volume2"
        };
      }
      if (tool.id === "lightning-distance-calculator") {
        return {
          ...tool,
          title: "Lightning Distance & Thunder Storm Delay Calculator",
          description: "Calculate lightning strike distance from thunder delay with live stopwatch, temperature sound speed tuning, and 30/30 storm safety protocols.",
          iconName: "Zap"
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
              {mathMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Binary className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {mathMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-3xl leading-relaxed">
                {mathMetadata.description}
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
          categorySlug="math-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mathMetadata.cards.map((card, idx) => {
              const CardIcon = card.icon;

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
                  <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
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
              {mathMetadata.faqs.map((faq, idx) => (
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

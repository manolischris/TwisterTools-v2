import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calculator, ShieldCheck, RefreshCw, Lock, Palette, HelpCircle, DollarSign, Percent, Scale, TrendingUp, Info, BookOpen, Building, Car, PiggyBank, Activity, Flame, Droplets, Heart, PieChart } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";

export const metadata: Metadata = {
  title: "Daily Essentials, Financial & Math Calculators",
  description: "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
  keywords: ["financial calculators", "investment tools", "math calculators", "loan estimators", "unit converters"],
  alternates: {
    canonical: "https://www.twistertools.com/tools/calculators",
  },
  openGraph: {
    title: "Daily Essentials, Financial & Math Calculators - TwisterTools",
    description: "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
    url: "https://www.twistertools.com/tools/calculators",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/categories/calculators.jpg",
        width: 1200,
        height: 630,
        alt: "Daily Essentials, Financial & Math Calculators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Essentials, Financial & Math Calculators - TwisterTools",
    description: "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
    images: ["https://www.twistertools.com/images/categories/calculators.jpg"],
  },
};

const calculatorMetadata = {
  name: "Daily Essentials, Financial & Math Calculators",
  icon: "Calculator",
  description: "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
  detailedGuide: "Run heavy mathematical calculations, date counts, and numerical evaluations in real-time with instant outputs.",
  cards: [
    {
      title: "High-Precision Math Computations",
      icon: "Calculator",
      content: "Our math suite handles chronological date differences, statistical metrics, percentages, and multi-domain conversions. We utilize advanced rounding techniques to avoid common floating-point bugs in JavaScript."
    },
    {
      title: "Statistical Data Set Analysis",
      icon: "Cpu",
      content: "Calculate mean, median, mode, variance, and standard deviation for datasets. Enter raw numbers or comma-separated lists, and get complete statistical breakdowns with detailed visualization formulas."
    },
    {
      title: "Chronological Date & Time Calculations",
      icon: "Clock",
      content: "Find exact ages down to the day, count elapsed days between dates, and see upcoming milestones. Perfect for scheduling, tracking project durations, or historical dates."
    },
    {
      title: "AdSense & Revenue Estimation Tools",
      icon: "Layers",
      content: "Determine business expenses, discounted rates, sales tax percentages, or Google AdSense earnings. Quickly calculate gross/net profit margins and test stacked promotions."
    }
  ],
  faqs: [
    {
      q: "Are calculations computed on a server?",
      a: "No. All equations, unit translations, and statistics are calculated by your local device's processor using client-side JavaScript, ensuring speed and confidentiality."
    },
    {
      q: "How does the Unit Converter handle precision?",
      a: "It converts values using precise scale factors. Results are displayed with up to 10 decimal places, preventing round-off error during multi-unit conversions."
    },
    {
      q: "Can I use these calculators on my phone?",
      a: "Yes. All calculators are designed with fully responsive grid layouts that adapt perfectly to touch screens, tablets, and desktop computers."
    }
  ]
};

export default function CalculatorsCategoryPage() {
  const categoryTools = toolsRegistry.filter(
    (tool) => tool.category === "calculators"
  ).map((tool) => {
    if (tool.id === "investment-calculator") {
      return {
        ...tool,
        title: "Compound Investment & Return Calculator",
        description: "Project future portfolio growth, compounding yields, and monthly contribution targets.",
        iconName: "TrendingUp"
      };
    }
    if (tool.id === "compound-interest-calculator") {
      return {
        ...tool,
        title: "Compound Interest & Growth Calculator",
        description: "Simulate exponential capital accumulation with variable compounding frequencies, continuous yield calculations, and real purchasing power modeling.",
        iconName: "TrendingUp"
      };
    }
    if (tool.id === "simple-interest-calculator") {
      return {
        ...tool,
        title: "Simple Interest & Loan Calculator",
        description: "Compute simple interest, total payback balances, and generate clear payment breakdowns instantly.",
        iconName: "Calculator"
      };
    }
    if (tool.id === "mortgage-calculator") {
      return {
        ...tool,
        title: "Mortgage Payment & Amortization Schedule",
        description: "Calculate exact monthly mortgage payments, generate detailed amortization schedules, and evaluate the impact of extra payments.",
        iconName: "Building"
      };
    }
    if (tool.id === "auto-loan-calculator") {
      return {
        ...tool,
        title: "Auto Loan & Monthly Payment Estimator",
        description: "Calculate auto loan payments, trade-in tax credits, dealer fees, and amortization schedules.",
        iconName: "Car"
      };
    }
    if (tool.id === "loan-payoff-calculator") {
      return {
        ...tool,
        title: "Loan Payoff & Debt Reduction Calculator",
        description: "Calculate payoff timelines, interest savings, and lump-sum impact to accelerate debt elimination.",
        iconName: "Calculator"
      };
    }
    if (tool.id === "retirement-calculator") {
      return {
        ...tool,
        title: "Retirement Savings & Nest Egg Planner",
        description: "Calculate projected retirement nest egg, employer match compounding, and 4% rule safe withdrawal rates.",
        iconName: "PiggyBank"
      };
    }
    if (tool.id === "inflation-calculator") {
      return {
        ...tool,
        title: "Inflation Rate & Purchasing Power Calculator",
        description: "Calculate future money value, CPI decay, and real purchasing power erosion.",
        iconName: "TrendingUp"
      };
    }
    if (tool.id === "roi-calculator") {
      return {
        ...tool,
        title: "ROI Calculator",
        description: "Calculate simple ROI, annualized return (CAGR), net profit, and investment performance across stocks and real estate.",
        iconName: "TrendingUp"
      };
    }
    if (tool.id === "break-even-calculator") {
      return {
        ...tool,
        title: "Break-Even Point Calculator",
        description: "Calculate unit break-even points, contribution margins, and target profit volume.",
        iconName: "Scale"
      };
    }
    if (tool.id === "margin-calculator") {
      return {
        ...tool,
        title: "Margin & Markup Calculator",
        description: "Calculate profit margin, markup percentage, gross selling price, and gross profit instantly.",
        iconName: "Calculator"
      };
    }
    if (tool.id === "salary-calculator") {
      return {
        ...tool,
        title: "Salary & Hourly Paycheck Converter",
        description: "Convert annual salary to hourly rate and calculate net take-home pay across bi-weekly, monthly, and weekly schedules.",
        iconName: "Calculator"
      };
    }
    if (tool.id === "net-worth-calculator") {
      return {
        ...tool,
        title: "Net Worth Calculator",
        description: "Track assets, evaluate liabilities, and calculate your true net worth with dynamic portfolio breakdowns.",
        iconName: "Scale"
      };
    }
    if (tool.id === "tip-calculator") {
      return {
        ...tool,
        title: "Tip & Bill Splitter Calculator",
        description: "Calculate restaurant tips, sales tax, and group bill splits with itemized individual breakdowns.",
        iconName: "Calculator"
      };
    }
    if (tool.id === "bmi-calculator") {
      return {
        ...tool,
        title: "BMI & Body Composition Calculator",
        description: "Calculate BMI, ideal weight targets, estimated body fat %, BMR, and TDEE.",
        iconName: "Activity"
      };
    }
    if (tool.id === "tdee-calculator") {
      return {
        ...tool,
        title: "Calorie & Daily Energy Expenditure (TDEE) Calculator",
        description: "Calculate your Total Daily Energy Expenditure (TDEE), Basal Metabolic Rate (BMR), and custom caloric goals.",
        iconName: "Flame"
      };
    }
    if (tool.id === "body-fat-calculator") {
      return {
        ...tool,
        title: "Body Fat Percentage & Lean Mass Calculator",
        description: "Calculate body fat percentage, lean body mass, and ACE fitness categories with tape measurements.",
        iconName: "Percent"
      };
    }
    if (tool.id === "water-intake-calculator") {
      return {
        ...tool,
        title: "Water Intake & Hydration Calculator",
        description: "Calculate personalized daily water intake in liters and fl oz based on weight, exercise, climate, and health factors.",
        iconName: "Droplets"
      };
    }
    if (tool.id === "ideal-weight-calculator") {
      return {
        ...tool,
        title: "Ideal Body Weight Calculator",
        description: "Calculate clinical ideal body weight using Devine, Robinson, Miller, and Hamwi formulas with healthy BMI ranges.",
        iconName: "Scale"
      };
    }
    if (tool.id === "heart-rate-calculator") {
      return {
        ...tool,
        title: "Target Heart Rate Zone Calculator",
        description: "Calculate personal target heart rate zones for fat loss, cardiovascular endurance, and athletic performance using Karvonen and Tanaka formulas.",
        iconName: "Heart"
      };
    }
    if (tool.id === "macro-calculator") {
      return {
        ...tool,
        title: "Macro Ratio & Flexible Dieting Calculator",
        description: "Calculate accurate macro ratios (protein, carbs, fats) for fat loss, muscle gain, or ketogenic diets.",
        iconName: "PieChart"
      };
    }
    return tool;
  }).sort((a, b) => {
    const aFeatured = a.isFeatured ? 1 : 0;
    const bFeatured = b.isFeatured ? 1 : 0;
    return bFeatured - aFeatured;
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
            <Link href="/" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              {calculatorMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Calculator className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {calculatorMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-3xl leading-relaxed">
                {calculatorMetadata.description}
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
          categorySlug="calculators"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {calculatorMetadata.cards.map((card, idx) => {
              // Map dynamic icons
              const CardIcon =
                card.icon === "Calculator" ? Calculator :
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
              {calculatorMetadata.faqs.map((faq, idx) => (
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

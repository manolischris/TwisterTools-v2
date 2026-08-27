import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calculator, CreditCard, ShieldCheck, RefreshCw, Lock, Palette, HelpCircle, DollarSign, Percent, Scale, TrendingUp, Info, BookOpen, Building, Car, PiggyBank, Activity, Flame, Droplets, Heart, PieChart, Baby, Calendar, Wine, Binary, Grid, ArrowRightLeft, Home, Wallet, Fuel, Zap, Footprints, Timer, Dog, Cat } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const category = "calculators";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
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
          url: featuredImage,
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
      images: [featuredImage],
    },
  };
}

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
  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "calculators")
    .map((tool) => {
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
    if (tool.id === "down-payment-calculator") {
      return {
        ...tool,
        title: "Down Payment Savings & Timeline Planner",
        description: "Calculate down payment targets, savings timelines, HYSA compound growth, and closing cost requirements.",
        iconName: "Home"
      };
    }
    if (tool.id === "emergency-fund-calculator") {
      return {
        ...tool,
        title: "Emergency Fund & Monthly Expense Buffer Calculator",
        description: "Determine your essential monthly burn rate, cash runway, and months to build a complete emergency fund.",
        iconName: "ShieldCheck"
      };
    }
    if (tool.id === "car-lease-vs-buy-calculator") {
      return {
        ...tool,
        title: "Car Lease vs Buy Calculator",
        description: "Calculate total cost of ownership, loan amortization vs lease payments, equity retention, and depreciation.",
        iconName: "Car"
      };
    }
    if (tool.id === "subscription-cost-calculator") {
      return {
        ...tool,
        title: "Subscription Audit & Expense Aggregator",
        description: "Audit recurring SaaS, streaming, and membership fees to calculate annual spend leaks and opportunity cost.",
        iconName: "Wallet"
      };
    }
    if (tool.id === "freelance-rate-calculator") {
      return {
        ...tool,
        title: "Freelance Rate & Overhead Calculator",
        description: "Calculate sustainable hourly rates, day rates, monthly retainers, tax reserves, and overhead costs.",
        iconName: "Calculator"
      };
    }
    if (tool.id === "rent-vs-buy-calculator") {
      return {
        ...tool,
        title: "Home Rent vs Buy Break-Even Calculator",
        description: "Compare total homeownership costs against renting and index fund investing to find your exact wealth break-even year.",
        iconName: "Scale"
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
    if (tool.id === "gpa-calculator") {
      return {
        ...tool,
        title: "GPA & Grade Point Average Calculator",
        description: "Compute term and cumulative GPA across 4.0, 4.3, and 5.0 weighted grading scales with target planner.",
        iconName: "GraduationCap"
      };
    }
    if (tool.id === "final-grade-calculator") {
      return {
        ...tool,
        title: "Grade & Exam Score Needed Calculator",
        description: "Calculate the exact score needed on your final exam to reach your target class grade.",
        iconName: "GraduationCap"
      };
    }
    if (tool.id === "apy-to-apr-calculator") {
      return {
        ...tool,
        title: "APY to APR Calculator",
        description: "Convert APY to APR and APR to APY across daily, monthly, quarterly, and continuous compounding schedules.",
        iconName: "ArrowRightLeft"
      };
    }
    if (tool.id === "credit-card-payoff-calculator") {
      return {
        ...tool,
        title: "Credit Card Payoff Calculator",
        description: "Simulate credit card payoff schedules, compare minimum payments vs accelerated plans, and calculate interest savings.",
        iconName: "CreditCard"
      };
    }
    if (tool.id === "fuel-cost-calculator") {
      return {
        ...tool,
        title: "Fuel Trip Cost & Mileage Expense Estimator",
        description: "Calculate gas expenses, road trip costs, passenger fare splits, highway tolls, and standard tax mileage reimbursements.",
        iconName: "Fuel"
      };
    }
    if (tool.id === "electricity-cost-calculator") {
      return {
        ...tool,
        title: "Electricity Appliance Running Cost & kWh Estimator",
        description: "Calculate running costs, kilowatt-hour (kWh) electricity consumption, and utility bill impact for home appliances with customizable utility tariff rates.",
        iconName: "Zap"
      };
    }
    if (tool.id === "unit-price-calculator") {
      return {
        ...tool,
        title: "Unit Price & Grocery Bulk Savings Calculator",
        description: "Standardize weights, volumes, and multipacks to expose real grocery savings.",
        iconName: "Scale"
      };
    }
    if (tool.id === "rule-of-72-calculator") {
      return {
        ...tool,
        title: "Rule of 72 Investment Doubling Time Calculator",
        description: "Calculate how many years it takes to double your investment or find the required annual rate of return.",
        iconName: "TrendingUp"
      };
    }
    if (tool.id === "mortgage-refinance-calculator") {
      return {
        ...tool,
        title: "Mortgage Refinance & Break-Even Calculator",
        description: "Evaluate break-even timelines, monthly payment changes, and lifetime interest savings for home loan refinancing.",
        iconName: "Home"
      };
    }
    return tool;
  }).sort((a, b) => {
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
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Navigation Breadcrumbs */}
          <div className="flex items-center gap-1 text-indigo-100 text-xs md:text-sm font-medium flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link href="/" className="hover:text-white transition-colors max-w-32.5 sm:max-w-50 md:max-w-none truncate">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors max-w-32.5 sm:max-w-50 md:max-w-none truncate">
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-32.5 sm:max-w-50 md:max-w-none truncate">
              {calculatorMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 shrink-0">
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
                card.icon === "Binary" ? Binary :
                card.icon === "Grid" ? Grid :
                card.icon === "ShieldCheck" ? ShieldCheck :
                card.icon === "RefreshCw" ? RefreshCw :
                card.icon === "Lock" ? Lock :
                card.icon === "Calendar" ? Calendar : Palette;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
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
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
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

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ShieldCheck, Timer, Clock, Layers, HelpCircle, CalendarDays, Hash, Sunrise, Moon, Globe, Flame, GraduationCap, Sun } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const category = "date-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Date, Time & Scheduling Tools",
    description: "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
    keywords: ["days between dates", "timezone converter", "workday calculator", "countdown timer", "date calculator"],
    alternates: {
      canonical: "https://www.twistertools.com/tools/date-tools",
    },
    openGraph: {
      title: "Date, Time & Scheduling Tools - TwisterTools",
      description: "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
      url: "https://www.twistertools.com/tools/date-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Date, Time & Scheduling Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Date, Time & Scheduling Tools - TwisterTools",
      description: "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
      images: [featuredImage],
    },
  };
}

const dateMetadata = {
  name: "Date, Time & Scheduling Tools",
  icon: "Calendar",
  description: "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
  detailedGuide: "Perform date calculations, convert timezones, count working days, or generate countdown timers locally in your browser session with zero server uploads.",
  cards: [
    {
      title: "100% Offline Date & Time Math",
      icon: "ShieldCheck",
      content: "All calculations, timezone offsets, and duration counting happen completely locally within your browser tab. We never transmit your calendar entries, event details, or scheduling calculations to any server."
    },
    {
      title: "High Precision Chronological Engines",
      icon: "Timer",
      content: "Our date engines strictly comply with ISO-8601 week specifications, standard Gregorian leap year rule sets, and global daylight saving transition database guidelines. Avoid manual calculation errors with custom roundings."
    },
    {
      title: "Event Countdowns & Scheduling Utilities",
      icon: "Clock",
      content: "Easily plan projects or track personal milestones. Convert UTC times to local time zones in real-time, generate custom countdown widget timers, and compute net business workdays in seconds."
    },
    {
      title: "Zero Account Sign-ups Required",
      icon: "Layers",
      content: "No subscription plans or account configurations are necessary. Load the date tools and start calculating immediately on any desktop or mobile device."
    }
  ],
  faqs: [
    {
      q: "Are my schedules or event dates sent to a server?",
      a: "No. All date, timezone, and calendar math is calculated purely client-side on your own CPU in real-time."
    },
    {
      q: "Does the workday calculator account for holidays?",
      a: "Yes. Our upcoming workday utilities support custom configurations so you can toggle local public holiday calendars and weekend schedules."
    },
    {
      q: "Does the timezone converter adjust for daylight saving transitions?",
      a: "Yes. It leverages native browser Internationalization APIs (Intl) and timezone offset registries to correctly calculate DST changes."
    }
  ]
};

export default function DateToolsCategoryPage() {
  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "date-tools")
    .map((tool) => {
      if (tool.id === "leap-year-checker") {
        return {
          ...tool,
          title: "Leap Year Checker",
          description: "Instantly check leap years, century leap rules, and date range schedules.",
          iconName: "Calendar",
        };
      }
      if (tool.id === "day-of-week-calculator") {
        return {
          ...tool,
          title: "Day of the Week Calculator",
          description: "Determine the exact day of the week for any past, present, or future calendar date instantly.",
          iconName: "CalendarDays",
        };
      }
      if (tool.id === "week-number-calculator") {
        return {
          ...tool,
          title: "Week Number Calculator (ISO-8601)",
          description: "Calculate ISO-8601 week numbers, week date ranges, and annual week metrics.",
          iconName: "Hash",
        };
      }
      if (tool.id === "countdown-timer-generator") {
        return {
          ...tool,
          title: "Event Countdown Timer Generator",
          description: "Create customizable, embeddable countdown timers for launches, sales, and events.",
          iconName: "Timer",
        };
      }
      if (tool.id === "sunrise-sunset-calculator") {
        return {
          ...tool,
          title: "Sunrise & Sunset Time Estimator",
          description: "Calculate accurate sunrise, sunset, twilight phases, golden hour, and daylight duration for any coordinates.",
          iconName: "Sunrise",
        };
      }
      if (tool.id === "moon-phase-calculator") {
        return {
          ...tool,
          title: "Moon Phase Calendar & Visualizer",
          description: "Calculate accurate lunar phases, illumination percentages, moon age, distance, and monthly lunar calendar views.",
          iconName: "Moon",
        };
      }
      if (tool.id === "pomodoro-timer") {
        return {
          ...tool,
          title: "Pomodoro Interval Timer & Work Sprint Visualizer",
          description: "Circadian focus sprint intervals, task batching, and flow state ergonomics.",
          iconName: "Timer",
        };
      }
      if (tool.id === "meeting-timezone-scheduler") {
        return {
          ...tool,
          title: "Meeting Overlap & Multi-Timezone Scheduler",
          description: "Find perfect cross-timezone meeting overlaps, schedule remote team calls across international working hours, and export ICS calendar invites.",
          iconName: "Globe",
        };
      }
      if (tool.id === "employee-timesheet-calculator") {
        return {
          ...tool,
          title: "Employee Timesheet & Overtime Pay Calculator",
          description: "Calculate daily and weekly work hours, lunch break deductions, overtime (1.5x), California daily double time (2.0x), and export payroll CSVs.",
          iconName: "Clock",
        };
      }
      if (tool.id === "fte-calculator") {
        return {
          ...tool,
          title: "Work Hours to Full-Time Equivalent (FTE) Calculator",
          description: "Convert part-time hours, shifts, and team rosters into standardized Full-Time Equivalents (FTE), ACA employer mandates, and payroll metrics.",
          iconName: "Calculator",
        };
      }
      if (tool.id === "solar-noon-angle-calculator") {
        return {
          ...tool,
          title: "Solar Noon, Solar Zenith & Sun Path Angle Estimator",
          description: "Calculate exact solar noon culmination time, solar zenith, altitude, azimuth angles, and daylight hours with NOAA precision.",
          iconName: "Sun",
        };
      }
      if (tool.id === "julian-date-converter") {
        return {
          ...tool,
          title: "Julian Day & Astronomical Modified Julian Date Converter",
          description: "Convert between calendar dates, Julian Day (JD), Modified Julian Date (MJD), Reduced Julian Date (RJD), and Sidereal Time (GMST) with precision astronomical epoch calculations.",
          iconName: "Sun",
        };
      }
      if (tool.id === "habit-streak-calculator") {
        return {
          ...tool,
          title: "Habit Tracker Streak & Target Goal Probability Calculator",
          description: "Forecast habit streak durability, calculate target milestone probabilities, and track 66-day automaticity metrics using UCL behavioral modeling.",
          iconName: "Flame",
        };
      }
      if (tool.id === "recurring-bill-calculator") {
        return {
          ...tool,
          title: "Bill Due Date & Recurring Cycle Schedule Calculator",
          description: "Forecast future bill due dates, weekend business-day shifts, and annualized cash flow for subscriptions and recurring payments.",
          iconName: "CalendarDays",
        };
      }
      if (tool.id === "graduation-date-calculator") {
        return {
          ...tool,
          title: "School Semester & College Graduation Date Estimator",
          description: "Estimate degree completion dates, credit roadmaps, and semester pacing for college and school.",
          iconName: "GraduationCap",
        };
      }
      if (tool.id === "solar-lunar-eclipse-finder") {
        return {
          ...tool,
          title: "Next Solar & Lunar Eclipse Visibility Explorer",
          description: "Interactive astronomical trajectory explorer for upcoming solar and lunar eclipses, totality paths, and visibility zones.",
          iconName: "Sun",
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
            <Link href="/" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              {dateMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {dateMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-full leading-relaxed">
                {dateMetadata.description}
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
          categorySlug="date-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {dateMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "ShieldCheck" ? ShieldCheck :
                card.icon === "Timer" ? Timer :
                card.icon === "Clock" ? Clock : Layers;

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
              {dateMetadata.faqs.map((faq, idx) => (
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

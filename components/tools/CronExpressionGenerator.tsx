"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Terminal,
  Cpu,
  Table,
  Workflow,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Info,
} from "lucide-react";
import Script from "next/script";

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Cron Expression Generator & Explainer",
  "description": "Generate, validate, and parse Unix cron schedule strings into human-readable English text instructions instantly with next execution milestone matrices.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires HTML5 Canvas and JavaScript execution capability.",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Interactive UI configuration builders",
    "Instant English translation parsing maps",
    "Next 5 scheduled execution date matrix tracking",
    "100% secure client-side sandbox execution topology",
    "Comprehensive production crontab preset reference matrix"
  ]
};

// ─────────────────────────────────────────────────────────────
//  Type Definitions
// ─────────────────────────────────────────────────────────────
type Preset = {
  name: string;
  expression: string;
  description: string;
};

type FieldMode = "all" | "step" | "range" | "specific";

// ─────────────────────────────────────────────────────────────
//  Presets Data
// ─────────────────────────────────────────────────────────────
const CRON_PRESETS: Preset[] = [
  { name: "Every Minute", expression: "* * * * *", description: "Run at the start of every single minute." },
  { name: "Every 5 Minutes", expression: "*/5 * * * *", description: "Run at minute 0, 5, 10, 15, etc." },
  { name: "Every 15 Minutes", expression: "*/15 * * * *", description: "Run at minute 0, 15, 30, and 45." },
  { name: "Hourly (On the Hour)", expression: "0 * * * *", description: "Run once an hour at the top of the hour." },
  { name: "Daily at Midnight", expression: "0 0 * * *", description: "Run once a day at 12:00 AM." },
  { name: "Daily at Noon", expression: "0 12 * * *", description: "Run once a day at 12:00 PM." },
  { name: "Weekly on Sunday", expression: "0 0 * * 0", description: "Run once a week at midnight on Sunday." },
  { name: "Weekdays at 9 AM", expression: "0 9 * * 1-5", description: "Run at 9:00 AM, Monday through Friday." },
  { name: "Monthly (1st of Month)", expression: "0 0 1 * *", description: "Run at midnight on the first day of every month." },
  { name: "Yearly (Jan 1st)", expression: "0 0 1 1 *", description: "Run at midnight on January 1st." },
];

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─────────────────────────────────────────────────────────────
//  Validation & Parsing Helper functions
// ─────────────────────────────────────────────────────────────
function validateCron(cron: string): { isValid: boolean; error?: string } {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { isValid: false, error: "Expression must have exactly 5 fields (Minute, Hour, Day of Month, Month, Day of Week)" };
  }

  const [min, hour, dom, mon, dow] = parts;

  const validateField = (
    field: string,
    minVal: number,
    maxVal: number,
    name: string,
    aliases?: string[]
  ): string | null => {
    if (field === "*" || field === "?") return null;

    const items = field.split(",");
    for (const item of items) {
      if (item === "") return `Invalid empty value in list for ${name}`;

      if (item.includes("/")) {
        const [range, stepStr] = item.split("/");
        if (!stepStr || isNaN(parseInt(stepStr, 10)) || parseInt(stepStr, 10) <= 0) {
          return `Invalid step increment "${stepStr}" for ${name}`;
        }
        if (range !== "*") {
          const rangeErr = validateRange(range, minVal, maxVal, name, aliases);
          if (rangeErr) return rangeErr;
        }
        continue;
      }

      const rangeErr = validateRange(item, minVal, maxVal, name, aliases);
      if (rangeErr) return rangeErr;
    }

    return null;
  };

  const validateRange = (
    item: string,
    minVal: number,
    maxVal: number,
    name: string,
    aliases?: string[]
  ): string | null => {
    if (item.includes("-")) {
      const [startStr, endStr] = item.split("-");
      if (!startStr || !endStr) return `Invalid range format "${item}" for ${name}`;
      
      const start = parsePart(startStr, aliases);
      const end = parsePart(endStr, aliases);

      if (start === null || isNaN(start) || start < minVal || start > maxVal) {
        return `Start value "${startStr}" out of bounds for ${name} (must be ${minVal}-${maxVal})`;
      }
      if (end === null || isNaN(end) || end < minVal || end > maxVal) {
        return `End value "${endStr}" out of bounds for ${name} (must be ${minVal}-${maxVal})`;
      }
      if (start > end) {
        return `Start value must be less than or equal to end value in range "${item}" for ${name}`;
      }
      return null;
    }

    const val = parsePart(item, aliases);
    if (val === null || isNaN(val) || val < minVal || val > maxVal) {
      return `Value "${item}" out of bounds for ${name} (must be ${minVal}-${maxVal})`;
    }
    return null;
  };

  const parsePart = (valStr: string, aliases?: string[]): number | null => {
    const num = parseInt(valStr, 10);
    if (!isNaN(num)) return num;

    if (aliases) {
      const idx = aliases.findIndex(a => a.toLowerCase() === valStr.toLowerCase());
      if (idx !== -1) {
        return aliases === MONTH_NAMES ? idx + 1 : idx;
      }
    }
    return null;
  };

  const minErr = validateField(min, 0, 59, "Minutes");
  if (minErr) return { isValid: false, error: minErr };

  const hourErr = validateField(hour, 0, 23, "Hours");
  if (hourErr) return { isValid: false, error: hourErr };

  const domErr = validateField(dom, 1, 31, "Day of Month");
  if (domErr) return { isValid: false, error: domErr };

  const monErr = validateField(mon, 1, 12, "Month", MONTH_NAMES);
  if (monErr) return { isValid: false, error: monErr };

  const dowErr = validateField(dow, 0, 7, "Day of Week", DAY_NAMES);
  if (dowErr) return { isValid: false, error: dowErr };

  return { isValid: true };
}

function translateCron(cron: string): string {
  const validation = validateCron(cron);
  if (!validation.isValid) {
    return "Invalid expression: " + validation.error;
  }

  const parts = cron.trim().split(/\s+/);
  const [min, hour, dom, mon, dow] = parts;

  const MONTHS_FULL = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const getOrdinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatList = (items: string[]): string => {
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  };

  const translatePart = (
    field: string,
    name: 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'
  ): string => {
    if (field === '*' || field === '?') {
      if (name === 'minute') return 'every minute';
      if (name === 'hour') return 'every hour';
      if (name === 'dayOfMonth') return 'every day';
      if (name === 'month') return 'every month';
      if (name === 'dayOfWeek') return 'every day of the week';
    }

    if (field.startsWith('*/')) {
      const step = parseInt(field.slice(2), 10);
      if (name === 'minute') return `every ${step} minutes`;
      if (name === 'hour') return `every ${step} hours`;
      if (name === 'dayOfMonth') return `every ${step} days`;
      if (name === 'month') return `every ${step} months`;
      if (name === 'dayOfWeek') return `every ${step} days of the week`;
    }

    const items = field.split(',');
    const translatedItems = items.map(item => {
      if (item.includes('/')) {
        const [range, stepStr] = item.split('/');
        const step = parseInt(stepStr, 10);
        if (range === '*') {
          return `every ${step} units`;
        }
        return `every ${step} units in range ${range}`;
      }

      if (item.includes('-')) {
        const [startStr, endStr] = item.split('-');
        if (name === 'month') {
          const start = isNaN(parseInt(startStr, 10)) ? startStr : MONTHS_FULL[parseInt(startStr, 10)];
          const end = isNaN(parseInt(endStr, 10)) ? endStr : MONTHS_FULL[parseInt(endStr, 10)];
          return `${start} through ${end}`;
        }
        if (name === 'dayOfWeek') {
          const start = isNaN(parseInt(startStr, 10)) ? startStr : DAYS_FULL[parseInt(startStr, 10)];
          const end = isNaN(parseInt(endStr, 10)) ? endStr : DAYS_FULL[parseInt(endStr, 10)];
          return `${start} through ${end}`;
        }
        return `${startStr} through ${endStr}`;
      }

      // Single value
      if (name === 'month') {
        const val = parseInt(item, 10);
        return isNaN(val) ? item : MONTHS_FULL[val];
      }
      if (name === 'dayOfWeek') {
        const val = parseInt(item, 10);
        return isNaN(val) ? item : DAYS_FULL[val];
      }
      if (name === 'minute') {
        return `minute ${item}`;
      }
      if (name === 'hour') {
        return `hour ${item}`;
      }
      if (name === 'dayOfMonth') {
        return `the ${getOrdinal(parseInt(item, 10))} day`;
      }
      return item;
    });

    const listStr = formatList(translatedItems);
    if (name === 'minute') return `at ${listStr}`;
    if (name === 'hour') return `at ${listStr}`;
    if (name === 'dayOfMonth') return `on ${listStr} of the month`;
    if (name === 'month') return `in ${listStr}`;
    if (name === 'dayOfWeek') return `on ${listStr}`;
    return listStr;
  };

  let minText = translatePart(min, 'minute');
  if (min === '*') minText = 'every minute';
  else if (min.startsWith('*/')) {
    const step = parseInt(min.slice(2), 10);
    minText = `every ${getOrdinal(step)} minute`;
  }

  let hourText = translatePart(hour, 'hour');
  if (hour === '*') hourText = 'of every hour';
  else if (hour.startsWith('*/')) {
    const step = parseInt(hour.slice(2), 10);
    hourText = `every ${step} hours`;
  } else {
    hourText = hourText.replace('at ', 'past ');
  }

  let domText = translatePart(dom, 'dayOfMonth');
  if (dom === '*') domText = '';
  
  let monText = translatePart(mon, 'month');
  if (mon === '*') monText = 'of every month';

  let dowText = translatePart(dow, 'dayOfWeek');
  if (dow === '*') dowText = '';

  let sentence = '';
  if (min === '0' && hour !== '*' && !hour.includes(',') && !hour.includes('-') && !hour.includes('/')) {
    const hNum = parseInt(hour, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    sentence = `At ${pad(hNum)}:00`;
  } else if (!min.includes(',') && !min.includes('-') && !min.includes('/') && min !== '*' && !hour.includes(',') && !hour.includes('-') && !hour.includes('/') && hour !== '*') {
    const hNum = parseInt(hour, 10);
    const mNum = parseInt(min, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    sentence = `At ${pad(hNum)}:${pad(mNum)}`;
  } else {
    sentence = `At ${minText} ${hourText}`;
  }

  if (domText) {
    sentence += ` ${domText}`;
  }
  if (monText) {
    if (domText) sentence += ` ${monText}`;
    else sentence += ` of every month`;
  }

  if (dowText) {
    sentence += ` ${dowText}`;
  }

  sentence = sentence.replace(/\s+/g, ' ').trim();
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  if (!sentence.endsWith('.')) sentence += '.';

  return sentence;
}

function getNextExecutions(cronExpr: string, count = 5): Date[] {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minPart, hourPart, domPart, monthPart, dowPart] = parts;

  function parseField(part: string, minVal: number, maxVal: number, altNames?: Record<string, number>): Set<number> | null {
    if (part === '*' || part === '?') return null;
    const result = new Set<number>();
    
    let cleaned = part;
    if (altNames) {
      for (const [name, val] of Object.entries(altNames)) {
        cleaned = cleaned.replace(new RegExp(name, 'gi'), String(val));
      }
    }

    const items = cleaned.split(',');
    for (const item of items) {
      if (item.includes('/')) {
        const [range, stepStr] = item.split('/');
        const step = parseInt(stepStr, 10);
        let start = minVal;
        let end = maxVal;
        if (range !== '*') {
          if (range.includes('-')) {
            const [rStart, rEnd] = range.split('-');
            start = parseInt(rStart, 10);
            end = parseInt(rEnd, 10);
          } else {
            start = parseInt(range, 10);
          }
        }
        for (let i = start; i <= end; i += step) {
          if (i >= minVal && i <= maxVal) result.add(i);
        }
      } else if (item.includes('-')) {
        const [startStr, endStr] = item.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        for (let i = start; i <= end; i++) {
          if (i >= minVal && i <= maxVal) result.add(i);
        }
      } else {
        const val = parseInt(item, 10);
        if (!isNaN(val) && val >= minVal && val <= maxVal) {
          result.add(val);
        }
      }
    }
    return result;
  }

  const MONTH_ALIASES = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  const DOW_ALIASES = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

  const validMinutes = parseField(minPart, 0, 59);
  const validHours = parseField(hourPart, 0, 23);
  const validDom = parseField(domPart, 1, 31);
  const validMonths = parseField(monthPart, 1, 12, MONTH_ALIASES);
  
  const dowRaw = parseField(dowPart, 0, 7, DOW_ALIASES);
  let validDow: Set<number> | null = null;
  if (dowRaw) {
    validDow = new Set<number>();
    for (const val of dowRaw) {
      if (val === 7) validDow.add(0);
      else validDow.add(val);
    }
  }

  const dates: Date[] = [];
  let current = new Date();
  current.setSeconds(0);
  current.setMilliseconds(0);
  current.setMinutes(current.getMinutes() + 1);

  let attempts = 0;
  const maxAttempts = 10000;

  while (dates.length < count && attempts < maxAttempts) {
    attempts++;
    
    const month = current.getMonth() + 1;
    if (validMonths && !validMonths.has(month)) {
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
      current.setHours(0);
      current.setMinutes(0);
      continue;
    }

    const dom = current.getDate();
    const dow = current.getDay();
    
    const isDomRestricted = domPart !== '*';
    const isDowRestricted = dowPart !== '*';

    let dayMatches = true;
    if (isDomRestricted && isDowRestricted) {
      const domMatch = validDom ? validDom.has(dom) : false;
      const dowMatch = validDow ? validDow.has(dow) : false;
      dayMatches = domMatch || dowMatch;
    } else {
      if (isDomRestricted && validDom && !validDom.has(dom)) dayMatches = false;
      if (isDowRestricted && validDow && !validDow.has(dow)) dayMatches = false;
    }

    if (!dayMatches) {
      current.setDate(current.getDate() + 1);
      current.setHours(0);
      current.setMinutes(0);
      continue;
    }

    const hour = current.getHours();
    if (validHours && !validHours.has(hour)) {
      current.setHours(current.getHours() + 1);
      current.setMinutes(0);
      continue;
    }

    const minute = current.getMinutes();
    if (validMinutes && !validMinutes.has(minute)) {
      current.setMinutes(current.getMinutes() + 1);
      continue;
    }

    dates.push(new Date(current));
    current.setMinutes(current.getMinutes() + 1);
  }

  return dates;
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function CronExpressionGenerator() {
  const [activeTab, setActiveTab] = useState<"presets" | "advanced">("presets");

  const [rawExpression, setRawExpression] = useState("* * * * *");
  const [copied, setCopied] = useState(false);
  const [isRawFocused, setIsRawFocused] = useState(false);

  const [expandedSection, setExpandedSection] = useState<string | null>("minutes");

  const [minuteMode, setMinuteMode] = useState<FieldMode>("all");
  const [minuteStep, setMinuteStep] = useState(5);
  const [minuteSpecifics, setMinuteSpecifics] = useState<number[]>([0]);
  const [minuteRangeStart, setMinuteRangeStart] = useState(0);
  const [minuteRangeEnd, setMinuteRangeEnd] = useState(59);

  const [hourMode, setHourMode] = useState<FieldMode>("all");
  const [hourStep, setHourStep] = useState(2);
  const [hourSpecifics, setHourSpecifics] = useState<number[]>([0]);
  const [hourRangeStart, setHourRangeStart] = useState(0);
  const [hourRangeEnd, setHourRangeEnd] = useState(23);

  const [domMode, setDomMode] = useState<FieldMode>("all");
  const [domStep, setDomStep] = useState(2);
  const [domSpecifics, setDomSpecifics] = useState<number[]>([1]);
  const [domRangeStart, setDomRangeStart] = useState(1);
  const [domRangeEnd, setDomRangeEnd] = useState(31);

  const [monthMode, setMonthMode] = useState<FieldMode>("all");
  const [monthStep, setMonthStep] = useState(2);
  const [monthSpecifics, setMonthSpecifics] = useState<number[]>([1]);
  const [monthRangeStart, setMonthRangeStart] = useState(1);
  const [monthRangeEnd, setMonthRangeEnd] = useState(12);

  const [dowMode, setDowMode] = useState<FieldMode>("all");
  const [dowSpecifics, setDowSpecifics] = useState<number[]>([0]);
  const [dowRangeStart, setDowRangeStart] = useState(0);
  const [dowRangeEnd, setDowRangeEnd] = useState(6);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === "presets") return;

    const getFieldString = (
      mode: FieldMode,
      step: number,
      specifics: number[],
      rangeStart: number,
      rangeEnd: number,
      defaultVal = "*"
    ) => {
      if (mode === "all") return "*";
      if (mode === "step") return `*/${step}`;
      if (mode === "range") return `${rangeStart}-${rangeEnd}`;
      if (mode === "specific") {
        if (specifics.length === 0) return defaultVal;
        return [...specifics].sort((a, b) => a - b).join(",");
      }
      return "*";
    };

    const m = getFieldString(minuteMode, minuteStep, minuteSpecifics, minuteRangeStart, minuteRangeEnd, "0");
    const h = getFieldString(hourMode, hourStep, hourSpecifics, hourRangeStart, hourRangeEnd, "0");
    const dom = getFieldString(domMode, domStep, domSpecifics, domRangeStart, domRangeEnd, "*");
    const mon = getFieldString(monthMode, monthStep, monthSpecifics, monthRangeStart, monthRangeEnd, "*");
    const dow = getFieldString(dowMode, 2, dowSpecifics, dowRangeStart, dowRangeEnd, "*");

    setRawExpression(`${m} ${h} ${dom} ${mon} ${dow}`);
  }, [
    activeTab,
    minuteMode, minuteStep, minuteSpecifics, minuteRangeStart, minuteRangeEnd,
    hourMode, hourStep, hourSpecifics, hourRangeStart, hourRangeEnd,
    domMode, domStep, domSpecifics, domRangeStart, domRangeEnd,
    monthMode, monthStep, monthSpecifics, monthRangeStart, monthRangeEnd,
    dowMode, dowSpecifics, dowRangeStart, dowRangeEnd,
  ]);

  const syncUiFromRaw = useCallback(() => {
    const parts = rawExpression.trim().split(/\s+/);
    if (parts.length !== 5) return;

    const parseFieldState = (
      part: string,
      setMode: (m: FieldMode) => void,
      setStep: (s: number) => void,
      setSpecifics: (sp: number[]) => void,
      setRangeStart: (rs: number) => void,
      setRangeEnd: (re: number) => void
    ) => {
      if (part === "*") {
        setMode("all");
        return;
      }
      if (part.startsWith("*/")) {
        setMode("step");
        setStep(parseInt(part.slice(2), 10) || 5);
        return;
      }
      if (part.includes("-")) {
        const [start, end] = part.split("-");
        setMode("range");
        setRangeStart(parseInt(start, 10) || 0);
        setRangeEnd(parseInt(end, 10) || 0);
        return;
      }
      const nums = part.split(",").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        setMode("specific");
        setSpecifics(nums);
      }
    };

    parseFieldState(parts[0], setMinuteMode, setMinuteStep, setMinuteSpecifics, setMinuteRangeStart, setMinuteRangeEnd);
    parseFieldState(parts[1], setHourMode, setHourStep, setHourSpecifics, setHourRangeStart, setHourRangeEnd);
    parseFieldState(parts[2], setDomMode, setDomStep, setDomSpecifics, setDomRangeStart, setDomRangeEnd);
    parseFieldState(parts[3], setMonthMode, setMonthStep, setMonthSpecifics, setMonthRangeStart, setMonthRangeEnd);
    
    const dowPart = parts[4];
    if (dowPart === "*") {
      setDowMode("all");
    } else if (dowPart.includes("-")) {
      const [start, end] = dowPart.split("-");
      setDowMode("range");
      setDowRangeStart(parseInt(start, 10) || 0);
      setDowRangeEnd(parseInt(end, 10) || 0);
    } else {
      const nums = dowPart.split(",").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        setDowMode("specific");
        setDowSpecifics(nums);
      }
    }
  }, [rawExpression]);

  const handleTabChange = (tab: "presets" | "advanced") => {
    setActiveTab(tab);
    if (tab === "advanced") {
      syncUiFromRaw();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawExpression.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  const handleReset = () => {
    setRawExpression("* * * * *");
    setMinuteMode("all");
    setHourMode("all");
    setDomMode("all");
    setMonthMode("all");
    setDowMode("all");
    setExpandedSection("minutes");
  };

  const handleLoadSample = () => {
    setRawExpression("*/15 9-17 * * 1-5");
    if (activeTab === "advanced") {
      setTimeout(() => syncUiFromRaw(), 50);
    }
  };

  const validation = useMemo(() => validateCron(rawExpression), [rawExpression]);
  const explanation = useMemo(() => translateCron(rawExpression), [rawExpression]);
  const nextDates = useMemo(() => {
    if (!validation.isValid) return [];
    return getNextExecutions(rawExpression, 5);
  }, [rawExpression, validation.isValid]);

  const toggleSpecific = (val: number, list: number[], setter: (v: number[]) => void) => {
    if (list.includes(val)) {
      setter(list.filter((x) => x !== val));
    } else {
      setter([...list, val]);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-8 space-y-5">
          
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <button
              onClick={() => handleTabChange("presets")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 border h-10 min-w-[120px] justify-center cursor-pointer ${
                activeTab === "presets"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-indigo-600"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Quick Presets
            </button>
            <button
              onClick={() => handleTabChange("advanced")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 border h-10 min-w-[120px] justify-center cursor-pointer ${
                activeTab === "advanced"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-indigo-600"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Advanced Configurator
            </button>
          </div>

          {activeTab === "presets" && (
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-4 sm:p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Select a Preset Configuration
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {CRON_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setRawExpression(preset.expression)}
                    className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                      rawExpression === preset.expression
                        ? "bg-indigo-50/50 border-indigo-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-indigo-400"
                    }`}
                  >
                    <div className="flex justify-between w-full items-center mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{preset.name}</span>
                      <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {preset.expression}
                      </code>
                    </div>
                    <p className="text-slate-505 text-xs leading-relaxed text-slate-500">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="space-y-4">
              {[
                {
                  id: "minutes",
                  label: "Minutes",
                  mode: minuteMode,
                  setMode: setMinuteMode,
                  step: minuteStep,
                  setStep: setMinuteStep,
                  specifics: minuteSpecifics,
                  setSpecifics: setMinuteSpecifics,
                  rangeStart: minuteRangeStart,
                  setRangeStart: setMinuteRangeStart,
                  rangeEnd: minuteRangeEnd,
                  setRangeEnd: setMinuteRangeEnd,
                  min: 0,
                  max: 59,
                },
                {
                  id: "hours",
                  label: "Hours",
                  mode: hourMode,
                  setMode: setHourMode,
                  step: hourStep,
                  setStep: setHourStep,
                  specifics: hourSpecifics,
                  setSpecifics: setHourSpecifics,
                  rangeStart: hourRangeStart,
                  setRangeStart: setHourRangeStart,
                  rangeEnd: hourRangeEnd,
                  setRangeEnd: setHourRangeEnd,
                  min: 0,
                  max: 23,
                },
                {
                  id: "dom",
                  label: "Day of Month",
                  mode: domMode,
                  setMode: setDomMode,
                  step: domStep,
                  setStep: setDomStep,
                  specifics: domSpecifics,
                  setSpecifics: setDomSpecifics,
                  rangeStart: domRangeStart,
                  setRangeStart: setDomRangeStart,
                  rangeEnd: domRangeEnd,
                  setRangeEnd: setDomRangeEnd,
                  min: 1,
                  max: 31,
                },
                {
                  id: "month",
                  label: "Month",
                  mode: monthMode,
                  setMode: setMonthMode,
                  step: monthStep,
                  setStep: setMonthStep,
                  specifics: monthSpecifics,
                  setSpecifics: setMonthSpecifics,
                  rangeStart: monthRangeStart,
                  setRangeStart: setMonthRangeStart,
                  rangeEnd: monthRangeEnd,
                  setRangeEnd: setMonthRangeEnd,
                  min: 1,
                  max: 12,
                  aliases: MONTH_NAMES_FULL,
                },
                {
                  id: "dow",
                  label: "Day of Week",
                  mode: dowMode,
                  setMode: setDowMode,
                  step: 2,
                  setStep: () => {},
                  specifics: dowSpecifics,
                  setSpecifics: setDowSpecifics,
                  rangeStart: dowRangeStart,
                  setRangeStart: setDowRangeStart,
                  rangeEnd: dowRangeEnd,
                  setRangeEnd: setDowRangeEnd,
                  min: 0,
                  max: 6,
                  aliases: DAY_NAMES_FULL,
                },
              ].map((field) => {
                const isOpen = expandedSection === field.id;
                return (
                  <div
                    key={field.id}
                    className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => setExpandedSection(isOpen ? null : field.id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-900 bg-slate-50/55 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                          {field.id === "minutes" ? "1" : field.id === "hours" ? "2" : field.id === "dom" ? "3" : field.id === "month" ? "4" : "5"}
                        </span>
                        <div>
                          <span className="text-base font-semibold text-slate-900">{field.label}</span>
                          <span className="text-xs text-slate-500 font-normal ml-2 block sm:inline">
                            (Current:{" "}
                            <code className="text-indigo-600 bg-indigo-50/70 px-1.5 py-0.5 rounded font-mono font-medium">
                              {rawExpression.split(/\s+/)[field.id === "minutes" ? 0 : field.id === "hours" ? 1 : field.id === "dom" ? 2 : field.id === "month" ? 3 : 4] || "*"}
                            </code>
                            )
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="space-y-5 p-4 sm:p-6">
                        
                        <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl max-w-md">
                          {[
                            { mode: "all" as FieldMode, label: `Every ${field.label}` },
                            { mode: "step" as FieldMode, label: "Steps" },
                            { mode: "range" as FieldMode, label: "Range" },
                            { mode: "specific" as FieldMode, label: "Specific" },
                          ]
                            .filter((opt) => !(field.id === "dow" && opt.mode === "step"))
                            .map((opt) => (
                              <button
                                key={opt.mode}
                                onClick={() => field.setMode(opt.mode)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold h-10 cursor-pointer transition-all duration-200 ${
                                  field.mode === opt.mode
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                        </div>

                        {field.mode === "all" && (
                          <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            Executes on every single {field.label.toLowerCase().replace(/s$/, "")} interval (matches wildcard symbol <code className="font-mono text-slate-800 bg-slate-200 px-1 py-0.5 rounded">*</code>).
                          </p>
                        )}

                        {field.mode === "step" && (
                          <div className="space-y-3 bg-slate-50/50 p-5 rounded-xl border border-slate-200/50">
                            <label className="block text-xs font-semibold text-slate-700">
                              Execute every [X] {field.label.toLowerCase()}:
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={field.id === "hours" ? 2 : field.id === "dom" ? 2 : field.id === "month" ? 2 : 2}
                                max={field.id === "hours" ? 12 : field.id === "dom" ? 15 : field.id === "month" ? 6 : 30}
                                value={field.step}
                                onChange={(e) => field.setStep(parseInt(e.target.value, 10))}
                                className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                              />
                              <span className="font-mono text-sm font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 flex-shrink-0 min-w-[54px] text-center">
                                {field.step}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Outputs: <code className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">*/{field.step}</code>. Running at indices divisible by {field.step}.
                            </p>
                          </div>
                        )}

                        {field.mode === "range" && (
                          <div className="bg-slate-50/55 p-5 rounded-xl border border-slate-200/50 space-y-4">
                            <div className="flex gap-4 items-center">
                              <div className="flex-1 space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">Start Value</label>
                                <select
                                  value={field.rangeStart}
                                  onChange={(e) => field.setRangeStart(parseInt(e.target.value, 10))}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                                >
                                  {Array.from({ length: field.max - field.min + 1 }).map((_, idx) => {
                                    const val = field.min + idx;
                                    return (
                                      <option key={val} value={val}>
                                        {field.aliases ? field.aliases[idx] : val}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <span className="text-slate-400 text-sm mt-5">to</span>
                              <div className="flex-1 space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">End Value</label>
                                <select
                                  value={field.rangeEnd}
                                  onChange={(e) => field.setRangeEnd(parseInt(e.target.value, 10))}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                                >
                                  {Array.from({ length: field.max - field.min + 1 }).map((_, idx) => {
                                    const val = field.min + idx;
                                    return (
                                      <option key={val} value={val} disabled={val < field.rangeStart}>
                                        {field.aliases ? field.aliases[idx] : val}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">
                              Outputs expression: <code className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">{field.rangeStart}-{field.rangeEnd}</code>
                            </p>
                          </div>
                        )}

                        {field.mode === "specific" && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-slate-700">Select specific times:</span>
                              <button
                                onClick={() => field.setSpecifics([])}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                              >
                                Deselect All
                              </button>
                            </div>
                            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                              {Array.from({ length: field.max - field.min + 1 }).map((_, idx) => {
                                const val = field.min + idx;
                                const isSelected = field.specifics.includes(val);
                                const displayName = field.aliases ? field.aliases[idx].slice(0, 3) : val;
                                return (
                                  <button
                                    key={val}
                                    onClick={() => toggleSpecific(val, field.specifics, field.setSpecifics)}
                                    className={`w-10 h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer ${
                                      isSelected
                                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-offset-1 ring-indigo-500"
                                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50"
                                    }`}
                                    title={field.aliases ? field.aliases[idx] : String(val)}
                                  >
                                    {displayName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Slate-to-Indigo Gradient Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Active Cron Expression</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  validation.isValid
                    ? "bg-green-500/20 text-green-150 border border-green-500/30"
                    : "bg-red-500/20 text-red-150 border border-red-500/30"
                }`}
              >
                {validation.isValid ? "Valid" : "Invalid"}
              </span>
            </div>

            <div className="space-y-5 flex-1 p-4 sm:p-6">
              
              <div className="space-y-2">
                <label htmlFor="raw-cron-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Expression String
                </label>
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-mono bg-slate-50 transition-all ${
                    isRawFocused ? "ring-2 ring-indigo-500 border-transparent bg-white" : "border-slate-200"
                  }`}
                >
                  <input
                    id="raw-cron-input"
                    type="text"
                    value={rawExpression}
                    onChange={(e) => setRawExpression(e.target.value)}
                    onFocus={() => setIsRawFocused(true)}
                    onBlur={() => setIsRawFocused(false)}
                    className="w-full bg-transparent text-slate-900 focus:outline-none font-mono text-base font-semibold"
                    placeholder="* * * * *"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Schedule Translation
                </span>
                <div className={`p-4 rounded-xl border text-sm leading-relaxed transition-colors ${
                  validation.isValid 
                    ? "bg-slate-50/50 border-slate-200/60 text-slate-700" 
                    : "bg-red-50/30 border-red-100 text-red-600"
                }`}>
                  {explanation}
                </div>
              </div>

              {validation.isValid && nextDates.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Next 5 Executions
                  </span>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {nextDates.map((date, idx) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-2.5 bg-slate-50/30 text-xs">
                        <span className="font-semibold text-slate-700">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-mono text-slate-500">
                          {date.toLocaleTimeString("en-US", {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col gap-3">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied Expression!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Cron Expression
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleLoadSample}
                  className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Load Sample
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Reset Settings
                </button>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-50/30 border border-indigo-100/50 text-xs text-indigo-700 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>100% Client-Side execution.</strong> Calculations, parses, and projections are computed inside your browser sandbox. No scheduler payloads are transmitted over the network.
            </span>
          </div>

        </div>

      </div>

      <section className="mt-12 space-y-8">
        
        {/* Section 1: Deep Architectural Breakdown & Mathematical Anatomy */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm md:p-10 mb-8 p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center">
              <Terminal className="w-6 h-6"/>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              The Technical Architecture of Cron Syntax
            </h2>
          </div>
          
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Originating from the Unix V7 operating system daemon, a **Cron Expression** is a compact, space-delimited text string comprising five or six distinct fields that represent a temporal schedule. The underlying automation engine evaluates this configuration at the turn of every minute against the system host clock to determine if a specific background process, shell script, or microservice task is cleared for execution.
          </p>
          
          <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white border-b border-slate-200">
                <tr>
                  {["Field Index", "Field Parameter", "Allowed Value Bounds", "Supported Special Operators"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["1", "Minute", "0 – 59", "* , - /"],
                  ["2", "Hour", "0 – 23", "* , - /"],
                  ["3", "Day of Month", "1 – 31", "* , - / ? L W"],
                  ["4", "Month", "1 – 12 or JAN – DEC", "* , - /"],
                  ["5", "Day of Week", "0 – 6 or SUN – SAT", "* , - / ? L #"]
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-semibold text-slate-700"
                            : j === 1
                            ? "text-indigo-700 font-medium"
                            : "text-slate-650"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4 mt-6">Decoding the Operator Character Set</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-mono text-indigo-600 font-bold text-base block mb-1">* (Asterisk)</span>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                The wild-card operator matches every possible increment within that specific field's boundaries. For instance, a <code className="font-mono bg-slate-200 px-1 rounded text-slate-800 text-xs">*</code> inside the Hour field indicates execution every hour.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-mono text-indigo-600 font-bold text-base block mb-1">, (Comma)</span>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Declares a discrete, non-contiguous list of value assignments. A configuration of <code className="font-mono bg-slate-200 px-1 rounded text-slate-800 text-xs">1,3,5</code> in the Day of Week column restricts execution strictly to Sundays, Tuesdays, and Thursdays.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-mono text-indigo-600 font-bold text-base block mb-1">- (Hyphen)</span>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Specifies an inclusive range of contiguous numbers. Configuring an Hour field to <code className="font-mono bg-slate-200 px-1 rounded text-slate-800 text-xs">9-17</code> locks execution workflows exclusively between 9:00 AM and 5:00 PM.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-mono text-indigo-600 font-bold text-base block mb-1">/ (Forward Slash)</span>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                Specifies incremental steps. A value sequence of <code className="font-mono bg-slate-200 px-1 rounded text-slate-800 text-xs">0/15</code> within the Minutes block limits processing loops to execution at exactly the 0, 15, 30, and 45-minute marks.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Step-by-Step Logic Execution Matrix */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm md:p-10 mb-8 p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center">
              <Cpu className="w-6 h-6"/>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Structural Parsing and Execution Mechanics
            </h2>
          </div>
          
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            When a background daemon processes an active schedule matrix, the runtime evaluates individual system intervals utilizing specific tokenization layers:
          </p>

          <div className="space-y-4">
            {[
              {
                step: "Step 1: Token Isolation",
                desc: (
                  <>
                    The parser processes the input string from left to right, breaking fields apart by seeking explicit whitespace delineators. If the block fails to compile exactly 5 structural fragments, an validation error exception layer is raised.
                  </>
                )
              },
              {
                step: "Step 2: Special Operator Expansion",
                desc: (
                  <>
                    Step sequences (<code className="font-mono text-xs">/</code>) and mathematical ranges (<code className="font-mono text-xs">-</code>) are compiled into explicit discrete integer array sets. For instance, an expression fragment like <code className="font-mono text-xs">5-8</code> immediately expands internally to the integer list <code className="font-mono text-xs">[5, 6, 7, 8]</code>.
                  </>
                )
              },
              {
                step: "Step 3: Logical Union Evaluation",
                desc: (
                  <>
                    Commas are mapped out as continuous mathematical unions. The system combines disparate lists while stripping duplicate integers to yield an organized execution bitmask representing distinct, isolated time triggers.
                  </>
                )
              },
              {
                step: "Step 4: Syntax Validation Verification",
                desc: (
                  <>
                    The compiled schedule sets are cross-checked against boundary rules (e.g. asserting that a entry of 60 is never present in a minute array block). Once validated, the structural data layer synthesizes the natural human explanation string.
                  </>
                )
              }
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50/50 rounded-xl border border-slate-200/60">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.step}</h4>
                  <div className="text-slate-650 text-sm leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Technical Reference Expression Mapping Grid */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm md:p-10 mb-8 p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center">
              <Table className="w-6 h-6"/>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Production Reference Expressions Matrix
            </h2>
          </div>
          
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Accelerate your systems orchestration utilizing this authoritative reference matrix of common production-grade scheduling patterns:
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white border-b border-slate-200">
                <tr>
                  {["Cron Target Pattern", "Human Translation Description", "Primary Devops Integration Use Case"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {[
                  ["* * * * *", "Every single minute continuously", "Real-time telemetry streams & queue polling"],
                  ["0 * * * *", "Hourly, at minute marker 0", "Transactional database synchronization snapshots"],
                  ["0 0 * * *", "Daily, exactly at 12:00 AM midnight", "Cache clearing & transactional logging rotations"],
                  ["0 0 * * 0", "Weekly, on Sunday at 12:00 AM", "Comprehensive system backup uploads to cloud storage"],
                  ["0 0 1 * *", "Monthly, on the 1st day at 12:00 AM", "Automated recurring subscriber invoice billing engines"],
                  ["0 22 * * 1-5", "At 10:00 PM, Monday through Friday", "Off-peak system batch builds & reporting compiling"]
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-mono font-semibold text-indigo-700"
                            : j === 1
                            ? "font-semibold text-slate-700"
                            : "text-slate-650"
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Enterprise Implementation & Automation Patterns */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm md:p-10 mb-8 p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center">
              <Workflow className="w-6 h-6"/>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Systems Integration Automation Patterns
            </h2>
          </div>
          
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Deploy professional cron configurations across modern distributed architecture tiers leveraging these production patterns:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-md transition-all duration-200 group p-4 sm:p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                <span>Database Replication Snapshots</span>
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Schedule off-peak data redundancy processes (e.g., <code className="font-mono text-xs text-indigo-600">0 2 * * *</code>) to compile snapshot records when network application load thresholds reach daily minimum baselines, avoiding CPU contention on main transactions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-md transition-all duration-200 group p-4 sm:p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                <span>Cache Eviction Frameworks</span>
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Orchestrate systemic memory management scripts across dynamic Redis, Valkey, or Memcached lookup grids. Triggering memory sweeps hourly prevents stale application state leakage without interrupting processing queues.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-md transition-all duration-200 group p-4 sm:p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                <span>SaaS Automated Billing Runtimes</span>
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Configure monthly execution schedules to parse account subscription thresholds, balance remaining credits, execute payment gateway logic payloads, and distribute accounting statements automatically on target milestones.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-md transition-all duration-200 group p-4 sm:p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                <span>System Log Hygiene & Rotation</span>
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Establish operational shell scripts to archive massive system debugging trails, compress historically static objects, clear out ephemeral staging storage directories, and avoid server disk space exhaustion.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Authoritative Frequently Asked Questions (FAQ) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm md:p-10 mb-8 p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6"/>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Advanced Scheduling Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-5">
            {[
              {
                q: "Are six-field cron strings supported in standard Unix infrastructure?",
                a: "Standard Linux/Unix Crontab configurations rely strictly on the classic 5-field syntax engine. Advanced programming frameworks, enterprise event systems like Quartz Scheduler, or public cloud events (e.g. AWS CloudWatch / EventBridge) leverage extended 6 or 7-field structures to support specialized processing elements like precise execution down to the second or a specific calendar year."
              },
              {
                q: "How does the system handle daylight saving time (DST) time shifts?",
                a: "During autumn fallback transitions, cron routines scheduled inside the duplicate hourly window might execute twice. Conversely, during spring forward shifts, tasks inside the missing hour interval are skipped entirely. To prevent state anomalies or data corruption, critical computing systems should synchronize their hardware layers to Coordinated Universal Time (UTC)."
              },
              {
                q: "What is the functional difference between using */5 and 0/5 selectors?",
                a: "In standard Unix processing syntax, */5 and 0/5 yield identical runtime matrices. Both tell the timing parser to schedule calculations at every step increment divisible by 5 (0, 5, 10, 15...) inside the fields boundary constraint parameter."
              },
              {
                q: "Is it safe to parse and predict schedule instances within this online browser client?",
                a: "Absolutely. TwisterTools operates entirely inside the local device browser context utilizing high-performance client-side TypeScript string tokenizers. Zero parameters, system configuration paths, or sensitive architecture layout components are sent across external server APIs or networks, providing absolute, ironclad privacy."
              }
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-3.5">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <Script
        id="cron-web-app-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdSchema),
        }}
      />
    </div>
  );
}

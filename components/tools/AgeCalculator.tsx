"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  Clock,
  CalendarClock,
  Milestone,
  HelpCircle,
  Award,
  Info,
  Cpu,
  Trash2,
  History,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Utility Calculations (Pure JavaScript)
// ─────────────────────────────────────────────────────────────

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculatePreciseDifference(start: Date, end: Date): AgeBreakdown | null {
  if (end < start) return null;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonthDate.getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days, hours, minutes, seconds };
}

export default function AgeCalculator() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // ── Date of Birth States ──
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(0); // 0 = Jan
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthHour, setBirthHour] = useState<number>(12);
  const [birthMinute, setBirthMinute] = useState<number>(0);
  const [enableBirthTime, setEnableBirthTime] = useState<boolean>(false);

  // ── Target Date States ──
  const [useCurrentTargetDate, setUseCurrentTargetDate] = useState<boolean>(true);
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [targetMonth, setTargetMonth] = useState<number>(6); // 0 = Jan
  const [targetDay, setTargetDay] = useState<number>(16);
  const [targetHour, setTargetHour] = useState<number>(13);
  const [targetMinute, setTargetMinute] = useState<number>(11);

  // ── Presets & Extra states ──
  const [leapYearResult, setLeapYearResult] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync ticker
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update target date inputs to current when live ticker is enabled
  useEffect(() => {
    if (!useCurrentTargetDate || !currentTime) return;
    setTargetYear(currentTime.getFullYear());
    setTargetMonth(currentTime.getMonth());
    setTargetDay(currentTime.getDate());
    setTargetHour(currentTime.getHours());
    setTargetMinute(currentTime.getMinutes());
  }, [useCurrentTargetDate, currentTime]);

  // Adjust max days based on selected month & year
  const daysInBirthMonth = useMemo(() => {
    return new Date(birthYear, birthMonth + 1, 0).getDate();
  }, [birthYear, birthMonth]);

  const daysInTargetMonth = useMemo(() => {
    return new Date(targetYear, targetMonth + 1, 0).getDate();
  }, [targetYear, targetMonth]);

  // Handle constraints
  useEffect(() => {
    if (birthDay > daysInBirthMonth) {
      setBirthDay(daysInBirthMonth);
    }
  }, [daysInBirthMonth, birthDay]);

  useEffect(() => {
    if (targetDay > daysInTargetMonth) {
      setTargetDay(daysInTargetMonth);
    }
  }, [daysInTargetMonth, targetDay]);

  // Sync dropdowns when native Date input changes
  const birthDateString = useMemo(() => {
    const y = String(birthYear).padStart(4, "0");
    const m = String(birthMonth + 1).padStart(2, "0");
    const d = String(birthDay).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [birthYear, birthMonth, birthDay]);

  const handleBirthDatePickerChange = (val: string) => {
    if (!val) return;
    const parts = val.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      setBirthYear(y);
      setBirthMonth(m);
      const maxDays = new Date(y, m + 1, 0).getDate();
      setBirthDay(Math.min(d, maxDays));
    }
  };

  const targetDateString = useMemo(() => {
    const y = String(targetYear).padStart(4, "0");
    const m = String(targetMonth + 1).padStart(2, "0");
    const d = String(targetDay).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [targetYear, targetMonth, targetDay]);

  const handleTargetDatePickerChange = (val: string) => {
    if (!val) return;
    const parts = val.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      setTargetYear(y);
      setTargetMonth(m);
      const maxDays = new Date(y, m + 1, 0).getDate();
      setTargetDay(Math.min(d, maxDays));
      setUseCurrentTargetDate(false); // Stop live tracking on custom change
    }
  };

  // ── Construct DateTime Objects ──
  const birthDateTime = useMemo(() => {
    return new Date(
      birthYear,
      birthMonth,
      birthDay,
      enableBirthTime ? birthHour : 0,
      enableBirthTime ? birthMinute : 0,
      0
    );
  }, [birthYear, birthMonth, birthDay, birthHour, birthMinute, enableBirthTime]);

  const targetDateTime = useMemo(() => {
    if (useCurrentTargetDate && currentTime) {
      return currentTime;
    }
    return new Date(
      targetYear,
      targetMonth,
      targetDay,
      enableBirthTime ? targetHour : 0,
      enableBirthTime ? targetMinute : 0,
      0
    );
  }, [
    useCurrentTargetDate,
    currentTime,
    targetYear,
    targetMonth,
    targetDay,
    targetHour,
    targetMinute,
    enableBirthTime,
  ]);

  // ── Core Calculations ──
  const ageBreakdown = useMemo(() => {
    return calculatePreciseDifference(birthDateTime, targetDateTime);
  }, [birthDateTime, targetDateTime]);

  // Alternate Breakdowns
  const alternateBreakdowns = useMemo(() => {
    if (!ageBreakdown) return null;
    const diffMs = targetDateTime.getTime() - birthDateTime.getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 7));
    const totalMonths = Math.max(
      0,
      ageBreakdown.years * 12 + ageBreakdown.months + ageBreakdown.days / 30.4375
    );

    return {
      months: totalMonths.toLocaleString("en-US", { maximumFractionDigits: 1 }),
      weeks: totalWeeks.toLocaleString("en-US", { maximumFractionDigits: 1 }),
      days: totalDays.toLocaleString("en-US"),
      hours: totalHours.toLocaleString("en-US"),
      minutes: totalMinutes.toLocaleString("en-US"),
      seconds: totalSeconds.toLocaleString("en-US"),
    };
  }, [ageBreakdown, birthDateTime, targetDateTime]);

  // Next Birthday Ticker
  const nextBirthdayCountdown = useMemo(() => {
    if (!mounted || !currentTime) return null;
    const currentYear = targetDateTime.getFullYear();
    let nextBday = new Date(
      currentYear,
      birthMonth,
      birthDay,
      enableBirthTime ? birthHour : 0,
      enableBirthTime ? birthMinute : 0,
      0
    );

    if (nextBday.getTime() < targetDateTime.getTime()) {
      nextBday.setFullYear(currentYear + 1);
    }

    // Rollover for leaplings: if birthdate is Feb 29 and next birthday year is not leap,
    // JS Date automatically rolls to March 1.
    const diff = nextBday.getTime() - targetDateTime.getTime();
    if (diff < 1000) {
      return { isBirthday: true, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const countdownBreakdown = calculatePreciseDifference(targetDateTime, nextBday);
    if (!countdownBreakdown) return null;

    return {
      isBirthday: false,
      months: countdownBreakdown.months,
      days: countdownBreakdown.days,
      hours: countdownBreakdown.hours,
      minutes: countdownBreakdown.minutes,
      seconds: countdownBreakdown.seconds,
    };
  }, [mounted, currentTime, birthMonth, birthDay, birthHour, birthMinute, enableBirthTime, targetDateTime]);

  // Next 5 Birthdays Milestones
  const upcomingBirthdays = useMemo(() => {
    const milestones = [];
    const baseYear = nextBirthdayCountdown?.isBirthday
      ? targetDateTime.getFullYear()
      : nextBirthdayCountdown
        ? new Date(
          targetDateTime.getFullYear(),
          birthMonth,
          birthDay,
          enableBirthTime ? birthHour : 0,
          enableBirthTime ? birthMinute : 0,
          0
        ).getTime() < targetDateTime.getTime()
          ? targetDateTime.getFullYear() + 1
          : targetDateTime.getFullYear()
        : targetDateTime.getFullYear();

    for (let i = 0; i < 5; i++) {
      const year = baseYear + i;
      let bdayDate = new Date(
        year,
        birthMonth,
        birthDay,
        enableBirthTime ? birthHour : 0,
        enableBirthTime ? birthMinute : 0,
        0
      );

      // Handle leap year babes rollover (Feb 29) to Feb 28 in non-leap years
      let note = "";
      if (birthMonth === 1 && birthDay === 29) {
        if (!isLeapYear(year)) {
          bdayDate = new Date(year, 1, 28);
          note = " (Feb 28 Rollover)";
        }
      }

      const weekday = bdayDate.toLocaleDateString("en-US", { weekday: "long" });
      const formattedDate = bdayDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const age = year - birthYear;

      milestones.push({
        age,
        dateStr: `${formattedDate}${note}`,
        weekday,
      });
    }
    return milestones;
  }, [birthYear, birthMonth, birthDay, birthHour, birthMinute, enableBirthTime, targetDateTime, nextBirthdayCountdown]);

  // Actions
  const handleClear = () => {
    setBirthYear(1990);
    setBirthMonth(0);
    setBirthDay(1);
    setBirthHour(12);
    setBirthMinute(0);
    setEnableBirthTime(false);
    setUseCurrentTargetDate(true);
    setLeapYearResult(null);
  };

  const handleLeapYearCheck = () => {
    if (isLeapYear(birthYear)) {
      setLeapYearResult(
        `Born in a Leap Year! ${birthYear} was a leap year (366 days), meaning February had an extra 29th day.`
      );
    } else {
      setLeapYearResult(
        `Common Year: ${birthYear} was not a leap year. It had 365 days, and February had 28 days.`
      );
    }
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Generating options arrays
  const yearsArray = useMemo(() => {
    const currentY = new Date().getFullYear();
    const arr = [];
    for (let y = currentY; y >= 1900; y--) arr.push(y);
    return arr;
  }, []);

  const monthsArray = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  const daysArray = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInBirthMonth; d++) arr.push(d);
    return arr;
  }, [daysInBirthMonth]);

  const targetDaysArray = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInTargetMonth; d++) arr.push(d);
    return arr;
  }, [daysInTargetMonth]);

  const hoursArray = useMemo(() => {
    const arr = [];
    for (let h = 0; h < 24; h++) arr.push(h);
    return arr;
  }, []);

  const minutesArray = useMemo(() => {
    const arr = [];
    for (let m = 0; m < 60; m++) arr.push(m);
    return arr;
  }, []);

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL — 8 columns ══════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Input controls */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Configure Birth Details
            </h2>

            {/* Date of Birth selects */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date of Birth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="dob-day" className="sr-only">Day of Birth</label>
                    <select
                      id="dob-day"
                      value={birthDay}
                      onChange={(e) => setBirthDay(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      {daysArray.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dob-month" className="sr-only">Month of Birth</label>
                    <select
                      id="dob-month"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      {monthsArray.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dob-year" className="sr-only">Year of Birth</label>
                    <select
                      id="dob-year"
                      value={birthYear}
                      onChange={(e) => setBirthYear(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      {yearsArray.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Helper Date Input */}
              <div>
                <label htmlFor="dob-picker-helper" className="block text-xs font-medium text-slate-500 mb-1.5">
                  Or select using date picker helper:
                </label>
                <input
                  id="dob-picker-helper"
                  type="date"
                  value={birthDateString}
                  onChange={(e) => handleBirthDatePickerChange(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Time of Birth Toggle */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="time-of-birth-toggle"
                    className="text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    Include Time of Birth
                  </label>
                  <button
                    id="time-of-birth-toggle"
                    role="switch"
                    aria-checked={enableBirthTime}
                    onClick={() => setEnableBirthTime((p) => !p)}
                    className="relative inline-flex h-10 w-12 flex-shrink-0 items-center justify-center cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Include Time of Birth</span>
                    <span
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${enableBirthTime ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${enableBirthTime ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </span>
                  </button>
                </div>

                {enableBirthTime && (
                  <div className="grid grid-cols-2 gap-3 mt-3 animate-fadeIn">
                    <div>
                      <label htmlFor="dob-hour" className="block text-xs font-semibold text-slate-500 mb-1">
                        Hour (24h)
                      </label>
                      <select
                        id="dob-hour"
                        value={birthHour}
                        onChange={(e) => setBirthHour(parseInt(e.target.value, 10))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        {hoursArray.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dob-minute" className="block text-xs font-semibold text-slate-500 mb-1">
                        Minute
                      </label>
                      <select
                        id="dob-minute"
                        value={birthMinute}
                        onChange={(e) => setBirthMinute(parseInt(e.target.value, 10))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        {minutesArray.map((m) => (
                          <option key={m} value={m}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Age at the Date of Selector */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Calculate Age At Date
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Live Ticker (Current Time)</span>
                  <button
                    id="live-ticker-toggle"
                    role="switch"
                    aria-checked={useCurrentTargetDate}
                    onClick={() => setUseCurrentTargetDate((p) => !p)}
                    className="relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Live Ticker (Current Time)</span>
                    <span
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${useCurrentTargetDate ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${useCurrentTargetDate ? "translate-x-4" : "translate-x-0"
                          }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {!useCurrentTargetDate && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="target-day" className="sr-only">Target Day</label>
                      <select
                        id="target-day"
                        value={targetDay}
                        onChange={(e) => setTargetDay(parseInt(e.target.value, 10))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        {targetDaysArray.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="target-month" className="sr-only">Target Month</label>
                      <select
                        id="target-month"
                        value={targetMonth}
                        onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        {monthsArray.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="target-year" className="sr-only">Target Year</label>
                      <select
                        id="target-year"
                        value={targetYear}
                        onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        {yearsArray.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="target-picker-helper" className="block text-xs font-medium text-slate-500 mb-1.5">
                      Or select using target date picker helper:
                    </label>
                    <input
                      id="target-picker-helper"
                      type="date"
                      value={targetDateString}
                      onChange={(e) => handleTargetDatePickerChange(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {enableBirthTime && (
                    <div className="grid grid-cols-2 gap-3 mt-3 animate-fadeIn">
                      <div>
                        <label htmlFor="target-hour" className="block text-xs font-semibold text-slate-500 mb-1">
                          Hour (24h)
                        </label>
                        <select
                          id="target-hour"
                          value={targetHour}
                          onChange={(e) => setTargetHour(parseInt(e.target.value, 10))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        >
                          {hoursArray.map((h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="target-minute" className="block text-xs font-semibold text-slate-500 mb-1">
                          Minute
                        </label>
                        <select
                          id="target-minute"
                          value={targetMinute}
                          onChange={(e) => setTargetMinute(parseInt(e.target.value, 10))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        >
                          {minutesArray.map((m) => (
                            <option key={m} value={m}>
                              {String(m).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Presets and Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
              <button
                id="calculate-age-cta"
                onClick={scrollToResults}
                className="flex-1 min-w-[150px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-md shadow-indigo-100 transition-all hover:-translate-y-0.5"
              >
                Calculate Age
              </button>
              <button
                id="leap-year-check-btn"
                onClick={handleLeapYearCheck}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm px-4 py-3 rounded-xl transition-all"
              >
                Born in Leap Year Check
              </button>
              <button
                id="clear-fields-btn"
                onClick={handleClear}
                aria-label="Clear all input fields"
                className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 border border-slate-200 font-medium text-sm p-3 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Leap Year Alert Badge */}
            {leapYearResult && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-2.5 animate-fadeIn">
                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-normal">{leapYearResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════ RIGHT STICKY PANEL — 4 columns ══════════════════ */}
        <div ref={resultsRef} className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          {/* Main Results Box */}
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-100 to-indigo-50/30 border-b border-slate-200/50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Calculation Results
              </h3>
            </div>

            <div className="p-5 space-y-5">
              {/* Chronological Age */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Chronological Age
                </p>
                {ageBreakdown ? (
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {ageBreakdown.years} <span className="text-indigo-600 font-semibold text-2xl">Years</span>
                      </p>
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {ageBreakdown.months} <span className="text-indigo-600 font-semibold text-2xl">Months</span>
                      </p>
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {ageBreakdown.days} <span className="text-indigo-600 font-semibold text-2xl">Days</span>
                      </p>
                      {enableBirthTime && (
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 font-mono">
                          <div>{String(ageBreakdown.hours).padStart(2, "0")} Hours</div>
                          <div>{String(ageBreakdown.minutes).padStart(2, "0")} Mins</div>
                          <div>{String(ageBreakdown.seconds).padStart(2, "0")} Secs</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 leading-normal">
                      Date of Birth cannot be in the future relative to the target calculation date.
                    </p>
                  </div>
                )}
              </div>

              {/* Next Birthday Countdown */}
              {nextBirthdayCountdown && ageBreakdown && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Birthday Countdown
                  </p>
                  {nextBirthdayCountdown.isBirthday ? (
                    <div className="bg-indigo-600 text-white rounded-xl p-4 text-center">
                      <p className="font-bold text-sm">Happy Birthday! Today is your special day.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { label: "Mo", val: nextBirthdayCountdown.months },
                        { label: "Days", val: nextBirthdayCountdown.days },
                        { label: "Hrs", val: nextBirthdayCountdown.hours },
                        { label: "Min", val: nextBirthdayCountdown.minutes },
                        { label: "Sec", val: nextBirthdayCountdown.seconds },
                      ].map(({ label, val }) => (
                        <div key={label} className="bg-white border border-slate-100 shadow-sm rounded-lg p-1.5">
                          <p className="text-sm font-extrabold text-indigo-600 font-mono">
                            {String(val).padStart(2, "0")}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Alternate Breakdowns */}
          {alternateBreakdowns && ageBreakdown && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Alternate Breakdowns
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { label: "Total Months lived", val: alternateBreakdowns.months },
                  { label: "Total Weeks lived", val: alternateBreakdowns.weeks },
                  { label: "Total Days lived", val: alternateBreakdowns.days },
                  { label: "Total Hours lived", val: alternateBreakdowns.hours },
                  { label: "Total Minutes lived", val: alternateBreakdowns.minutes },
                  { label: "Total Seconds lived", val: alternateBreakdowns.seconds },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="font-semibold text-slate-800 font-mono text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next 5 Birthdays Milestones */}
          {ageBreakdown && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Milestone className="w-3.5 h-3.5 text-indigo-500" />
                Next 5 Birthdays
              </h3>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-12">Age</th>
                      <th className="py-2 px-3 font-semibold">Date &amp; Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {upcomingBirthdays.map(({ age, dateStr, weekday }) => (
                      <tr key={age} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{age}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800 leading-tight">{weekday}</p>
                          <p className="text-[10px] text-slate-500">{dateStr}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6 border-t border-slate-200/60">
        {/* CARD 1: Understanding Chronological Age & Time Tracking */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:p-8 shadow-sm space-y-6 mt-6 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Chronological Age &amp; Time Tracking</span>
          </h2>
          <div className="space-y-4 text-slate-700">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Chronological age is the measurement of time that has elapsed from a specific birth event to a target calendar date. While it is a standard metric used for legal identification, medical evaluation, and developmental milestones, tracking age dynamically requires deep handling of chronological anomalies. Our advanced calculation engine accounts for the historical dynamics of leap years—where an extra day is introduced every four years to keep our calendars in alignment with the Earth&apos;s orbit—as well as the alternating 30-day and 31-day monthly boundaries. Tracking your exact age down to the day, hour, and second offers a precise perspective of your personal timeline.
            </p>
          </div>
        </div>

        {/* CARD 2: How the Age Calculator Computes Your Time */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:p-8 shadow-sm space-y-6 mt-6 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How the Age Calculator Computes Your Time</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "Precise Date Delta",
                body: "Computes the exact mathematical delta between your birth date and the current system time in absolute milliseconds."
              },
              {
                num: "02",
                title: "Leap Year Alignment",
                body: "Programmatically scans the historical calendar timeline to add an extra day for every verified leap year encountered."
              },
              {
                num: "03",
                title: "Dynamic Month Mapping",
                body: "Evaluates the specific days in each calendar month to accurately calculate remaining partial-month remainders."
              },
              {
                num: "04",
                title: "Time Unit Breakdown",
                body: "Converts the absolute time delta into clean, digestible subdivisions: years, months, weeks, days, hours, and minutes."
              },
              {
                num: "05",
                title: "Real-time Refreshing",
                body: "Keeps the seconds and minutes updating live so you can watch your chronological timeline tick forward in real-time."
              },
              {
                num: "06",
                title: "Local Cryptographic Safety",
                body: "Operates entirely on client-side JS memory. Your birth date is processed securely in-RAM and never sent to our servers."
              }
            ].map(({ num, title, body }) => (
              <div
                key={num}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 3: Chronological Milestones & Time Epochs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:p-8 shadow-sm space-y-6 mt-6 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Chronological Milestones &amp; Time Epochs</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["Milestone Unit", "Equivalent Value in Minutes", "Historical Context / Significance"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["1 Year (Standard)", "525,600 minutes", "One complete solar revolution of the Earth."],
                  ["1 Leap Year", "527,040 minutes", "Accounts for the cumulative orbital remainder of ~6 hours annually."],
                  ["1 Decade", "5,259,600 minutes", "Used to measure generational demographics and macro-economic trends."],
                  ["1 Golden Jubilee", "26,298,000 minutes", "Represents 50 years, historically marked as a significant milestone era."],
                  ["Average Human Lifespan", "~42,000,000 minutes", "Based on global longevity data of approximately 80 chronological years."]
                ].map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-100 last:border-0`}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 text-sm ${j === 0
                          ? "font-semibold text-slate-700"
                          : j === 1
                            ? "text-indigo-600 font-mono font-medium"
                            : "text-slate-600"
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

        {/* CARD 4: Frequently Asked Questions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl md:p-8 shadow-sm space-y-6 mt-6 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How accurate is the leap year calculation?",
                a: "Our system scans the exact Gregorian calendar rules, adding a 366th day for every year divisible by 4, except for century years that are not divisible by 400. This ensures 100% mathematical precision for any date range in modern history."
              },
              {
                q: "Why is my age in weeks different from total years multiplied by 52?",
                a: "A standard calendar year contains 52 weeks plus 1 day (or 2 days in a leap year). Multiplying years directly by 52 ignores these trailing days. Our calculator handles the absolute day-by-day sequence to provide the exact true week count."
              },
              {
                q: "Is my birth date stored or tracked in any database?",
                a: "No. All calculations are executed natively in your browser memory. We have zero database attachments on our rendering page, protecting your birth date and personal privacy by design."
              }
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-4 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-3.5">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 5: Why Use the TwisterTools Age Calculator? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg text-white p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="lucide lucide-info w-5 h-5 text-white" />
            </div>
            <span>Why Use the TwisterTools Age Calculator?</span>
          </h2>
          <p className="text-indigo-100 text-base leading-relaxed">
            Our Age Calculator goes far beyond standard year-and-month trackers. By breaking down your personal timeline into real-time hours, minutes, and seconds alongside dedicated chronological milestone comparisons, we provide an engaging and comprehensive view of your time. Built with clean, zero-dependency local JavaScript, the calculator loads instantly, runs completely offline, and guarantees absolute privacy.
          </p>
        </div>
      </section>

      {/* JSON-LD WebApplication Schema */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "TwisterTools Age Calculator",
              "description": "Calculate your precise chronological age in years, months, weeks, days, hours, and seconds. Includes next birthday countdown and milestones.",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "All",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "USD"
              }
            }),
          }}
        />
      </div>
    </div>
  );
}

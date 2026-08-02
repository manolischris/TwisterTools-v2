"use client";

import React, { useState, useMemo } from "react";
import {
  Scale,
  ArrowLeftRight,
  Copy,
  Check,
  Trash2,
  Database,
  Cpu,
  Table,
  HardDrive,
  HelpCircle,
  Zap,
  Shield,
  Blocks,
  Activity,
  Maximize2,
  Gauge,
  Thermometer,
  ZapOff,
  Compass,
  Clock,
  Box,
  RotateCw,
  Layers,
  BookOpen,
  CheckCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Units & Categories Definitions
// ─────────────────────────────────────────────────────────────

export type UnitCategory =
  | "length"
  | "weight"
  | "temperature"
  | "volume"
  | "speed"
  | "pressure"
  | "power"
  | "voltage"
  | "time"
  | "area"
  | "torque";

interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  ratioFromBase?: number; // base * ratio = unit
  fromBase?: (val: number) => number;
  toBase?: (val: number) => number;
}

interface CategoryConfig {
  id: UnitCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  baseUnitSymbol: string;
  units: UnitDefinition[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "length",
    name: "Length",
    icon: Maximize2,
    baseUnitSymbol: "m",
    units: [
      { id: "m", name: "Meter", symbol: "m", ratioFromBase: 1 },
      { id: "km", name: "Kilometer", symbol: "km", ratioFromBase: 0.001 },
      { id: "cm", name: "Centimeter", symbol: "cm", ratioFromBase: 100 },
      { id: "mm", name: "Millimeter", symbol: "mm", ratioFromBase: 1000 },
      { id: "um", name: "Micrometer", symbol: "µm", ratioFromBase: 1e6 },
      { id: "nm", name: "Nanometer", symbol: "nm", ratioFromBase: 1e9 },
      { id: "mi", name: "Mile", symbol: "mi", ratioFromBase: 0.000621371 },
      { id: "yd", name: "Yard", symbol: "yd", ratioFromBase: 1.09361 },
      { id: "ft", name: "Foot", symbol: "ft", ratioFromBase: 3.28084 },
      { id: "in", name: "Inch", symbol: "in", ratioFromBase: 39.3701 },
      { id: "nmi", name: "Nautical Mile", symbol: "nmi", ratioFromBase: 0.000539957 },
    ],
  },
  {
    id: "weight",
    name: "Weight / Mass",
    icon: Scale,
    baseUnitSymbol: "kg",
    units: [
      { id: "kg", name: "Kilogram", symbol: "kg", ratioFromBase: 1 },
      { id: "g", name: "Gram", symbol: "g", ratioFromBase: 1000 },
      { id: "mg", name: "Milligram", symbol: "mg", ratioFromBase: 1e6 },
      { id: "mcg", name: "Microgram", symbol: "µg", ratioFromBase: 1e9 },
      { id: "t", name: "Metric Ton", symbol: "t", ratioFromBase: 0.001 },
      { id: "lb", name: "Pound", symbol: "lb", ratioFromBase: 2.20462 },
      { id: "oz", name: "Ounce", symbol: "oz", ratioFromBase: 35.274 },
      { id: "st", name: "Stone", symbol: "st", ratioFromBase: 0.157473 },
      { id: "imp_ton", name: "Imperial Ton", symbol: "long ton", ratioFromBase: 0.000984207 },
      { id: "us_ton", name: "US Short Ton", symbol: "short ton", ratioFromBase: 0.00110231 },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: Thermometer,
    baseUnitSymbol: "°C",
    units: [
      {
        id: "c",
        name: "Celsius",
        symbol: "°C",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: "f",
        name: "Fahrenheit",
        symbol: "°F",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: "k",
        name: "Kelvin",
        symbol: "K",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
      {
        id: "r",
        name: "Rankine",
        symbol: "°R",
        toBase: (v) => ((v - 491.67) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 491.67,
      },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    icon: Box,
    baseUnitSymbol: "L",
    units: [
      { id: "l", name: "Liter", symbol: "L", ratioFromBase: 1 },
      { id: "ml", name: "Milliliter", symbol: "mL", ratioFromBase: 1000 },
      { id: "m3", name: "Cubic Meter", symbol: "m³", ratioFromBase: 0.001 },
      { id: "cm3", name: "Cubic Centimeter", symbol: "cm³", ratioFromBase: 1000 },
      { id: "gal", name: "US Gallon", symbol: "gal", ratioFromBase: 0.264172 },
      { id: "qt", name: "US Quart", symbol: "qt", ratioFromBase: 1.05669 },
      { id: "pt", name: "US Pint", symbol: "pt", ratioFromBase: 2.11338 },
      { id: "cup", name: "US Cup", symbol: "cup", ratioFromBase: 4.16667 },
      { id: "floz", name: "US Fluid Ounce", symbol: "fl oz", ratioFromBase: 33.814 },
      { id: "imp_gal", name: "Imperial Gallon", symbol: "imp gal", ratioFromBase: 0.219969 },
    ],
  },
  {
    id: "speed",
    name: "Speed",
    icon: Compass,
    baseUnitSymbol: "m/s",
    units: [
      { id: "ms", name: "Meters per second", symbol: "m/s", ratioFromBase: 1 },
      { id: "kmh", name: "Kilometers per hour", symbol: "km/h", ratioFromBase: 3.6 },
      { id: "mph", name: "Miles per hour", symbol: "mph", ratioFromBase: 2.23694 },
      { id: "kn", name: "Knot", symbol: "kn", ratioFromBase: 1.94384 },
      { id: "fts", name: "Feet per second", symbol: "ft/s", ratioFromBase: 3.28084 },
      { id: "mach", name: "Mach (Standard Sea Level)", symbol: "M", ratioFromBase: 0.00291545 },
    ],
  },
  {
    id: "pressure",
    name: "Pressure",
    icon: Gauge,
    baseUnitSymbol: "Pa",
    units: [
      { id: "pa", name: "Pascal", symbol: "Pa", ratioFromBase: 1 },
      { id: "kpa", name: "Kilopascal", symbol: "kPa", ratioFromBase: 0.001 },
      { id: "mpa", name: "Megapascal", symbol: "MPa", ratioFromBase: 1e-6 },
      { id: "bar", name: "Bar", symbol: "bar", ratioFromBase: 1e-5 },
      { id: "mbar", name: "Millibar", symbol: "mbar", ratioFromBase: 0.01 },
      { id: "psi", name: "Pounds per Sq Inch", symbol: "psi", ratioFromBase: 0.000145038 },
      { id: "atm", name: "Standard Atmosphere", symbol: "atm", ratioFromBase: 9.8692e-6 },
      { id: "torr", name: "Torr / mmHg", symbol: "Torr", ratioFromBase: 0.00750062 },
    ],
  },
  {
    id: "power",
    name: "Power",
    icon: Activity,
    baseUnitSymbol: "W",
    units: [
      { id: "w", name: "Watt", symbol: "W", ratioFromBase: 1 },
      { id: "kw", name: "Kilowatt", symbol: "kW", ratioFromBase: 0.001 },
      { id: "mw", name: "Megawatt", symbol: "MW", ratioFromBase: 1e-6 },
      { id: "hp", name: "Mechanical Horsepower", symbol: "hp", ratioFromBase: 0.00134102 },
      { id: "hpm", name: "Metric Horsepower", symbol: "PS", ratioFromBase: 0.00135962 },
      { id: "btuh", name: "BTU per hour", symbol: "BTU/h", ratioFromBase: 3.41214 },
    ],
  },
  {
    id: "voltage",
    name: "Voltage",
    icon: ZapOff,
    baseUnitSymbol: "V",
    units: [
      { id: "v", name: "Volt", symbol: "V", ratioFromBase: 1 },
      { id: "mv", name: "Millivolt", symbol: "mV", ratioFromBase: 1000 },
      { id: "kv", name: "Kilovolt", symbol: "kV", ratioFromBase: 0.001 },
      { id: "mv_mega", name: "Megavolt", symbol: "MV", ratioFromBase: 1e-6 },
      { id: "uv", name: "Microvolt", symbol: "µV", ratioFromBase: 1e6 },
    ],
  },
  {
    id: "time",
    name: "Time",
    icon: Clock,
    baseUnitSymbol: "s",
    units: [
      { id: "s", name: "Second", symbol: "s", ratioFromBase: 1 },
      { id: "ms", name: "Millisecond", symbol: "ms", ratioFromBase: 1000 },
      { id: "us", name: "Microsecond", symbol: "µs", ratioFromBase: 1e6 },
      { id: "ns", name: "Nanosecond", symbol: "ns", ratioFromBase: 1e9 },
      { id: "min", name: "Minute", symbol: "min", ratioFromBase: 1 / 60 },
      { id: "h", name: "Hour", symbol: "h", ratioFromBase: 1 / 3600 },
      { id: "d", name: "Day", symbol: "d", ratioFromBase: 1 / 86400 },
      { id: "wk", name: "Week", symbol: "wk", ratioFromBase: 1 / 604800 },
      { id: "yr", name: "Year (Julian)", symbol: "yr", ratioFromBase: 1 / 31557600 },
    ],
  },
  {
    id: "area",
    name: "Area",
    icon: Layers,
    baseUnitSymbol: "m²",
    units: [
      { id: "m2", name: "Square Meter", symbol: "m²", ratioFromBase: 1 },
      { id: "km2", name: "Square Kilometer", symbol: "km²", ratioFromBase: 1e-6 },
      { id: "cm2", name: "Square Centimeter", symbol: "cm²", ratioFromBase: 10000 },
      { id: "mm2", name: "Square Millimeter", symbol: "mm²", ratioFromBase: 1e6 },
      { id: "ha", name: "Hectare", symbol: "ha", ratioFromBase: 0.0001 },
      { id: "ac", name: "Acre", symbol: "ac", ratioFromBase: 0.000247105 },
      { id: "mi2", name: "Square Mile", symbol: "sq mi", ratioFromBase: 3.861e-7 },
      { id: "ft2", name: "Square Foot", symbol: "sq ft", ratioFromBase: 10.7639 },
      { id: "in2", name: "Square Inch", symbol: "sq in", ratioFromBase: 1550.003 },
    ],
  },
  {
    id: "torque",
    name: "Torque",
    icon: RotateCw,
    baseUnitSymbol: "N·m",
    units: [
      { id: "nm", name: "Newton Meter", symbol: "N·m", ratioFromBase: 1 },
      { id: "knm", name: "Kilonewton Meter", symbol: "kN·m", ratioFromBase: 0.001 },
      { id: "ftlbf", name: "Pound-Foot", symbol: "ft·lbf", ratioFromBase: 0.737562 },
      { id: "inlbf", name: "Pound-Inch", symbol: "in·lbf", ratioFromBase: 8.85075 },
      { id: "kgfm", name: "Kilogram-Force Meter", symbol: "kgf·m", ratioFromBase: 0.101972 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  Conversion Helpers
// ─────────────────────────────────────────────────────────────

function convertUnits(
  value: number,
  fromUnit: UnitDefinition,
  toUnit: UnitDefinition
): number {
  if (isNaN(value)) return 0;
  if (fromUnit.id === toUnit.id) return value;

  if (fromUnit.toBase && toUnit.fromBase) {
    const baseValue = fromUnit.toBase(value);
    return toUnit.fromBase(baseValue);
  }

  if (fromUnit.ratioFromBase !== undefined && toUnit.ratioFromBase !== undefined) {
    const baseValue = value / fromUnit.ratioFromBase;
    return baseValue * toUnit.ratioFromBase;
  }

  return 0;
}

function formatResultNumber(num: number): string {
  if (num === 0) return "0";
  const absNum = Math.abs(num);
  if (absNum < 0.0001 || absNum >= 1e9) {
    return num.toExponential(6).replace(/\.?0+e/, "e");
  }
  return Number(num.toFixed(6)).toString();
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function MasterUnitConverter() {
  const [activeCategory, setActiveCategory] = useState<UnitCategory>("length");
  const [inputValue, setInputValue] = useState<string>("1");
  const [fromUnitId, setFromUnitId] = useState<string>("m");
  const [toUnitId, setToUnitId] = useState<string>("ft");
  const [copied, setCopied] = useState<boolean>(false);
  const [precision, setPrecision] = useState<number>(4);

  const currentCategoryConfig = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  }, [activeCategory]);

  const fromUnit = useMemo(() => {
    return (
      currentCategoryConfig.units.find((u) => u.id === fromUnitId) ||
      currentCategoryConfig.units[0]
    );
  }, [currentCategoryConfig, fromUnitId]);

  const toUnit = useMemo(() => {
    return (
      currentCategoryConfig.units.find((u) => u.id === toUnitId) ||
      currentCategoryConfig.units[1] ||
      currentCategoryConfig.units[0]
    );
  }, [currentCategoryConfig, toUnitId]);

  const handleCategoryChange = (catId: UnitCategory) => {
    const newConfig = CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
    setActiveCategory(catId);
    setFromUnitId(newConfig.units[0].id);
    setToUnitId(newConfig.units[1] ? newConfig.units[1].id : newConfig.units[0].id);
  };

  const numericInput = parseFloat(inputValue);
  const rawConvertedResult = useMemo(() => {
    if (isNaN(numericInput)) return 0;
    return convertUnits(numericInput, fromUnit, toUnit);
  }, [numericInput, fromUnit, toUnit]);

  const formattedResult = useMemo(() => {
    if (isNaN(numericInput)) return "0";
    if (rawConvertedResult === 0) return "0";
    const abs = Math.abs(rawConvertedResult);
    if (abs < 0.00001 || abs >= 1e8) {
      return rawConvertedResult.toExponential(precision);
    }
    return Number(rawConvertedResult.toFixed(precision)).toString();
  }, [numericInput, rawConvertedResult, precision]);

  const handleSwap = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  const handleCopy = async () => {
    const textToCopy = `${inputValue} ${fromUnit.symbol} = ${formattedResult} ${toUnit.symbol}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const handleClear = () => {
    setInputValue("0");
  };

  const categoryMatrix = useMemo(() => {
    const baseVal = isNaN(numericInput) ? 1 : numericInput;
    return currentCategoryConfig.units.map((u) => {
      const res = convertUnits(baseVal, fromUnit, u);
      return {
        unit: u,
        value: formatResultNumber(res),
      };
    });
  }, [numericInput, fromUnit, currentCategoryConfig]);

  return (
    <div className="w-full space-y-8">

      {/* ── Two-Column Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: INPUT & SELECTION ══════════════════ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between self-start">
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                Measurement Parameters
              </span>
            </div>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Select Domain Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isActive ? "text-white" : "text-indigo-600"}`} />
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="unit-input-val" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Source Value
              </label>
              <input
                id="unit-input-val"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value..."
                className="w-full text-lg font-mono font-bold p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-end">
              <div>
                <label htmlFor="from-unit-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  From Unit
                </label>
                <select
                  id="from-unit-select"
                  value={fromUnitId}
                  onChange={(e) => setFromUnitId(e.target.value)}
                  className="w-full text-sm font-medium p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  {currentCategoryConfig.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSwap}
                title="Swap Units"
                className="h-[46px] w-[46px] flex items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:scale-105 transition-all self-end justify-self-center"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>

              <div>
                <label htmlFor="to-unit-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  To Unit
                </label>
                <select
                  id="to-unit-select"
                  value={toUnitId}
                  onChange={(e) => setToUnitId(e.target.value)}
                  className="w-full text-sm font-medium p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  {currentCategoryConfig.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <label htmlFor="precision-select" className="text-xs font-semibold text-slate-500">Decimals:</label>
                <select
                  id="precision-select"
                  value={precision}
                  onChange={(e) => setPrecision(Number(e.target.value))}
                  className="text-xs font-mono font-semibold p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                >
                  {[0, 2, 4, 6, 8, 10].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Value
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: CONVERTED DISPLAY ══════════════════ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between self-start">
          <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-200" />
              <span className="text-sm font-semibold">Converted Result</span>
            </div>
            <span className="text-xs bg-indigo-500/30 px-2.5 py-1 rounded-full text-indigo-100 font-mono">
              {currentCategoryConfig.name}
            </span>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100 rounded-2xl text-center space-y-2 p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Calculated Equivalent
              </p>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 break-all">
                {formattedResult}{" "}
                <span className="text-indigo-600 text-2xl font-sans">{toUnit.symbol}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono pt-1">
                {inputValue} {fromUnit.symbol} = {formattedResult} {toUnit.symbol}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                copied
                  ? "bg-green-600 text-white shadow-md shadow-green-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Result Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Conversion Result
                </>
              )}
            </button>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                All Units Breakdown ({currentCategoryConfig.name})
              </h3>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/30">
                {categoryMatrix.map(({ unit, value }) => (
                  <div
                    key={unit.id}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs ${
                      unit.id === toUnit.id ? "bg-indigo-50/80 font-bold text-indigo-900" : "text-slate-700"
                    }`}
                  >
                    <span className="truncate pr-2">
                      {unit.name} ({unit.symbol})
                    </span>
                    <span className="font-mono font-semibold text-slate-900 flex-shrink-0">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT CARDS (HIGH-AUTHORITY SEO)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        {/* Card 1: Architectural Overview & Standard Precision */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>High-Precision Multi-Domain Unit Conversion System</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The Universal Unit Converter Suite provides instant, double-precision floating-point conversions across 11 core physical and engineering dimensions: Length, Weight/Mass, Temperature, Volume, Speed, Pressure, Power, Voltage, Time, Area, and Torque. Designed for engineers, researchers, technical professionals, students, and software developers, it seamlessly bridges the gap between International System of Units (SI) metric standards and US Customary / Imperial systems.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Unlike basic lookup tools that introduce compound rounding errors, our execution engine standardizes inputs into a single high-precision SI base unit (such as meters for distance, kilograms for mass, or Pascals for pressure) before deriving target values. This two-phase transformation pipeline guarantees exact scalar integrity across both macro and sub-atomic scale conversions.
          </p>
        </div>

        {/* Card 2: Technical Conversion Mechanics & Mathematical Formulas */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Mathematical Conversion Mechanics & Non-Linear Transformations</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            For proportional physical dimensions (such as Length, Mass, Volume, and Pressure), conversions rely on linear scaling ratios anchored to fixed SI definitions. The core transformation equation is expressed as:
          </p>
          <div className="bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl overflow-x-auto my-3">
            {"V_{target} = \\left( \\frac{V_{input}}{R_{from}} \\right) \\times R_{to}"}
          </div>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Where $V{'{'}input{'}'}$ represents the user input value, $R{'{'}from{'}'}$ is the scalar ratio of the source unit relative to the base SI unit, and $R{'{'}to{'}'}$ is the target unit ratio.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Non-proportional dimensions such as <strong>Temperature</strong> cannot be scaled linearly due to differing thermodynamic zero points (Absolute Zero vs. the freezing point of water). Our engine applies custom functional transformations for thermodynamic conversions:
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 space-y-1">
              <span className="font-bold text-indigo-600 font-sans block">Celsius to Fahrenheit</span>
              <code>T_(°F) = (T_(°C) × 9/5) + 32</code>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 space-y-1">
              <span className="font-bold text-indigo-600 font-sans block">Fahrenheit to Celsius</span>
              <code>T_(°C) = (T_(°F) - 32) × 5/9</code>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 space-y-1">
              <span className="font-bold text-indigo-600 font-sans block">Celsius to Kelvin</span>
              <code>T_(K) = T_(°C) + 273.15</code>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 space-y-1">
              <span className="font-bold text-indigo-600 font-sans block">Fahrenheit to Rankine</span>
              <code>T_(°R) = T_(°F) + 491.67</code>
            </div>
          </div>
        </div>

        {/* Card 3: Supported Units Reference Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Supported Physical Dimensions & Base Standards</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            The table below highlights the base SI standard, primary conversion factors, and common application domains across the 11 supported dimensional suites:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Base Unit</th>
                  <th className="px-4 py-3">Supported Measurement Units</th>
                  <th className="px-4 py-3">Primary Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                <tr className="bg-white">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Length</td>
                  <td className="px-4 py-2.5 font-mono">Meter (m)</td>
                  <td className="px-4 py-2.5">m, km, cm, mm, µm, nm, mi, yd, ft, in, nmi</td>
                  <td className="px-4 py-2.5">Civil & Mechanical Engineering</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Weight / Mass</td>
                  <td className="px-4 py-2.5 font-mono">Kilogram (kg)</td>
                  <td className="px-4 py-2.5">kg, g, mg, µg, t, lb, oz, st, long ton, short ton</td>
                  <td className="px-4 py-2.5">Logistics, Physics & Trade</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Temperature</td>
                  <td className="px-4 py-2.5 font-mono">Celsius (°C)</td>
                  <td className="px-4 py-2.5">°C, °F, Kelvin (K), Rankine (°R)</td>
                  <td className="px-4 py-2.5">Thermodynamics & HVAC</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Pressure</td>
                  <td className="px-4 py-2.5 font-mono">Pascal (Pa)</td>
                  <td className="px-4 py-2.5">Pa, kPa, MPa, bar, mbar, psi, atm, Torr</td>
                  <td className="px-4 py-2.5">Pneumatics & Aviation</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Power</td>
                  <td className="px-4 py-2.5 font-mono">Watt (W)</td>
                  <td className="px-4 py-2.5">W, kW, MW, hp (mechanical), PS (metric), BTU/h</td>
                  <td className="px-4 py-2.5">Electrical & Automotive Systems</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Torque</td>
                  <td className="px-4 py-2.5 font-mono">Newton Meter (N·m)</td>
                  <td className="px-4 py-2.5">N·m, kN·m, ft·lbf, in·lbf, kgf·m</td>
                  <td className="px-4 py-2.5">Automotive & Structural Fastening</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: How to Use the Universal Converter */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Use the Universal Unit Converter Suite</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Select Domain Category",
                body: "Click on any of the 11 domain buttons (e.g., Length, Pressure, Torque) in the top grid selector to load the corresponding unit scales.",
              },
              {
                step: "02",
                title: "Enter Source Value",
                body: "Type your numeric value into the Source Value input field. Standard, decimal, and scientific numbers are instantly evaluated.",
              },
              {
                step: "03",
                title: "Choose Units & Swap",
                body: "Select your 'From Unit' and 'To Unit' from the drop-down menus. Click the central swap button to instantly reverse the conversion direction.",
              },
              {
                step: "04",
                title: "Set Decimal Precision",
                body: "Adjust the precision selector (from 0 to 10 decimal places) to format the output for exact academic, engineering, or general use.",
              },
              {
                step: "05",
                title: "Inspect Full Breakdown",
                body: "Review the 'All Units Breakdown' panel to view how your input value scales across every single unit within the active category simultaneously.",
              },
              {
                step: "06",
                title: "One-Click Copy Result",
                body: "Click 'Copy Conversion Result' to copy the formatted equation directly to your system clipboard for inclusion in reports or documentation.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold tracking-wide">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Industrial & Field Applications */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Engineering & Industrial Applications</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Mechanical & Automotive Engineering</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Convert engine torque specifications between Foot-Pounds ($ft\\cdot lbf$) and Newton Meters ($N\\cdot m$) or calibrate pneumatic pressures from bar to PSI during vehicle maintenance and component manufacturing.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Aerospace & Maritime Logistics</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamlessly translate airspeeds between Knots, Mach numbers, and meters per second or convert fuel payloads between Metric Tons, Imperial Gallons, and US Gallons for flight planning.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Electrical Grid & Power Systems</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluate high-voltage transmission lines across Megavolt (MV), Kilovolt (kV), and Millivolt (mV) ratings while correlating electrical power metrics between Kilowatts (kW) and Horsepower (hp).
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Scientific Research & Laboratories</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Convert microgram and nanometer chemical formulations directly into base SI units for peer-reviewed research papers and international scientific collaboration.
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: FAQ Section (Static Non-Accordion) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How accurate are the conversion results across extreme values?",
                a: "Conversions use standard double-precision 64-bit IEEE 754 floating-point calculations. Extremely large or small numbers automatically switch to clean scientific notation to prevent display overflow while retaining strict scalar precision.",
              },
              {
                q: "Is my data sent to an external server when converting?",
                a: "No. The Universal Unit Converter Suite executes 100% client-side in React TypeScript directly within your web browser. Input values and calculation results remain strictly private and never leave your local session.",
              },
              {
                q: "Why are temperature conversions calculated differently than length or mass?",
                a: "Temperature scales do not share a common zero point (0°C equals 32°F and 273.15 Kelvin). As a result, temperature transformations require additive scalar offsets in addition to multiplicative scaling factors.",
              },
              {
                q: "What is the difference between US Short Ton and Imperial Long Ton?",
                a: "A US Short Ton equals 2,000 pounds (907.185 kg), whereas an Imperial Long Ton (historically used in the UK) equals 2,240 pounds (1016.05 kg). Both units are provided under the Weight & Mass suite.",
              },
              {
                q: "How does the decimal precision toggle work?",
                a: "The precision dropdown allows you to lock output results to a specific number of decimal places (from 0 to 10). This rounds displayed values without altering underlying floating-point calculations.",
              },
              {
                q: "Can I convert compound units like Torque and Pressure?",
                a: "Yes. Torque includes Newton Meters (N·m), Pound-Feet (ft·lbf), and Pound-Inches (in·lbf). Pressure covers Pascals, Kilopascals, Megapascals, bar, millibar, PSI, Atmospheres, and Torr.",
              },
            ].map(({ q, a }, idx) => (
              <div
                key={idx}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-1.5 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-3.5">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 7: Platform Features */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Platform Advantages</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl">
              <Shield className="w-5 h-5 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm mb-1">100% Client-Side Sandbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero network roundtrips or API latency. All conversions execute locally with complete data privacy.
              </p>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl">
              <Blocks className="w-5 h-5 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm mb-1">11 Domain Suites</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consolidates 11 standalone conversion tools into a single responsive, unified workstation.
              </p>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl">
              <Activity className="w-5 h-5 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Precision Formatting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure precision up to 10 decimal places with automatic scientific notation scaling for extreme values.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── JSON-LD Structured Data Schemas ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Universal Unit Converter Suite",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description:
              "High-precision universal unit converter supporting Length, Weight, Temperature, Volume, Speed, Pressure, Power, Voltage, Time, Area, and Torque.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "11 physical & engineering domain suites",
              "Double-precision 64-bit IEEE 754 calculations",
              "Dynamic multi-unit breakdown matrix",
              "Customizable decimal precision formatting",
              "100% client-side data security",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How accurate are the conversion results across extreme values?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Conversions use standard double-precision 64-bit IEEE 754 floating-point calculations. Extremely large or small values automatically scale into clean scientific notation.",
                },
              },
              {
                "@type": "Question",
                name: "Is my data sent to an external server when converting?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. The Universal Unit Converter Suite operates 100% client-side in React TypeScript within your browser.",
                },
              },
              {
                "@type": "Question",
                name: "Why are temperature conversions calculated differently than length or mass?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Temperature scales do not share a common zero point (0°C is 32°F and 273.15 K). Therefore, temperature transformations require additive offsets in addition to multiplicative scaling factors.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between US Short Ton and Imperial Long Ton?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A US Short Ton equals 2,000 pounds (907.185 kg), whereas an Imperial Long Ton equals 2,240 pounds (1016.05 kg). Both are included in our Weight & Mass suite.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  CreditCard,
  User,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  ShieldCheck,
  Info,
  Database,
  Cpu,
  Table,
  Lock,
  Zap,
  HelpCircle,
  Building,
  Globe,
  MapPin,
  Calendar,
  Key,
  ListOrdered,
  AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "jcb";

interface CardBrandConfig {
  name: string;
  prefixes: string[];
  length: number;
  cvvLength: number;
}

interface GeneratedProfile {
  id: string;
  brand: CardBrand;
  brandName: string;
  cardNumber: string;
  formattedCardNumber: string;
  expMonth: string;
  expYear: string;
  expFormatted: string;
  cvv: string;
  cardholderName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  email: string;
  ssn: string;
}

// ─────────────────────────────────────────────────────────────
// BRAND DATA & MOCK CONSTANTS
// ─────────────────────────────────────────────────────────────

const BRAND_CONFIGS: Record<CardBrand, CardBrandConfig> = {
  visa: { name: "Visa", prefixes: ["4539", "4556", "4916", "4175"], length: 16, cvvLength: 3 },
  mastercard: { name: "Mastercard", prefixes: ["5100", "5200", "5300", "5400", "5500"], length: 16, cvvLength: 3 },
  amex: { name: "American Express", prefixes: ["3400", "3700", "3782"], length: 15, cvvLength: 4 },
  discover: { name: "Discover", prefixes: ["6011", "6440", "6500"], length: 16, cvvLength: 3 },
  jcb: { name: "JCB", prefixes: ["3528", "3589"], length: 16, cvvLength: 3 },
};

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Donald", "Sandra"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const STREET_NAMES = [
  "Main St", "High St", "Maple Ave", "Oak St", "Washington St", "Park Ave",
  "Elm St", "Cedar St", "Pine St", "Lake Rd", "Hill Rd", "Broadway",
  "Sunset Blvd", "River Rd", "Lincoln Hwy"
];

const CITIES_STATES = [
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Los Angeles", state: "CA", zip: "90001" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Houston", state: "TX", zip: "77001" },
  { city: "Phoenix", state: "AZ", zip: "85001" },
  { city: "Philadelphia", state: "PA", zip: "19101" },
  { city: "San Antonio", state: "TX", zip: "78201" },
  { city: "San Diego", state: "CA", zip: "92101" },
  { city: "Dallas", state: "TX", zip: "75201" },
  { city: "Austin", state: "TX", zip: "78701" },
];

// ─────────────────────────────────────────────────────────────
// LUHN ALGORITHM & MOCK GENERATION HELPERS
// ─────────────────────────────────────────────────────────────

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateLuhnNumber(prefix: string, length: number): string {
  let number = prefix;
  while (number.length < length - 1) {
    number += Math.floor(Math.random() * 10).toString();
  }

  // Calculate checksum using Luhn Algorithm
  let sum = 0;
  let isEven = true; // Starting from rightmost digit (which is the check digit)

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return number + checkDigit.toString();
}

function formatCardNumber(cardNumber: string, brand: CardBrand): string {
  if (brand === "amex") {
    return cardNumber.replace(/^(\d{4})(\d{6})(\d{5})$/, "$1 $2 $3");
  }
  return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}

function generateSingleProfile(selectedBrand: CardBrand): GeneratedProfile {
  const config = BRAND_CONFIGS[selectedBrand];
  const prefix = getRandomElement(config.prefixes);
  const rawCardNumber = generateLuhnNumber(prefix, config.length);

  const now = new Date();
  const currentYear = now.getFullYear();
  const expYear = (currentYear + getRandomInt(1, 5)).toString().slice(-2);
  const expMonth = getRandomInt(1, 12).toString().padStart(2, "0");

  let cvv = "";
  for (let i = 0; i < config.cvvLength; i++) {
    cvv += Math.floor(Math.random() * 10).toString();
  }

  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const cardholderName = `${firstName} ${lastName}`;

  const location = getRandomElement(CITIES_STATES);
  const streetNumber = getRandomInt(100, 9999);
  const streetName = getRandomElement(STREET_NAMES);

  const phoneArea = getRandomInt(200, 999);
  const phoneMid = getRandomInt(200, 999);
  const phoneLast = getRandomInt(1000, 9999);

  const ssnGroup1 = getRandomInt(100, 899).toString().padStart(3, "0");
  const ssnGroup2 = getRandomInt(10, 99).toString().padStart(2, "0");
  const ssnGroup3 = getRandomInt(1000, 9999).toString().padStart(4, "0");

  return {
    id: Math.random().toString(36).substring(2, 9),
    brand: selectedBrand,
    brandName: config.name,
    cardNumber: rawCardNumber,
    formattedCardNumber: formatCardNumber(rawCardNumber, selectedBrand),
    expMonth,
    expYear,
    expFormatted: `${expMonth}/${expYear}`,
    cvv,
    cardholderName,
    address: {
      street: `${streetNumber} ${streetName}`,
      city: location.city,
      state: location.state,
      zip: location.zip,
      country: "United States",
    },
    phone: `+1 (${phoneArea}) ${phoneMid}-${phoneLast}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(10, 99)}@example-test.com`,
    ssn: `${ssnGroup1}-${ssnGroup2}-${ssnGroup3}`,
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function CreditCardGenerator() {
  const [selectedBrand, setSelectedBrand] = useState<CardBrand>("visa");
  const [quantity, setQuantity] = useState<number>(1);
  const [profiles, setProfiles] = useState<GeneratedProfile[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      setProfiles([generateSingleProfile("visa")]);
    }
  }, [hydrated]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const newProfiles: GeneratedProfile[] = [];
    for (let i = 0; i < quantity; i++) {
      newProfiles.push(generateSingleProfile(selectedBrand));
    }
    setProfiles(newProfiles);
  }, [selectedBrand, quantity]);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* fallback */
    }
  };

  const copyAllAsJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(profiles, null, 2));
      setCopiedId("json-all");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* fallback */
    }
  };

  const copyAllAsCSV = async () => {
    if (profiles.length === 0) return;
    const headers = ["Brand", "Card Number", "Exp Month", "Exp Year", "CVV", "Cardholder", "Street", "City", "State", "Zip", "Phone", "Email", "SSN"];
    const rows = profiles.map((p) => [
      p.brandName,
      p.cardNumber,
      p.expMonth,
      p.expYear,
      p.cvv,
      `"${p.cardholderName}"`,
      `"${p.address.street}"`,
      p.address.city,
      p.address.state,
      p.address.zip,
      p.phone,
      p.email,
      p.ssn,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopiedId("csv-all");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* fallback */
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock_credit_cards_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const primaryProfile = profiles.length > 0 ? profiles[0] : null;

  return (
    <div className="w-full space-y-8">
      {/* Legal Compliance Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl p-4 shadow-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm text-amber-900 leading-relaxed">
          <strong>LEGAL DISCLAIMER & NOTICE:</strong> All card numbers, expiry dates, CVVs, names, and addresses generated by this tool are <strong>100% mathematically fictitious and synthetically generated</strong> using the standard Luhn Algorithm. They are <strong>NOT real payment cards</strong>, contain no financial value, cannot process transactions, and are strictly intended for payment gateway integration testing, software development, and QA sandboxes.
        </div>
      </div>

      {/* ── Two-Column Workspace Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: CONTROLS & PRIMARY CARD ══════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-none">Generator Options</h2>
                  <p className="text-xs text-indigo-200 mt-1">Configure brand & batch parameters</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Card Network
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(BRAND_CONFIGS) as CardBrand[]).map((brandKey) => {
                    const isSelected = selectedBrand === brandKey;
                    return (
                      <button
                        key={brandKey}
                        onClick={() => setSelectedBrand(brandKey)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all min-h-[44px] ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{BRAND_CONFIGS[brandKey].name}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Batch Generation Quantity
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {quantity} {quantity === 1 ? "Record" : "Records"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuantity(num)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all min-h-[44px] ${
                        quantity === num
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {num} {num === 1 ? "Card" : "Cards"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                Generate New {selectedBrand.toUpperCase()} Data
              </button>
            </div>
          </div>

          {/* 3D Realistic Credit Card Graphic */}
          {primaryProfile && (
            <div className="relative rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800 overflow-hidden space-y-6">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-7 rounded bg-amber-400/80 border border-amber-300/40 flex items-center justify-center shadow-inner">
                    <div className="w-6 h-4 border border-amber-600/40 rounded-sm grid grid-cols-2 gap-0.5">
                      <div className="border-r border-amber-600/40"></div>
                      <div></div>
                    </div>
                  </div>
                  <span className="text-[10px] tracking-widest uppercase font-mono text-slate-400">TEST SANDBOX</span>
                </div>
                <span className="text-lg font-bold italic tracking-wider text-indigo-300">
                  {primaryProfile.brandName}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Card Number</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xl md:text-2xl font-bold tracking-widest text-slate-100">
                    {primaryProfile.formattedCardNumber}
                  </p>
                  <button
                    onClick={() => copyToClipboard(primaryProfile.cardNumber, "primary-card")}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Copy Card Number"
                  >
                    {copiedField === "primary-card" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Cardholder</p>
                  <p className="text-xs font-semibold text-slate-200 truncate">{primaryProfile.cardholderName}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Expires</p>
                  <p className="text-xs font-mono font-semibold text-slate-200">{primaryProfile.expFormatted}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">CVV / CVC</p>
                  <p className="text-xs font-mono font-semibold text-slate-200">{primaryProfile.cvv}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════ RIGHT PANEL: MOCK IDENTITY & BATCH DATA ══════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-none">Mock Identity Details</h2>
                  <p className="text-xs text-indigo-200 mt-1">Generated sandbox user details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAllAsJSON}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all flex items-center gap-1.5"
                >
                  {copiedId === "json-all" ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  JSON
                </button>
                <button
                  onClick={copyAllAsCSV}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all flex items-center gap-1.5"
                >
                  {copiedId === "csv-all" ? <Check className="w-3.5 h-3.5 text-green-300" /> : <FileText className="w-3.5 h-3.5" />}
                  CSV
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {primaryProfile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Full Name</span>
                    <div className="flex justify-between items-center font-medium text-slate-800">
                      <span>{primaryProfile.cardholderName}</span>
                      <button
                        onClick={() => copyToClipboard(primaryProfile.cardholderName, "name")}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {copiedField === "name" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Email Address</span>
                    <div className="flex justify-between items-center font-medium text-slate-800 truncate">
                      <span className="truncate">{primaryProfile.email}</span>
                      <button
                        onClick={() => copyToClipboard(primaryProfile.email, "email")}
                        className="text-slate-400 hover:text-indigo-600 flex-shrink-0 ml-1"
                      >
                        {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Street Address</span>
                    <div className="flex justify-between items-center font-medium text-slate-800">
                      <span>{primaryProfile.address.street}</span>
                      <button
                        onClick={() => copyToClipboard(primaryProfile.address.street, "street")}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {copiedField === "street" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">City, State, Zip</span>
                    <div className="flex justify-between items-center font-medium text-slate-800">
                      <span>{primaryProfile.address.city}, {primaryProfile.address.state} {primaryProfile.address.zip}</span>
                      <button
                        onClick={() => copyToClipboard(`${primaryProfile.address.city}, ${primaryProfile.address.state} ${primaryProfile.address.zip}`, "citystate")}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {copiedField === "citystate" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Phone Number</span>
                    <div className="flex justify-between items-center font-medium text-slate-800">
                      <span>{primaryProfile.phone}</span>
                      <button
                        onClick={() => copyToClipboard(primaryProfile.phone, "phone")}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {copiedField === "phone" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Mock SSN</span>
                    <div className="flex justify-between items-center font-mono font-medium text-slate-800">
                      <span>{primaryProfile.ssn}</span>
                      <button
                        onClick={() => copyToClipboard(primaryProfile.ssn, "ssn")}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {copiedField === "ssn" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Action */}
              <button
                onClick={downloadJSON}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Download Batch Payload (.JSON)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Batch Table View (If > 1 record) ── */}
      {profiles.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" />
              Generated Batch Payload ({profiles.length} Cards)
            </h3>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-semibold">
                  <th className="p-3">Brand</th>
                  <th className="p-3 font-mono">Card Number</th>
                  <th className="p-3">Exp</th>
                  <th className="p-3 font-mono">CVV</th>
                  <th className="p-3">Cardholder</th>
                  <th className="p-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-sans font-semibold text-slate-700">{p.brandName}</td>
                    <td className="p-3 font-bold text-slate-900">{p.cardNumber}</td>
                    <td className="p-3 text-slate-600">{p.expFormatted}</td>
                    <td className="p-3 text-slate-600">{p.cvv}</td>
                    <td className="p-3 font-sans text-slate-800">{p.cardholderName}</td>
                    <td className="p-3 font-sans text-slate-600">{p.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: Luhn Algorithm Validation & Mathematical Mechanics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Luhn Algorithm Validation & Mathematical Mechanics</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              The primary mechanism used to verify test payment card structures across modern e-commerce systems is the <strong>Luhn Algorithm</strong> (also recognized as the <em>Modulus 10</em> or <em>Mod 10</em> checksum algorithm). Developed by IBM scientist Hans Peter Luhn in 1954, this simple checksum formula distinguishes valid digit sequences from accidental single-digit errors or transposition mistakes during manual input.
            </p>
            <p>
              When a payment gateway processes a primary account number (PAN), it executes the Luhn check prior to contacting financial routing networks (such as VisaNet or Mastercard BankNet). The algorithm works through a four-step process:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Beginning with the rightmost check digit, move leftward, doubling the value of every second digit.</li>
              <li>If doubling a digit yields a number greater than 9 (e.g., $7 \times 2 = 14$), sum the constituent digits of the product ($1 + 4 = 5$) or subtract 9.</li>
              <li>Sum all final modified and unmodified digits together.</li>
              <li>If the total modulo 10 equals zero (Total mod 10 == 0), the card sequence passes structural validation.</li>
            </ol>
            <p>
              Our generator executes this exact algorithm client-side, ensuring every generated card string passes front-end validation checks in checkout forms and staging environments.
            </p>
          </div>
        </div>

        {/* Card 2: Industry Issuer Identification Numbers (IIN / BIN Table) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Industry Issuer Identification Numbers (IIN / BIN Reference)</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            The initial digits of any payment card represent the <strong>Issuer Identification Number (IIN)</strong>, historically referred to as the <strong>Bank Identification Number (BIN)</strong>. Assigned according to ISO/IEC 7812 standards, these digits identify the card network and issuing institution.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Card Network</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Major Industry Identifier (MII)</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Standard Prefixes (IIN / BIN)</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">PAN Length</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">CVV Length</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Visa", "4 (Banking and Financial)", "4539, 4556, 4916, 4175", "16 digits", "3 digits"],
                  ["Mastercard", "5 (Banking and Financial)", "5100 - 5500, 2221 - 2720", "16 digits", "3 digits"],
                  ["American Express", "3 (Travel and Entertainment)", "34, 37", "15 digits", "4 digits"],
                  ["Discover", "6 (Merchandise and Banking)", "6011, 644 - 649, 65", "16 digits", "3 digits"],
                  ["JCB", "3 (Japanese Credit Bureau)", "3528 - 3589", "16 digits", "3 digits"],
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Enterprise Integration & QA Sandbox Use Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Enterprise Integration & QA Sandbox Use Cases</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Payment Gateway Staging",
                body: "Validate webhooks, response codes, and payment success/failure flows in Stripe, PayPal, Adyen, and Square sandbox environments without exposing actual financial credentials.",
              },
              {
                title: "UI/UX Checkout Testing",
                body: "Verify front-end input masks, brand logo detection, credit card field formatting, expiration date parsing, and real-time form validation UX.",
              },
              {
                title: "Database Load & Stress Testing",
                body: "Generate high-volume batch mock profiles (JSON/CSV) to test seed data performance, schema scaling, and database write throughput during development.",
              },
              {
                title: "Compliance & Security Auditing",
                body: "Test PCI-DSS scope boundaries by ensuring logging software, analytics tools, and error tracking systems redact fake card numbers properly.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">{title}</h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Frequently Asked Questions */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Can these test credit card numbers be used to make actual purchases?",
                a: "No. These numbers are purely mathematical constructs generated via the Luhn algorithm. They do not correspond to active accounts, have no money attached, and will be immediately declined by live payment processors.",
              },
              {
                q: "How does Stripe, PayPal, or Square handle these test numbers?",
                a: "Payment processors provide dedicated sandbox modes. When in sandbox or test mode, payment gateways accept Luhn-valid cards (or specific test PANs provided in their documentation) to simulate successful or failed charge responses.",
              },
              {
                q: "Is generating test card numbers legal?",
                a: "Yes. Generating mathematical test numbers for software development, QA testing, and UI validation is completely legal. Attempting to use generated numbers fraudulently to obtain goods or services is illegal.",
              },
              {
                q: "Is any identity or credit card data stored on your servers?",
                a: "No. The entire generation process occurs 100% client-side in your web browser. No data is sent to external servers or stored in any database.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Test Credit Card & Mock Identity Generator",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript",
            description:
              "Generate valid test credit card numbers using the Luhn Algorithm along with complete mock identity profiles for software development and staging environments.",
            featureList: [
              "Luhn algorithm checksum generation",
              "Visa, Mastercard, Amex, Discover, and JCB support",
              "Complete mock profile generation (SSN, Email, Address, Phone)",
              "JSON & CSV batch payload exports",
              "100% client-side execution",
            ],
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
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
                name: "Can these test credit card numbers be used to make actual purchases?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. These numbers are purely mathematical constructs generated via the Luhn algorithm. They do not correspond to active accounts.",
                },
              },
              {
                "@type": "Question",
                name: "Is generating test card numbers legal?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Generating mathematical test numbers for software development, QA testing, and UI validation is completely legal.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calculator,
  Receipt,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  FileSpreadsheet,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  PieChart,
  ArrowRightLeft,
  Building2,
  Scale,
  ListOrdered,
  FileText,
  AlertCircle,
  Download,
  Info,
  Zap,
  Shield,
  Briefcase,
  Layers,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types & Interfaces
// ─────────────────────────────────────────────────────────────

type TaxCalculationMode = "add-tax" | "extract-tax";

interface ExpenseLineItem {
  id: string;
  description: string;
  amount: number;
  taxRate: number;
  isTaxable: boolean;
}

interface USStateTaxRate {
  state: string;
  code: string;
  stateRate: number;
  avgLocalRate: number;
  combinedAvgRate: number;
}

// ─────────────────────────────────────────────────────────────
//  US State Tax Data Presets
// ─────────────────────────────────────────────────────────────

const US_STATE_TAX_RATES: USStateTaxRate[] = [
  { state: "Alabama", code: "AL", stateRate: 4.0, avgLocalRate: 5.29, combinedAvgRate: 9.29 },
  { state: "Alaska", code: "AK", stateRate: 0.0, avgLocalRate: 1.76, combinedAvgRate: 1.76 },
  { state: "Arizona", code: "AZ", stateRate: 5.6, avgLocalRate: 2.80, combinedAvgRate: 8.40 },
  { state: "Arkansas", code: "AR", stateRate: 6.5, avgLocalRate: 2.97, combinedAvgRate: 9.47 },
  { state: "California", code: "CA", stateRate: 7.25, avgLocalRate: 1.60, combinedAvgRate: 8.85 },
  { state: "Colorado", code: "CO", stateRate: 2.9, avgLocalRate: 4.88, combinedAvgRate: 7.78 },
  { state: "Connecticut", code: "CT", stateRate: 6.35, avgLocalRate: 0.0, combinedAvgRate: 6.35 },
  { state: "Delaware", code: "DE", stateRate: 0.0, avgLocalRate: 0.0, combinedAvgRate: 0.0 },
  { state: "Florida", code: "FL", stateRate: 6.0, avgLocalRate: 1.01, combinedAvgRate: 7.01 },
  { state: "Georgia", code: "GA", stateRate: 4.0, avgLocalRate: 3.38, combinedAvgRate: 7.38 },
  { state: "Hawaii", code: "HI", stateRate: 4.0, avgLocalRate: 0.44, combinedAvgRate: 4.44 },
  { state: "Idaho", code: "ID", stateRate: 6.0, avgLocalRate: 0.03, combinedAvgRate: 6.03 },
  { state: "Illinois", code: "IL", stateRate: 6.25, avgLocalRate: 2.57, combinedAvgRate: 8.82 },
  { state: "Indiana", code: "IN", stateRate: 7.0, avgLocalRate: 0.0, combinedAvgRate: 7.0 },
  { state: "Iowa", code: "IA", stateRate: 6.0, avgLocalRate: 0.94, combinedAvgRate: 6.94 },
  { state: "Kansas", code: "KS", stateRate: 6.5, avgLocalRate: 2.17, combinedAvgRate: 8.67 },
  { state: "Kentucky", code: "KY", stateRate: 6.0, avgLocalRate: 0.0, combinedAvgRate: 6.0 },
  { state: "Louisiana", code: "LA", stateRate: 4.45, avgLocalRate: 5.11, combinedAvgRate: 9.56 },
  { state: "Maine", code: "ME", stateRate: 5.5, avgLocalRate: 0.0, combinedAvgRate: 5.5 },
  { state: "Maryland", code: "MD", stateRate: 6.0, avgLocalRate: 0.0, combinedAvgRate: 6.0 },
  { state: "Massachusetts", code: "MA", stateRate: 6.25, avgLocalRate: 0.0, combinedAvgRate: 6.25 },
  { state: "Michigan", code: "MI", stateRate: 6.0, avgLocalRate: 0.0, combinedAvgRate: 6.0 },
  { state: "Minnesota", code: "MN", stateRate: 6.88, avgLocalRate: 1.15, combinedAvgRate: 8.03 },
  { state: "Mississippi", code: "MS", stateRate: 7.0, avgLocalRate: 0.07, combinedAvgRate: 7.07 },
  { state: "Missouri", code: "MO", stateRate: 4.23, avgLocalRate: 4.10, combinedAvgRate: 8.33 },
  { state: "Montana", code: "MT", stateRate: 0.0, avgLocalRate: 0.0, combinedAvgRate: 0.0 },
  { state: "Nebraska", code: "NE", stateRate: 5.5, avgLocalRate: 1.44, combinedAvgRate: 6.94 },
  { state: "Nevada", code: "NV", stateRate: 6.85, avgLocalRate: 1.38, combinedAvgRate: 8.23 },
  { state: "New Hampshire", code: "NH", stateRate: 0.0, avgLocalRate: 0.0, combinedAvgRate: 0.0 },
  { state: "New Jersey", code: "NJ", stateRate: 6.63, avgLocalRate: -0.03, combinedAvgRate: 6.60 },
  { state: "New Mexico", code: "NM", stateRate: 4.88, avgLocalRate: 2.84, combinedAvgRate: 7.72 },
  { state: "New York", code: "NY", stateRate: 4.0, avgLocalRate: 4.53, combinedAvgRate: 8.53 },
  { state: "North Carolina", code: "NC", stateRate: 4.75, avgLocalRate: 2.25, combinedAvgRate: 7.00 },
  { state: "North Dakota", code: "ND", stateRate: 5.0, avgLocalRate: 2.04, combinedAvgRate: 7.04 },
  { state: "Ohio", code: "OH", stateRate: 5.75, avgLocalRate: 1.49, combinedAvgRate: 7.24 },
  { state: "Oklahoma", code: "OK", stateRate: 4.5, avgLocalRate: 4.49, combinedAvgRate: 8.99 },
  { state: "Oregon", code: "OR", stateRate: 0.0, avgLocalRate: 0.0, combinedAvgRate: 0.0 },
  { state: "Pennsylvania", code: "PA", stateRate: 6.0, avgLocalRate: 0.34, combinedAvgRate: 6.34 },
  { state: "Rhode Island", code: "RI", stateRate: 7.0, avgLocalRate: 0.0, combinedAvgRate: 7.0 },
  { state: "South Carolina", code: "SC", stateRate: 6.0, avgLocalRate: 1.43, combinedAvgRate: 7.43 },
  { state: "South Dakota", code: "SD", stateRate: 4.2, avgLocalRate: 1.91, combinedAvgRate: 6.11 },
  { state: "Tennessee", code: "TN", stateRate: 7.0, avgLocalRate: 2.55, combinedAvgRate: 9.55 },
  { state: "Texas", code: "TX", stateRate: 6.25, avgLocalRate: 1.95, combinedAvgRate: 8.20 },
  { state: "Utah", code: "UT", stateRate: 6.10, avgLocalRate: 1.15, combinedAvgRate: 7.25 },
  { state: "Vermont", code: "VT", stateRate: 6.0, avgLocalRate: 0.36, combinedAvgRate: 6.36 },
  { state: "Virginia", code: "VA", stateRate: 5.3, avgLocalRate: 0.47, combinedAvgRate: 5.77 },
  { state: "Washington", code: "WA", stateRate: 6.5, avgLocalRate: 2.88, combinedAvgRate: 9.38 },
  { state: "West Virginia", code: "WV", stateRate: 6.0, avgLocalRate: 0.57, combinedAvgRate: 6.57 },
  { state: "Wisconsin", code: "WI", stateRate: 5.0, avgLocalRate: 0.43, combinedAvgRate: 5.43 },
  { state: "Wyoming", code: "WY", stateRate: 4.0, avgLocalRate: 1.36, combinedAvgRate: 5.36 },
];

const INITIAL_EXPENSE_ITEMS: ExpenseLineItem[] = [
  { id: "1", description: "Office Supplies & Paper", amount: 250.0, taxRate: 8.25, isTaxable: true },
  { id: "2", description: "Software Subscriptions", amount: 120.0, taxRate: 8.25, isTaxable: true },
  { id: "3", description: "Professional Consulting", amount: 500.0, taxRate: 0.0, isTaxable: false },
];

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function SalesTaxCalculator() {
  // ── Mode & Quick Single Calc State ──
  const [mode, setMode] = useState<TaxCalculationMode>("add-tax");
  const [baseAmount, setBaseAmount] = useState<string>("100.00");
  const [taxRate, setTaxRate] = useState<string>("8.25");
  const [selectedState, setSelectedState] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // ── Multi-Line Item Expense Suite State ──
  const [expenseItems, setExpenseItems] = useState<ExpenseLineItem[]>(INITIAL_EXPENSE_ITEMS);
  const [newItemDesc, setNewItemDesc] = useState<string>("");
  const [newItemAmount, setNewItemAmount] = useState<string>("");
  const [newItemTaxRate, setNewItemTaxRate] = useState<string>("8.25");

  // ── Quick Single Calculation Computations ──
  const singleCalcResults = useMemo(() => {
    const rawAmount = parseFloat(baseAmount) || 0;
    const rawRate = parseFloat(taxRate) || 0;

    if (rawAmount <= 0 || rawRate < 0) {
      return { netAmount: 0, taxAmount: 0, grossAmount: 0, effectiveRate: 0 };
    }

    if (mode === "add-tax") {
      // Net -> Gross
      const netAmount = rawAmount;
      const taxAmount = netAmount * (rawRate / 100);
      const grossAmount = netAmount + taxAmount;
      return {
        netAmount,
        taxAmount,
        grossAmount,
        effectiveRate: rawRate,
      };
    } else {
      // Extract Tax from Gross -> Net
      const grossAmount = rawAmount;
      const netAmount = grossAmount / (1 + rawRate / 100);
      const taxAmount = grossAmount - netAmount;
      return {
        netAmount,
        taxAmount,
        grossAmount,
        effectiveRate: rawRate,
      };
    }
  }, [baseAmount, taxRate, mode]);

  // ── Multi-Line Expense Computations ──
  const expenseTotals = useMemo(() => {
    let totalNet = 0;
    let totalTax = 0;
    let totalGross = 0;
    let taxableNetTotal = 0;

    expenseItems.forEach((item) => {
      const net = item.amount;
      const rate = item.isTaxable ? item.taxRate : 0;
      const tax = net * (rate / 100);
      const gross = net + tax;

      totalNet += net;
      totalTax += tax;
      totalGross += gross;
      if (item.isTaxable) {
        taxableNetTotal += net;
      }
    });

    const blendedTaxRate = totalNet > 0 ? (totalTax / totalNet) * 100 : 0;

    return {
      totalNet,
      totalTax,
      totalGross,
      taxableNetTotal,
      blendedTaxRate,
    };
  }, [expenseItems]);

  // ── State Preset Handler ──
  const handleStateSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    setSelectedState(stateCode);
    if (!stateCode) return;

    const matched = US_STATE_TAX_RATES.find((s) => s.code === stateCode);
    if (matched) {
      const rateStr = matched.combinedAvgRate.toFixed(2);
      setTaxRate(rateStr);
      setNewItemTaxRate(rateStr);
    }
  }, []);

  // ── Item Management ──
  const addExpenseItem = useCallback(() => {
    if (!newItemDesc.trim() || !newItemAmount) return;
    const amountVal = parseFloat(newItemAmount);
    const rateVal = parseFloat(newItemTaxRate) || 0;

    if (isNaN(amountVal) || amountVal <= 0) return;

    const newItem: ExpenseLineItem = {
      id: Date.now().toString(),
      description: newItemDesc.trim(),
      amount: amountVal,
      taxRate: rateVal,
      isTaxable: rateVal > 0,
    };

    setExpenseItems((prev) => [...prev, newItem]);
    setNewItemDesc("");
    setNewItemAmount("");
  }, [newItemDesc, newItemAmount, newItemTaxRate]);

  const removeExpenseItem = useCallback((id: string) => {
    setExpenseItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleItemTaxable = useCallback((id: string) => {
    setExpenseItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isTaxable: !item.isTaxable } : item
      )
    );
  }, []);

  const resetAll = useCallback(() => {
    setBaseAmount("100.00");
    setTaxRate("8.25");
    setNewItemTaxRate("8.25");
    setSelectedState("");
    setExpenseItems(INITIAL_EXPENSE_ITEMS);
  }, []);

  const copyResultsToClipboard = useCallback(async () => {
    const singleBreakdown = `=== Single Transaction Calculation ===
Calculation Mode: ${mode === "add-tax" ? "Add Tax (Net → Gross)" : "Extract Tax (Gross → Net)"}
Input Amount: $${parseFloat(baseAmount || "0").toFixed(2)}
Tax Rate: ${singleCalcResults.effectiveRate}%
Net Subtotal: $${singleCalcResults.netAmount.toFixed(2)}
Calculated Tax: $${singleCalcResults.taxAmount.toFixed(2)}
Gross Total: $${singleCalcResults.grossAmount.toFixed(2)}`;

    const itemsBreakdown = expenseItems.map((item, idx) => {
      const net = item.amount;
      const rate = item.isTaxable ? item.taxRate : 0;
      const tax = net * (rate / 100);
      const gross = net + tax;
      const taxLabel = item.isTaxable ? `${item.taxRate}%` : "Exempt";
      return `${idx + 1}. ${item.description}: Net $${net.toFixed(2)} @ ${taxLabel} Tax (Gross $${gross.toFixed(2)})`;
    }).join("\n");

    const totalsBreakdown = `--- Expense Log Totals ---
Total Net: $${expenseTotals.totalNet.toFixed(2)}
Total Tax: $${expenseTotals.totalTax.toFixed(2)}
Blended Tax Rate: ${expenseTotals.blendedTaxRate.toFixed(2)}%
Grand Total Gross: $${expenseTotals.totalGross.toFixed(2)}`;

    const textToCopy = `=== Sales Tax Calculator & Expense Suite Audit Summary ===

${singleBreakdown}

=== Itemized Expense Log ===
${expenseItems.length === 0 ? "No expenses logged." : itemsBreakdown}

${totalsBreakdown}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  }, [mode, baseAmount, singleCalcResults, expenseItems, expenseTotals]);

  const currencyFormat = (num: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);

  return (
    <div className="w-full space-y-8">
      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: Quick Calculator & Presets ══════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">Single Transaction Tax Engine</h2>
              </div>
              <button
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                title="Reset Workspace"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMode("add-tax")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${mode === "add-tax"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Plus className="w-4 h-4" />
                Add Tax (Net → Gross)
              </button>
              <button
                onClick={() => setMode("extract-tax")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${mode === "extract-tax"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Extract Tax (Gross → Net)
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {mode === "add-tax" ? "Net Amount / Pre-Tax Price ($)" : "Gross Amount / Total Included Price ($)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 text-sm font-mono border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    US State Preset
                  </label>
                  <select
                    value={selectedState}
                    onChange={handleStateSelect}
                    className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all min-h-[42px]"
                  >
                    <option value="">-- Custom Rate --</option>
                    {US_STATE_TAX_RATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.state} ({st.combinedAvgRate}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaxRate(val);
                        setNewItemTaxRate(val);
                        setSelectedState("");
                      }}
                      placeholder="8.25"
                      className="w-full pl-3 pr-8 py-2.5 text-sm font-mono border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-200/60 pb-2">
                <span>Net Subtotal:</span>
                <span className="font-mono font-medium text-slate-900">{currencyFormat(singleCalcResults.netAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-200/60 pb-2">
                <span>Calculated Sales Tax ({singleCalcResults.effectiveRate}%):</span>
                <span className="font-mono font-semibold text-indigo-600">+{currencyFormat(singleCalcResults.taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
                <span>Gross Total:</span>
                <span className="font-mono text-base text-slate-900">{currencyFormat(singleCalcResults.grossAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: Expense Suite & Summaries ══════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">Itemized Expense Log</h2>
              </div>
              <div className="flex items-center gap-2">
                {expenseItems.length > 0 && (
                  <button
                    onClick={() => setExpenseItems([])}
                    className="text-xs text-rose-500 hover:text-rose-700 hover:underline transition-colors mr-2 cursor-pointer font-medium"
                    title="Clear all expense items"
                  >
                    Clear Log
                  </button>
                )}
                <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-indigo-100">
                  {expenseItems.length} Items
                </span>
              </div>
            </div>

            {/* Item Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addExpenseItem();
              }}
              className="grid sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200"
            >
              <input
                type="text"
                placeholder="Item Description"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="sm:col-span-5 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Net ($)"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="sm:col-span-3 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Tax %"
                value={newItemTaxRate}
                onChange={(e) => setNewItemTaxRate(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="submit"
                className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg py-2 transition-all flex items-center justify-center gap-1 min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {/* Expense Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-right">Net</th>
                    <th className="p-2.5 text-right">Tax Rate</th>
                    <th className="p-2.5 text-right">Gross</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {expenseItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        No expenses logged. Add an item above to get started.
                      </td>
                    </tr>
                  ) : (
                    expenseItems.map((item) => {
                      const net = item.amount;
                      const rate = item.isTaxable ? item.taxRate : 0;
                      const tax = net * (rate / 100);
                      const gross = net + tax;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-medium text-slate-800">
                            {item.description}
                            {!item.isTaxable && (
                              <span className="ml-1.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Exempt
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">{currencyFormat(net)}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            <button
                              onClick={() => toggleItemTaxable(item.id)}
                              className="underline decoration-dashed underline-offset-2 hover:text-indigo-600"
                              title="Click to toggle taxable status"
                            >
                              {item.isTaxable ? `${item.taxRate}%` : "0.0%"}
                            </button>
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                            {currencyFormat(gross)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => removeExpenseItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Aggregated Totals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Net
                </p>
                <p className="text-sm font-mono font-bold text-slate-800">
                  {currencyFormat(expenseTotals.totalNet)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Sales Tax
                </p>
                <p className="text-sm font-mono font-bold text-indigo-600">
                  {currencyFormat(expenseTotals.totalTax)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Blended Tax Rate
                </p>
                <p className="text-sm font-mono font-bold text-slate-800">
                  {expenseTotals.blendedTaxRate.toFixed(2)}%
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Grand Total Gross
                </p>
                <p className="text-sm font-mono font-bold text-slate-900">
                  {currencyFormat(expenseTotals.totalGross)}
                </p>
              </div>
            </div>

            {/* Copy Action Button */}
            <button
              onClick={copyResultsToClipboard}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${copied
                ? "bg-green-600 text-white shadow-md shadow-green-200"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Calculations Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Complete Audit Summary
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (SEO PROSE & RICH TECHNICAL CARDS)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8 pt-4">
        {/* Card 1: Architectural Foundations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Architectural Foundations of Sales Tax Engineering</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Sales tax calculation is a fundamental financial requirement for modern e-commerce, brick-and-mortar retail, and corporate procurement systems. At its mathematical core, sales tax is an <em>ad valorem</em> consumption tax levied on the retail sale of physical goods and qualifying services. While conceptually straightforward, accounting for sales tax requires strict segregation between <strong>net subtotal revenue</strong> (the base amount retained by the business), <strong>tax liability</strong> (fiduciary funds collected on behalf of state or local authorities), and <strong>gross revenue</strong> (the total cash collected from buyers).
            </p>
            <p>
              When pricing goods directly (Net-to-Gross), sales tax is computed by applying the statutory tax percentage rate $R$ to the pre-tax net subtotal $N$:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs md:text-sm text-slate-800 my-2 overflow-x-auto">
              Tax Amount = Base Net Amount × (Tax Rate / 100)
            </div>
            <p>
              Conversely, when auditing historical transaction logs, point-of-sale receipts, or credit card settlements where only the final gross total $G$ is recorded, financial software must perform <strong>reverse tax extraction</strong> to isolate base expenses and embedded tax liabilities without cumulative rounding drift.
            </p>
          </div>
        </div>

        {/* Card 2: Mathematical Derivations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Mathematical Mechanics of Reverse Tax Extraction</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              A common misconception in bookkeeping is that reverse tax extraction can be performed by subtracting the tax percentage directly from the gross total (e.g., subtracting 8.25% from a $108.25 total). This mathematically flawed approach understates base revenue and produces inaccurate tax liability filings.
            </p>
            <p>
              Because the final gross total represents 100% of the net base price plus the tax percentage ($100\% + R\%$), the exact algebraic formula required to extract the true net amount $N$ from a gross total $G$ requires dividing by the combined growth factor $(1 + R/100)$:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Correct Reverse Formula
                </span>
                <p className="font-mono text-sm text-slate-800 font-bold">
                  Net = Gross / (1 + Tax Rate / 100)
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  Accurately isolates the original base cost prior to tax assessment.
                </p>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block mb-1">
                  Common Bookkeeping Mistake
                </span>
                <p className="font-mono text-sm text-rose-800 font-bold">
                  Net = Gross - (Gross × Tax Rate)
                </p>
                <p className="text-xs text-rose-600 mt-2">
                  Incorrectly applies the tax percentage to the combined total rather than the base amount.
                </p>
              </div>
            </div>
            <p>
              Our dual-engine workspace applies double-precision floating-point arithmetic to maintain precision across single item entries and multi-line corporate expense ledgers.
            </p>
          </div>
        </div>

        {/* Card 3: Step-by-Step User Instructions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Use the Sales Tax Calculator & Expense Suite</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Select Calculation Mode",
                body: "Choose 'Add Tax (Net → Gross)' to calculate taxes on a base price, or 'Extract Tax (Gross → Net)' to isolate pre-tax subtotals from an all-inclusive receipt price.",
              },
              {
                step: "02",
                title: "Apply US State Presets or Custom Rates",
                body: "Select a US state from the drop-down menu to automatically populate average combined state and local tax benchmarks, or type a custom tax rate directly into the input field.",
              },
              {
                step: "03",
                title: "Input Transaction Amounts",
                body: "Enter your base dollar amount into the Single Transaction Tax Engine to generate an instant real-time breakdown of Net Subtotal, Calculated Sales Tax, and Gross Total.",
              },
              {
                step: "04",
                title: "Log Multi-Line Expenses",
                body: "Use the Itemized Expense Log on the right panel to enter descriptions, net amounts, and tax rates for individual receipt line items.",
              },
              {
                step: "05",
                title: "Toggle Tax-Exempt Status",
                body: "Click on any line item's tax rate in the table to toggle between taxable and non-taxable status for tax-exempt services or goods.",
              },
              {
                step: "06",
                title: "Export Audit Summaries",
                body: "Review aggregated metrics including Total Net, Total Tax, Blended Tax Rate, and Grand Total Gross, then click 'Copy Complete Audit Summary' to export your results.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-slate-50/60 border border-slate-200 rounded-xl p-5 flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1 text-sm">{title}</h3>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Enterprise Accounting & Industry Use Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Enterprise Accounting & Real-World Industry Applications</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "E-Commerce Checkout Optimization",
                body: "Determine localized price displays for international storefronts. Convert tax-inclusive pricing structures into itemized pre-tax subtotals and local VAT/sales tax charges during checkout processing.",
              },
              {
                title: "Corporate Expense Auditing & Receipt Verification",
                body: "Accounts payable teams can process employee expense reports where receipts display a single total. Extracting base costs from inclusive totals ensures proper tax deduction filings and GL entries.",
              },
              {
                title: "Contractor & Freelance Invoicing",
                body: "Structure transparent billing for clients across multiple jurisdictions. Separately itemize taxable physical deliverables from non-taxable professional consulting fees.",
              },
              {
                title: "Point-of-Sale (POS) System Balancing",
                body: "Reconcile daily end-of-day register tape totals with bank deposits, validating that tax collected matches expected state remittance figures across mixed-inventory sales.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                </div>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: US Jurisdictional Benchmark Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <ListOrdered className="w-5 h-5 text-indigo-600" />
            </div>
            <span>US State & Local Sales Tax Benchmarks (2026 Reference)</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Sales tax rates in the United States vary widely depending on state, county, municipality, and special district tax assessments. The reference table below outlines state base rates, average local additions, and combined benchmark tax rates featured in our built-in preset selector:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="p-3">State Jurisdiction</th>
                  <th className="p-3 text-right">State Base Rate</th>
                  <th className="p-3 text-right">Avg Local Rate</th>
                  <th className="p-3 text-right">Combined Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">California (CA)</td>
                  <td className="p-3 text-right font-mono">7.25%</td>
                  <td className="p-3 text-right font-mono">1.60%</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">8.85%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Texas (TX)</td>
                  <td className="p-3 text-right font-mono">6.25%</td>
                  <td className="p-3 text-right font-mono">1.95%</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">8.20%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">New York (NY)</td>
                  <td className="p-3 text-right font-mono">4.00%</td>
                  <td className="p-3 text-right font-mono">4.53%</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">8.53%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Florida (FL)</td>
                  <td className="p-3 text-right font-mono">6.00%</td>
                  <td className="p-3 text-right font-mono">1.01%</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">7.01%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Illinois (IL)</td>
                  <td className="p-3 text-right font-mono">6.25%</td>
                  <td className="p-3 text-right font-mono">2.57%</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">8.82%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Washington (WA)</td>
                  <td className="p-3 text-right font-mono">6.50%</td>
                  <td className="p-3 text-right font-mono">2.88%</td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-600">9.38%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Oregon / Delaware / NH / MT / AK</td>
                  <td className="p-3 text-right font-mono">0.00%</td>
                  <td className="p-3 text-right font-mono">0.00%</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600">0.00% (NOMAD States)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 6: Comparison Grid - Direct vs Extract */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Comparison Matrix: Direct Tax Addition vs. Reverse Tax Extraction</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="p-3">Calculation Dimension</th>
                  <th className="p-3">Direct Addition (Net → Gross)</th>
                  <th className="p-3">Reverse Extraction (Gross → Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Known Input Value</td>
                  <td className="p-3 font-mono">Pre-Tax Base Amount ($N$)</td>
                  <td className="p-3 font-mono">Final Receipt Total ($G$)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Mathematical Operation</td>
                  <td className="p-3 font-mono">Multiplication ($N \times R\%$)</td>
                  <td className="p-3 font-mono">Division ($G / (1 + R\%)$)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Primary Accounting Goal</td>
                  <td className="p-3">Determine checkout price for customers</td>
                  <td className="p-3">Isolate base expense & reclaimable tax</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">Example Scenario ($100 @ 8.25%)</td>
                  <td className="p-3">$100 Net + $8.25 Tax = $108.25 Gross</td>
                  <td className="p-3">$108.25 Gross / 1.0825 = $100.00 Net</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 7: FAQ Section (Static Cards) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                What is the difference between Net Amount and Gross Amount?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                The Net Amount (pre-tax price) is the base cost of goods or services before taxes are added. The Gross Amount (post-tax price) represents the final total price paid by the consumer, which combines the net amount plus all applicable sales taxes.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                How do I extract sales tax from a total receipt amount?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                To extract tax from a total amount, select the "Extract Tax (Gross → Net)" mode in our calculator. Enter the receipt total and the local tax rate. The engine divides the total by $(1 + \text{'{'}Tax Rate{'}'}/100)$ to reveal the exact pre-tax price and embedded tax amount.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Why does blended tax rate differ from individual line item tax rates?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                When an expense log contains a mix of taxable items (e.g., office supplies) and tax-exempt items (e.g., professional services or food staples), the overall effective or blended tax rate across the whole receipt will be lower than the statutory tax rate applied to taxable goods.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Is my financial data secure when using this tool?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Yes, 100%. All calculations are performed entirely in your web browser using client-side JavaScript code. No financial data, expense line items, or numbers are transmitted to any server or external API.
              </p>
            </div>
          </div>
        </div>

        {/* Card 8: Platform Performance Advantages */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Platform Security & Client-Side Execution Standard</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap,
                title: "Zero-Latency Reactive Calculations",
                body: "Driven by React useMemo hooks, all calculations update instantly in memory without network latency or round-trip server delay.",
              },
              {
                icon: Shield,
                title: "100% In-Browser Privacy Sandbox",
                body: "Your expense logs, pricing structures, and internal ledger figures remain private on your local device.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 9: Financial Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Financial Disclaimer</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            The calculations, tax rates, and regulatory reference data provided by this tool are for general informational, educational, and illustrative purposes only. Sales tax rules, rates, and exemptions fluctuate frequently across individual state, county, and local municipal jurisdictions, and tax laws can be complex. This tool does not constitute official tax, legal, financial, or accounting advice, and should not be used as a substitute for consulting a qualified Certified Public Accountant (CPA) or professional tax advisor. Users are solely responsible for verifying the accuracy of rates and calculations before filing tax returns, submitting expense logs, or issuing customer invoices.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
           JSON-LD SCHEMAS
      ───────────────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Sales Tax Calculator & Gross/Net Expense Suite",
            url: "https://www.twistertools.com/tools/calculators/sales-tax-calculator",
            applicationCategory: "BusinessApplication",
            operatingSystem: "All",
            description:
              "Calculate sales tax, reverse extract net amounts from total gross prices, and aggregate multi-line expense logs with US state tax presets.",
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
                name: "What is the difference between Net Amount and Gross Amount?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The Net Amount is the base cost of goods before tax. The Gross Amount is the final price including sales tax.",
                },
              },
              {
                "@type": "Question",
                name: "How do I extract sales tax from a total receipt amount?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Divide the total gross amount by (1 + Tax Rate / 100) to find the original pre-tax net subtotal.",
                },
              },
              {
                "@type": "Question",
                name: "Why does blended tax rate differ from individual line item tax rates?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A blended tax rate accounts for non-taxable or exempt line items in an expense log, lowering the total effective tax percentage.",
                },
              },
              {
                "@type": "Question",
                name: "Is my financial data secure when using this tool?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, 100%. All calculations are performed entirely in your web browser using client-side JavaScript code. No financial data is transmitted to any server.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
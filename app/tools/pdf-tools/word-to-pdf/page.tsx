import React from "react";
import WordToPdf from "@/components/tools/WordToPdf";
import { FileType } from "lucide-react";

export const metadata = {
  title: "Word to PDF Converter - Free & Secure Client-Side Tool | TwisterTools",
  description: "Convert Word (.docx) documents to PDF format directly in your browser with full privacy, visual preview, custom margins, and zero server uploads.",
};

export default function WordToPdfPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Edge-to-Edge Title Banner */}
        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <FileType className="w-6 h-6 text-indigo-200"/>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Word to PDF Converter</h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
              Convert Microsoft Word (.docx) documents to PDF format instantly with complete privacy and zero server uploads.
            </p>
          </div>
        </div>

        <WordToPdf/>
      </div>
    </main>
  );
}

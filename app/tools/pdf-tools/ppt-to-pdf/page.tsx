import PptToPdfConverter from "@/components/tools/PptToPdfConverter";

export const metadata = {
  title: "PPT to PDF Presentation Converter - Free Online Tool | TwisterTools",
  description: "Convert PowerPoint slides (.pptx) to high-resolution PDF documents directly in your browser with 100% privacy.",
};

export default function PptToPdfPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PptToPdfConverter />
    </main>
  );
}

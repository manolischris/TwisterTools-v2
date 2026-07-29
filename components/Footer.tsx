import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Column 1: Brand & Mission */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg select-none w-fit"
              aria-label="TwisterTools Home"
            >
              <svg
                viewBox="0 0 180 180"
                className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(-2, 2)">
                  <path
                    d="M68.75 94C64.27 94.7 61.97 99.74 60.91 103.73C58.63 112.31 61.72 122.25 67.06 129.18C81.72 148.18 107.48 154.36 129.54 144.76C159.06 131.91 175.94 101.72 173.42 69.75C172.84 62.47 171.63 55.21 169.55 48.23C168.46 44.57 165.55 39.52 165.75 35.95C173.15 43.64 177.16 58.32 179.27 68.48C188.84 114.59 153.09 164.62 104.25 163.8C94.66 163.65 85.24 161.28 76.36 157.81C44.61 145.39 30.39 104.18 49.34 75.59C63.32 54.5 97.56 48.64 113.82 70.4C117.35 75.12 119.63 81.31 119.72 87.25C119.77 90.12 118.46 93.27 119.25 96C123.51 95.38 125.96 90.58 127 86.75C129.44 77.77 126.32 67.74 120.73 60.5C106.12 41.55 80.33 35.89 58.45 45.24C28.8 57.92 12.22 88.42 14.62 120.25C15.23 128.42 16.84 136.33 19.17 144.16C20.04 147.11 22.61 151.19 22.25 153.95C19.21 151.46 17.66 146.74 15.92 143.31C10.78 133.17 8.13 122.08 7.41 110.75C4.71 68.14 39.05 25.12 83.75 26.18C93.39 26.41 102.7 28.76 111.65 32.18C143.53 44.37 157.57 86.01 138.68 114.43C127.75 130.86 106.63 137.7 88.55 130.23C83.69 128.22 78.54 125.22 75.29 120.98C71.32 115.79 68.3 109.45 68.25 102.75C68.23 99.88 69.58 96.73 68.75 94Z"
                    fill="#4f46e5"
                    className="text-indigo-600 dark:text-indigo-400 fill-current"
                    fillRule="evenodd"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
              <span className="flex items-baseline font-sans">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-xl md:text-3xl">
                  Twister
                </span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight text-xl md:text-3xl">
                  Tools
                </span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              Free online tools for text manipulation, image editing, SEO
              optimization, and more. Fast, secure, and easy-to-use web
              utilities for everyone.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://www.facebook.com/twistertools/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Follow us on Facebook"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.tumblr.com/twistertools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Follow us on Tumblr"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 10.084 0h3.345v6.116h4.458v3.631h-4.458v7.086c0 1.244.362 2.978 2.718 2.978h.061c.546 0 1.217-.119 1.664-.303l.777 3.397c-.482.369-1.72.814-3.233.814l-.853.281z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Top Categories */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Top Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/tools/calculators"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Daily Essentials, Financial & Math Calculators
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/developer-tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Developer, Code & Web Engineering Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/image-tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Image Editing, Compression & Conversion Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/pdf-tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  PDF & Document Utilities
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/converter-tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Data & Number Base Converter Utilities
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/text-tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Text Analysis, List Comparison & Editing Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/web-tools"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  SEO, Domain & Network Inspector Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Tools */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Popular Tools
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/tools/generator-tools/qr-code-generator"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  QR Code Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/password-tools/password-generator"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Password Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/developer-tools/md5-generator"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  MD5 Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/developer-tools/json-to-csv-converter"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  JSON to CSV
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/image-tools/image-compressor"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Image Compressor
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/generator-tools/uuid-generator"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  UUID Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Copyright &copy; 2026 TwisterTools. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

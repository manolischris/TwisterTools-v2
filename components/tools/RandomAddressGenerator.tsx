"use client";

import React, { useState, useMemo } from "react";
import {
    MapPin,
    Globe,
    Copy,
    Check,
    RefreshCw,
    Download,
    Layers,
    Compass,
    Navigation,
    ShieldCheck,
    Database,
    ExternalLink,
    Code,
    FileSpreadsheet,
    Building2,
    Map,
    HelpCircle,
    BookOpen,
    SlidersHorizontal,
    Search
} from "lucide-react";

// --- Country Datasets & Seed Data ---
interface CountryDataset {
    code: string;
    name: string;
    flag: string;
    states: {
        name: string;
        code: string;
        cities: {
            name: string;
            zipFormat: string; // e.g. "#####" or "A#A #A#"
            streetNames: string[];
            latRange: [number, number];
            lngRange: [number, number];
        }[];
    }[];
}

const COUNTRY_DATA: CountryDataset[] = [
    {
        code: "US",
        name: "United States",
        flag: "🇺🇸",
        states: [
            {
                name: "California",
                code: "CA",
                cities: [
                    {
                        name: "Los Angeles",
                        zipFormat: "900##",
                        streetNames: ["Sunset Blvd", "Wilshire Blvd", "Hollywood Blvd", "Santa Monica Blvd", "Figueroa St", "Grand Ave", "Olympic Blvd", "Rodeo Dr"],
                        latRange: [33.95, 34.15],
                        lngRange: [-118.45, -118.20]
                    },
                    {
                        name: "San Francisco",
                        zipFormat: "941##",
                        streetNames: ["Market St", "Mission St", "Geary St", "Lombard St", "Montgomery St", "California St", "Castro St", "Van Ness Ave"],
                        latRange: [37.70, 37.82],
                        lngRange: [-122.50, -122.38]
                    },
                    {
                        name: "San Diego",
                        zipFormat: "921##",
                        streetNames: ["Broadway", "Pacific Coast Hwy", "Balboa Dr", "Harbor Dr", "Mission Bay Dr", "University Ave", "El Cajon Blvd"],
                        latRange: [32.65, 32.85],
                        lngRange: [-117.25, -117.10]
                    }
                ]
            },
            {
                name: "New York",
                code: "NY",
                cities: [
                    {
                        name: "New York City",
                        zipFormat: "100##",
                        streetNames: ["5th Ave", "Broadway", "Madison Ave", "Wall St", "Park Ave", "Lexington Ave", "Amsterdam Ave", "Hudson St"],
                        latRange: [40.70, 40.85],
                        lngRange: [-74.01, -73.93]
                    },
                    {
                        name: "Buffalo",
                        zipFormat: "142##",
                        streetNames: ["Main St", "Delaware Ave", "Elmwood Ave", "Niagara St", "Hertel Ave", "Genesee St"],
                        latRange: [42.85, 42.95],
                        lngRange: [-78.90, -78.80]
                    }
                ]
            },
            {
                name: "Texas",
                code: "TX",
                cities: [
                    {
                        name: "Austin",
                        zipFormat: "787##",
                        streetNames: ["Congress Ave", "Lamar Blvd", "Guadalupe St", "Barton Springs Rd", "6th St", "Rainey St", "Riverside Dr"],
                        latRange: [30.20, 30.40],
                        lngRange: [-97.80, -97.68]
                    },
                    {
                        name: "Houston",
                        zipFormat: "770##",
                        streetNames: ["Westheimer Rd", "Main St", "Montrose Blvd", "Post Oak Blvd", "Texas Ave", "Kirby Dr", "Heights Blvd"],
                        latRange: [29.70, 29.85],
                        lngRange: [-95.45, -95.30]
                    }
                ]
            }
        ]
    },
    {
        code: "UK",
        name: "United Kingdom",
        flag: "🇬🇧",
        states: [
            {
                name: "Greater London",
                code: "ENG",
                cities: [
                    {
                        name: "London",
                        zipFormat: "EC#A ###",
                        streetNames: ["Oxford St", "Baker St", "Piccadilly", "Regent St", "King's Rd", "Fleet St", "Abbey Rd", "Strand"],
                        latRange: [51.48, 51.55],
                        lngRange: [-0.18, -0.05]
                    }
                ]
            },
            {
                name: "Greater Manchester",
                code: "ENG",
                cities: [
                    {
                        name: "Manchester",
                        zipFormat: "M# ###",
                        streetNames: ["Deansgate", "Market St", "Princess St", "Oxford Rd", "Peter St", "Portland St", "King St"],
                        latRange: [53.45, 53.50],
                        lngRange: [-2.26, -2.20]
                    }
                ]
            },
            {
                name: "Midlothian",
                code: "SCT",
                cities: [
                    {
                        name: "Edinburgh",
                        zipFormat: "EH# ###",
                        streetNames: ["Royal Mile", "Princes St", "George St", "Queen St", "Grassmarket", "Cowgate", "Rose St"],
                        latRange: [55.93, 55.98],
                        lngRange: [-3.22, -3.15]
                    }
                ]
            }
        ]
    },
    {
        code: "CA",
        name: "Canada",
        flag: "🇨🇦",
        states: [
            {
                name: "Ontario",
                code: "ON",
                cities: [
                    {
                        name: "Toronto",
                        zipFormat: "M5V #A#",
                        streetNames: ["Yonge St", "Queen St W", "King St W", "Bay St", "Bloor St", "Spadina Ave", "Dundas St"],
                        latRange: [43.63, 43.72],
                        lngRange: [-79.42, -79.35]
                    },
                    {
                        name: "Ottawa",
                        zipFormat: "K1P #A#",
                        streetNames: ["Bank St", "Elgin St", "Rideau St", "Wellington St", "Sussex Dr", "Laurier Ave"],
                        latRange: [45.40, 45.45],
                        lngRange: [-75.72, -75.66]
                    }
                ]
            },
            {
                name: "British Columbia",
                code: "BC",
                cities: [
                    {
                        name: "Vancouver",
                        zipFormat: "V6B #A#",
                        streetNames: ["Robson St", "Granville St", "Burrard St", "Georgia St", "Davie St", "Denman St", "Main St"],
                        latRange: [49.25, 49.30],
                        lngRange: [-123.15, -123.08]
                    }
                ]
            }
        ]
    },
    {
        code: "DE",
        name: "Germany",
        flag: "🇩🇪",
        states: [
            {
                name: "Berlin",
                code: "BE",
                cities: [
                    {
                        name: "Berlin",
                        zipFormat: "101##",
                        streetNames: ["Friedrichstraße", "Unter den Linden", "Kurfürstendamm", "Karl-Marx-Allee", "Torstraße", "Kantstraße"],
                        latRange: [52.48, 52.55],
                        lngRange: [13.35, 13.45]
                    }
                ]
            },
            {
                name: "Bavaria",
                code: "BY",
                cities: [
                    {
                        name: "Munich",
                        zipFormat: "803##",
                        streetNames: ["Maximilianstraße", "Leopoldstraße", "Kaufingerstraße", "Brienner Straße", "Ludwigstraße", "Sendlinger Str."],
                        latRange: [48.12, 48.18],
                        lngRange: [11.55, 11.62]
                    }
                ]
            }
        ]
    },
    {
        code: "AU",
        name: "Australia",
        flag: "🇦🇺",
        states: [
            {
                name: "New South Wales",
                code: "NSW",
                cities: [
                    {
                        name: "Sydney",
                        zipFormat: "200#",
                        streetNames: ["George St", "Pitt St", "Castlereagh St", "Macquarie St", "Elizabeth St", "Oxford St", "Crown St"],
                        latRange: [-33.90, -33.84],
                        lngRange: [151.18, 151.24]
                    }
                ]
            },
            {
                name: "Victoria",
                code: "VIC",
                cities: [
                    {
                        name: "Melbourne",
                        zipFormat: "300#",
                        streetNames: ["Collins St", "Bourke St", "Flinders St", "Swanston St", "Chapel St", "Lygon St", "Brunswick St"],
                        latRange: [-37.84, -37.78],
                        lngRange: [144.93, 145.00]
                    }
                ]
            }
        ]
    },
    {
        code: "FR",
        name: "France",
        flag: "🇫🇷",
        states: [
            {
                name: "Île-de-France",
                code: "IDF",
                cities: [
                    {
                        name: "Paris",
                        zipFormat: "7500#",
                        streetNames: ["Champs-Élysées", "Boulevard Saint-Germain", "Rue de Rivoli", "Boulevard Haussmann", "Rue Montorgueil", "Rue Saint-Honoré"],
                        latRange: [48.83, 48.89],
                        lngRange: [2.30, 2.40]
                    }
                ]
            },
            {
                name: "Provence-Alpes-Côte d'Azur",
                code: "PACA",
                cities: [
                    {
                        name: "Marseille",
                        zipFormat: "1300#",
                        streetNames: ["La Canebière", "Rue Paradis", "Rue de Rome", "Boulevard Michelet", "Corniche Kennedy"],
                        latRange: [43.27, 43.33],
                        lngRange: [5.36, 5.42]
                    }
                ]
            }
        ]
    },
    {
        code: "JP",
        name: "Japan",
        flag: "🇯🇵",
        states: [
            {
                name: "Tokyo",
                code: "13",
                cities: [
                    {
                        name: "Tokyo (Chiyoda/Shibuya)",
                        zipFormat: "100-00##",
                        streetNames: ["Chuo Dori", "Meiji Dori", "Aoyama Dori", "Omotesando", "Roppongi Dori", "Harajuku Street", "Sotobori Dori"],
                        latRange: [35.65, 35.71],
                        lngRange: [139.68, 139.77]
                    }
                ]
            },
            {
                name: "Osaka",
                code: "27",
                cities: [
                    {
                        name: "Osaka",
                        zipFormat: "530-00##",
                        streetNames: ["Midosuji", "Sennichimae", "Dotonbori", "Sakaisuji", "Yotsubashi-suji"],
                        latRange: [34.66, 34.72],
                        lngRange: [135.48, 135.53]
                    }
                ]
            }
        ]
    }
];

export interface GeneratedAddress {
    id: string;
    streetNumber: number;
    streetName: string;
    fullStreet: string;
    unit?: string;
    city: string;
    state: string;
    stateCode: string;
    postalCode: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    coordinatesFormatted: string;
    singleLine: string;
}

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

// Cryptographic Random Helper Functions
function getCryptoRandom(): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(getCryptoRandom() * (max - min + 1)) + min;
}

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(getCryptoRandom() * arr.length)];
}

function formatPostalCode(format: string): string {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "0123456789";
    return format
        .split("")
        .map((char) => {
            if (char === "#") return getRandomItem(digits.split(""));
            if (char === "A") return getRandomItem(letters.split(""));
            return char;
        })
        .join("");
}

export default function RandomAddressGenerator() {
    // Selection & Generation Filters
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("ALL");
    const [includeUnits, setIncludeUnits] = useState<boolean>(true);
    const [batchQuantity, setBatchQuantity] = useState<number>(5);
    const [exportFormat, setExportFormat] = useState<"json" | "csv" | "text">("json");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [globalCopied, setGlobalCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"cards" | "raw">("cards");
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);

    // Initial Generator Core
    const generateSingleAddress = (): GeneratedAddress => {
        let country: CountryDataset;
        if (selectedCountryCode === "ALL") {
            country = getRandomItem(COUNTRY_DATA);
        } else {
            country = COUNTRY_DATA.find((c) => c.code === selectedCountryCode) || COUNTRY_DATA[0];
        }

        const state = getRandomItem(country.states);
        const city = getRandomItem(state.cities);
        const streetName = getRandomItem(city.streetNames);
        const streetNumber = getRandomInt(10, 9998);
        const postalCode = formatPostalCode(city.zipFormat);

        // Calculate Realistic Coordinate within City Bounding Box
        const lat = Number((city.latRange[0] + getCryptoRandom() * (city.latRange[1] - city.latRange[0])).toFixed(6));
        const lng = Number((city.lngRange[0] + getCryptoRandom() * (city.lngRange[1] - city.lngRange[0])).toFixed(6));

        let unit: string | undefined;
        if (includeUnits && getCryptoRandom() > 0.4) {
            const unitTypes = ["Apt", "Suite", "Unit", "#"];
            const unitType = getRandomItem(unitTypes);
            const unitNumber = getRandomInt(1, 450);
            unit = `${unitType} ${unitNumber}`;
        }

        const fullStreet = unit ? `${streetNumber} ${streetName}, ${unit}` : `${streetNumber} ${streetName}`;
        const singleLine = `${fullStreet}, ${city.name}, ${state.code} ${postalCode}, ${country.name}`;

        return {
            id: `addr_${Date.now()}_${getRandomInt(1000, 9999)}`,
            streetNumber,
            streetName,
            fullStreet,
            unit,
            city: city.name,
            state: state.name,
            stateCode: state.code,
            postalCode,
            country: country.name,
            countryCode: country.code,
            latitude: lat,
            longitude: lng,
            coordinatesFormatted: `${lat}, ${lng}`,
            singleLine
        };
    };

    // Address State
    const [addresses, setAddresses] = useState<GeneratedAddress[]>(() => {
        // Hydrate initial addresses with distinct static records to prevent hydration mismatch and resolve duplicate keys
        return [
            {
                id: "addr_initial_1",
                streetNumber: 742,
                streetName: "Evergreen Terrace",
                fullStreet: "742 Evergreen Terrace, Apt 4B",
                unit: "Apt 4B",
                city: "Los Angeles",
                state: "California",
                stateCode: "CA",
                postalCode: "90012",
                country: "United States",
                countryCode: "US",
                latitude: 34.0522,
                longitude: -118.2437,
                coordinatesFormatted: "34.0522, -118.2437",
                singleLine: "742 Evergreen Terrace, Apt 4B, Los Angeles, CA 90012, United States"
            },
            {
                id: "addr_initial_2",
                streetNumber: 10,
                streetName: "Downing St",
                fullStreet: "10 Downing St",
                unit: undefined,
                city: "London",
                state: "Greater London",
                stateCode: "ENG",
                postalCode: "EC1A 1BB",
                country: "United Kingdom",
                countryCode: "UK",
                latitude: 51.5033,
                longitude: -0.1275,
                coordinatesFormatted: "51.5033, -0.1275",
                singleLine: "10 Downing St, London, ENG EC1A 1BB, United Kingdom"
            },
            {
                id: "addr_initial_3",
                streetNumber: 221,
                streetName: "Baker St",
                fullStreet: "221B Baker St",
                unit: "B",
                city: "London",
                state: "Greater London",
                stateCode: "ENG",
                postalCode: "EC1A 2BB",
                country: "United Kingdom",
                countryCode: "UK",
                latitude: 51.5237,
                longitude: -0.1585,
                coordinatesFormatted: "51.5237, -0.1585",
                singleLine: "221B Baker St, London, ENG EC1A 2BB, United Kingdom"
            },
            {
                id: "addr_initial_4",
                streetNumber: 350,
                streetName: "Fifth Ave",
                fullStreet: "350 Fifth Ave, Suite 7501",
                unit: "Suite 7501",
                city: "New York City",
                state: "New York",
                stateCode: "NY",
                postalCode: "10001",
                country: "United States",
                countryCode: "US",
                latitude: 40.7484,
                longitude: -73.9857,
                coordinatesFormatted: "40.7484, -73.9857",
                singleLine: "350 Fifth Ave, Suite 7501, New York City, NY 10001, United States"
            },
            {
                id: "addr_initial_5",
                streetNumber: 400,
                streetName: "Yonge St",
                fullStreet: "400 Yonge St, Unit 12",
                unit: "Unit 12",
                city: "Toronto",
                state: "Ontario",
                stateCode: "ON",
                postalCode: "M5V 1A1",
                country: "Canada",
                countryCode: "CA",
                latitude: 43.6598,
                longitude: -79.3822,
                coordinatesFormatted: "43.6598, -79.3822",
                singleLine: "400 Yonge St, Unit 12, Toronto, ON M5V 1A1, Canada"
            }
        ];
    });

    const activeAddress = addresses[selectedAddressIndex] || addresses[0];

    // Trigger Generator Action
    const handleGenerate = () => {
        const count = Math.min(100, Math.max(1, batchQuantity));
        const newAddresses: GeneratedAddress[] = [];
        for (let i = 0; i < count; i++) {
            newAddresses.push(generateSingleAddress());
        }
        setAddresses(newAddresses);
        setSelectedAddressIndex(0);
    };

    // Copy to Clipboard Handling
    const handleCopySingle = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1800);
    };

    const handleCopyAll = () => {
        let content = "";
        if (exportFormat === "json") {
            content = JSON.stringify(addresses, null, 2);
        } else if (exportFormat === "csv") {
            const headers = ["Street", "City", "State", "StateCode", "PostalCode", "Country", "CountryCode", "Latitude", "Longitude", "FullAddress"];
            const rows = addresses.map((a) => [
                `"${a.fullStreet}"`,
                `"${a.city}"`,
                `"${a.state}"`,
                `"${a.stateCode}"`,
                `"${a.postalCode}"`,
                `"${a.country}"`,
                `"${a.countryCode}"`,
                a.latitude,
                a.longitude,
                `"${a.singleLine}"`
            ]);
            content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        } else {
            content = addresses.map((a) => a.singleLine).join("\n");
        }

        navigator.clipboard.writeText(content);
        setGlobalCopied(true);
        setTimeout(() => setGlobalCopied(false), 2000);
    };

    // Download Data Asset
    const handleDownload = () => {
        let content = "";
        let filename = "random_addresses";
        let type = "text/plain";

        if (exportFormat === "json") {
            content = JSON.stringify(addresses, null, 2);
            filename += ".json";
            type = "application/json";
        } else if (exportFormat === "csv") {
            const headers = ["Street", "City", "State", "StateCode", "PostalCode", "Country", "CountryCode", "Latitude", "Longitude", "FullAddress"];
            const rows = addresses.map((a) => [
                `"${a.fullStreet}"`,
                `"${a.city}"`,
                `"${a.state}"`,
                `"${a.stateCode}"`,
                `"${a.postalCode}"`,
                `"${a.country}"`,
                `"${a.countryCode}"`,
                a.latitude,
                a.longitude,
                `"${a.singleLine}"`
            ]);
            content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            filename += ".csv";
            type = "text/csv;charset=utf-8;";
        } else {
            content = addresses.map((a) => a.singleLine).join("\n");
            filename += ".txt";
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Computed Output String for Raw Viewer
    const rawFormattedOutput = useMemo(() => {
        if (exportFormat === "json") {
            return JSON.stringify(addresses, null, 2);
        }
        if (exportFormat === "csv") {
            const headers = ["Street", "City", "State", "PostalCode", "Country", "Latitude", "Longitude"];
            const rows = addresses.map((a) => `"${a.fullStreet}","${a.city}","${a.state}","${a.postalCode}","${a.country}",${a.latitude},${a.longitude}`);
            return [headers.join(","), ...rows].join("\n");
        }
        return addresses.map((a) => a.singleLine).join("\n");
    }, [addresses, exportFormat]);

    // WebApplication & FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Address & Geographic Location Picker",
        "url": "https://twistertools.com/tools/random-tools/random-address-generator",
        "description": "Generate realistic mock addresses, real postal code structures, valid street grids, and calibrated latitude and longitude GPS coordinates across international territories for software testing and QA.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Are these real physical addresses with living residents?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The generator creates synthetic mock data by probabilistically combining authentic municipal street names, calibrated postal districts, realistic house numbers, and actual geographic bounding boxes. While the streets and cities exist, individual address combinations are randomized to prevent referencing specific private dwellings."
                }
            },
            {
                "@type": "Question",
                "name": "Are the latitude and longitude GPS coordinates accurate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Each generated coordinate pair is constrained within the exact geographic bounding box (polygon) of the specified metropolitan district, ensuring valid map rendering on Leaflet, Mapbox, Google Maps, or OpenStreetMap."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export bulk data directly into databases or automated test scripts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can generate up to 100 structured records simultaneously and export them instantly as formatted JSON arrays, RFC 4180-compliant CSV files, or plain text lines for easy ingestion into Cypress, Jest, Selenium, PostgreSQL, and MongoDB."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool use genuine cryptographic entropy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. All randomness utilizes the browser's hardware-backed Web Crypto API (crypto.getRandomValues) rather than standard pseudo-random functions, ensuring unbiased distribution without systemic pattern repetitions."
                }
            },
            {
                "@type": "Question",
                "name": "What international formats and countries are supported?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine natively handles distinct address syntax, state/province hierarchies, and postal numbering schemas for the United States (ZIP codes), United Kingdom (postcodes), Canada (alphanumeric FSA codes), Germany (PLZ), Australia, France, and Japan."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Generation Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Generator Configuration
                            </h2>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {COUNTRY_DATA.length} Territories
                            </span>
                        </div>

                        {/* Country Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> Target Territory / Country
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCountryCode("ALL")}
                                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${selectedCountryCode === "ALL"
                                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Global (All)</span>
                                </button>
                                {COUNTRY_DATA.map((c) => {
                                    const isSelected = selectedCountryCode === c.code;
                                    return (
                                        <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => setSelectedCountryCode(c.code)}
                                            className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                }`}
                                        >
                                            <span className="text-sm">{c.flag}</span>
                                            <span className="truncate">{c.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            {/* Quantity Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Batch Quantity (1-100)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={batchQuantity === 0 ? "" : batchQuantity}
                                    onChange={(e) => handleNumberInput(e, setBatchQuantity)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    placeholder="Quantity"
                                />
                            </div>

                            {/* Unit Numbers Toggle */}
                            <div className="space-y-1.5 flex flex-col justify-end">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Secondary Unit Numbers
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIncludeUnits(!includeUnits)}
                                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${includeUnits
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                        }`}
                                >
                                    <span>Include Apt/Suite</span>
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-white border border-slate-200">
                                        {includeUnits ? "Enabled" : "Off"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Main Generate Button */}
                        <button
                            onClick={handleGenerate}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Generate {batchQuantity} Random {batchQuantity === 1 ? "Address" : "Addresses"}
                        </button>

                        {/* Interactive Map Visualizer Box */}
                        {activeAddress && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5 text-indigo-600 uppercase tracking-wider">
                                        <Compass className="w-4 h-4" /> Calibrated GPS Position
                                    </span>
                                    <span className="font-mono text-slate-500 text-[11px]">
                                        {activeAddress.latitude}, {activeAddress.longitude}
                                    </span>
                                </div>
                                <div className="h-40 w-full rounded-lg bg-slate-200 relative overflow-hidden border border-slate-300 flex items-center justify-center shadow-inner group">
                                    {/* Real OpenStreetMap Live Preview centered on address coordinates */}
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        scrolling="no"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeAddress.longitude - 0.012}%2C${activeAddress.latitude - 0.006}%2C${activeAddress.longitude + 0.012}%2C${activeAddress.latitude + 0.006}&layer=mapnik`}
                                        className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-80 mix-blend-multiply dark:mix-blend-normal"
                                    />
                                    {/* Subtle overlay for text contrast and premium design feel */}
                                    <div className="absolute inset-0 bg-slate-900/5 dark:bg-black/25 pointer-events-none" />

                                    <div className="relative z-10 flex flex-col items-center gap-1 text-center p-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 bg-white/95 px-2.5 py-1 rounded-lg shadow-sm border border-slate-200/80">
                                            {activeAddress.city}, {activeAddress.country}
                                        </span>
                                    </div>
                                    <a
                                        href={`https://www.openstreetmap.org/?mlat=${activeAddress.latitude}&mlon=${activeAddress.longitude}#map=14/${activeAddress.latitude}/${activeAddress.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-white/95 text-slate-800 hover:text-indigo-600 text-[11px] font-bold px-2 py-1 rounded-md border border-slate-200 shadow-xs transition"
                                    >
                                        Open in OSM <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {(["json", "csv", "text"] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => setExportFormat(fmt)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition cursor-pointer ${exportFormat === fmt
                                        ? "bg-white text-indigo-600 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output & Formatted Results */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900">
                                    Generated Dataset ({addresses.length})
                                </h2>
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("cards")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "cards" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Card View
                                </button>
                                <button
                                    onClick={() => setActiveTab("raw")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "raw" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Raw Code
                                </button>
                            </div>
                        </div>

                        {activeTab === "cards" ? (
                            /* Card Listing View */
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {addresses.map((addr, idx) => {
                                    const isSelected = selectedAddressIndex === idx;
                                    return (
                                        <div
                                            key={addr.id}
                                            onClick={() => setSelectedAddressIndex(idx)}
                                            className={`p-4 rounded-xl border transition cursor-pointer text-left space-y-2 ${isSelected
                                                ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                                                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider block mb-0.5">
                                                        Record #{idx + 1} • {addr.countryCode}
                                                    </span>
                                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                                        {addr.fullStreet}
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopySingle(addr.singleLine, idx);
                                                    }}
                                                    title="Copy single line"
                                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition cursor-pointer"
                                                >
                                                    {copiedIndex === idx ? (
                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="text-xs text-slate-600 font-medium">
                                                {addr.city}, {addr.stateCode} {addr.postalCode} • {addr.country}
                                            </div>

                                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-1">
                                                <span className="flex items-center gap-1">
                                                    <Navigation className="w-3 h-3 text-indigo-500" />
                                                    GPS: {addr.coordinatesFormatted}
                                                </span>
                                                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                                    {addr.state}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Raw Code Block View */
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={rawFormattedOutput}
                                    className="w-full h-[500px] p-3.5 font-mono text-xs text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none resize-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={handleCopyAll}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {globalCopied ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                            {globalCopied ? "Copied to Clipboard" : `Copy All (${exportFormat.toUpperCase()})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Geographic Schemas & Postal Architectures */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            International Address Formatting & Postal Code Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Geographic addressing systems vary significantly across national jurisdictions. Software applications handling user onboarding, e-commerce checkout pipelines, and international logistics must accurately validate and store diverse postal formats without truncating characters or enforcing incorrect regional assumptions.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-indigo-600" /> United States (USPS)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Formatted as <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">123 Main St, City, ST 12345</code>. Employs 5-digit numeric ZIP codes, 2-character ISO state abbreviations, and street descriptors preceding municipal headers.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" /> United Kingdom (Royal Mail)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Alphanumeric outward and inward code structures (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">EC1A 1BB</code>). Addresses sequence from specific dwelling to broader county groupings.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> Canada (Canada Post)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Alternating alphanumeric Forward Sortation Areas (FSAs) formatted as <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">A1A 1A1</code>, paired with standard 2-letter provincial designations.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Bounding Box Geocoding & Coordinate Bounding */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Map className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Municipal Bounding Box Algorithms & Spatial Integrity
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Generic mock generators often output disconnected random latitudes and longitudes, placing addresses in open oceans or contradictory deserts. This utility solves this by constraining coordinate generation within verified municipal bounding boxes ([Lat_min, Lat_max] × [Lng_min, Lng_max]).
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Metropolitan Region</th>
                                    <th className="p-3">Country</th>
                                    <th className="p-3">Latitude Bounds</th>
                                    <th className="p-3">Longitude Bounds</th>
                                    <th className="p-3">Postal Pattern</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Los Angeles, CA</td>
                                    <td className="p-3">United States</td>
                                    <td className="p-3 font-mono">33.95°N – 34.15°N</td>
                                    <td className="p-3 font-mono">-118.45°W – -118.20°W</td>
                                    <td className="p-3 font-mono">900##</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Central London</td>
                                    <td className="p-3">United Kingdom</td>
                                    <td className="p-3 font-mono">51.48°N – 51.55°N</td>
                                    <td className="p-3 font-mono">-0.18°W – -0.05°W</td>
                                    <td className="p-3 font-mono">EC#A ###</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Toronto, ON</td>
                                    <td className="p-3">Canada</td>
                                    <td className="p-3 font-mono">43.63°N – 43.72°N</td>
                                    <td className="p-3 font-mono">-79.42°W – -79.35°W</td>
                                    <td className="p-3 font-mono">M5V #A#</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Berlin Mitte</td>
                                    <td className="p-3">Germany</td>
                                    <td className="p-3 font-mono">52.48°N – 52.55°N</td>
                                    <td className="p-3 font-mono">13.35°E – 13.45°E</td>
                                    <td className="p-3 font-mono">101##</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Software Engineering & QA Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Test Fixtures, Database Seeding & GDPR Compliance
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Using authentic Personally Identifiable Information (PII) during development and automated end-to-end testing introduces critical privacy risks under GDPR, CCPA, and HIPAA compliance frameworks. Synthetic location generators provide essential structural realism without exposing actual customer identities.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Code className="w-4 h-4 text-indigo-600" /> Automated Test Fixtures (Cypress / Playwright)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Populate registration forms, geofence radius calculators, shipping cost estimators, and billing profiles with multi-attribute randomized records to surface edge-case form validation defects.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Spatial GIS & Map Benchmarking
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Benchmark spatial indexing algorithms (R-Tree, PostGIS, Quadtree) and map cluster rendering engines (Mapbox GL, Leaflet MarkerCluster) by injecting hundreds of co-located points within target urban zones.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are these real physical addresses with living residents?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The generator creates synthetic mock data by probabilistically combining authentic municipal street names, calibrated postal districts, realistic house numbers, and actual geographic bounding boxes. While the streets and cities exist, individual address combinations are randomized to prevent referencing specific private dwellings.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are the latitude and longitude GPS coordinates accurate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Each generated coordinate pair is constrained within the exact geographic bounding box (polygon) of the specified metropolitan district, ensuring valid map rendering on Leaflet, Mapbox, Google Maps, or OpenStreetMap.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export bulk data directly into databases or automated test scripts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can generate up to 100 structured records simultaneously and export them instantly as formatted JSON arrays, RFC 4180-compliant CSV files, or plain text lines for easy ingestion into Cypress, Jest, Selenium, PostgreSQL, and MongoDB.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool use genuine cryptographic entropy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. All randomness utilizes the browser&apos;s hardware-backed Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) rather than standard pseudo-random functions, ensuring unbiased distribution without systemic pattern repetitions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What international formats and countries are supported?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The engine natively handles distinct address syntax, state/province hierarchies, and postal numbering schemas for the United States (ZIP codes), United Kingdom (postcodes), Canada (alphanumeric FSA codes), Germany (PLZ), Australia, France, and Japan.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
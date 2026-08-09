"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Sun,
    Sunrise,
    Sunset,
    Compass,
    MapPin,
    Clock,
    Calendar,
    Info,
    HelpCircle,
    FileText,
    Search,
    RotateCcw,
    Globe,
    Share2,
    Copy,
    Check,
    Zap,
    Navigation,
    Sparkles,
    BookOpen,
    BarChart3,
    Camera,
    ShieldAlert,
    Cpu,
} from "lucide-react";

// Types
interface LocationPreset {
    name: string;
    country: string;
    lat: number;
    lng: number;
    timezone: string;
    offset: number;
}

// Expanded global city database (40+ major world locations)
const WORLD_CITIES: LocationPreset[] = [
    { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060, timezone: "America/New_York", offset: -5 },
    { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, timezone: "Europe/London", offset: 0 },
    { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo", offset: 9 },
    { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris", offset: 1 },
    { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney", offset: 10 },
    { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo", offset: 2 },
    { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, timezone: "America/Sao_Paulo", offset: -3 },
    { name: "Reykjavik", country: "Iceland", lat: 64.1466, lng: -21.9426, timezone: "Atlantic/Reykjavik", offset: 0 },
    { name: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275, timezone: "Europe/Athens", offset: 2 },
    { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles", offset: -8 },
    { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298, timezone: "America/Chicago", offset: -6 },
    { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto", offset: -5 },
    { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver", offset: -8 },
    { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050, timezone: "Europe/Berlin", offset: 1 },
    { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome", offset: 1 },
    { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid", offset: 1 },
    { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam", offset: 1 },
    { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai", offset: 4 },
    { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "Asia/Singapore", offset: 8 },
    { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, timezone: "Asia/Hong_Kong", offset: 8 },
    { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, timezone: "Asia/Kolkata", offset: 5.5 },
    { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.2090, timezone: "Asia/Kolkata", offset: 5.5 },
    { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok", offset: 7 },
    { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, timezone: "Asia/Seoul", offset: 9 },
    { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, timezone: "Asia/Shanghai", offset: 8 },
    { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul", offset: 3 },
    { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, timezone: "Africa/Johannesburg", offset: 2 },
    { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires", offset: -3 },
    { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City", offset: -6 },
    { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633, timezone: "Pacific/Auckland", offset: 12 },
    { name: "Honolulu", country: "USA (Hawaii)", lat: 21.3069, lng: -157.8583, timezone: "Pacific/Honolulu", offset: -10 },
    { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, timezone: "Europe/Zurich", offset: 1 },
    { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738, timezone: "Europe/Vienna", offset: 1 },
    { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, timezone: "Europe/Stockholm", offset: 1 },
    { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522, timezone: "Europe/Oslo", offset: 1 },
    { name: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384, timezone: "Europe/Helsinki", offset: 2 },
    { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122, timezone: "Europe/Warsaw", offset: 1 },
    { name: "Prague", country: "Czechia", lat: 50.0755, lng: 14.4378, timezone: "Europe/Prague", offset: 1 },
    { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603, timezone: "Europe/Dublin", offset: 0 },
    { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, timezone: "Europe/Lisbon", offset: 0 },
];

// Popular quick buttons subset
const POPULAR_PRESETS = WORLD_CITIES.slice(0, 8);

// Pure astronomical calculations based on NOAA Solar Calculations
function calculateSolarData(lat: number, lng: number, date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    const julianDay =
        day +
        Math.floor((153 * m + 2) / 5) +
        365 * y +
        Math.floor(y / 4) -
        Math.floor(y / 100) +
        Math.floor(y / 400) -
        32045;

    const julianCentury = (julianDay - 2451545.0) / 36525.0;

    let geomMeanLongSun = (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
    if (geomMeanLongSun < 0) geomMeanLongSun += 360;

    const geomMeanAnomalySun = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
    const eccentEarthOrbit = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);

    const sunEqOfCenter =
        Math.sin((geomMeanAnomalySun * Math.PI) / 180) * (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) +
        Math.sin(((2 * geomMeanAnomalySun) * Math.PI) / 180) * (0.019993 - 0.000101 * julianCentury) +
        Math.sin(((3 * geomMeanAnomalySun) * Math.PI) / 180) * 0.000289;

    const sunTrueLong = geomMeanLongSun + sunEqOfCenter;
    const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(((125.04 - 1934.136 * julianCentury) * Math.PI) / 180);

    const meanObliqEcliptic = 23 + (26 + (21.448 - julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813))) / 60) / 60;
    const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos(((125.04 - 1934.136 * julianCentury) * Math.PI) / 180);

    const sunDeclin = (Math.asin(Math.sin((obliqCorr * Math.PI) / 180) * Math.sin((sunAppLong * Math.PI) / 180)) * 180) / Math.PI;

    const varY = Math.tan(((obliqCorr / 2) * Math.PI) / 180) * Math.tan(((obliqCorr / 2) * Math.PI) / 180);
    const eqOfTime =
        4 *
        ((varY * Math.sin((2 * geomMeanLongSun * Math.PI) / 180) -
            2 * eccentEarthOrbit * Math.sin((geomMeanAnomalySun * Math.PI) / 180) +
            4 * eccentEarthOrbit * varY * Math.sin((geomMeanAnomalySun * Math.PI) / 180) * Math.cos((2 * geomMeanLongSun * Math.PI) / 180) -
            0.5 * varY * varY * Math.sin((4 * geomMeanLongSun * Math.PI) / 180) -
            1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin((2 * geomMeanAnomalySun * Math.PI) / 180)) *
            180) /
        Math.PI;

    const getHourAngle = (zenithDegrees: number) => {
        const latRad = (lat * Math.PI) / 180;
        const declinRad = (sunDeclin * Math.PI) / 180;
        const zenithRad = (zenithDegrees * Math.PI) / 180;

        const cosHA = (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(declinRad)) / (Math.cos(latRad) * Math.cos(declinRad));

        if (cosHA > 1) return { polarNight: true, polarDay: false, ha: 0 };
        if (cosHA < -1) return { polarNight: false, polarDay: true, ha: 180 };

        return { polarNight: false, polarDay: false, ha: (Math.acos(cosHA) * 180) / Math.PI };
    };

    const officialHA = getHourAngle(90.833);
    const civilHA = getHourAngle(96.0);
    const nauticalHA = getHourAngle(102.0);
    const astroHA = getHourAngle(108.0);
    const goldenHourHA = getHourAngle(84.0);

    const solarNoonUTC = 720 - 4 * lng - eqOfTime;

    const formatMinutesToTime = (minutesFromMidnightUTC: number): string => {
        let m = minutesFromMidnightUTC % 1440;
        if (m < 0) m += 1440;

        const hours = Math.floor(m / 60);
        const mins = Math.floor(m % 60);
        const secs = Math.floor((m % 1) * 60);

        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    };

    const getTimesForHA = (haObj: ReturnType<typeof getHourAngle>) => {
        if (haObj.polarNight) return { start: "Polar Night", end: "Polar Night", isSpecial: true };
        if (haObj.polarDay) return { start: "Midnight Sun", end: "Midnight Sun", isSpecial: true };

        const sunriseMins = solarNoonUTC - haObj.ha * 4;
        const sunsetMins = solarNoonUTC + haObj.ha * 4;

        return {
            start: formatMinutesToTime(sunriseMins),
            end: formatMinutesToTime(sunsetMins),
            isSpecial: false,
            sunriseMins,
            sunsetMins,
        };
    };

    const officialTimes = getTimesForHA(officialHA);
    const civilTimes = getTimesForHA(civilHA);
    const nauticalTimes = getTimesForHA(nauticalHA);
    const astroTimes = getTimesForHA(astroHA);
    const goldenHourTimes = getTimesForHA(goldenHourHA);

    let dayLengthMinutes = 0;
    if (!officialHA.polarNight && !officialHA.polarDay) {
        dayLengthMinutes = officialHA.ha * 8;
    } else if (officialHA.polarDay) {
        dayLengthMinutes = 1440;
    }

    const getAzimuth = (isSunrise: boolean) => {
        if (officialHA.polarNight || officialHA.polarDay) return 0;
        const latRad = (lat * Math.PI) / 180;
        const declinRad = (sunDeclin * Math.PI) / 180;

        const cosAzimuth = (Math.sin(declinRad) - Math.sin(latRad) * Math.cos(90.833 * Math.PI / 180)) / (Math.cos(latRad) * Math.sin(90.833 * Math.PI / 180));
        let az = (Math.acos(Math.min(Math.max(cosAzimuth, -1), 1)) * 180) / Math.PI;

        if (isSunrise) {
            az = 360 - az;
        }
        return Math.round(az * 10) / 10;
    };

    return {
        solarNoonUTC: formatMinutesToTime(solarNoonUTC),
        sunriseUTC: officialTimes.start,
        sunsetUTC: officialTimes.end,
        civilDawnUTC: civilTimes.start,
        civilDuskUTC: civilTimes.end,
        nauticalDawnUTC: nauticalTimes.start,
        nauticalDuskUTC: nauticalTimes.end,
        astroDawnUTC: astroTimes.start,
        astroDuskUTC: astroTimes.end,
        goldenHourMorningUTC: goldenHourTimes.start,
        goldenHourEveningUTC: goldenHourTimes.end,
        dayLengthMinutes,
        sunDeclinationDeg: Math.round(sunDeclin * 100) / 100,
        equationOfTimeMins: Math.round(eqOfTime * 100) / 100,
        sunriseAzimuth: rawSunriseAzimuth(),
        sunsetAzimuth: rawSunsetAzimuth(),
        isPolarNight: officialHA.polarNight,
        isPolarDay: officialHA.polarDay,
    };

    function rawSunriseAzimuth() { return getAzimuth(true); }
    function rawSunsetAzimuth() { return getAzimuth(false); }
}

export default function SunriseSunsetCalculator() {
    // Input States
    const [latInput, setLatInput] = useState<string>("40.7128");
    const [lngInput, setLngInput] = useState<string>("-74.0060");
    const [dateInput, setDateInput] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [utcOffsetInput, setUtcOffsetInput] = useState<string>("-5");
    const [copied, setCopied] = useState<boolean>(false);
    const [locationName, setLocationName] = useState<string>("New York, USA");

    // City Search States
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Format Helpers
    const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || val === "-" || !isNaN(Number(val))) {
            setLatInput(val);
        }
    };

    const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || val === "-" || !isNaN(Number(val))) {
            setLngInput(val);
        }
    };

    const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || val === "-" || val === "+" || !isNaN(Number(val))) {
            setUtcOffsetInput(val);
        }
    };

    // Select location preset
    const selectPreset = (preset: LocationPreset) => {
        setLatInput(preset.lat.toString());
        setLngInput(preset.lng.toString());
        setLocationName(`${preset.name}, ${preset.country}`);
        setUtcOffsetInput(preset.offset !== undefined ? preset.offset.toString() : Math.round(preset.lng / 15).toString());
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    // Filter cities based on search query
    const filteredCities = useMemo(() => {
        if (!searchQuery.trim()) return WORLD_CITIES;
        const q = searchQuery.toLowerCase();
        return WORLD_CITIES.filter(
            (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    // Close search dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get current device location
    const handleGeolocate = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLatInput(lat.toFixed(4));
                    setLngInput(lng.toFixed(4));
                    setLocationName("Your Current Location");

                    // Estimate UTC offset in hours
                    const offset = -new Date().getTimezoneOffset() / 60;
                    setUtcOffsetInput(offset.toString());
                    setIsDropdownOpen(false);
                },
                (error) => {
                    alert("Unable to retrieve location. Please grant permission or enter coordinates manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // Compute Solar Calculations
    const calculatedData = useMemo(() => {
        const lat = parseFloat(latInput) || 0;
        const lng = parseFloat(lngInput) || 0;
        const offset = parseFloat(utcOffsetInput) || 0;
        const selectedDate = dateInput ? new Date(dateInput + "T12:00:00Z") : new Date();

        const raw = calculateSolarData(lat, lng, selectedDate);

        // Helper to adjust UTC time string to user-selected UTC offset
        const adjustToLocalTime = (utcStr: string): string => {
            if (utcStr === "Polar Night" || utcStr === "Midnight Sun") return utcStr;

            const parts = utcStr.split(":");
            if (parts.length < 3) return utcStr;

            let hours = parseInt(parts[0], 10);
            let minutes = parseInt(parts[1], 10);
            let seconds = parseInt(parts[2], 10);

            // Add offset
            let totalSeconds = hours * 3600 + minutes * 60 + seconds + offset * 3600;

            // Handle day wraparound
            totalSeconds = (totalSeconds + 86400 * 10) % 86400;

            const locH = Math.floor(totalSeconds / 3600);
            const locM = Math.floor((totalSeconds % 3600) / 60);
            const locS = totalSeconds % 60;

            const pad = (n: number) => n.toString().padStart(2, "0");
            const time24 = `${pad(locH)}:${pad(locM)}:${pad(locS)}`;

            // Format 12-hour AM/PM
            const period = locH >= 12 ? "PM" : "AM";
            const displayH = locH % 12 === 0 ? 12 : locH % 12;
            const time12 = `${displayH}:${pad(locM)}:${pad(locS)} ${period}`;

            return `${time12} (${time24})`;
        };

        const formatDayLength = (mins: number) => {
            const h = Math.floor(mins / 60);
            const m = Math.floor(mins % 60);
            const s = Math.round((mins % 1) * 60);
            return `${h}h ${m}m ${s}s`;
        };

        return {
            sunrise: adjustToLocalTime(raw.sunriseUTC),
            sunset: adjustToLocalTime(raw.sunsetUTC),
            solarNoon: adjustToLocalTime(raw.solarNoonUTC),
            civilDawn: adjustToLocalTime(raw.civilDawnUTC),
            civilDusk: adjustToLocalTime(raw.civilDuskUTC),
            nauticalDawn: adjustToLocalTime(raw.nauticalDawnUTC),
            nauticalDusk: adjustToLocalTime(raw.nauticalDuskUTC),
            astroDawn: adjustToLocalTime(raw.astroDawnUTC),
            astroDusk: adjustToLocalTime(raw.astroDuskUTC),
            goldenHourMorning: adjustToLocalTime(raw.goldenHourMorningUTC),
            goldenHourEvening: adjustToLocalTime(raw.goldenHourEveningUTC),
            dayLengthFormatted: formatDayLength(raw.dayLengthMinutes),
            nightLengthFormatted: formatDayLength(1440 - raw.dayLengthMinutes),
            declination: raw.sunDeclinationDeg,
            eqOfTime: raw.equationOfTimeMins,
            sunriseAzimuth: raw.sunriseAzimuth,
            sunsetAzimuth: raw.sunsetAzimuth,
            isPolarNight: raw.isPolarNight,
            isPolarDay: raw.isPolarDay,
        };
    }, [latInput, lngInput, dateInput, utcOffsetInput]);

    const handleCopyResults = () => {
        const textToCopy = `Sunrise & Sunset Report for ${locationName} (${dateInput})
Latitude: ${latInput}, Longitude: ${lngInput} (UTC Offset: ${utcOffsetInput})
--------------------------------------------------
Sunrise: ${calculatedData.sunrise}
Solar Noon: ${calculatedData.solarNoon}
Sunset: ${calculatedData.sunset}
Day Length: ${calculatedData.dayLengthFormatted}
Night Length: ${calculatedData.nightLengthFormatted}

Twilight Times:
- Civil Twilight: ${calculatedData.civilDawn} to ${calculatedData.civilDusk}
- Nautical Twilight: ${calculatedData.nauticalDawn} to ${calculatedData.nauticalDusk}
- Astronomical Twilight: ${calculatedData.astroDawn} to ${calculatedData.astroDusk}

Golden Hour:
- Morning Golden Hour: ${calculatedData.civilDawn} to ${calculatedData.goldenHourMorning}
- Evening Golden Hour: ${calculatedData.goldenHourEvening} to ${calculatedData.civilDusk}

Solar Azimuth: Sunrise (${calculatedData.sunriseAzimuth}°), Sunset (${calculatedData.sunsetAzimuth}°)
Calculated with TwisterTools Sunrise & Sunset Estimator`;

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setLatInput("40.7128");
        setLngInput("-74.0060");
        setDateInput(new Date().toISOString().split("T")[0]);
        setUtcOffsetInput("-5");
        setLocationName("New York, USA");
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    // Structured Data / Schemas
    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Sunrise & Sunset Time Estimator",
        "url": "https://twistertools.com/tools/date-tools/sunrise-sunset-calculator",
        "description": "Calculate accurate sunrise, sunset, solar noon, dawn, dusk, golden hour, and day length for any global city or coordinates using precise astronomical algorithms.",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How do I search for my city in the Sunrise & Sunset Time Estimator?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simply type your city or country name into the 'Search City or Location' search bar. A dynamic dropdown list of global cities will filter in real time. Click on your target city to automatically load its exact latitude, longitude, and timezone offset."
                }
            },
            {
                "@type": "Question",
                "name": "How is official sunrise and sunset defined in solar calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Official sunrise is the exact moment when the upper edge of the Sun's disk appears above the horizon in the morning. Official sunset occurs when the upper edge disappears below the horizon in the evening. Standard calculations use a solar zenith angle of 90.833° to account for atmospheric refraction (approx. 34 arcminutes) and the Sun's semidiameter (approx. 16 arcminutes)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Civil, Nautical, and Astronomical Twilight?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Twilight is defined by the Sun's position below the horizon. Civil Twilight occurs when the Sun is between 0° and 6° below the horizon, providing enough natural light for outdoor activities without artificial lighting. Nautical Twilight occurs between 6° and 12° below the horizon, allowing sailors to navigate using horizon lines and bright stars. Astronomical Twilight occurs between 12° and 18° below the horizon, where faint stars become visible to the naked eye until complete astronomical darkness."
                }
            },
            {
                "@type": "Question",
                "name": "Why does Solar Noon rarely match 12:00 PM local clock time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Solar Noon is the instant when the Sun reaches its highest point in the sky and crosses the local meridian. It rarely coincides with 12:00 PM local clock time due to your position within your time zone (longitude offset), Daylight Saving Time (+1 hour), and the Equation of Time—a variation caused by Earth's elliptical orbit and axial tilt causing sun times to drift up to 16 minutes throughout the year."
                }
            },
            {
                "@type": "Question",
                "name": "What are Polar Night and Midnight Sun?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "At high latitudes near the Arctic and Antarctic Circles (above 66.5° N/S), Earth's axial tilt causes extreme seasonal solar behavior. Polar Night occurs in winter when the Sun stays entirely below the horizon for 24 hours. Midnight Sun (or Polar Day) occurs in summer when the Sun remains visible continuously above the horizon for 24 hours."
                }
            },
            {
                "@type": "Question",
                "name": "How does elevation affect sunrise and sunset times?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As your elevation increases, your horizon drops relative to sea level (dip of the horizon). Every 1,000 meters of elevation advance sunrise and delay sunset by approximately 1 minute, effectively lengthening your observable daylight period."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-6">
            {/* Schema Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* Main Workspace (5:7 Split Grid on Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Panel: Location & Parameters Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 lg:col-span-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            Settings
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={handleGeolocate}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-xs font-semibold transition border border-amber-200 shadow-xs"
                            >
                                <Navigation className="w-3.5 h-3.5" />
                                Use My Location
                            </button>
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* City Search Bar */}
                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Search City or Location
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Type city or country (e.g., Athens, Tokyo, Berlin)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>

                        {/* Search Filter Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                                {filteredCities.length > 0 ? (
                                    filteredCities.map((city) => (
                                        <button
                                            key={`${city.name}-${city.country}`}
                                            type="button"
                                            onClick={() => selectPreset(city)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/70 transition flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">
                                                    {city.name}
                                                </p>
                                                <p className="text-xs text-slate-500">{city.country}</p>
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-600">
                                                {city.lat > 0 ? `${city.lat}°N` : `${Math.abs(city.lat)}°S`},{" "}
                                                {city.lng > 0 ? `${city.lng}°E` : `${Math.abs(city.lng)}°W`}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-xs text-slate-500 text-center">
                                        No matching city found. Enter custom coordinates below.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Preset Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Quick City Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => selectPreset(preset)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${locationName.includes(preset.name)
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Coordinate Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                                Latitude (-90 to 90)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={latInput}
                                    onChange={handleLatChange}
                                    placeholder="e.g. 40.7128"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">°N</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                                Longitude (-180 to 180)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={lngInput}
                                    onChange={handleLngChange}
                                    placeholder="e.g. -74.0060"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">°E</span>
                            </div>
                        </div>
                    </div>

                    {/* Date & UTC Offset */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                                Calculation Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dateInput}
                                    onChange={(e) => setDateInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                                UTC Timezone Offset (Hours)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={utcOffsetInput}
                                    onChange={handleOffsetChange}
                                    placeholder="e.g. -5 or +2"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">HRS</span>
                            </div>
                        </div>
                    </div>

                    {/* Location Summary Tag */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Selected Location Target</p>
                                <p className="text-sm font-bold text-slate-900">{locationName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-medium">Coordinates</p>
                            <p className="text-xs font-mono font-semibold text-indigo-600">
                                {parseFloat(latInput || "0").toFixed(2)}°, {parseFloat(lngInput || "0").toFixed(2)}°
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Primary Solar Calculations Output */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 lg:col-span-7">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Sun className="w-5 h-5 text-amber-500" />
                            Solar Times Overview
                        </h2>
                        <button
                            onClick={handleCopyResults}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? "Copied Report!" : "Copy Full Report"}</span>
                        </button>
                    </div>

                    {/* Primary Cards: Sunrise, Noon, Sunset */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Sunrise Card */}
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Sunrise</span>
                                <Sunrise className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                                    {calculatedData.sunrise}
                                </p>
                                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                                    Azimuth: {calculatedData.sunriseAzimuth}° E
                                </p>
                            </div>
                        </div>

                        {/* Solar Noon Card */}
                        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Solar Noon</span>
                                <Sun className="w-5 h-5 text-sky-600" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                                    {calculatedData.solarNoon}
                                </p>
                                <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                                    Sun at highest peak
                                </p>
                            </div>
                        </div>

                        {/* Sunset Card */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-xl p-4 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Sunset</span>
                                <Sunset className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                                    {calculatedData.sunset}
                                </p>
                                <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                                    Azimuth: {calculatedData.sunsetAzimuth}° W
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Daylight Duration Progress Bar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                Day Length: <strong className="text-slate-900">{calculatedData.dayLengthFormatted}</strong>
                            </span>
                            <span className="text-slate-500">
                                Night: <strong className="text-slate-900">{calculatedData.nightLengthFormatted}</strong>
                            </span>
                        </div>
                        {/* Visual ratio bar */}
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                            <div
                                className="bg-amber-400 h-full transition-all duration-500"
                                style={{
                                    width: `${(parseFloat(calculatedData.dayLengthFormatted.split("h")[0] || "0") / 24) * 100
                                        }%`,
                                }}
                                title="Daylight Proportion"
                            ></div>
                            <div className="bg-slate-800 h-full flex-1" title="Nighttime Proportion"></div>
                        </div>
                    </div>

                    {/* Detailed Twilight & Golden Hour Table */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Twilight & Photography Windows
                        </h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm">
                            <div className="p-3 bg-slate-50/80 flex items-center justify-between">
                                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Morning Golden Hour
                                </span>
                                <span className="font-mono text-slate-900 font-medium">
                                    {calculatedData.civilDawn} - {calculatedData.goldenHourMorning}
                                </span>
                            </div>
                            <div className="p-3 bg-white flex items-center justify-between">
                                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Evening Golden Hour
                                </span>
                                <span className="font-mono text-slate-900 font-medium">
                                    {calculatedData.goldenHourEvening} - {calculatedData.civilDusk}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 flex items-center justify-between">
                                <span className="font-medium text-slate-700">Civil Twilight (Dawn / Dusk)</span>
                                <span className="font-mono text-slate-800">
                                    {calculatedData.civilDawn} / {calculatedData.civilDusk}
                                </span>
                            </div>
                            <div className="p-3 bg-white flex items-center justify-between">
                                <span className="font-medium text-slate-700">Nautical Twilight (Dawn / Dusk)</span>
                                <span className="font-mono text-slate-800">
                                    {calculatedData.nauticalDawn} / {calculatedData.nauticalDusk}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 flex items-center justify-between">
                                <span className="font-medium text-slate-700">Astronomical Twilight</span>
                                <span className="font-mono text-slate-800">
                                    {calculatedData.astroDawn} / {calculatedData.astroDusk}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD SEO CONTENT CARDS */}

            {/* Card 1: Comprehensive Guide / How It Works */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Understanding Solar Position & Astronomical Calculations
                    </h2>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    The exact times of sunrise, sunset, and twilight are determined by the geometrical relationship between Earth's axial tilt, orbital position around the Sun, and your precise geographical latitude and longitude. Our estimator features an interactive global city search tool alongside precision astronomical algorithms adapted from the <strong>NOAA (National Oceanic and Atmospheric Administration) Solar Calculator</strong>, delivering instant solar event estimations anywhere on Earth.
                </p>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    When determining solar event times, two primary physical corrections are automatically incorporated into our algorithms:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm md:text-base">
                    <li>
                        <strong>Atmospheric Refraction:</strong> Earth's atmosphere bends incoming sunlight upward by approximately 34 arcminutes (0.566°). As a result, the Sun appears above the horizon shortly before its geometric body actually rises.
                    </li>
                    <li>
                        <strong>Solar Angular Diameter:</strong> Official sunrise and sunset are marked by the appearance or disappearance of the Sun's <em>top rim</em> (upper limb), not its central core. This accounts for an additional 16 arcminutes (0.266°) of angular radius.
                    </li>
                    <li>
                        <strong>Standard Zenith Angle:</strong> Combining refraction and angular radius yields the official solar zenith angle of <strong>90.833°</strong> (90° + 50 arcminutes) for true sunrise and sunset computations.
                    </li>
                </ul>
            </div>

            {/* Card 2: Key Solar Definitions Matrix */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Core Astronomical Definitions & Solar Terminology
                    </h2>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Understanding the core concepts behind solar position tracking clarifies why clock times shift throughout the year and how geographical parameters dictate solar events.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-700">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 font-bold text-slate-900 min-w-[140px]">Term</th>
                                <th className="p-3 font-bold text-slate-900 min-w-[180px]">Solar Zenith Angle</th>
                                <th className="p-3 font-bold text-slate-900 min-w-[280px]">Physical Description & Primary Utility</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">Official Sunrise</td>
                                <td className="p-3 font-mono text-indigo-600">90.833°</td>
                                <td className="p-3">First upper edge of the Sun becomes visible above the horizon. Used as legal daylight boundary.</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">Solar Noon</td>
                                <td className="p-3 font-mono text-indigo-600">Local Minimum</td>
                                <td className="p-3">The moment the Sun crosses the local meridian and reaches its highest elevation in the sky.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">Official Sunset</td>
                                <td className="p-3 font-mono text-indigo-600">90.833°</td>
                                <td className="p-3">The upper limb of the Sun vanishes completely beneath the horizon. Marks end of geometric daytime.</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">Solar Azimuth</td>
                                <td className="p-3 font-mono text-indigo-600">0° to 360°</td>
                                <td className="p-3">The horizontal compass direction of the Sun measured clockwise from true north. Critical for solar panel tilt.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">Solar Declination</td>
                                <td className="p-3 font-mono text-indigo-600">-23.44° to +23.44°</td>
                                <td className="p-3">The angle between Earth's equatorial plane and the line joining the centers of Earth and Sun. Dictates seasons.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card 3: Technical Breakdown of Twilight Phases */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Compass className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        The Three Phases of Twilight & Golden Hour
                    </h2>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Twilight occurs during the intervals before sunrise and after sunset when the Sun is below the horizon, but Earth's upper atmosphere remains illuminated. Depending on your activity—whether photography, astronomy, maritime navigation, or aviation—different twilight thresholds are required:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                            <Sun className="w-4 h-4 text-amber-500" /> Civil Twilight (0° to -6°)
                        </h3>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            The Sun is up to 6° below the horizon. Natural light is sufficient for outdoor activities without artificial illumination. Terrestrial objects are clearly defined, and only the brightest stars are visible.
                        </p>
                    </div>

                    <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-sky-500" /> Nautical Twilight (-6° to -12°)
                        </h3>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            The Sun sits 6° to 12° below the horizon. Mariners can distinguish horizon lines while simultaneously viewing bright navigation stars. Artificial street lighting becomes necessary on land.
                        </p>
                    </div>

                    <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" /> Astronomical Twilight (-12° to -18°)
                        </h3>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            The Sun is 12° to 18° below the horizon. The sky is nearly dark, allowing astronomers to observe deep-sky objects. Past -18°, complete astronomical night is reached.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 4: Mathematics Behind NOAA Solar Calculations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Mathematical Foundation & Equation of Time Formula
                    </h2>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Solar calculation engines use astronomical algorithms to compute the hour angle ($HA$) of the Sun for any given latitude ($\phi$), declination ($\delta$), and zenith angle ($Z$). The primary governing equation is:
                </p>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto text-center">
                    <code>
                        {"\\cos(HA) = \\frac{\\cos(Z) - \\sin(\\phi) \\cdot \\sin(\\delta)}{\\cos(\\phi) \\cdot \\cos(\\delta)}"}
                    </code>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Additionally, the <strong>Equation of Time (EoT)</strong> compensates for Earth's orbital eccentricity and axial tilt. The EoT value fluctuates continuously throughout the year, causing true solar noon to shift by up to +14 minutes or -16 minutes relative to mean solar time.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Julian Century ($JC$)</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Calculated from Julian Day ($JD$) relative to standard epoch J2000.0: <br />
                            <span className="font-mono text-indigo-600">JC = (JD - 2451545.0) / 36525.0</span>
                        </p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Sun Declination ($\delta$)</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Combines corrected mean obliquity of the ecliptic with the Sun's apparent longitude to determine precise tilt.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 5: Practical Real-World Applications */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Real-World Practical Applications Across Industries
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Camera className="w-4 h-4 text-indigo-600" />
                            <span>Photography & Outdoor Cinematography</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Photographers leverage Golden Hour and Blue Hour calculations to plan outdoor shoots with optimal ambient lighting, avoiding harsh midday shadows.
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>Solar Energy & Engineering</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Solar array installers utilize sunrise/sunset times along with azimuth angle data to optimize photovoltaic panel tilt angles and forecast energy yield.
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            <span>Aviation & Maritime Operations</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Pilots enforce strict Visual Flight Rules (VFR) tied to Civil Twilight limits, while mariners use nautical twilight calculations for celestial star navigation.
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Agriculture & Horticulture</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Farmers monitor seasonal changes in total daylight duration to optimize crop planting schedules, irrigation cycles, and livestock management.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 6: Frequently Asked Questions (Static Highlighted Cards) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            How do I search for my city in the Sunrise & Sunset Time Estimator?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Simply type your city or country name into the 'Search City or Location' search bar. A dynamic dropdown list of global cities will filter in real time. Click on your target city to automatically load its exact latitude, longitude, and timezone offset.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            How is official sunrise and sunset defined in solar calculations?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Official sunrise is the exact moment when the upper edge of the Sun's disk appears above the horizon in the morning. Official sunset occurs when the upper edge disappears below the horizon in the evening. Standard calculations use a solar zenith angle of 90.833° to account for atmospheric refraction (approx. 34 arcminutes) and the Sun's semidiameter (approx. 16 arcminutes).
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            What is the difference between Civil, Nautical, and Astronomical Twilight?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Twilight is defined by the Sun's position below the horizon. Civil Twilight occurs when the Sun is between 0° and 6° below the horizon, providing enough natural light for outdoor activities without artificial lighting. Nautical Twilight occurs between 6° and 12° below the horizon, allowing sailors to navigate using horizon lines and bright stars. Astronomical Twilight occurs between 12° and 18° below the horizon, where faint stars become visible to the naked eye until complete astronomical darkness.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            Why does Solar Noon rarely match 12:00 PM local clock time?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Solar Noon is the instant when the Sun reaches its highest point in the sky and crosses the local meridian. It rarely coincides with 12:00 PM local clock time due to your position within your time zone (longitude offset), Daylight Saving Time (+1 hour), and the Equation of Time—a variation caused by Earth's elliptical orbit and axial tilt causing sun times to drift up to 16 minutes throughout the year.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            What are Polar Night and Midnight Sun?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            At high latitudes near the Arctic and Antarctic Circles (above 66.5° N/S), Earth's axial tilt causes extreme seasonal solar behavior. Polar Night occurs in winter when the Sun stays entirely below the horizon for 24 hours. Midnight Sun (or Polar Day) occurs in summer when the Sun remains visible continuously above the horizon for 24 hours.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            How does elevation affect sunrise and sunset times?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            As your elevation increases, your horizon drops relative to sea level (dip of the horizon). Every 1,000 meters of elevation advance sunrise and delay sunset by approximately 1 minute, effectively lengthening your observable daylight period.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
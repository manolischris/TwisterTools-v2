"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    Globe2,
    RotateCw,
    Sparkles,
    CheckCircle2,
    XCircle,
    BookOpen,
    HelpCircle,
    Trophy,
    Flame,
    Share2,
    Compass,
    Landmark,
    Users,
    MapPin,
    Coins,
    Languages,
    Layers,
    ListFilter,
    Download,
    Copy,
    Check,
    BarChart3,
    ArrowRight,
    RefreshCw,
    ShieldCheck
} from "lucide-react";

type Continent = "All" | "Africa" | "Americas" | "Asia" | "Europe" | "Oceania";
type QuizMode = "flag-to-country" | "country-to-capital" | "country-to-flag";

interface CountryData {
    code: string; // ISO 3166-1 alpha-2
    name: string;
    capital: string;
    continent: Continent;
    population: number;
    areaSqKm: number;
    currency: string;
    languages: string[];
}

// Curated 70+ sovereign nation dataset covering all continents
const COUNTRIES: CountryData[] = [
    { code: "af", name: "Afghanistan", capital: "Kabul", continent: "Asia", population: 41100000, areaSqKm: 652864, currency: "Afghan Afghani (AFN)", languages: ["Pashto", "Dari"] },
    { code: "al", name: "Albania", capital: "Tirana", continent: "Europe", population: 2800000, areaSqKm: 28748, currency: "Albanian Lek (ALL)", languages: ["Albanian"] },
    { code: "dz", name: "Algeria", capital: "Algiers", continent: "Africa", population: 44900000, areaSqKm: 2381741, currency: "Algerian Dinar (DZD)", languages: ["Arabic", "Berber"] },
    { code: "ad", name: "Andorra", capital: "Andorra la Vella", continent: "Europe", population: 80000, areaSqKm: 468, currency: "Euro (EUR)", languages: ["Catalan"] },
    { code: "ao", name: "Angola", capital: "Luanda", continent: "Africa", population: 35600000, areaSqKm: 1246700, currency: "Angolan Kwanza (AOA)", languages: ["Portuguese"] },
    { code: "ag", name: "Antigua and Barbuda", capital: "Saint John's", continent: "Americas", population: 94000, areaSqKm: 442, currency: "East Caribbean Dollar (XCD)", languages: ["English"] },
    { code: "ar", name: "Argentina", capital: "Buenos Aires", continent: "Americas", population: 45800000, areaSqKm: 2780400, currency: "Argentine Peso (ARS)", languages: ["Spanish"] },
    { code: "am", name: "Armenia", capital: "Yerevan", continent: "Asia", population: 2800000, areaSqKm: 29743, currency: "Armenian Dram (AMD)", languages: ["Armenian"] },
    { code: "au", name: "Australia", capital: "Canberra", continent: "Oceania", population: 26000000, areaSqKm: 7692024, currency: "Australian Dollar (AUD)", languages: ["English"] },
    { code: "at", name: "Austria", capital: "Vienna", continent: "Europe", population: 9100000, areaSqKm: 83879, currency: "Euro (EUR)", languages: ["German"] },
    { code: "az", name: "Azerbaijan", capital: "Baku", continent: "Asia", population: 10100000, areaSqKm: 86600, currency: "Azerbaijani Manat (AZN)", languages: ["Azerbaijani"] },
    { code: "bs", name: "Bahamas", capital: "Nassau", continent: "Americas", population: 410000, areaSqKm: 13878, currency: "Bahamian Dollar (BSD)", languages: ["English"] },
    { code: "bh", name: "Bahrain", capital: "Manama", continent: "Asia", population: 1500000, areaSqKm: 785, currency: "Bahraini Dinar (BHD)", languages: ["Arabic"] },
    { code: "bd", name: "Bangladesh", capital: "Dhaka", continent: "Asia", population: 171000000, areaSqKm: 148460, currency: "Bangladeshi Taka (BDT)", languages: ["Bengali"] },
    { code: "bb", name: "Barbados", capital: "Bridgetown", continent: "Americas", population: 282000, areaSqKm: 430, currency: "Barbados Dollar (BBD)", languages: ["English"] },
    { code: "by", name: "Belarus", capital: "Minsk", continent: "Europe", population: 9200000, areaSqKm: 207600, currency: "Belarusian Ruble (BYN)", languages: ["Belarusian", "Russian"] },
    { code: "be", name: "Belgium", capital: "Brussels", continent: "Europe", population: 11700000, areaSqKm: 30528, currency: "Euro (EUR)", languages: ["Dutch", "French", "German"] },
    { code: "bz", name: "Belize", capital: "Belmopan", continent: "Americas", population: 405000, areaSqKm: 22966, currency: "Belize Dollar (BZD)", languages: ["English", "Spanish"] },
    { code: "bj", name: "Benin", capital: "Porto-Novo", continent: "Africa", population: 13400000, areaSqKm: 114763, currency: "West African CFA franc (XOF)", languages: ["French"] },
    { code: "bt", name: "Bhutan", capital: "Thimphu", continent: "Asia", population: 782000, areaSqKm: 38394, currency: "Bhutanese Ngultrum (BTN)", languages: ["Dzongkha"] },
    { code: "bo", name: "Bolivia", capital: "Sucre", continent: "Americas", population: 12200000, areaSqKm: 1098581, currency: "Bolivian Boliviano (BOB)", languages: ["Spanish", "Quechua", "Aymara"] },
    { code: "ba", name: "Bosnia and Herzegovina", capital: "Sarajevo", continent: "Europe", population: 3200000, areaSqKm: 51197, currency: "Convertible Mark (BAM)", languages: ["Bosnian", "Croatian", "Serbian"] },
    { code: "bw", name: "Botswana", capital: "Gaborone", continent: "Africa", population: 2630000, areaSqKm: 581730, currency: "Botswana Pula (BWP)", languages: ["English", "Tswana"] },
    { code: "br", name: "Brazil", capital: "Brasília", continent: "Americas", population: 215000000, areaSqKm: 8515767, currency: "Brazilian Real (BRL)", languages: ["Portuguese"] },
    { code: "bn", name: "Brunei", capital: "Bandar Seri Begawan", continent: "Asia", population: 450000, areaSqKm: 5765, currency: "Brunei Dollar (BND)", languages: ["Malay", "English"] },
    { code: "bg", name: "Bulgaria", capital: "Sofia", continent: "Europe", population: 6400000, areaSqKm: 110994, currency: "Bulgarian Lev (BGN)", languages: ["Bulgarian"] },
    { code: "bf", name: "Burkina Faso", capital: "Ouagadougou", continent: "Africa", population: 22700000, areaSqKm: 274200, currency: "West African CFA franc (XOF)", languages: ["French"] },
    { code: "bi", name: "Burundi", capital: "Gitega", continent: "Africa", population: 13000000, areaSqKm: 27834, currency: "Burundian Franc (BIF)", languages: ["Kirundi", "French", "English"] },
    { code: "cv", name: "Cabo Verde", capital: "Praia", continent: "Africa", population: 590000, areaSqKm: 4033, currency: "Cape Verdean Escudo (CVE)", languages: ["Portuguese"] },
    { code: "kh", name: "Cambodia", capital: "Phnom Penh", continent: "Asia", population: 16800000, areaSqKm: 181035, currency: "Cambodian Riel (KHR)", languages: ["Khmer"] },
    { code: "cm", name: "Cameroon", capital: "Yaoundé", continent: "Africa", population: 28000000, areaSqKm: 475442, currency: "Central African CFA franc (XAF)", languages: ["French", "English"] },
    { code: "ca", name: "Canada", capital: "Ottawa", continent: "Americas", population: 40000000, areaSqKm: 9984670, currency: "Canadian Dollar (CAD)", languages: ["English", "French"] },
    { code: "cf", name: "Central African Republic", capital: "Bangui", continent: "Africa", population: 5600000, areaSqKm: 622984, currency: "Central African CFA franc (XAF)", languages: ["Sango", "French"] },
    { code: "td", name: "Chad", capital: "N'Djamena", continent: "Africa", population: 17700000, areaSqKm: 1284000, currency: "Central African CFA franc (XAF)", languages: ["French", "Arabic"] },
    { code: "cl", name: "Chile", capital: "Santiago", continent: "Americas", population: 19600000, areaSqKm: 756102, currency: "Chilean Peso (CLP)", languages: ["Spanish"] },
    { code: "cn", name: "China", capital: "Beijing", continent: "Asia", population: 1410000000, areaSqKm: 9596961, currency: "Chinese Yuan (CNY)", languages: ["Mandarin"] },
    { code: "co", name: "Colombia", capital: "Bogotá", continent: "Americas", population: 52000000, areaSqKm: 1141748, currency: "Colombian Peso (COP)", languages: ["Spanish"] },
    { code: "km", name: "Comoros", capital: "Moroni", continent: "Africa", population: 836000, areaSqKm: 2235, currency: "Comorian Franc (KMF)", languages: ["Comorian", "Arabic", "French"] },
    { code: "cg", name: "Congo (Brazzaville)", capital: "Brazzaville", continent: "Africa", population: 6000000, areaSqKm: 342000, currency: "Central African CFA franc (XAF)", languages: ["French", "Lingala"] },
    { code: "cd", name: "Congo (Kinshasa)", capital: "Kinshasa", continent: "Africa", population: 99000000, areaSqKm: 2344858, currency: "Congolese Franc (CDF)", languages: ["French", "Lingala", "Swahili"] },
    { code: "cr", name: "Costa Rica", capital: "San José", continent: "Americas", population: 5180000, areaSqKm: 51100, currency: "Costa Rican Colón (CRC)", languages: ["Spanish"] },
    { code: "hr", name: "Croatia", capital: "Zagreb", continent: "Europe", population: 3850000, areaSqKm: 56594, currency: "Euro (EUR)", languages: ["Croatian"] },
    { code: "cu", name: "Cuba", capital: "Havana", continent: "Americas", population: 11200000, areaSqKm: 109884, currency: "Cuban Peso (CUP)", languages: ["Spanish"] },
    { code: "cy", name: "Cyprus", capital: "Nicosia", continent: "Asia", population: 1250000, areaSqKm: 9251, currency: "Euro (EUR)", languages: ["Greek", "Turkish"] },
    { code: "cz", name: "Czech Republic", capital: "Prague", continent: "Europe", population: 10900000, areaSqKm: 78867, currency: "Czech Koruna (CZK)", languages: ["Czech"] },
    { code: "dk", name: "Denmark", capital: "Copenhagen", continent: "Europe", population: 5930000, areaSqKm: 42933, currency: "Danish Krone (DKK)", languages: ["Danish"] },
    { code: "dj", name: "Djibouti", capital: "Djibouti", continent: "Africa", population: 1100000, areaSqKm: 23200, currency: "Djiboutian Franc (DJF)", languages: ["Arabic", "French"] },
    { code: "dm", name: "Dominica", capital: "Roseau", continent: "Americas", population: 72000, areaSqKm: 751, currency: "East Caribbean Dollar (XCD)", languages: ["English"] },
    { code: "do", name: "Dominican Republic", capital: "Santo Domingo", continent: "Americas", population: 11200000, areaSqKm: 48671, currency: "Dominican Peso (DOP)", languages: ["Spanish"] },
    { code: "ec", name: "Ecuador", capital: "Quito", continent: "Americas", population: 18000000, areaSqKm: 283561, currency: "United States Dollar (USD)", languages: ["Spanish", "Kichwa"] },
    { code: "eg", name: "Egypt", capital: "Cairo", continent: "Africa", population: 112000000, areaSqKm: 1002450, currency: "Egyptian Pound (EGP)", languages: ["Arabic"] },
    { code: "sv", name: "El Salvador", capital: "San Salvador", continent: "Americas", population: 6300000, areaSqKm: 21041, currency: "United States Dollar (USD)", languages: ["Spanish"] },
    { code: "gq", name: "Equatorial Guinea", capital: "Malabo", continent: "Africa", population: 1600000, areaSqKm: 28051, currency: "Central African CFA franc (XAF)", languages: ["Spanish", "French", "Portuguese"] },
    { code: "er", name: "Eritrea", capital: "Asmara", continent: "Africa", population: 3600000, areaSqKm: 117600, currency: "Eritrean Nakfa (ERN)", languages: ["Tigrinya", "Arabic", "English"] },
    { code: "ee", name: "Estonia", capital: "Tallinn", continent: "Europe", population: 1300000, areaSqKm: 45227, currency: "Euro (EUR)", languages: ["Estonian"] },
    { code: "sz", name: "Eswatini", capital: "Mbabane", continent: "Africa", population: 1200000, areaSqKm: 17364, currency: "Swazi Lilangeni (SZL)", languages: ["Swazi", "English"] },
    { code: "et", name: "Ethiopia", capital: "Addis Ababa", continent: "Africa", population: 123000000, areaSqKm: 1104300, currency: "Ethiopian Birr (ETB)", languages: ["Amharic"] },
    { code: "fj", name: "Fiji", capital: "Suva", continent: "Oceania", population: 926000, areaSqKm: 18274, currency: "Fijian Dollar (FJD)", languages: ["English", "Fijian", "Hindustani"] },
    { code: "fi", name: "Finland", capital: "Helsinki", continent: "Europe", population: 5560000, areaSqKm: 338424, currency: "Euro (EUR)", languages: ["Finnish", "Swedish"] },
    { code: "fr", name: "France", capital: "Paris", continent: "Europe", population: 68000000, areaSqKm: 551695, currency: "Euro (EUR)", languages: ["French"] },
    { code: "ga", name: "Gabon", capital: "Libreville", continent: "Africa", population: 2400000, areaSqKm: 267667, currency: "Central African CFA franc (XAF)", languages: ["French"] },
    { code: "gm", name: "Gambia", capital: "Banjul", continent: "Africa", population: 2700000, areaSqKm: 10689, currency: "Gambian Dalasi (GMD)", languages: ["English"] },
    { code: "ge", name: "Georgia", capital: "Tbilisi", continent: "Asia", population: 3700000, areaSqKm: 69700, currency: "Georgian Lari (GEL)", languages: ["Georgian"] },
    { code: "de", name: "Germany", capital: "Berlin", continent: "Europe", population: 84400000, areaSqKm: 357022, currency: "Euro (EUR)", languages: ["German"] },
    { code: "gh", name: "Ghana", capital: "Accra", continent: "Africa", population: 34000000, areaSqKm: 238533, currency: "Ghanaian Cedi (GHS)", languages: ["English"] },
    { code: "gr", name: "Greece", capital: "Athens", continent: "Europe", population: 10400000, areaSqKm: 131957, currency: "Euro (EUR)", languages: ["Greek"] },
    { code: "gd", name: "Grenada", capital: "Saint George's", continent: "Americas", population: 125000, areaSqKm: 344, currency: "East Caribbean Dollar (XCD)", languages: ["English"] },
    { code: "gt", name: "Guatemala", capital: "Guatemala City", continent: "Americas", population: 18000000, areaSqKm: 108889, currency: "Guatemalan Quetzal (GTQ)", languages: ["Spanish"] },
    { code: "gn", name: "Guinea", capital: "Conakry", continent: "Africa", population: 13900000, areaSqKm: 245857, currency: "Guinean Franc (GNF)", languages: ["French"] },
    { code: "gw", name: "Guinea-Bissau", capital: "Bissau", continent: "Africa", population: 2100000, areaSqKm: 36125, currency: "West African CFA franc (XOF)", languages: ["Portuguese"] },
    { code: "gy", name: "Guyana", capital: "Georgetown", continent: "Americas", population: 800000, areaSqKm: 214969, currency: "Guyanese Dollar (GYD)", languages: ["English"] },
    { code: "ht", name: "Haiti", capital: "Port-au-Prince", continent: "Americas", population: 11500000, areaSqKm: 27750, currency: "Haitian Gourde (HTG)", languages: ["French", "Haitian Creole"] },
    { code: "hn", name: "Honduras", capital: "Tegucigalpa", continent: "Americas", population: 10400000, areaSqKm: 112492, currency: "Honduran Lempira (HNL)", languages: ["Spanish"] },
    { code: "hu", name: "Hungary", capital: "Budapest", continent: "Europe", population: 9600000, areaSqKm: 93028, currency: "Hungarian Forint (HUF)", languages: ["Hungarian"] },
    { code: "is", name: "Iceland", capital: "Reykjavik", continent: "Europe", population: 390000, areaSqKm: 103000, currency: "Icelandic Króna (ISK)", languages: ["Icelandic"] },
    { code: "in", name: "India", capital: "New Delhi", continent: "Asia", population: 1428000000, areaSqKm: 3287263, currency: "Indian Rupee (INR)", languages: ["Hindi", "English"] },
    { code: "id", name: "Indonesia", capital: "Jakarta", continent: "Asia", population: 277000000, areaSqKm: 1904569, currency: "Indonesian Rupiah (IDR)", languages: ["Indonesian"] },
    { code: "ir", name: "Iran", capital: "Tehran", continent: "Asia", population: 88500000, areaSqKm: 1648195, currency: "Iranian Rial (IRR)", languages: ["Persian"] },
    { code: "iq", name: "Iraq", capital: "Baghdad", continent: "Asia", population: 44500000, areaSqKm: 438317, currency: "Iraqi Dinar (IQD)", languages: ["Arabic", "Kurdish"] },
    { code: "ie", name: "Ireland", capital: "Dublin", continent: "Europe", population: 5200000, areaSqKm: 70273, currency: "Euro (EUR)", languages: ["English", "Irish"] },
    { code: "il", name: "Israel", capital: "Jerusalem", continent: "Asia", population: 9700000, areaSqKm: 22072, currency: "Israeli New Shekel (ILS)", languages: ["Hebrew", "Arabic"] },
    { code: "it", name: "Italy", capital: "Rome", continent: "Europe", population: 58900000, areaSqKm: 301340, currency: "Euro (EUR)", languages: ["Italian"] },
    { code: "ci", name: "Ivory Coast", capital: "Yamoussoukro", continent: "Africa", population: 28000000, areaSqKm: 322463, currency: "West African CFA franc (XOF)", languages: ["French"] },
    { code: "jm", name: "Jamaica", capital: "Kingston", continent: "Americas", population: 2800000, areaSqKm: 10991, currency: "Jamaican Dollar (JMD)", languages: ["English"] },
    { code: "jp", name: "Japan", capital: "Tokyo", continent: "Asia", population: 124500000, areaSqKm: 377975, currency: "Japanese Yen (JPY)", languages: ["Japanese"] },
    { code: "jo", name: "Jordan", capital: "Amman", continent: "Asia", population: 11300000, areaSqKm: 89342, currency: "Jordanian Dinar (JOD)", languages: ["Arabic"] },
    { code: "kz", name: "Kazakhstan", capital: "Astana", continent: "Asia", population: 19800000, areaSqKm: 2724900, currency: "Kazakhstani Tenge (KZT)", languages: ["Kazakh", "Russian"] },
    { code: "ke", name: "Kenya", capital: "Nairobi", continent: "Africa", population: 55000000, areaSqKm: 580367, currency: "Kenyan Shilling (KES)", languages: ["Swahili", "English"] },
    { code: "ki", name: "Kiribati", capital: "Tarawa", continent: "Oceania", population: 131000, areaSqKm: 811, currency: "Australian Dollar (AUD)", languages: ["English", "Gilbertese"] },
    { code: "kp", name: "North Korea", capital: "Pyongyang", continent: "Asia", population: 26000000, areaSqKm: 120538, currency: "North Korean Won (KPW)", languages: ["Korean"] },
    { code: "kr", name: "South Korea", capital: "Seoul", continent: "Asia", population: 51700000, areaSqKm: 100210, currency: "South Korean Won (KRW)", languages: ["Korean"] },
    { code: "kw", name: "Kuwait", capital: "Kuwait City", continent: "Asia", population: 4300000, areaSqKm: 17818, currency: "Kuwaiti Dinar (KWD)", languages: ["Arabic"] },
    { code: "kg", name: "Kyrgyzstan", capital: "Bishkek", continent: "Asia", population: 7000000, areaSqKm: 199951, currency: "Kyrgyzstani Som (KGS)", languages: ["Kyrgyz", "Russian"] },
    { code: "la", name: "Laos", capital: "Vientiane", continent: "Asia", population: 7500000, areaSqKm: 236800, currency: "Lao Kip (LAK)", languages: ["Lao"] },
    { code: "lv", name: "Latvia", capital: "Riga", continent: "Europe", population: 1880000, areaSqKm: 64589, currency: "Euro (EUR)", languages: ["Latvian"] },
    { code: "lb", name: "Lebanon", capital: "Beirut", continent: "Asia", population: 5500000, areaSqKm: 10452, currency: "Lebanese Pound (LBP)", languages: ["Arabic"] },
    { code: "ls", name: "Lesotho", capital: "Maseru", continent: "Africa", population: 2300000, areaSqKm: 30355, currency: "Lesotho Loti (LSL)", languages: ["Sesotho", "English"] },
    { code: "lr", name: "Liberia", capital: "Monrovia", continent: "Africa", population: 5300000, areaSqKm: 111369, currency: "Liberian Dollar (LRD)", languages: ["English"] },
    { code: "ly", name: "Libya", capital: "Tripoli", continent: "Africa", population: 6800000, areaSqKm: 1759540, currency: "Libyan Dinar (LYD)", languages: ["Arabic"] },
    { code: "li", name: "Liechtenstein", capital: "Vaduz", continent: "Europe", population: 39000, areaSqKm: 160, currency: "Swiss Franc (CHF)", languages: ["German"] },
    { code: "lt", name: "Lithuania", capital: "Vilnius", continent: "Europe", population: 2800000, areaSqKm: 65300, currency: "Euro (EUR)", languages: ["Lithuanian"] },
    { code: "lu", name: "Luxembourg", capital: "Luxembourg City", continent: "Europe", population: 660000, areaSqKm: 2586, currency: "Euro (EUR)", languages: ["Luxembourgish", "French", "German"] },
    { code: "mg", name: "Madagascar", capital: "Antananarivo", continent: "Africa", population: 29600000, areaSqKm: 587041, currency: "Malagasy Ariary (MGA)", languages: ["Malagasy", "French"] },
    { code: "mw", name: "Malawi", capital: "Lilongwe", continent: "Africa", population: 20400000, areaSqKm: 118484, currency: "Malawian Kwacha (MWK)", languages: ["English", "Chewa"] },
    { code: "my", name: "Malaysia", capital: "Kuala Lumpur", continent: "Asia", population: 33900000, areaSqKm: 329847, currency: "Malaysian Ringgit (MYR)", languages: ["Malay"] },
    { code: "mv", name: "Maldives", capital: "Malé", continent: "Asia", population: 520000, areaSqKm: 298, currency: "Maldivian Rufiyaa (MVR)", languages: ["Dhivehi"] },
    { code: "ml", name: "Mali", capital: "Bamako", continent: "Africa", population: 22600000, areaSqKm: 1240192, currency: "West African CFA franc (XOF)", languages: ["Bambara"] },
    { code: "mt", name: "Malta", capital: "Valletta", continent: "Europe", population: 530000, areaSqKm: 316, currency: "Euro (EUR)", languages: ["Maltese", "English"] },
    { code: "mh", name: "Marshall Islands", capital: "Majuro", continent: "Oceania", population: 42000, areaSqKm: 181, currency: "United States Dollar (USD)", languages: ["Marshallese", "English"] },
    { code: "mr", name: "Mauritania", capital: "Nouakchott", continent: "Africa", population: 4700000, areaSqKm: 1030700, currency: "Mauritanian Ouguiya (MRU)", languages: ["Arabic"] },
    { code: "mu", name: "Mauritius", capital: "Port Louis", continent: "Africa", population: 1300000, areaSqKm: 2040, currency: "Mauritian Rupee (MUR)", languages: ["English", "French", "Mauritian Creole"] },
    { code: "mx", name: "Mexico", capital: "Mexico City", continent: "Americas", population: 128000000, areaSqKm: 1964375, currency: "Mexican Peso (MXN)", languages: ["Spanish"] },
    { code: "fm", name: "Micronesia", capital: "Palikir", continent: "Oceania", population: 114000, areaSqKm: 702, currency: "United States Dollar (USD)", languages: ["English"] },
    { code: "md", name: "Moldova", capital: "Chisinau", continent: "Europe", population: 2500000, areaSqKm: 33846, currency: "Moldovan Leu (MDL)", languages: ["Romanian"] },
    { code: "mc", name: "Monaco", capital: "Monaco", continent: "Europe", population: 39000, areaSqKm: 2, currency: "Euro (EUR)", languages: ["French"] },
    { code: "mn", name: "Mongolia", capital: "Ulaanbaatar", continent: "Asia", population: 3400000, areaSqKm: 1564116, currency: "Mongolian Tögrög (MNT)", languages: ["Mongolian"] },
    { code: "me", name: "Montenegro", capital: "Podgorica", continent: "Europe", population: 620000, areaSqKm: 13812, currency: "Euro (EUR)", languages: ["Montenegrin"] },
    { code: "ma", name: "Morocco", capital: "Rabat", continent: "Africa", population: 37800000, areaSqKm: 446550, currency: "Moroccan Dirham (MAD)", languages: ["Arabic", "Berber"] },
    { code: "mz", name: "Mozambique", capital: "Maputo", continent: "Africa", population: 33000000, areaSqKm: 801590, currency: "Mozambican Metical (MZN)", languages: ["Portuguese"] },
    { code: "mm", name: "Myanmar", capital: "Naypyidaw", continent: "Asia", population: 54000000, areaSqKm: 676578, currency: "Myanmar Kyat (MMK)", languages: ["Burmese"] },
    { code: "na", name: "Namibia", capital: "Windhoek", continent: "Africa", population: 2600000, areaSqKm: 825615, currency: "Namibian Dollar (NAD)", languages: ["English"] },
    { code: "nr", name: "Nauru", capital: "Yaren", continent: "Oceania", population: 11000, areaSqKm: 21, currency: "Australian Dollar (AUD)", languages: ["Nauruan", "English"] },
    { code: "np", name: "Nepal", capital: "Kathmandu", continent: "Asia", population: 30000000, areaSqKm: 147181, currency: "Nepalese Rupee (NPR)", languages: ["Nepali"] },
    { code: "nl", name: "Netherlands", capital: "Amsterdam", continent: "Europe", population: 17900000, areaSqKm: 41850, currency: "Euro (EUR)", languages: ["Dutch"] },
    { code: "nz", name: "New Zealand", capital: "Wellington", continent: "Oceania", population: 5200000, areaSqKm: 268838, currency: "New Zealand Dollar (NZD)", languages: ["English", "Māori"] },
    { code: "ni", name: "Nicaragua", capital: "Managua", continent: "Americas", population: 6900000, areaSqKm: 130375, currency: "Nicaraguan Córdoba (NIO)", languages: ["Spanish"] },
    { code: "ne", name: "Niger", capital: "Niamey", continent: "Africa", population: 26000000, areaSqKm: 1267000, currency: "West African CFA franc (XOF)", languages: ["French"] },
    { code: "ng", name: "Nigeria", capital: "Abuja", continent: "Africa", population: 224000000, areaSqKm: 923768, currency: "Nigerian Naira (NGN)", languages: ["English"] },
    { code: "mk", name: "North Macedonia", capital: "Skopje", continent: "Europe", population: 2000000, areaSqKm: 25713, currency: "Macedonian Denar (MKD)", languages: ["Macedonian"] },
    { code: "no", name: "Norway", capital: "Oslo", continent: "Europe", population: 5500000, areaSqKm: 385207, currency: "Norwegian Krone (NOK)", languages: ["Norwegian"] },
    { code: "om", name: "Oman", capital: "Muscat", continent: "Asia", population: 4600000, areaSqKm: 309500, currency: "Omani Rial (OMR)", languages: ["Arabic"] },
    { code: "pk", name: "Pakistan", capital: "Islamabad", continent: "Asia", population: 240000000, areaSqKm: 796095, currency: "Pakistani Rupee (PKR)", languages: ["Urdu", "English"] },
    { code: "pw", name: "Palau", capital: "Ngerulmud", continent: "Oceania", population: 18000, areaSqKm: 459, currency: "United States Dollar (USD)", languages: ["Palauan", "English"] },
    { code: "ps", name: "Palestine", capital: "Ramallah", continent: "Asia", population: 5200000, areaSqKm: 6020, currency: "Israeli New Shekel (ILS)", languages: ["Arabic"] },
    { code: "pa", name: "Panama", capital: "Panama City", continent: "Americas", population: 4400000, areaSqKm: 75420, currency: "Panamanian Balboa (PAB)", languages: ["Spanish"] },
    { code: "pg", name: "Papua New Guinea", capital: "Port Moresby", continent: "Oceania", population: 10100000, areaSqKm: 462840, currency: "Papua New Guinean Kina (PGK)", languages: ["English", "Tok Pisin", "Hiri Motu"] },
    { code: "py", name: "Paraguay", capital: "Asunción", continent: "Americas", population: 6800000, areaSqKm: 406752, currency: "Paraguayan Guaraní (PYG)", languages: ["Spanish", "Guaraní"] },
    { code: "pe", name: "Peru", capital: "Lima", continent: "Americas", population: 34000000, areaSqKm: 1285216, currency: "Peruvian Sol (PEN)", languages: ["Spanish"] },
    { code: "ph", name: "Philippines", capital: "Manila", continent: "Asia", population: 117000000, areaSqKm: 300000, currency: "Philippine Peso (PHP)", languages: ["Filipino", "English"] },
    { code: "pl", name: "Poland", capital: "Warsaw", continent: "Europe", population: 37700000, areaSqKm: 312696, currency: "Polish Złoty (PLN)", languages: ["Polish"] },
    { code: "pt", name: "Portugal", capital: "Lisbon", continent: "Europe", population: 10400000, areaSqKm: 92212, currency: "Euro (EUR)", languages: ["Portuguese"] },
    { code: "qa", name: "Qatar", capital: "Doha", continent: "Asia", population: 2700000, areaSqKm: 11586, currency: "Qatari Riyal (QAR)", languages: ["Arabic"] },
    { code: "ro", name: "Romania", capital: "Bucharest", continent: "Europe", population: 19000000, areaSqKm: 238397, currency: "Romanian Leu (RON)", languages: ["Romanian"] },
    { code: "ru", name: "Russia", capital: "Moscow", continent: "Europe", population: 146000000, areaSqKm: 17098246, currency: "Russian Ruble (RUB)", languages: ["Russian"] },
    { code: "rw", name: "Rwanda", capital: "Kigali", continent: "Africa", population: 13800000, areaSqKm: 26338, currency: "Rwandan Franc (RWF)", languages: ["Kinyarwanda", "French", "English", "Swahili"] },
    { code: "kn", name: "Saint Kitts and Nevis", capital: "Basseterre", continent: "Americas", population: 48000, areaSqKm: 261, currency: "East Caribbean Dollar (XCD)", languages: ["English"] },
    { code: "lc", name: "Saint Lucia", capital: "Castries", continent: "Americas", population: 180000, areaSqKm: 616, currency: "East Caribbean Dollar (XCD)", languages: ["English"] },
    { code: "vc", name: "Saint Vincent and the Grenadines", capital: "Kingstown", continent: "Americas", population: 104000, areaSqKm: 389, currency: "East Caribbean Dollar (XCD)", languages: ["English"] },
    { code: "ws", name: "Samoa", capital: "Apia", continent: "Oceania", population: 222000, areaSqKm: 2831, currency: "Samoan Tālā (WST)", languages: ["Samoan", "English"] },
    { code: "sm", name: "San Marino", capital: "San Marino", continent: "Europe", population: 34000, areaSqKm: 61, currency: "Euro (EUR)", languages: ["Italian"] },
    { code: "st", name: "Sao Tome and Principe", capital: "São Tomé", continent: "Africa", population: 227000, areaSqKm: 964, currency: "Dobra (STN)", languages: ["Portuguese"] },
    { code: "sa", name: "Saudi Arabia", capital: "Riyadh", continent: "Asia", population: 36900000, areaSqKm: 2149690, currency: "Saudi Riyal (SAR)", languages: ["Arabic"] },
    { code: "sn", name: "Senegal", capital: "Dakar", continent: "Africa", population: 17300000, areaSqKm: 196722, currency: "West African CFA franc (XOF)", languages: ["French", "Wolof"] },
    { code: "rs", name: "Serbia", capital: "Belgrade", continent: "Europe", population: 6700000, areaSqKm: 88361, currency: "Serbian Dinar (RSD)", languages: ["Serbian"] },
    { code: "sc", name: "Seychelles", capital: "Victoria", continent: "Africa", population: 100000, areaSqKm: 459, currency: "Seychellois Rupee (SCR)", languages: ["Seychellois Creole", "English", "French"] },
    { code: "sl", name: "Sierra Leone", capital: "Freetown", continent: "Africa", population: 8600000, areaSqKm: 71740, currency: "Leone (SLE)", languages: ["English"] },
    { code: "sg", name: "Singapore", capital: "Singapore", continent: "Asia", population: 5900000, areaSqKm: 734, currency: "Singapore Dollar (SGD)", languages: ["English", "Malay", "Mandarin", "Tamil"] },
    { code: "sk", name: "Slovakia", capital: "Bratislava", continent: "Europe", population: 5400000, areaSqKm: 49035, currency: "Euro (EUR)", languages: ["Slovak"] },
    { code: "si", name: "Slovenia", capital: "Ljubljana", continent: "Europe", population: 2100000, areaSqKm: 20273, currency: "Euro (EUR)", languages: ["Slovenian"] },
    { code: "sb", name: "Solomon Islands", capital: "Honiara", continent: "Oceania", population: 720000, areaSqKm: 28896, currency: "Solomon Islands Dollar (SBD)", languages: ["English"] },
    { code: "so", name: "Somalia", capital: "Mogadishu", continent: "Africa", population: 17600000, areaSqKm: 637657, currency: "Somali Shilling (SOS)", languages: ["Somali", "Arabic"] },
    { code: "za", name: "South Africa", capital: "Pretoria", continent: "Africa", population: 60400000, areaSqKm: 1221037, currency: "South African Rand (ZAR)", languages: ["Zulu", "Xhosa", "Afrikaans", "English"] },
    { code: "ss", name: "South Sudan", capital: "Juba", continent: "Africa", population: 11000000, areaSqKm: 644329, currency: "South Sudanese Pound (SSP)", languages: ["English"] },
    { code: "es", name: "Spain", capital: "Madrid", continent: "Europe", population: 48000000, areaSqKm: 505990, currency: "Euro (EUR)", languages: ["Spanish"] },
    { code: "lk", name: "Sri Lanka", capital: "Sri Jayawardenepura Kotte", continent: "Asia", population: 22000000, areaSqKm: 65610, currency: "Sri Lankan Rupee (LKR)", languages: ["Sinhala", "Tamil"] },
    { code: "sd", name: "Sudan", capital: "Khartoum", continent: "Africa", population: 46000000, areaSqKm: 1861484, currency: "Sudanese Pound (SDG)", languages: ["Arabic", "English"] },
    { code: "sr", name: "Suriname", capital: "Paramaribo", continent: "Americas", population: 618000, areaSqKm: 163820, currency: "Surinamese Dollar (SRD)", languages: ["Dutch"] },
    { code: "se", name: "Sweden", capital: "Stockholm", continent: "Europe", population: 10500000, areaSqKm: 450295, currency: "Swedish Krona (SEK)", languages: ["Swedish"] },
    { code: "ch", name: "Switzerland", capital: "Bern", continent: "Europe", population: 8900000, areaSqKm: 41285, currency: "Swiss Franc (CHF)", languages: ["German", "French", "Italian", "Romansh"] },
    { code: "sy", name: "Syria", capital: "Damascus", continent: "Asia", population: 22000000, areaSqKm: 185180, currency: "Syrian Pound (SYP)", languages: ["Arabic"] },
    { code: "tw", name: "Taiwan", capital: "Taipei", continent: "Asia", population: 23900000, areaSqKm: 36197, currency: "New Taiwan Dollar (TWD)", languages: ["Mandarin"] },
    { code: "tj", name: "Tajikistan", capital: "Dushanbe", continent: "Asia", population: 10000000, areaSqKm: 143100, currency: "Tajikistani Somoni (TJS)", languages: ["Tajik", "Russian"] },
    { code: "tz", name: "Tanzania", capital: "Dodoma", continent: "Africa", population: 65500000, areaSqKm: 947303, currency: "Tanzanian Shilling (TZS)", languages: ["Swahili", "English"] },
    { code: "th", name: "Thailand", capital: "Bangkok", continent: "Asia", population: 71800000, areaSqKm: 513120, currency: "Thai Baht (THB)", languages: ["Thai"] },
    { code: "tl", name: "Timor-Leste", capital: "Dili", continent: "Asia", population: 1340000, areaSqKm: 15007, currency: "United States Dollar (USD)", languages: ["Tetum", "Portuguese"] },
    { code: "tg", name: "Togo", capital: "Lomé", continent: "Africa", population: 8800000, areaSqKm: 56785, currency: "West African CFA franc (XOF)", languages: ["French"] },
    { code: "to", name: "Tonga", capital: "Nukuʻalofa", continent: "Oceania", population: 106000, areaSqKm: 747, currency: "Tongan Paʻanga (TOP)", languages: ["Tongan", "English"] },
    { code: "tt", name: "Trinidad and Tobago", capital: "Port of Spain", continent: "Americas", population: 1530000, areaSqKm: 5130, currency: "Trinidad and Tobago Dollar (TTD)", languages: ["English"] },
    { code: "tn", name: "Tunisia", capital: "Tunis", continent: "Africa", population: 12300000, areaSqKm: 163610, currency: "Tunisian Dinar (TND)", languages: ["Arabic"] },
    { code: "tr", name: "Turkey", capital: "Ankara", continent: "Asia", population: 85300000, areaSqKm: 783562, currency: "Turkish Lira (TRY)", languages: ["Turkish"] },
    { code: "tm", name: "Turkmenistan", capital: "Ashgabat", continent: "Asia", population: 6400000, areaSqKm: 488100, currency: "Turkmenistani Manat (TMT)", languages: ["Turkmen", "Russian"] },
    { code: "tv", name: "Tuvalu", capital: "Funafuti", continent: "Oceania", population: 11000, areaSqKm: 26, currency: "Australian Dollar (AUD)", languages: ["Tuvaluan", "English"] },
    { code: "ug", name: "Uganda", capital: "Kampala", continent: "Africa", population: 47200000, areaSqKm: 241038, currency: "Ugandan Shilling (UGX)", languages: ["English", "Swahili"] },
    { code: "ua", name: "Ukraine", capital: "Kyiv", continent: "Europe", population: 38000000, areaSqKm: 603550, currency: "Ukrainian Hryvnia (UAH)", languages: ["Ukrainian"] },
    { code: "ae", name: "United Arab Emirates", capital: "Abu Dhabi", continent: "Asia", population: 9400000, areaSqKm: 83600, currency: "UAE Dirham (AED)", languages: ["Arabic"] },
    { code: "gb", name: "United Kingdom", capital: "London", continent: "Europe", population: 67700000, areaSqKm: 242495, currency: "British Pound (GBP)", languages: ["English"] },
    { code: "us", name: "United States", capital: "Washington, D.C.", continent: "Americas", population: 335000000, areaSqKm: 9833517, currency: "US Dollar (USD)", languages: ["English"] },
    { code: "uy", name: "Uruguay", capital: "Montevideo", continent: "Americas", population: 3400000, areaSqKm: 176215, currency: "Uruguayan Peso (UYU)", languages: ["Spanish"] },
    { code: "uz", name: "Uzbekistan", capital: "Tashkent", continent: "Asia", population: 36000000, areaSqKm: 447400, currency: "Uzbekistani Som (UZS)", languages: ["Uzbek", "Russian"] },
    { code: "vu", name: "Vanuatu", capital: "Port Vila", continent: "Oceania", population: 326000, areaSqKm: 12189, currency: "Vanuatu Vatu (VUV)", languages: ["Bislama", "English", "French"] },
    { code: "va", name: "Vatican City", capital: "Vatican City", continent: "Europe", population: 800, areaSqKm: 0.49, currency: "Euro (EUR)", languages: ["Italian", "Latin"] },
    { code: "ve", name: "Venezuela", capital: "Caracas", continent: "Americas", population: 28300000, areaSqKm: 916445, currency: "Venezuelan Bolívar (VES)", languages: ["Spanish"] },
    { code: "vn", name: "Vietnam", capital: "Hanoi", continent: "Asia", population: 98800000, areaSqKm: 331212, currency: "Vietnamese Dong (VND)", languages: ["Vietnamese"] },
    { code: "ye", name: "Yemen", capital: "Sanaa", continent: "Asia", population: 33600000, areaSqKm: 527968, currency: "Yemeni Rial (YER)", languages: ["Arabic"] },
    { code: "zm", name: "Zambia", capital: "Lusaka", continent: "Africa", population: 20000000, areaSqKm: 752618, currency: "Zambian Kwacha (ZMW)", languages: ["English"] },
    { code: "zw", name: "Zimbabwe", capital: "Harare", continent: "Africa", population: 16000000, areaSqKm: 390757, currency: "Zimbabwean Dollar (ZWL)", languages: ["English", "Shona", "Ndebele"] }
];

export default function RandomCountryPicker() {
    // Mode & Filter States
    const [selectedContinent, setSelectedContinent] = useState<Continent>("All");
    const [quizMode, setQuizMode] = useState<QuizMode>("flag-to-country");
    const [isQuizActive, setIsQuizActive] = useState<boolean>(false);

    // Generator & Quiz State
    const [currentCountry, setCurrentCountry] = useState<CountryData>(COUNTRIES[0]);
    const [quizOptions, setQuizOptions] = useState<CountryData[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

    // Scorecard & Tracking
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [bestStreak, setBestStreak] = useState<number>(0);
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [copied, setCopied] = useState<boolean>(false);

    // History Log of Picked Countries
    const [history, setHistory] = useState<CountryData[]>([]);

    // Filter available countries based on continent
    const filteredCountries = useMemo(() => {
        if (selectedContinent === "All") return COUNTRIES;
        return COUNTRIES.filter((c) => c.continent === selectedContinent);
    }, [selectedContinent]);

    // Cryptographic Secure Random Index Generator
    const getRandomIndex = (max: number): number => {
        if (max <= 1) return 0;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    };

    // Pick a new random country and generate options if quiz mode is active
    const generateNewPick = useCallback(() => {
        const pickedPool = filteredCountries.length > 0 ? filteredCountries : COUNTRIES;
        const mainIndex = getRandomIndex(pickedPool.length);
        const picked = pickedPool[mainIndex];

        setCurrentCountry(picked);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);

        // Build 4 random options (1 correct + 3 distinct distractors)
        const distractors: CountryData[] = [];

        // 1. Grab distractors from the filtered continent pool first
        const sameContinentPool = filteredCountries.filter((c) => c.code !== picked.code);
        while (distractors.length < 3 && sameContinentPool.length > 0) {
            const dIndex = getRandomIndex(sameContinentPool.length);
            distractors.push(sameContinentPool[dIndex]);
            sameContinentPool.splice(dIndex, 1);
        }

        // 2. If we still need more distractors (e.g. Oceania pool is too small), fill with global pool
        if (distractors.length < 3) {
            const globalPool = COUNTRIES.filter(
                (c) => c.code !== picked.code && !distractors.some((d) => d.code === c.code)
            );
            while (distractors.length < 3 && globalPool.length > 0) {
                const dIndex = getRandomIndex(globalPool.length);
                distractors.push(globalPool[dIndex]);
                globalPool.splice(dIndex, 1);
            }
        }

        const options = [picked, ...distractors];
        // Fisher-Yates crypto shuffle
        for (let i = options.length - 1; i > 0; i--) {
            const j = getRandomIndex(i + 1);
            [options[i], options[j]] = [options[j], options[i]];
        }

        setQuizOptions(options);
        setHistory((prev) => [picked, ...prev.filter((p) => p.code !== picked.code)].slice(0, 50));
    }, [filteredCountries]);

    // Auto-generate on initial mount or continent change
    useEffect(() => {
        generateNewPick();
    }, [selectedContinent, generateNewPick]);

    // Handle Quiz Answer Submission
    const handleAnswerSelect = (option: CountryData) => {
        if (isAnswerSubmitted) return;

        let isCorrect = false;
        if (quizMode === "flag-to-country" || quizMode === "country-to-flag") {
            isCorrect = option.code === currentCountry.code;
            setSelectedAnswer(option.code);
        } else if (quizMode === "country-to-capital") {
            isCorrect = option.capital === currentCountry.capital;
            setSelectedAnswer(option.capital);
        }

        setIsAnswerSubmitted(true);
        setTotalQuestions((prev) => prev + 1);

        if (isCorrect) {
            setScore((prev) => prev + 1);
            setStreak((prev) => {
                const next = prev + 1;
                if (next > bestStreak) setBestStreak(next);
                return next;
            });
        } else {
            setStreak(0);
        }
    };

    const handleCopyDetails = () => {
        const text = `Country Dossier: ${currentCountry.name} (${currentCountry.code.toUpperCase()})
- Capital: ${currentCountry.capital}
- Continent: ${currentCountry.continent}
- Population: ${currentCountry.population.toLocaleString()}
- Surface Area: ${currentCountry.areaSqKm.toLocaleString()} sq km
- Currency: ${currentCountry.currency}
- Official Languages: ${currentCountry.languages.join(", ")}
Source: twistertools.com/tools/random-tools/random-country-picker`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Country", "ISO Code", "Capital", "Continent", "Population", "Area Sq Km", "Currency", "Languages"];
        const rows = history.map((c) => [
            `"${c.name}"`,
            `"${c.code.toUpperCase()}"`,
            `"${c.capital}"`,
            `"${c.continent}"`,
            c.population,
            c.areaSqKm,
            `"${c.currency}"`,
            `"${c.languages.join("; ")}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "random_countries_dossier.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetStats = () => {
        setScore(0);
        setStreak(0);
        setTotalQuestions(0);
    };

    // WebApplication & FAQPage JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Country & Flag Quiz Generator",
        "url": "https://twistertools.com/tools/random-tools/random-country-picker",
        "description": "Generate random sovereign countries, explore national flag vectors, learn world capitals and geography statistics, or challenge yourself in interactive flag quiz modes.",
        "applicationCategory": "EducationalApplication",
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
                "name": "How does the random country generation algorithm work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses the browser Web Crypto API (crypto.getRandomValues) to produce cryptographically unseeded hardware entropy. This ensures every sovereign nation across Africa, Americas, Asia, Europe, and Oceania has an equal, unbiased probability of being selected."
                }
            },
            {
                "@type": "Question",
                "name": "How many sovereign countries and territories are recognized worldwide?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The United Nations officially recognizes 195 sovereign states: 193 UN member states and 2 permanent non-member observer states (the Holy See and Palestine). Standard ISO 3166-1 registries index 249 country code designations including dependencies and overseas territories."
                }
            },
            {
                "@type": "Question",
                "name": "What interactive quiz modes are available?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool provides 3 dynamic quiz modes: Flag to Country Name, Country to Capital City, and Country Name to Flag Vector, each with automated distractor generation and real-time streak analytics."
                }
            },
            {
                "@type": "Question",
                "name": "Can I filter country generation by specific continental regions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can filter random generation and quizzes to All continents, or isolate Africa, the Americas, Asia, Europe, or Oceania to focus your study sessions on specific global regions."
                }
            },
            {
                "@type": "Question",
                "name": "Are country demographic and geographic statistics up to date?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, population, surface area (in square kilometers), capital designations, official currencies, and primary spoken languages reflect international statistical standard benchmarks."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Interactive Flag Stage & Generator Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Header & Mode Toggles */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Globe2 className="w-5 h-5 text-indigo-600" />
                                {isQuizActive ? "Geography Challenge Mode" : "Country Generator"}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsQuizActive(!isQuizActive)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${isQuizActive
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600"
                                        }`}
                                >
                                    <Trophy className="w-3.5 h-3.5" />
                                    {isQuizActive ? "Exit Quiz" : "Start Quiz"}
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar: Continent Selector */}
                        <div className="mb-5 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ListFilter className="w-4 h-4 text-indigo-600" />
                                Filter Regional Pool
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {(["All", "Africa", "Americas", "Asia", "Europe", "Oceania"] as Continent[]).map((continent) => (
                                    <button
                                        key={continent}
                                        onClick={() => setSelectedContinent(continent)}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition text-center cursor-pointer ${selectedContinent === continent
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {continent}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quiz Mode Selector (Visible in Quiz Mode) */}
                        {isQuizActive && (
                            <div className="mb-5 space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Select Quiz Challenge Type
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        { id: "flag-to-country", label: "Flag → Country" },
                                        { id: "country-to-capital", label: "Country → Capital" },
                                        { id: "country-to-flag", label: "Country → Flag" }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setQuizMode(mode.id as QuizMode);
                                                setIsAnswerSubmitted(false);
                                                setSelectedAnswer(null);
                                            }}
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${quizMode === mode.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stage Card: Flag or Question Prompt */}
                        <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6 relative overflow-hidden">
                            {/* Flag Display Stage */}
                            {(quizMode !== "country-to-flag" || !isQuizActive) && (
                                <div className="relative w-48 h-32 sm:w-56 sm:h-36 rounded-xl overflow-hidden shadow-md border-2 border-slate-200 bg-white mb-4">
                                    <Image
                                        src={`https://flagcdn.com/w320/${currentCountry.code}.png`}
                                        alt={`National Flag of ${currentCountry.name}`}
                                        fill
                                        sizes="(max-width: 640px) 192px, 224px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            )}

                            {/* Prompt Typography */}
                            {!isQuizActive ? (
                                <div className="text-center space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900">{currentCountry.name}</h3>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                        {currentCountry.continent} • Capital: {currentCountry.capital}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center space-y-1">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                        Identify the Correct Match
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                                        {quizMode === "flag-to-country" && "Which nation does this flag belong to?"}
                                        {quizMode === "country-to-capital" && `What is the capital of ${currentCountry.name}?`}
                                        {quizMode === "country-to-flag" && `Which flag belongs to ${currentCountry.name}?`}
                                    </h3>
                                </div>
                            )}
                        </div>

                        {/* Interactive Section: Quiz Multiple Choice Options OR Explore Buttons */}
                        {isQuizActive ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {quizOptions.map((opt) => {
                                        let isCorrectChoice = false;
                                        let isSelectedChoice = false;

                                        if (quizMode === "flag-to-country" || quizMode === "country-to-flag") {
                                            isCorrectChoice = opt.code === currentCountry.code;
                                            isSelectedChoice = selectedAnswer === opt.code;
                                        } else {
                                            isCorrectChoice = opt.capital === currentCountry.capital;
                                            isSelectedChoice = selectedAnswer === opt.capital;
                                        }

                                        let btnStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-800";
                                        if (isAnswerSubmitted) {
                                            if (isCorrectChoice) {
                                                btnStyle = "bg-emerald-500 text-white border-emerald-500 font-bold shadow-sm";
                                            } else if (isSelectedChoice && !isCorrectChoice) {
                                                btnStyle = "bg-rose-500 text-white border-rose-500 font-bold shadow-sm";
                                            } else {
                                                btnStyle = "bg-slate-100 text-slate-400 border-slate-200 opacity-60";
                                            }
                                        }

                                        return (
                                            <button
                                                key={opt.code}
                                                onClick={() => handleAnswerSelect(opt)}
                                                disabled={isAnswerSubmitted}
                                                className={`p-3.5 rounded-xl border font-semibold text-sm transition flex items-center justify-between gap-2 text-left cursor-pointer min-w-0 ${btnStyle}`}
                                            >
                                                {quizMode === "country-to-flag" ? (
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="relative w-12 h-8 rounded border border-slate-300 overflow-hidden flex-shrink-0 bg-white">
                                                            <Image
                                                                src={`https://flagcdn.com/w80/${opt.code}.png`}
                                                                alt={opt.name}
                                                                fill
                                                                sizes="48px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <span className="truncate">{opt.name}</span>
                                                    </div>
                                                ) : quizMode === "country-to-capital" ? (
                                                    <span>{opt.capital}</span>
                                                ) : (
                                                    <span className="truncate">{opt.name}</span>
                                                )}

                                                {isAnswerSubmitted && isCorrectChoice && (
                                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
                                                )}
                                                {isAnswerSubmitted && isSelectedChoice && !isCorrectChoice && (
                                                    <XCircle className="w-5 h-5 flex-shrink-0 text-white" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {isAnswerSubmitted && (
                                    <button
                                        onClick={generateNewPick}
                                        className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
                                    >
                                        Next Question
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Generator Standard Actions */
                            <div className="space-y-4">
                                <button
                                    onClick={generateNewPick}
                                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <RotateCw className="w-5 h-5" />
                                    Generate Random Country
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Utilities */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyDetails}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Dossier" : "Copy Country Dossier"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Country Dossier, Metrics & History Log */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header Stats Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Country Factsheet & Insights
                            </h2>
                            {isQuizActive && (
                                <button
                                    onClick={resetStats}
                                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Reset Score
                                </button>
                            )}
                        </div>

                        {/* Quiz Scorecard Banner (If active) */}
                        {isQuizActive && (
                            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 text-center">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Score</span>
                                    <span className="text-xl font-black text-slate-900">{score} / {totalQuestions}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" /> Streak
                                    </span>
                                    <span className="text-xl font-black text-amber-600">{streak}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                                        <Trophy className="w-3.5 h-3.5 text-indigo-600" /> Best
                                    </span>
                                    <span className="text-xl font-black text-indigo-600">{bestStreak}</span>
                                </div>
                            </div>
                        )}

                        {/* Full Data Matrix of Current Country */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                            {/* Capital City */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Landmark className="w-4 h-4 text-indigo-600" />
                                    Capital City
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                    {currentCountry.capital}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Government Seat</p>
                            </div>

                            {/* Population */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Users className="w-4 h-4 text-indigo-600" />
                                    Estimated Population
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                    {currentCountry.population.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Inhabitants</p>
                            </div>

                            {/* Land Area */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <MapPin className="w-4 h-4 text-indigo-600" />
                                    Surface Land Area
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1">
                                    {currentCountry.areaSqKm.toLocaleString()} km²
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    ~{(currentCountry.areaSqKm * 0.386102).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq miles
                                </p>
                            </div>

                            {/* Currency */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Coins className="w-4 h-4 text-indigo-600" />
                                    Official Currency
                                </div>
                                <p className="text-base font-extrabold text-slate-900 mt-1 truncate">
                                    {currentCountry.currency}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Legal Tender</p>
                            </div>
                        </div>

                        {/* Spoken Languages Badge Tray */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Languages className="w-4 h-4 text-indigo-600" />
                                    Official & Spoken Languages
                                </span>
                                <span className="text-indigo-600">{currentCountry.languages.length} Listed</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {currentCountry.languages.map((lang) => (
                                    <span
                                        key={lang}
                                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-xs"
                                    >
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Recent History Generator Roll */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Recent Generated Countries ({history.length})
                            </label>
                            <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {history.map((c) => (
                                    <div
                                        key={c.code}
                                        onClick={() => setCurrentCountry(c)}
                                        className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative w-6 h-4 rounded overflow-hidden border border-slate-200 flex-shrink-0">
                                                <Image
                                                    src={`https://flagcdn.com/w40/${c.code}.png`}
                                                    alt={c.name}
                                                    fill
                                                    sizes="24px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <span className="font-bold text-slate-900 truncate">{c.name}</span>
                                            <span className="text-[11px] text-slate-400">({c.capital})</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-indigo-600 flex-shrink-0 ml-2">
                                            {c.continent}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Security & API Status */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Web Crypto API RNG
                        </span>
                        <span>Vector SVG Flag Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Geographic Distribution & Sovereign Nation Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Geopolitical Structure: Sovereign States, Dependencies & ISO Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Political geography organizes the Earth into distinct political jurisdictions, sovereign entities, and administrative territories. Under international law—specifically codified by the <strong>1933 Montevideo Convention on the Rights and Duties of States</strong>—a sovereign state must possess four fundamental legal characteristics:
                    </p>

                    <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700 font-medium">
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>1. Permanent Population:</strong> A stable resident human population not dependent on external jurisdictions.
                        </li>
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>2. Defined Territory:</strong> Clearly delineated geographic borders over which legitimate territorial sovereignty is exercised.
                        </li>
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>3. Sovereign Government:</strong> An organized central authority exercising administrative and legal control.
                        </li>
                        <li className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <strong>4. Capacity for International Relations:</strong> The legal autonomy to enter treaties and bilateral diplomatic relations with other sovereign nations.
                        </li>
                    </ul>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Today, international diplomacy is standardized under the <strong>International Organization for Standardization (ISO 3166-1)</strong>, which governs two-letter alpha-2 country codes (e.g., <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">US</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">DE</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">JP</code>), three-letter alpha-3 codes, and numeric-3 designations utilized globally in telecommunications, air travel, trade, and internet top-level domains (.ccTLDs).
                    </p>
                </section>

                {/* Card 2: Continental Breakdown & Demographic Comparative Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Continental Matrix: Population, Land Area & Sovereign Counts
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compare continental landmasses by sovereign country distribution, cumulative land area, and human demographic shares:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Continent</th>
                                    <th className="p-3">UN Sovereign States</th>
                                    <th className="p-3">Estimated Population</th>
                                    <th className="p-3">Land Surface Area</th>
                                    <th className="p-3">Most Populous Nation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Asia</td>
                                    <td className="p-3">48 States</td>
                                    <td className="p-3">~4.75 Billion (59.2%)</td>
                                    <td className="p-3">44,579,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">India (1.43B)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Africa</td>
                                    <td className="p-3">54 States</td>
                                    <td className="p-3">~1.46 Billion (18.2%)</td>
                                    <td className="p-3">30,370,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">Nigeria (224M)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Europe</td>
                                    <td className="p-3">44 States</td>
                                    <td className="p-3">~742 Million (9.3%)</td>
                                    <td className="p-3">10,180,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">Germany (84M)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Americas</td>
                                    <td className="p-3">35 States</td>
                                    <td className="p-3">~1.04 Billion (13.0%)</td>
                                    <td className="p-3">42,549,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">United States (335M)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Oceania</td>
                                    <td className="p-3">14 States</td>
                                    <td className="p-3">~45 Million (0.6%)</td>
                                    <td className="p-3">8,600,000 km²</td>
                                    <td className="p-3 font-bold text-indigo-600">Australia (26M)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Vexillology Principles & Flag Symbolism */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Vexillology: Principles of Flag Design & Symbolism
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Vexillology</strong> is the scholarly study of the history, symbolism, and usage of flags. Established by the North American Vexillological Association (NAVA), great national flags consistently follow five fundamental rules of visual design:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">1. Simplicity & Recall</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A flag should be simple enough that a child can draw it from memory. Clean geometric bands (like the tricolors of France, Italy, or Germany) maximize visual recognition at great distances.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">2. Meaningful Symbolism</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Colors and charges embody cultural narrative: red frequently symbolizes sacrifice or courage, blue denotes maritime reach or peace, and gold reflects natural sovereignty or wealth.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">3. Distinctive Contrast</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Effective flags adhere to heraldic rules of tincture, ensuring high-contrast boundaries between metals (white/yellow) and dark colors (black, blue, red, green).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                How does the random country generation algorithm work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) to produce cryptographically unseeded hardware entropy. This ensures every sovereign nation across Africa, Americas, Asia, Europe, and Oceania has an equal, unbiased probability of being selected.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many sovereign countries and territories are recognized worldwide?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The United Nations officially recognizes 195 sovereign states: 193 UN member states and 2 permanent non-member observer states (the Holy See and Palestine). Standard ISO 3166-1 registries index 249 country code designations including dependencies and overseas territories.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What interactive quiz modes are available?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool provides 3 dynamic quiz modes: Flag to Country Name, Country to Capital City, and Country Name to Flag Vector, each with automated distractor generation and real-time streak analytics.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I filter country generation by specific continental regions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can filter random generation and quizzes to All continents, or isolate Africa, the Americas, Asia, Europe, or Oceania to focus your study sessions on specific global regions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are country demographic and geographic statistics up to date?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, population, surface area (in square kilometers), capital designations, official currencies, and primary spoken languages reflect international statistical standard benchmarks.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
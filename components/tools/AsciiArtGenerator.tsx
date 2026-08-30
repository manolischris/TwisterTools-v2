"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
    Type,
    Copy,
    Check,
    Download,
    RefreshCw,
    SlidersHorizontal,
    Code2,
    Sparkles,
    Maximize2,
    Palette,
    Layers,
    BookOpen,
    HelpCircle,
    Terminal,
    Eye,
    Frame,
    CaseSensitive,
    Zap,
    Hash,
    AlignLeft,
    AlignCenter,
    AlignRight,
    FileText,
    Image,
    CheckCircle2
} from "lucide-react";

// --- ASCII FONT DEFINITIONS & GLYPH TABLES ---

type FontCategory = "figlet" | "unicode" | "decorative" | "ciphers";

interface FontOption {
    id: string;
    name: string;
    category: FontCategory;
    description: string;
    height?: number;
}

const FONT_OPTIONS: FontOption[] = [
    { id: "standard", name: "Standard 3D", category: "figlet", description: "Classic isometric multi-line FIGlet lettering" },
    { id: "slant", name: "Slant Italic", category: "figlet", description: "Dynamic forward-slanted cyber aesthetic" },
    { id: "blocks", name: "Solid Blocks", category: "figlet", description: "High-density UTF-8 block typography" },
    { id: "shadow", name: "Drop Shadow", category: "figlet", description: "Clean drop-shadow extruded ASCII layout" },
    { id: "cyber", name: "Cyberpunk Glitch", category: "figlet", description: "Futuristic terminal mainframe typography" },
    { id: "bubble", name: "Circled Bubbles", category: "unicode", description: "Unicode enclosed alphanumeric glyphs Ⓣⓔⓧⓣ" },
    { id: "squared", name: "Boxed Squares", category: "unicode", description: "Bold enclosed square letters 🅃🄴🅇🅃" },
    { id: "script", name: "Cursive Script", category: "unicode", description: "Mathematical script calligraphic characters" },
    { id: "gothic", name: "Fraktur Gothic", category: "unicode", description: "Old-world medieval typography 𝔗𝔢𝔵𝔱" },
    { id: "double", name: "Double Struck", category: "unicode", description: "Mathematical blackboard bold 𝕋𝕖𝕩𝕥" },
    { id: "monospace", name: "Fullwidth Vaporwave", category: "unicode", description: "Wide-spaced aesthetic vaporwave Ｔｅｘｔ" },
    { id: "inverted", name: "Upside Down Flip", category: "decorative", description: "180-degree inverted mirrored unicode ʇxǝ⊥" },
    { id: "morse", name: "Morse Code", category: "ciphers", description: "Telecommunication audio pulse dots and dashes" },
    { id: "binary", name: "Binary ASCII Matrix", category: "ciphers", description: "Base-2 raw 8-bit binary bytecode" },
    { id: "hex", name: "Hexadecimal Array", category: "ciphers", description: "Byte-aligned hex-encoded ASCII bytes" }
];

interface FrameOption {
    id: string;
    name: string;
    description: string;
}

const FRAME_OPTIONS: FrameOption[] = [
    { id: "none", name: "No Border", description: "Raw typography output" },
    { id: "single", name: "Single Line (┌─┐)", description: "Classic clean box-drawing frame" },
    { id: "double", name: "Double Line (╔═╗)", description: "Heavy prominent institutional border" },
    { id: "rounded", name: "Rounded Corners (╭─╮)", description: "Modern soft aesthetic perimeter" },
    { id: "retro", name: "Retro Terminal (+--+)", description: "Pure 7-bit ASCII cross-hatch boundary" },
    { id: "stars", name: "Star Dust (★ ✦ ★)", description: "Decorative astrological cosmic framing" },
    { id: "hash", name: "Hash Matrix (#####)", description: "Monolithic software header comment block" },
    { id: "vintage", name: "Vintage Wave (~*~)", description: "Classic 90s BBS banner border" }
];

// FIGlet glyph database for multi-line rendering
const FIGLET_FONTS: Record<string, { height: number; chars: Record<string, string[]> }> = {
    standard: {
        height: 5,
        chars: {
            a: ["  ___  ", " / _ \\ ", "/ /_\\ \\", "|  _  |", "|_| |_|"],
            b: [" ___  ", "| _ ) ", "| _ \\ ", "| _/  ", "|___/ "],
            c: ["  ___ ", " / __|", "| (__ ", " \\___|", "      "],
            d: [" ___  ", "|   \\ ", "| |) |", "| |) |", "|___/ "],
            e: [" ___ ", "| __|", "| _| ", "| |  ", "|___|"],
            f: [" ___ ", "| __|", "| _| ", "| |  ", "|_|  "],
            g: ["  ___ ", " / __|", "| (_ |", " \\___|", "      "],
            h: [" _  _ ", "| || |", "| __ |", "| || |", "|_||_|"],
            i: [" _ ", "| |", "| |", "| |", "|_|"],
            j: ["   _ ", "  | |", "  | |", "|_| |", " \\__/ "],
            k: [" _  __", "| |/ /", "| ' < ", "| . \\ ", "|_|\\_\\"],
            l: [" _   ", "| |  ", "| |  ", "| |__", "|____|"],
            m: [" _  _ ", "| \\/ |", "| |\\/|", "| |  |", "|_|  |"],
            n: [" _  _ ", "| \\| |", "| .` |", "| |\\ |", "|_| \\_|"],
            o: [" ___  ", "/ _ \\ ", "| (_) |", "\\___/ ", "      "],
            p: [" ___  ", "| _ \\ ", "|  _/ ", "| |   ", "|_|   "],
            q: [" ___  ", "/ _ \\ ", "| (_) |", " \\__\\ \\", "    \\_\\"],
            r: [" ___  ", "| _ \\ ", "|   / ", "|_|\\_\\", "      "],
            s: [" ___ ", "/ __|", "\\__ \\", "|___/", "     "],
            t: [" ___ ", "|_ _|", " | | ", " | | ", " |_| "],
            u: [" _   _ ", "| | | |", "| |_| |", " \\___/ ", "       "],
            v: [" _   _ ", "| | | |", "| | | |", " \\_/ / ", "  \\_/  "],
            w: [" _    _ ", "| |/\\| |", "|  /\\  |", "| /  \\ |", "|/    \\|"],
            x: ["__  __", "\\ \\/ /", " >  < ", "/_/\\_\\", "      "],
            y: ["__   __", "\\ \\ / /", " \\ V / ", "  | |  ", "  |_|  "],
            z: ["____ ", "|_  /", " / / ", "/___|", "     "],
            "0": ["  ___  ", " / _ \\ ", "| | | |", "| |_| |", " \\___/ "],
            "1": [" _ ", "/ |", "| |", "| |", "|_|"],
            "2": [" ___  ", "|_  ) ", " / /  ", "/___| ", "      "],
            "3": [" ____ ", "|__ / ", " |_ \\ ", "|___/ ", "      "],
            "4": [" _ _  ", "| | | ", "|_  _|", "  |_| ", "      "],
            "5": [" ___ ", "| __|", "|__ \\", "|___/", "     "],
            "6": ["  __  ", " / /  ", "/ _ \\ ", "\\___/ ", "      "],
            "7": [" ____ ", "|__  |", "  / / ", " /_/  ", "      "],
            "8": [" ___ ", "( _ )", "/ _ \\", "\\___/", "     "],
            "9": [" ___  ", "/ _ \\ ", "\\_, / ", " /_/  ", "      "],
            " ": ["   ", "   ", "   ", "   ", "   "],
            "!": [" _ ", "| |", "| |", "|_|", "(_)"],
            "?": [" ___ ", "|_  )", " / / ", "|___|", " (_) "],
            "-": ["    ", "    ", "____", "    ", "    "],
            "+": ["    ", " _  ", "|_| ", "    ", "    "],
            ":": ["   ", " _ ", "(_)", " _ ", "(_)"],
            ".": ["   ", "   ", "   ", " _ ", "(_)"]
        }
    },
    slant: {
        height: 5,
        chars: {
            a: ["   ____ _ ", "  / __ `/ ", " / /_/ /  ", " \\__,_/   ", "          "],
            b: ["    __    ", "   / /_   ", "  / __ \\  ", " / /_/ /  ", "/_.___/   "],
            c: ["   ______ ", "  / ____/ ", " / /      ", "/ /___    ", "\\____/    "],
            d: ["    ____  ", "   / __ \\ ", "  / / / / ", " / /_/ /  ", "/_____/   "],
            e: ["   ___    ", "  / _ \\   ", " /  __/   ", " \\___/    ", "          "],
            f: ["   ______ ", "  / ____/ ", " / /_     ", "/ __/     ", "/_/       "],
            g: ["   ____ _ ", "  / __ `/ ", " / /_/ /  ", " \\__, /   ", "/____/    "],
            h: ["    __  __", "   / / / /", "  / /_/ / ", " / __  /  ", "/_/ /_/   "],
            i: ["   _      ", "  (_)     ", "  / /     ", " / /      ", "/_/       "],
            j: ["     _    ", "    (_)   ", "    / /   ", "   / /    ", " _/ /     "],
            k: ["    __ __ ", "   / //_/ ", "  / ,<    ", " / /| |   ", "/_/ |_|   "],
            l: ["    __    ", "   / /    ", "  / /     ", " / /___   ", "/_____/   "],
            m: ["    ____ ___  ", "   / __ `__ \\ ", "  / / / / / / ", " /_/ /_/ /_/  ", "              "],
            n: ["    ____  ", "   / __ \\ ", "  / / / / ", " /_/ /_/  ", "          "],
            o: ["   ____   ", "  / __ \\  ", " / /_/ /  ", " \\____/   ", "          "],
            p: ["    ____  ", "   / __ \\ ", "  / /_/ / ", " / ____/  ", "/_/       "],
            q: ["   ____ _ ", "  / __ `/ ", " / /_/ /  ", " \\__, /   ", "    /_/   "],
            r: ["    _____ ", "   / ___/ ", "  / /     ", " /_/      ", "          "],
            s: ["   _____  ", "  / ___/  ", "  \\__ \\   ", " ___/ /   ", "/____/    "],
            t: ["    __    ", "   / /_   ", "  / __/   ", " / /_     ", " \\__/     "],
            u: ["   __  __ ", "  / / / / ", " / /_/ /  ", " \\__,_/   ", "          "],
            v: [" _    __  ", "| |  / /  ", "| | / /   ", "| |/ /    ", "|___/     "],
            w: [" _      __", "| | /| / /", "| |/ |/ / ", "|__/|__/  ", "          "],
            x: ["   _  __  ", "  | |/_/  ", " _>  <    ", "/_/|_|    ", "          "],
            y: ["   __  __ ", "  / / / / ", " / /_/ /  ", " \\__, /   ", "/____/    "],
            z: ["   ____   ", "  /_  /   ", "   / /_   ", "  /___/   ", "          "],
            "0": ["   ____   ", "  / __ \\  ", " / / / /  ", " \\____/   ", "          "],
            "1": ["   ___    ", "  <  /    ", "  / /     ", " /_/      ", "          "],
            "2": ["   ___    ", "  |__ \\   ", "  __/ /   ", " /____/   ", "          "],
            "3": ["   _____  ", "  |__  /  ", "   /_ <   ", " ___/ /   ", "/____/    "],
            "4": ["   __ __  ", "  / // /  ", " / // /_  ", "/__  __/  ", "  /_/     "],
            "5": ["   ______ ", "  / ____/ ", " /___ \\   ", "____/ /   ", "/____/    "],
            "6": ["   _____  ", "  / ___/  ", " / __ \\   ", "/ /_/ /   ", "\\____/    "],
            "7": ["  _____   ", " /__  /   ", "   / /    ", "  /_/     ", "          "],
            "8": ["   ____   ", "  ( __ )  ", " / __  |  ", "/ /_/ /   ", "\\____/    "],
            "9": ["   ____   ", "  / __ \\  ", " / /_/ /  ", " \\__, /   ", "/____/    "],
            " ": ["    ", "    ", "    ", "    ", "    "],
            "!": ["   _  ", "  | | ", "  | | ", "  |_| ", "  (_) "],
            "?": ["  ___  ", " /__ \\ ", "   / / ", "  /_/  ", "  (_)  "],
            "-": ["        ", "        ", " ______ ", "/_____/ ", "        "],
            "+": ["        ", "   __   ", " _/  |_ ", " \\___/  ", "        "],
            ":": ["    ", " __ ", "/_/", " __ ", "/_/"],
            ".": ["    ", "    ", "    ", " __ ", "/_/"]
        }
    },
    blocks: {
        height: 5,
        chars: {
            a: ["█████", "█   █", "█████", "█   █", "█   █"],
            b: ["████ ", "█   █", "████ ", "█   █", "████ "],
            c: ["█████", "█    ", "█    ", "█    ", "█████"],
            d: ["████ ", "█   █", "█   █", "█   █", "████ "],
            e: ["█████", "█    ", "████ ", "█    ", "█████"],
            f: ["█████", "█    ", "████ ", "█    ", "█    "],
            g: ["█████", "█    ", "█  ██", "█   █", "█████"],
            h: ["█   █", "█   █", "█████", "█   █", "█   █"],
            i: ["███", " █ ", " █ ", " █ ", "███"],
            j: ["  ███", "   █ ", "   █ ", "█  █ ", "████ "],
            k: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
            l: ["█    ", "█    ", "█    ", "█    ", "█████"],
            m: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
            n: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
            o: ["█████", "█   █", "█   █", "█   █", "█████"],
            p: ["█████", "█   █", "█████", "█    ", "█    "],
            q: ["█████", "█   █", "█   █", "█████", "    █"],
            r: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
            s: ["█████", "█    ", "█████", "    █", "█████"],
            t: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
            u: ["█   █", "█   █", "█   █", "█   █", "█████"],
            v: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
            w: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
            x: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
            y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
            z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
            "0": ["█████", "█  ██", "█ █ █", "██  █", "█████"],
            "1": [" ██ ", "███ ", " █  ", " █  ", "████"],
            "2": ["█████", "    █", "█████", "█    ", "█████"],
            "3": ["█████", "    █", "█████", "    █", "█████"],
            "4": ["█   █", "█   █", "█████", "    █", "    █"],
            "5": ["█████", "█    ", "█████", "    █", "█████"],
            "6": ["█████", "█    ", "█████", "█   █", "█████"],
            "7": ["█████", "    █", "   █ ", "  █  ", " █   "],
            "8": ["█████", "█   █", "█████", "█   █", "█████"],
            "9": ["█████", "█   █", "█████", "    █", "█████"],
            " ": ["     ", "     ", "     ", "     ", "     "],
            "!": ["█", "█", "█", " ", "█"],
            "?": ["████", "   █", " ██ ", "    ", " █  "],
            "-": ["     ", "     ", "█████", "     ", "     "],
            "+": ["     ", "  █  ", "█████", "  █  ", "     "],
            ":": [" ", "█", " ", "█", " "],
            ".": [" ", " ", " ", " ", "█"]
        }
    },
    shadow: {
        height: 5,
        chars: {
            a: ["  ___  ", " / _ \\ ", "/ /_\\ \\", "|  _  |", "|_| |_|"],
            b: [" ___  ", "| _ ) ", "| _ \\ ", "| _/  ", "|___/ "],
            c: ["  ___ ", " / __|", "| (__ ", " \\___|", "      "],
            d: [" ___  ", "|   \\ ", "| |) |", "| |) |", "|___/ "],
            e: [" ___ ", "| __|", "| _| ", "| |  ", "|___|"],
            f: [" ___ ", "| __|", "| _| ", "| |  ", "|_|  "],
            g: ["  ___ ", " / __|", "| (_ |", " \\___|", "      "],
            h: [" _  _ ", "| || |", "| __ |", "| || |", "|_||_|"],
            i: [" _ ", "| |", "| |", "| |", "|_|"],
            j: ["   _ ", "  | |", "  | |", "|_| |", " \\__/ "],
            k: [" _  __", "| |/ /", "| ' < ", "| . \\ ", "|_|\\_\\"],
            l: [" _   ", "| |  ", "| |  ", "| |__", "|____|"],
            m: [" _  _ ", "| \\/ |", "| |\\/|", "| |  |", "|_|  |"],
            n: [" _  _ ", "| \\| |", "| .` |", "| |\\ |", "|_| \\_|"],
            o: [" ___  ", "/ _ \\ ", "| (_) |", "\\___/ ", "      "],
            p: [" ___  ", "| _ \\ ", "|  _/ ", "| |   ", "|_|   "],
            q: [" ___  ", "/ _ \\ ", "| (_) |", " \\__\\ \\", "    \\_\\"],
            r: [" ___  ", "| _ \\ ", "|   / ", "|_|\\_\\", "      "],
            s: [" ___ ", "/ __|", "\\__ \\", "|___/", "     "],
            t: [" ___ ", "|_ _|", " | | ", " | | ", " |_| "],
            u: [" _   _ ", "| | | |", "| |_| |", " \\___/ ", "       "],
            v: [" _   _ ", "| | | |", "| | | |", " \\_/ / ", "  \\_/  "],
            w: [" _    _ ", "| |/\\| |", "|  /\\  |", "| /  \\ |", "|/    \\|"],
            x: ["__  __", "\\ \\/ /", " >  < ", "/_/\\_\\", "      "],
            y: ["__   __", "\\ \\ / /", " \\ V / ", "  | |  ", "  |_|  "],
            z: ["____ ", "|_  /", " / / ", "/___|", "     "],
            "0": ["  ___  ", " / _ \\ ", "| | | |", "| |_| |", " \\___/ "],
            "1": [" _ ", "/ |", "| |", "| |", "|_|"],
            "2": [" ___  ", "|_  ) ", " / /  ", "/___| ", "      "],
            "3": [" ____ ", "|__ / ", " |_ \\ ", "|___/ ", "      "],
            "4": [" _ _  ", "| | | ", "|_  _|", "  |_| ", "      "],
            "5": [" ___ ", "| __|", "|__ \\", "|___/", "     "],
            "6": ["  __  ", " / /  ", "/ _ \\ ", "\\___/ ", "      "],
            "7": [" ____ ", "|__  |", "  / / ", " /_/  ", "      "],
            "8": [" ___ ", "( _ )", "/ _ \\", "\\___/", "     "],
            "9": [" ___  ", "/ _ \\ ", "\\_, / ", " /_/  ", "      "],
            " ": ["   ", "   ", "   ", "   ", "   "],
            "!": [" _ ", "| |", "| |", "|_|", "(_)"],
            "?": [" ___ ", "|_  )", " / / ", "|___|", " (_) "],
            "-": ["    ", "    ", "____", "    ", "    "],
            "+": ["    ", " _  ", "|_| ", "    ", "    "],
            ":": ["   ", " _ ", "(_)", " _ ", "(_)"],
            ".": ["   ", "   ", "   ", " _ ", "(_)"]
        }
    },
    cyber: {
        height: 5,
        chars: {
            a: [" ▄▀▀▄ ", "█▄▄▄█", "█   █", "█   █", "▀   ▀"],
            b: ["█▀▀█ ", "█▄▄█▄", "█   █", "█▄▄█▀", "▀▀▀  "],
            c: [" ▄▀▀▀", "█    ", "█    ", "█    ", " ▀▀▀▀"],
            d: ["█▀▀▄ ", "█   █", "█   █", "█▄▄█▀", "▀▀▀  "],
            e: ["█▀▀▀█", "█▄▄  ", "█▀▀  ", "█▄▄▄█", "▀▀▀▀▀"],
            f: ["█▀▀▀█", "█▄▄  ", "█▀▀  ", "█    ", "▀    "],
            g: [" ▄▀▀▀", "█ ▄▄▄", "█   █", "█▄▄▄█", " ▀▀▀▀"],
            h: ["█   █", "█▄▄▄█", "█   █", "█   █", "▀   ▀"],
            i: ["█▀▀▀█", "  █  ", "  █  ", "█▄▄▄█", "▀▀▀▀▀"],
            j: ["  ▀▀█", "    █", "    █", "█▄▄▄█", " ▀▀▀ "],
            k: ["█  █▀", "█▄█  ", "█ ▀▄ ", "█   █", "▀   ▀"],
            l: ["█    ", "█    ", "█    ", "█▄▄▄█", "▀▀▀▀▀"],
            m: ["█   █", "█▀▄▀█", "█ █ █", "█   █", "▀   ▀"],
            n: ["█   █", "█▀▄ █", "█ █ █", "█  ▀█", "▀   ▀"],
            o: [" ▄▀▀▄ ", "█    █", "█    █", " ▀▄▄▀ ", "      "],
            p: ["█▀▀█ ", "█▄▄█▀", "█    ", "█    ", "▀    "],
            q: [" ▄▀▀▄ ", "█    █", "█  █ █", " ▀▄▄▀█", "     ▀"],
            r: ["█▀▀█ ", "█▄▄█▀", "█  ▀▄", "█   █", "▀   ▀"],
            s: [" ▄▀▀▀", " ▀▀▄ ", "▄   █", "▀▀▀▀ ", "     "],
            t: ["▀█▀█▀", "  █  ", "  █  ", "  █  ", "  ▀  "],
            u: ["█   █", "█   █", "█   █", " ▀▄▄▀ ", "      "],
            v: ["█   █", "█   █", " █ █ ", "  █  ", "  ▀  "],
            w: ["█   █", "█ █ █", "█ █ █", " ▀▄▀ ", "     "],
            x: ["█   █", " ▀▄▀ ", "  █  ", " ▄▀▄ ", "█   █"],
            y: ["█   █", " ▀▄▀ ", "  █  ", "  █  ", "  ▀  "],
            z: ["▀▀▀▀█", "   █ ", "  █  ", " █   ", "█▄▄▄▄"],
            "0": [" ▄▀▀▄ ", "█  █ █", "█ █  █", " ▀▄▄▀ ", "      "],
            "1": [" ▄█  ", "  █  ", "  █  ", "▄▄█▄▄", "▀▀▀▀▀"],
            "2": ["█▀▀▀█", "    █", " ▄▀▀ ", "█▄▄▄█", "▀▀▀▀▀"],
            "3": ["█▀▀▀█", "   ▄▀", "    █", "█▄▄▄█", "▀▀▀▀▀"],
            "4": ["█  █ ", "█▄▄█▄", "   █ ", "   █ ", "   ▀ "],
            "5": ["█▀▀▀█", "█▄▄▄ ", "    █", "█▄▄▄█", "▀▀▀▀▀"],
            "6": [" ▄▀▀▀", "█▄▄▄ ", "█   █", " ▀▄▄▀ ", "      "],
            "7": ["▀▀▀▀█", "   █ ", "  █  ", " █   ", " ▀   "],
            "8": [" ▄▀▀▄ ", " ▀▄▄▀ ", " ▄▀▀▄ ", " ▀▄▄▀ ", "      "],
            "9": [" ▄▀▀▄ ", "█▄▄▄█", "    █", " ▀▄▄▀ ", "      "],
            " ": ["     ", "     ", "     ", "     ", "     "],
            "!": [" █ ", " █ ", " █ ", " ▄ ", " ▀ "],
            "?": ["█▀▀█", "   █", " ▄▀ ", " ▄  ", " ▀  "],
            "-": ["     ", "     ", "▀▀▀▀▀", "     ", "     "],
            "+": ["     ", "  █  ", "▀▀█▀▀", "  █  ", "     "],
            ":": ["   ", " ▄ ", " ▀ ", " ▄ ", " ▀ "],
            ".": ["   ", "   ", "   ", " ▄ ", " ▀ "]
        }
    }
};

// Unicode Character Maps
const UNICODE_MAPS: Record<string, Record<string, string>> = {
    bubble: {
        a: "ⓐ", b: "ⓑ", c: "ⓒ", d: "ⓓ", e: "ⓔ", f: "ⓕ", g: "ⓖ", h: "ⓗ", i: "ⓘ", j: "ⓙ", k: "ⓚ", l: "ⓛ", m: "ⓜ",
        n: "ⓝ", o: "ⓞ", p: "ⓟ", q: "ⓠ", r: "ⓡ", s: "ⓢ", t: "ⓣ", u: "ⓤ", v: "ⓥ", w: "ⓦ", x: "ⓧ", y: "ⓨ", z: "ⓩ",
        A: "Ⓐ", B: "Ⓑ", C: "Ⓒ", D: "Ⓓ", E: "Ⓔ", F: "Ⓕ", G: "Ⓖ", H: "Ⓗ", I: "Ⓘ", J: "Ⓙ", K: "Ⓚ", L: "Ⓛ", M: "Ⓜ",
        N: "Ⓝ", O: "Ⓞ", P: "Ⓟ", Q: "Ⓠ", R: "Ⓡ", S: "Ⓢ", T: "Ⓣ", U: "Ⓤ", V: "Ⓥ", W: "Ⓦ", X: "Ⓧ", Y: "Ⓨ", Z: "Ⓩ",
        "0": "⓪", "1": "①", "2": "②", "3": "③", "4": "④", "5": "⑤", "6": "⑥", "7": "⑦", "8": "⑧", "9": "⑨"
    },
    squared: {
        a: "🄰", b: "🄱", c: "🄲", d: "🄳", e: "🄴", f: "🄵", g: "🄶", h: "🄷", i: "🄸", j: "🄹", k: "🄺", l: "🄻", m: "🄼",
        n: "🄽", o: "🄾", p: "🄿", q: "🅀", r: "🅁", s: "🅂", t: "🅃", u: "🅄", v: "🅅", w: "🅆", x: "🅇", y: "🅈", z: "🅉",
        A: "🄰", B: "🄱", C: "🄲", D: "🄳", E: "🄴", F: "🄵", G: "🄶", H: "🄷", I: "🄸", J: "🄹", K: "🄺", L: "🄻", M: "🄼",
        N: "🄽", O: "🄾", P: "🄿", Q: "🅀", R: "🅁", S: "🅂", T: "🅃", U: "🅄", V: "🅅", W: "🅆", X: "🅇", Y: "🅈", Z: "🅉",
        "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9"
    },
    script: {
        a: "𝒶", b: "𝒷", c: "𝒸", d: "𝒹", e: "ℯ", f: "𝒻", g: "ℊ", h: "𝒽", i: "𝒾", j: "𝒿", k: "𝓀", l: "𝓁", m: "𝓂",
        n: "𝓃", o: "ℴ", p: "𝓅", q: "𝓆", r: "𝓇", s: "𝓈", t: "𝓉", u: "𝓊", v: "𝓋", w: "𝓌", x: "𝓍", y: "𝓎", z: "𝓏",
        A: "𝒜", B: "ℬ", C: "𝒞", D: "𝒟", E: "ℰ", F: "ℱ", G: "𝒢", H: "ℋ", I: "ℐ", J: "𝒥", K: "𝒦", L: "ℒ", M: "ℳ",
        N: "𝒩", O: "𝒪", P: "𝒫", Q: "𝒬", R: "ℛ", S: "𝒮", T: "𝒯", U: "𝒰", V: "𝒱", W: "𝒲", X: "𝒳", Y: "𝒴", Z: "𝒵"
    },
    gothic: {
        a: "𝔞", b: "𝔟", c: "𝔠", d: "𝔡", e: "𝔢", f: "𝔣", g: "𝔤", h: "𝔥", i: "𝔦", j: "𝔧", k: "𝔨", l: "𝔩", m: "𝔪",
        n: "𝔫", o: "𝔬", p: "𝔭", q: "𝔮", r: "𝔯", s: "𝔰", t: "𝔱", u: "𝔲", v: "𝔳", w: "𝔴", x: "𝔵", y: "𝔶", z: "𝔩",
        A: "𝔄", B: "𝔅", C: "ℭ", D: "𝔇", E: "𝔈", F: "𝔉", G: "𝔊", H: "ℌ", I: "ℑ", J: "𝔍", K: "𝔎", L: "𝔏", M: "𝔐",
        N: "𝔑", O: "𝔒", P: "𝔓", Q: "𝔔", R: "ℜ", S: "𝔖", T: "𝔗", U: "𝔘", V: "𝔙", W: "𝔚", X: "𝔛", Y: "𝔜", Z: "ℨ"
    },
    double: {
        a: "𝕒", b: "𝕓", c: "𝕔", d: "𝕕", e: "𝕖", f: "𝕗", g: "𝕘", h: "𝕙", i: "𝕚", j: "𝕛", k: "𝕜", l: "𝕝", m: "𝕞",
        n: "𝕟", o: "𝕠", p: "𝕡", q: "𝕢", r: "𝕣", s: "𝕤", t: "𝕥", u: "𝕦", v: "𝕧", w: "𝕨", x: "𝕩", y: "𝕪", z: "𝕫",
        A: "𝔸", B: "𝔹", C: "ℂ", D: "𝔻", E: "𝔼", F: "𝔽", G: "𝔾", H: "ℍ", I: "𝕀", J: "𝕁", K: "𝕂", L: "𝕃", M: "𝕄",
        N: "ℕ", O: "𝕆", P: "ℙ", Q: "ℚ", R: "ℝ", S: "𝕊", T: "𝕋", U: "𝕌", V: "𝕍", W: "𝕎", X: "𝕏", Y: "𝕐", Z: "ℤ",
        "0": "𝟘", "1": "𝟙", "2": "𝟚", "3": "𝟛", "4": "𝟜", "5": "𝟝", "6": "𝟞", "7": "𝟟", "8": "𝟠", "9": "𝟡"
    },
    monospace: {
        a: "ａ", b: "ｂ", c: "ｃ", d: "ｄ", e: "ｅ", f: "ｆ", g: "ｇ", h: "ｈ", i: "ｉ", j: "ｊ", k: "ｋ", l: "ｌ", m: "ｍ",
        n: "ｎ", o: "ｏ", p: "ｐ", q: "ｑ", r: "ｒ", s: "ｓ", t: "ｔ", u: "ｕ", v: "ｖ", w: "ｗ", x: "ｘ", y: "ｙ", z: "ｚ",
        A: "Ａ", B: "Ｂ", C: "Ｃ", D: "Ｄ", E: "Ｅ", F: "Ｆ", G: "Ｇ", H: "Ｈ", I: "Ｉ", J: "Ｊ", K: "Ｋ", L: "Ｌ", M: "Ｍ",
        N: "Ｎ", O: "Ｏ", P: "Ｐ", Q: "Ｑ", R: "Ｒ", S: "Ｓ", T: "Ｔ", U: "Ｕ", V: "Ｖ", W: "Ｗ", X: "Ｘ", Y: "Ｙ", Z: "Ｚ",
        "0": "０", "1": "１", "2": "２", "3": "３", "4": "４", "5": "５", "6": "６", "7": "７", "8": "８", "9": "９"
    },
    inverted: {
        a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ",
        n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
        A: "∀", B: "ᗺ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ", K: "ʞ", L: "˥", M: "W",
        N: "N", O: "O", P: "Ԁ", Q: "Ò", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
        "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
        "?": "¿", "!": "¡", ".": "˙", ",": "'", "'": ",", "_": "‾"
    },
    morse: {
        a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---",
        k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-",
        u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..",
        "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
        "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
        " ": "/"
    }
};

export default function AsciiArtGenerator() {
    // Primary Input & Styling State
    const [inputText, setInputText] = useState<string>("TWISTER");
    const [selectedFont, setSelectedFont] = useState<string>("standard");
    const [selectedFrame, setSelectedFrame] = useState<string>("double");
    const [letterSpacing, setLetterSpacing] = useState<number>(1);
    const [horizontalPadding, setHorizontalPadding] = useState<number>(2);
    const [verticalPadding, setVerticalPadding] = useState<number>(1);
    const [textAlignment, setTextAlignment] = useState<"left" | "center" | "right">("center");
    const [caseTransform, setCaseTransform] = useState<"none" | "uppercase" | "lowercase">("uppercase");
    const [invertColors, setInvertColors] = useState<boolean>(false);
    const [commentWrapper, setCommentWrapper] = useState<"none" | "slash" | "hash" | "html" | "sql">("none");

    // UI Feedback & Modal States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"output" | "preview" | "cheatsheet">("output");
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Number sanitization helper
    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        min = 0,
        max = 10
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(min);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) {
            setter(min);
        } else {
            setter(Math.min(max, Math.max(min, num)));
        }
    };

    // Text Case Transformation
    const processedText = useMemo(() => {
        if (!inputText) return "";
        if (caseTransform === "uppercase") return inputText.toUpperCase();
        if (caseTransform === "lowercase") return inputText.toLowerCase();
        return inputText;
    }, [inputText, caseTransform]);

    // Multi-line FIGlet or Unicode ASCII Render Engine
    const rawAsciiText = useMemo(() => {
        if (!processedText) return "";

        // Check if selected font is FIGlet multi-line font
        if (FIGLET_FONTS[selectedFont]) {
            const fontDef = FIGLET_FONTS[selectedFont];
            const height = fontDef.height;
            const lines: string[] = Array(height).fill("");
            const chars = processedText.toLowerCase().split("");
            const spacingStr = " ".repeat(letterSpacing);

            chars.forEach((char) => {
                const glyph = fontDef.chars[char] || fontDef.chars["?"] || Array(height).fill("   ");
                for (let r = 0; r < height; r++) {
                    lines[r] += (glyph[r] || "") + spacingStr;
                }
            });

            return lines.join("\n");
        }

        // Check if font is Unicode replacement
        if (UNICODE_MAPS[selectedFont]) {
            const map = UNICODE_MAPS[selectedFont];
            if (selectedFont === "inverted") {
                const chars = processedText.split("").reverse();
                return chars.map((c) => map[c] || c).join("");
            }
            if (selectedFont === "morse") {
                const chars = processedText.toLowerCase().split("");
                return chars.map((c) => map[c] || c).join(" ");
            }
            const chars = processedText.split("");
            const spacingStr = " ".repeat(letterSpacing);
            return chars.map((c) => (map[c] || c) + spacingStr).join("");
        }

        // Ciphers / Byte Encodings
        if (selectedFont === "binary") {
            return processedText
                .split("")
                .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
                .join(" ");
        }

        if (selectedFont === "hex") {
            return processedText
                .split("")
                .map((c) => "0x" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"))
                .join(" ");
        }

        return processedText;
    }, [processedText, selectedFont, letterSpacing]);

    // Border Framing & Alignment Engine
    const framedAsciiOutput = useMemo(() => {
        if (!rawAsciiText) return "";

        let lines = rawAsciiText.split("\n");

        // Calculate maximum content line length
        const maxContentLen = lines.reduce((max, line) => Math.max(max, line.length), 0);

        // Apply Alignment
        lines = lines.map((line) => {
            const diff = maxContentLen - line.length;
            if (diff <= 0) return line;
            if (textAlignment === "right") return " ".repeat(diff) + line;
            if (textAlignment === "center") {
                const leftPad = Math.floor(diff / 2);
                const rightPad = diff - leftPad;
                return " ".repeat(leftPad) + line + " ".repeat(rightPad);
            }
            return line + " ".repeat(diff);
        });

        // Add Vertical Padding
        const emptyLine = " ".repeat(maxContentLen);
        const vPads = Array(verticalPadding).fill(emptyLine);
        lines = [...vPads, ...lines, ...vPads];

        // Apply Borders
        const hPadStr = " ".repeat(horizontalPadding);
        const paddedWidth = maxContentLen + horizontalPadding * 2;

        if (selectedFrame === "single") {
            const top = "┌" + "─".repeat(paddedWidth) + "┐";
            const bot = "└" + "─".repeat(paddedWidth) + "┘";
            const framed = lines.map((l) => "│" + hPadStr + l + hPadStr + "│");
            return [top, ...framed, bot].join("\n");
        }

        if (selectedFrame === "double") {
            const top = "╔" + "═".repeat(paddedWidth) + "╗";
            const bot = "╚" + "═".repeat(paddedWidth) + "╝";
            const framed = lines.map((l) => "║" + hPadStr + l + hPadStr + "║");
            return [top, ...framed, bot].join("\n");
        }

        if (selectedFrame === "rounded") {
            const top = "╭" + "─".repeat(paddedWidth) + "╮";
            const bot = "╰" + "─".repeat(paddedWidth) + "╯";
            const framed = lines.map((l) => "│" + hPadStr + l + hPadStr + "│");
            return [top, ...framed, bot].join("\n");
        }

        if (selectedFrame === "retro") {
            const top = "+" + "-".repeat(paddedWidth) + "+";
            const bot = "+" + "-".repeat(paddedWidth) + "+";
            const framed = lines.map((l) => "|" + hPadStr + l + hPadStr + "|");
            return [top, ...framed, bot].join("\n");
        }

        if (selectedFrame === "stars") {
            const top = "★" + "═".repeat(paddedWidth) + "★";
            const bot = "★" + "═".repeat(paddedWidth) + "★";
            const framed = lines.map((l) => "✦" + hPadStr + l + hPadStr + "✦");
            return [top, ...framed, bot].join("\n");
        }

        if (selectedFrame === "hash") {
            const top = "#".repeat(paddedWidth + 4);
            const bot = "#".repeat(paddedWidth + 4);
            const framed = lines.map((l) => "##" + hPadStr + l + hPadStr + "##");
            return [top, ...framed, bot].join("\n");
        }

        if (selectedFrame === "vintage") {
            const top = "~" + "*".repeat(paddedWidth) + "~";
            const bot = "~" + "*".repeat(paddedWidth) + "~";
            const framed = lines.map((l) => "~" + hPadStr + l + hPadStr + "~");
            return [top, ...framed, bot].join("\n");
        }

        // Border none: apply plain horizontal padding
        return lines.map((l) => hPadStr + l).join("\n");
    }, [rawAsciiText, selectedFrame, horizontalPadding, verticalPadding, textAlignment]);

    // Source Code Comment Wrapping
    const finalFormattedOutput = useMemo(() => {
        if (!framedAsciiOutput) return "";
        if (commentWrapper === "slash") {
            return `/*\n${framedAsciiOutput}\n*/`;
        }
        if (commentWrapper === "hash") {
            return framedAsciiOutput
                .split("\n")
                .map((l) => `# ${l}`)
                .join("\n");
        }
        if (commentWrapper === "html") {
            return `<!--\n${framedAsciiOutput}\n-->`;
        }
        if (commentWrapper === "sql") {
            return framedAsciiOutput
                .split("\n")
                .map((l) => `-- ${l}`)
                .join("\n");
        }
        return framedAsciiOutput;
    }, [framedAsciiOutput, commentWrapper]);

    // Clipboard Copy Handler
    const handleCopy = () => {
        if (!finalFormattedOutput) return;
        navigator.clipboard.writeText(finalFormattedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Download as .TXT file
    const downloadAsTxt = () => {
        if (!finalFormattedOutput) return;
        const blob = new Blob([finalFormattedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ascii-banner-${inputText.toLowerCase().replace(/[^a-z0-9]/g, "-") || "art"}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Export as Raster PNG Image
    const exportAsPng = useCallback(() => {
        if (!finalFormattedOutput || typeof window === "undefined") return;

        const lines = finalFormattedOutput.split("\n");
        const maxLen = lines.reduce((max, l) => Math.max(max, l.length), 0);
        const fontSize = 16;
        const lineHeight = 22;
        const charWidth = 9.6;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const padding = 40;
        canvas.width = Math.ceil(maxLen * charWidth + padding * 2);
        canvas.height = Math.ceil(lines.length * lineHeight + padding * 2);

        // Background Fill
        ctx.fillStyle = invertColors ? "#f8fafc" : "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text Drawing
        ctx.fillStyle = invertColors ? "#0f172a" : "#38bdf8";
        ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
        ctx.textBaseline = "top";

        lines.forEach((line, idx) => {
            ctx.fillText(line, padding, padding + idx * lineHeight);
        });

        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `ascii-banner-${inputText.toLowerCase().replace(/[^a-z0-9]/g, "-") || "render"}.png`;
        link.click();
    }, [finalFormattedOutput, inputText, invertColors]);

    // Quick Sample Text Presets
    const samplePresets = ["TWISTER", "SERVER OK", "API v2.4", "CYBERPUNK", "DATABASE", "BUILD SUCCESS"];

    // Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Text to ASCII Art & Banner Typography Generator",
        "url": "https://twistertools.com/tools/text-tools/ascii-art-generator",
        "description": "Generate multi-line ASCII banner typography, FIGlet lettering, Unicode fonts, and framed comment blocks with real-time preview and instant export.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "What is ASCII art and how do FIGlet fonts work in modern software engineering?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ASCII art is a digital graphic design technique that creates visual illustrations and large typographic banners using standard 7-bit ASCII characters and UTF-8 glyphs. FIGlet (Frank, Ian, and Glenn's Letters) is the universal Unix algorithm developed in 1991 that compiles regular strings of text into oversized multi-line banners. In modern software engineering, developers embed FIGlet ASCII art inside CLI tools, terminal splash screens, code headers, and deployment logs to deliver clear visual separation and branded terminal experiences."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use generated ASCII art inside source code comments and README markdown files?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The generator includes dedicated source code comment presets for JavaScript/TypeScript (/* */), Python/Bash (#), HTML/XML (<!-- -->), and SQL (--). To preserve alignment in GitHub README.md files and Discord chats, always wrap the generated ASCII art inside triple-backtick markdown code blocks (```)."
                }
            },
            {
                "@type": "Question",
                "name": "Why do ASCII art characters sometimes misalign when pasted into other applications?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ASCII banners rely on monospaced typography where every single character—including spaces—occupies the exact same pixel width. If pasted into a proportional variable-width font (such as Arial or Helvetica), characters occupy varying widths and cause the design to warp. Always ensure the receiving application uses a monospace font like Consolas, Monaco, Fira Code, Courier New, or a code block wrapper."
                }
            },
            {
                "@type": "Question",
                "name": "How does the tool export ASCII banners as PNG images?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses HTML5 Canvas rasterization directly in your browser. It calculates the exact character dimensions, draws the monospaced text onto a high-contrast terminal canvas, and renders an uncompressed PNG graphic ready for social media banners, README documentation, or presentation slides without sending data to any external server."
                }
            },
            {
                "@type": "Question",
                "name": "Are Unicode characters like Fraktur, Bubble, and Double Struck compatible across all operating systems?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Unicode mathematical alphanumeric symbols (fraktur, boxed, double struck, fullwidth) are standardized UTF-8 characters supported natively across modern operating systems, including iOS, Android, macOS, Windows, Linux, and web browsers."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text data stored or processed on remote cloud servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The ASCII Art & Banner Typography Generator operates 100% client-side inside your browser using native JavaScript array mapping and Canvas rendering. Your text, credentials, or proprietary software comments never leave your local machine."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Configuration & Typography Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Text Input Header Bar */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Type className="w-4 h-4 text-indigo-600" />
                                    Source Text to Convert
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                    {inputText.length} chars
                                </span>
                            </label>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type banner text here..."
                                maxLength={40}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                            />
                            {/* Quick Presets */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {samplePresets.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setInputText(preset)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Style Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600" />
                                ASCII & Typography Font Style
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 p-1">
                                {FONT_OPTIONS.map((f) => {
                                    const isSelected = selectedFont === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setSelectedFont(f.id)}
                                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${isSelected
                                                ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400"
                                                : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={`text-xs font-bold ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                                                    {f.name}
                                                </span>
                                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white text-slate-500 font-bold border border-slate-200">
                                                    {f.category}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{f.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Frame & Border Style Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Frame className="w-4 h-4 text-indigo-600" />
                                Boundary Frame & Border
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {FRAME_OPTIONS.map((frm) => {
                                    const isSelected = selectedFrame === frm.id;
                                    return (
                                        <button
                                            key={frm.id}
                                            type="button"
                                            onClick={() => setSelectedFrame(frm.id)}
                                            className={`p-2 rounded-xl border text-center transition cursor-pointer ${isSelected
                                                ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400 text-indigo-900"
                                                : "bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700"
                                                }`}
                                        >
                                            <span className="text-xs font-bold block truncate">{frm.name.split(" ")[0]}</span>
                                            <span className="text-[10px] text-slate-400 font-mono block truncate">{frm.id}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Granular Sliders: Letter Spacing & Margins */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200/80 pb-2">
                                <span className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                                    Layout, Spacing & Padding
                                </span>
                                <span className="text-[11px] text-slate-400">Realtime Math</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Letter Spacing</span>
                                        <span className="font-mono text-indigo-600 font-black">{letterSpacing}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={4}
                                        step={1}
                                        value={letterSpacing}
                                        onChange={(e) => setLetterSpacing(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Horizontal Pad</span>
                                        <span className="font-mono text-indigo-600 font-black">{horizontalPadding}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={8}
                                        step={1}
                                        value={horizontalPadding}
                                        onChange={(e) => setHorizontalPadding(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Vertical Pad</span>
                                        <span className="font-mono text-indigo-600 font-black">{verticalPadding}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={3}
                                        step={1}
                                        value={verticalPadding}
                                        onChange={(e) => setVerticalPadding(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>

                            {/* Text Alignment & Transformations */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                                <div className="space-y-1">
                                    <span className="font-bold text-slate-600 block">Alignment</span>
                                    <div className="flex bg-slate-200/70 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setTextAlignment("left")}
                                            className={`flex-1 py-1 rounded flex justify-center ${textAlignment === "left" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                        >
                                            <AlignLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTextAlignment("center")}
                                            className={`flex-1 py-1 rounded flex justify-center ${textAlignment === "center" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                        >
                                            <AlignCenter className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTextAlignment("right")}
                                            className={`flex-1 py-1 rounded flex justify-center ${textAlignment === "right" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                        >
                                            <AlignRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="font-bold text-slate-600 block">Case Transform</span>
                                    <div className="flex bg-slate-200/70 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setCaseTransform("uppercase")}
                                            className={`flex-1 py-1 rounded text-[11px] font-bold ${caseTransform === "uppercase" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                        >
                                            UPPER
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCaseTransform("none")}
                                            className={`flex-1 py-1 rounded text-[11px] font-bold ${caseTransform === "none" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                        >
                                            As Is
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCaseTransform("lowercase")}
                                            className={`flex-1 py-1 rounded text-[11px] font-bold ${caseTransform === "lowercase" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                        >
                                            lower
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Source Code Comment Format */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                                    Code Header Comment Syntax
                                </span>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[
                                        { id: "none", label: "Plain" },
                                        { id: "slash", label: "/* JS */" },
                                        { id: "hash", label: "# Python" },
                                        { id: "html", label: "<!-- HTML" },
                                        { id: "sql", label: "-- SQL" }
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setCommentWrapper(c.id as any)}
                                            className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition border cursor-pointer ${commentWrapper === c.id
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Zap className="w-3.5 h-3.5 text-indigo-500" />
                            Render Engine: 100% Client-Side Pure JavaScript
                        </span>
                        <span className="font-semibold text-emerald-600">Zero Server Latency</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Live Monospace Terminal Preview & Exporter */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Preview Action Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Monospace Terminal Stream
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setInvertColors(!invertColors)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${invertColors
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                        }`}
                                    title="Toggle Terminal Theme"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{invertColors ? "Dark Mode" : "Light Mode"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Primary Monospaced Terminal Screen */}
                        <div
                            ref={previewContainerRef}
                            className={`rounded-2xl p-4 sm:p-6 border overflow-x-auto min-h-[320px] max-h-[460px] flex flex-col justify-center transition-colors duration-200 ${invertColors
                                ? "bg-slate-900 border-slate-800 text-sky-400 selection:bg-indigo-500 selection:text-white"
                                : "bg-slate-950 border-slate-900 text-emerald-400 selection:bg-emerald-600 selection:text-white"
                                }`}
                        >
                            {finalFormattedOutput ? (
                                <pre className="font-mono text-xs sm:text-sm md:text-base leading-tight tracking-normal whitespace-pre select-all">
                                    {finalFormattedOutput}
                                </pre>
                            ) : (
                                <div className="text-center py-12 text-slate-500 space-y-2">
                                    <Terminal className="w-8 h-8 mx-auto stroke-1" />
                                    <p className="text-xs font-mono">No input text provided. Enter a phrase above to generate ASCII artwork.</p>
                                </div>
                            )}
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Lines</span>
                                <span className="text-lg sm:text-xl font-black text-indigo-600 font-mono">
                                    {finalFormattedOutput ? finalFormattedOutput.split("\n").length : 0}
                                </span>
                                <span className="text-[10px] text-slate-400 block">vertical rows</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Max Width</span>
                                <span className="text-lg sm:text-xl font-black text-slate-800 font-mono">
                                    {finalFormattedOutput ? Math.max(...finalFormattedOutput.split("\n").map((l) => l.length)) : 0}
                                </span>
                                <span className="text-[10px] text-slate-400 block">characters</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Size</span>
                                <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
                                    {finalFormattedOutput ? new Blob([finalFormattedOutput]).size : 0} B
                                </span>
                                <span className="text-[10px] text-slate-400 block">UTF-8 payload</span>
                            </div>
                        </div>

                    </div>

                    {/* Action Buttons: Copy & Export Hub */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? "Copied ASCII Art to Clipboard!" : "Copy ASCII Art to Clipboard"}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={downloadAsTxt}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                            >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Save as .TXT File</span>
                            </button>

                            <button
                                type="button"
                                onClick={exportAsPng}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                            >
                                <Image className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Export as PNG Image</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Architectural Overview & History of ASCII Typography */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is ASCII Art? Evolution from 7-Bit Teletypes to Modern Terminal Typography
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        ASCII art is a graphic design discipline that renders pictures, visual structures, and typography entirely out of textual glyphs defined in the <strong>American Standard Code for Information Interchange (ASCII)</strong> and the extended <strong>Unicode Universal Coded Character Set</strong>. Originally standardized in 1963 for teleprinters and punch cards, the standard 7-bit ASCII character set contained just 128 numerical values (including 95 printable characters from space to tilde).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        During the Bulletin Board System (BBS) era of the 1980s and the rise of Unix mainframes in the 1990s, programmers created multi-line typographic programs like <em>FIGlet</em> to generate bold ASCII headlines across terminal terminals that lacked graphical display hardware. Today, ASCII typography remains an indispensable tool for CLI developer tooling, GitHub repository documentation headers, REST API terminal banners, microservice startup logs, and Discord community aesthetic branding.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Monospace Grid Integrity</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Every glyph occupies an exact identical fixed horizontal coordinate, preventing vertical drift and maintaining geometric alignment across monospace consoles.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Universal UTF-8 Portability</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pure text payloads require zero external web fonts, zero image HTTP requests, and render instantly inside raw operating system terminal buffers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Zero-Binary Overhead</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                High-impact branding banners weigh less than 1 kilobyte of memory, making them ideal for embedding directly in lightweight production microservices.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Typography & Font Classification Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Typography Classification & Font Family Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct typographic family ensures your terminal art matches the technical vibe of your application:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Font Engine</th>
                                    <th className="p-3">Glyph Architecture</th>
                                    <th className="p-3">Line Height</th>
                                    <th className="p-3">Rendering Compatibility</th>
                                    <th className="p-3">Primary Professional Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Standard 3D</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">7-Bit ASCII Slant</td>
                                    <td className="p-3 font-mono text-slate-600">5 Lines</td>
                                    <td className="p-3 text-xs">100% Universally Compatible</td>
                                    <td className="p-3 text-xs text-slate-600">CLI initialization screens, Node.js console splash banners, script logs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Slant Italic</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Angled Forward Slash</td>
                                    <td className="p-3 font-mono text-slate-600">5 Lines</td>
                                    <td className="p-3 text-xs">100% Universally Compatible</td>
                                    <td className="p-3 text-xs text-slate-600">DevOps deployment pipelines, CI/CD status headers, terminal tools</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Solid Blocks</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">UTF-8 Full Block (█)</td>
                                    <td className="p-3 font-mono text-slate-600">5 Lines</td>
                                    <td className="p-3 text-xs">UTF-8 Consoles & Browsers</td>
                                    <td className="p-3 text-xs text-slate-600">High-contrast server boots, Docker container runtime logs, security prompts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Cyberpunk Glitch</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Half Blocks (▀ ▄ █)</td>
                                    <td className="p-3 font-mono text-slate-600">5 Lines</td>
                                    <td className="p-3 text-xs">Modern Monospace Consoles</td>
                                    <td className="p-3 text-xs text-slate-600">Cybersecurity tools, CTF competitions, hacker terminal aesthetics</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Unicode Symbols</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Single-line Math Glyphs</td>
                                    <td className="p-3 font-mono text-slate-600">1 Line</td>
                                    <td className="p-3 text-xs">Modern Web & Mobile OS</td>
                                    <td className="p-3 text-xs text-slate-600">Discord usernames, social media bios, commit messages, file folder names</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Code Headers and README Integration */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Engineering Best Practices: Embedding ASCII Banners in Production
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain flawless rendering across different developer environments, follow these industry-standard implementation rules:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" /> GitHub README Markdown
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Always enclose ASCII banners inside fenced code blocks using triple backticks (<code className="bg-slate-200 px-1 rounded text-xs font-mono">```</code>). Without fenced blocks, markdown parsers treat spaces as collapsible whitespace and mangle the multi-line alignment.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Escaping Backslashes in JavaScript
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When pasting ASCII art inside JavaScript or TypeScript template literals (`...`), ensure backslashes (<code className="bg-slate-200 px-1 rounded text-xs font-mono">\</code>) are doubled (<code className="bg-slate-200 px-1 rounded text-xs font-mono">\\</code>) to prevent invalid escape sequence compilation errors.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> Production Node.js CLI Banner Example
                        </h3>
                        <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
                            {`// server.js - Startup Visualizer
const banner = \`
╔═════════════════════════════════════════════════╗
║   _____  _    _  _____  _____  _______  ______  ║
║  |_   _|| |  | ||_   _|/ ____||__   __||  ____| ║
║    | |  | |  | |  | | | (___     | |   | |__    ║
║    | |  | |/\\| |  | |  \\___ \\    | |   |  __|   ║
║   _| |_ \\  /\\  / _| |_ ____) |   | |   | |____  ║
║  |_____| \\/  \\/ |_____||_____/    |_|   |______| ║
║                                                 ║
║  >>> Twister Microservice v2.4 initialized <<<   ║
╚═════════════════════════════════════════════════╝\`;

console.log(banner);
console.log('Listening on port 8080 (http://localhost:8080)...');`}
                        </pre>
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
                                What is ASCII art and how do FIGlet fonts work in modern software engineering?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                ASCII art is a digital graphic design technique that creates visual illustrations and large typographic banners using standard 7-bit ASCII characters and UTF-8 glyphs. FIGlet (Frank, Ian, and Glenn&apos;s Letters) is the universal Unix algorithm developed in 1991 that compiles regular strings of text into oversized multi-line banners. In modern software engineering, developers embed FIGlet ASCII art inside CLI tools, terminal splash screens, code headers, and deployment logs to deliver clear visual separation and branded terminal experiences.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use generated ASCII art inside source code comments and README markdown files?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The generator includes dedicated source code comment presets for JavaScript/TypeScript (/* */), Python/Bash (#), HTML/XML (&lt;!-- --&gt;), and SQL (--). To preserve alignment in GitHub README.md files and Discord chats, always wrap the generated ASCII art inside triple-backtick markdown code blocks (```).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do ASCII art characters sometimes misalign when pasted into other applications?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                ASCII banners rely on monospaced typography where every single character—including spaces—occupies the exact same pixel width. If pasted into a proportional variable-width font (such as Arial or Helvetica), characters occupy varying widths and cause the design to warp. Always ensure the receiving application uses a monospace font like Consolas, Monaco, Fira Code, Courier New, or a code block wrapper.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the tool export ASCII banners as PNG images?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses HTML5 Canvas rasterization directly in your browser. It calculates the exact character dimensions, draws the monospaced text onto a high-contrast terminal canvas, and renders an uncompressed PNG graphic ready for social media banners, README documentation, or presentation slides without sending data to any external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are Unicode characters like Fraktur, Bubble, and Double Struck compatible across all operating systems?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Unicode mathematical alphanumeric symbols (fraktur, boxed, double struck, fullwidth) are standardized UTF-8 characters supported natively across modern operating systems, including iOS, Android, macOS, Windows, Linux, and web browsers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text data stored or processed on remote cloud servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The ASCII Art & Banner Typography Generator operates 100% client-side inside your browser using native JavaScript array mapping and Canvas rendering. Your text, credentials, or proprietary software comments never leave your local machine.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
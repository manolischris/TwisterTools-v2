'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Mail,
    ChevronRight,
    Send,
    CheckCircle2,
    MessageSquare,
    Clock,
    Globe,
    ExternalLink
} from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const response = await fetch('https://formspree.io/f/xkodqdbw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    _subject: formData.subject || 'TwisterTools Contact Inquiry',
                    message: formData.message
                })
            });

            if (response.ok) {
                setIsSuccess(true);
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                const data = await response.json();
                if (data && data.errors) {
                    setErrorMessage(data.errors.map((err: any) => err.message).join(', '));
                } else {
                    setErrorMessage('Failed to send the message. Please try again or email us directly.');
                }
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again or email us directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Us',
        url: 'https://www.twistertools.com/contact',
        description: 'Get in touch with the TwisterTools support and developer team for feedback, bug reports, and inquiries.',
        publisher: {
            '@type': 'Organization',
            name: 'TwisterTools',
            url: 'https://www.twistertools.com',
            email: 'contact@twistertools.com'
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Header */}
            <header className="relative overflow-hidden bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-indigo-700/50 shadow-md">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src="/images/og-hero.jpg"
                        alt="TwisterTools Background Visual"
                        fill
                        priority
                        className="object-cover object-center opacity-50 mix-blend-luminosity"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
                </div>
                <div className="relative z-10 max-w-5xl mx-auto">
                    <nav className="flex items-center space-x-2 text-xs sm:text-sm text-indigo-100 mb-4 font-medium">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white font-semibold">Contact Us</span>
                    </nav>
                    <div className="flex items-start space-x-4">
                        <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Contact Us</h1>
                            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-3xl leading-relaxed">
                                Have questions, feature requests, or technical feedback? We are here to help.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Details Column */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                                <MessageSquare className="w-5 h-5" />
                                <h2 className="font-bold text-slate-900 dark:text-white">Direct Email Support</h2>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Reach out directly for support, bug reports, partnership proposals, or feature recommendations.
                            </p>
                            <div className="pt-2">
                                <a
                                    href="mailto:contact@twistertools.com"
                                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline break-all"
                                >
                                    <span>contact@twistertools.com</span>
                                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                </a>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                                <Clock className="w-5 h-5" />
                                <h2 className="font-bold text-slate-900 dark:text-white">Response Time</h2>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Our support team typically reviews inquiries and technical bug reports within 24 to 48 business hours.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                                <Globe className="w-5 h-5" />
                                <h2 className="font-bold text-slate-900 dark:text-white">Global Privacy</h2>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Messages sent through this portal are used strictly to address your technical inquiry and will never be shared.
                            </p>
                        </div>
                    </div>

                    {/* Contact Form Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Us a Message</h2>
                            </div>

                            {isSuccess ? (
                                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 space-y-3">
                                    <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300 text-lg">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        <span>Message Dispatched!</span>
                                    </div>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                        Thank you for contacting TwisterTools. Your message has been successfully sent. We will review your inquiry and get back to you as soon as possible.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsSuccess(false);
                                            setErrorMessage(null);
                                        }}
                                        className="mt-2 text-xs font-semibold px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {errorMessage && (
                                        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-950 dark:text-rose-200 text-sm">
                                            {errorMessage}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@example.com"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Bug Report / Feature Recommendation"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            Message
                                        </label>
                                        <textarea
                                            rows={5}
                                            required
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Detail your inquiry or recommendation here..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-y"
                                        />
                                    </div>

                                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 text-sm cursor-pointer"
                                        >
                                            {isSubmitting ? (
                                                <span>Preparing Transmission...</span>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    <span>Submit Message</span>
                                                </>
                                            )}
                                        </button>

                                        <a
                                            href="mailto:contact@twistertools.com"
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                                        >
                                            <Mail className="w-4 h-4 text-slate-500" />
                                            <span>Compose via Email Client</span>
                                        </a>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
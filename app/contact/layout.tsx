import { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';

export async function generateMetadata(): Promise<Metadata> {
    const imageBase = path.join(process.cwd(), 'public', 'images', 'contact');
    const ogImageUrl = fs.existsSync(`${imageBase}.webp`)
        ? 'https://www.twistertools.com/images/contact.webp'
        : fs.existsSync(`${imageBase}.jpg`)
            ? 'https://www.twistertools.com/images/contact.jpg'
            : 'https://www.twistertools.com/images/og-default.jpg';

    return {
        title: 'Contact',
        description: 'Get in touch with the TwisterTools team. Send us your feedback, questions, bug reports, or feature requests.',
        alternates: {
            canonical: 'https://www.twistertools.com/contact',
        },
        openGraph: {
            title: 'Contact | TwisterTools',
            description: 'Get in touch with the TwisterTools team. Send us your feedback, questions, bug reports, or feature requests.',
            type: 'website',
            url: 'https://www.twistertools.com/contact',
            siteName: 'TwisterTools',
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: 'Contact TwisterTools',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: 'Contact | TwisterTools',
            description: 'Get in touch with the TwisterTools team. Send us your feedback, questions, bug reports, or feature requests.',
            images: [ogImageUrl],
        },
    };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: {
    default: "ForexBot Pro - Professional Forex Trading Bot",
    template: "%s | ForexBot Pro"
  },
  description: "Advanced AI-powered forex trading bot with comprehensive risk management, multiple strategies, and real-time market analysis.",
  keywords: ["forex", "trading", "bot", "AI", "automated trading", "scalping", "DCA", "grid trading", "OANDA", "MT5"],
  authors: [{ name: "ForexBot Pro Team" }],
  creator: "ForexBot Pro",
  publisher: "ForexBot Pro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://forexbot-pro.vercel.app",
    title: "ForexBot Pro - Professional Forex Trading Bot",
    description: "Advanced AI-powered forex trading bot with comprehensive risk management",
    siteName: "ForexBot Pro",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ForexBot Pro - Professional Trading Platform',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForexBot Pro - Professional Forex Trading Bot",
    description: "Advanced AI-powered forex trading bot with comprehensive risk management",
    creator: "@forexbotpro",
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://forexbot-pro.vercel.app',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0f172a",
          colorInputBackground: "#1e293b",
          colorInputText: "#f1f5f9",
          colorText: "#f8fafc",
          colorTextSecondary: "#94a3b8",
          colorSuccess: "#10b981",
          colorDanger: "#ef4444",
          colorWarning: "#f59e0b",
        },
        elements: {
          formButtonPrimary: 
            "bg-blue-600 hover:bg-blue-700 text-sm normal-case transition-colors duration-200",
          card: "bg-slate-900 border border-slate-700 shadow-lg",
          headerTitle: "text-blue-400 font-semibold",
          headerSubtitle: "text-slate-300",
          formFieldInput: "bg-slate-800 border-slate-600 focus:border-blue-500",
          formFieldLabel: "text-slate-200",
          footerActionLink: "text-blue-400 hover:text-blue-300",
        }
      }}
    >
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#0f172a" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className="antialiased bg-slate-900 text-white min-h-screen">
          <div id="root">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

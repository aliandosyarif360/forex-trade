import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ForexBot Pro - Professional Forex Trading Bot",
  description: "Advanced AI-powered forex trading bot with comprehensive risk management, multiple strategies, and real-time market analysis.",
  keywords: "forex, trading, bot, AI, automated trading, scalping, DCA, grid trading",
  authors: [{ name: "ForexBot Pro Team" }],
  creator: "ForexBot Pro",
  publisher: "ForexBot Pro",
  robots: "index, follow",
  openGraph: {
    title: "ForexBot Pro - Professional Forex Trading Bot",
    description: "Advanced AI-powered forex trading bot with comprehensive risk management",
    type: "website",
    locale: "id_ID",
    siteName: "ForexBot Pro"
  },
  twitter: {
    card: "summary_large_image",
    title: "ForexBot Pro - Professional Forex Trading Bot",
    description: "Advanced AI-powered forex trading bot"
  }
};

export default function RootLayout({ children }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isDemoMode = process.env.DEMO_MODE === 'true';
  const hasValidClerkKey = clerkPublishableKey && 
                           !clerkPublishableKey.includes('demo') && 
                           !clerkPublishableKey.includes('your_actual');

  if (!hasValidClerkKey) {
    console.warn('Clerk authentication not properly configured. Please set up your Clerk keys.');
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#10b981",
          colorBackground: "#0f172a",
          colorText: "#f8fafc",
          colorTextSecondary: "#94a3b8",
          colorInputBackground: "#1e293b",
          colorInputText: "#f8fafc",
          borderRadius: "8px",
        },
        elements: {
          formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
          card: "bg-slate-800 border border-slate-700",
          headerTitle: "text-emerald-400",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton: "bg-slate-700 hover:bg-slate-600 border border-slate-600",
          socialButtonsBlockButtonText: "text-slate-200",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-slate-700 border-slate-600 text-slate-200",
          footerActionLink: "text-emerald-400 hover:text-emerald-300",
        },
      }}
    >
      <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="bg-slate-900 text-slate-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

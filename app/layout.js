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
    type: "website",
    locale: "en_US",
    url: "https://forexbot-pro.vercel.app",
    title: "ForexBot Pro - Professional Forex Trading Bot",
    description: "Advanced AI-powered forex trading bot with comprehensive risk management",
    siteName: "ForexBot Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "ForexBot Pro - Professional Forex Trading Bot",
    description: "Advanced AI-powered forex trading bot with comprehensive risk management",
    creator: "@forexbotpro",
  },
};

export default function RootLayout({ children }) {
  // Check if we're in demo mode
  const isDemoMode = process.env.DEMO_MODE === 'true';
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key is provided, show a demo mode message
  if (!publishableKey || publishableKey.includes('demo')) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-white`}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold text-blue-400 mb-4">ForexBot Pro</h1>
              <p className="text-slate-300 mb-6">
                Demo Mode - Please configure your Clerk and Supabase credentials
              </p>
              <div className="bg-slate-800 p-6 rounded-lg max-w-2xl mx-auto text-left">
                <h2 className="text-xl font-semibold mb-4 text-blue-400">Setup Instructions:</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Create a Clerk account at <a href="https://clerk.com" className="text-blue-400 hover:underline">clerk.com</a></li>
                  <li>Create a Supabase project at <a href="https://supabase.com" className="text-blue-400 hover:underline">supabase.com</a></li>
                  <li>Copy your API keys to <code className="bg-slate-700 px-2 py-1 rounded">.env.local</code></li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0f172a",
          colorInputBackground: "#1e293b",
          colorInputText: "#f1f5f9",
        },
        elements: {
          formButtonPrimary: 
            "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
          card: "bg-slate-900 border border-slate-700",
          headerTitle: "text-blue-400",
          headerSubtitle: "text-slate-300",
        }
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-white`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

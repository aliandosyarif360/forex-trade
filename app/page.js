'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Bot, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Target,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  AlertTriangle
} from 'lucide-react';

export default function Beranda() {
  const { isSignedIn, user } = useUser();
  const [statistik, setStatistik] = useState({
    totalPengguna: 0,
    totalTrade: 0,
    tingkatSukses: 0,
    totalKeuntungan: 0
  });
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if we're in demo mode
    const checkDemoMode = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setIsDemoMode(data.environment?.app?.demoMode || false);
      } catch (error) {
        console.log('Demo mode check failed:', error);
        setIsDemoMode(true);
      }
    };

    checkDemoMode();

    // Simulasi loading statistik
    const timer = setTimeout(() => {
      setStatistik({
        totalPengguna: 15847,
        totalTrade: 3247392,
        tingkatSukses: 92.4,
        totalKeuntungan: 4847392
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const fitur = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Trading Otomatis dengan AI",
      description: "Algoritma canggih menganalisis pola pasar dan menjalankan trade dengan presisi tinggi"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analisis Visual MT5",
      description: "Interface trading visual yang menakjubkan dengan chart MT5 profesional"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Manajemen Risiko Canggih",
      description: "Sistem proteksi otomatis dengan stop loss dan take profit yang cerdas"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Eksekusi Real-time Polygon",
      description: "Koneksi langsung ke Polygon.io dengan eksekusi order super cepat"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Backtesting Akurat",
      description: "Uji strategi trading Anda dengan data historis yang komprehensif"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Monitoring Real-time",
      description: "Pantau performa trading Anda secara real-time dengan dashboard interaktif"
    }
  ];

  const strategiTrading = [
    {
      nama: "Scalping Pro",
      deskripsi: "Strategi trading cepat untuk profit harian konsisten",
      winRate: "89%",
      profitBulanan: "12-18%"
    },
    {
      nama: "Grid Trading",
      deskripsi: "Manfaatkan volatilitas pasar dengan sistem grid otomatis",
      winRate: "85%", 
      profitBulanan: "8-15%"
    },
    {
      nama: "Trend Following",
      deskripsi: "Ikuti tren pasar jangka panjang dengan akurasi tinggi",
      winRate: "78%",
      profitBulanan: "15-25%"
    }
  ];

  // Demo mode warning component
  const DemoWarning = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-8"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <div>
          <h3 className="font-semibold text-yellow-400">Demo Mode Active</h3>
          <p className="text-sm text-yellow-300">
            This is a demo version. Please configure your Clerk and Supabase credentials for full functionality.
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Demo Warning */}
      {isDemoMode && <DemoWarning />}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-900"></div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ForexBot Pro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Platform Trading Forex Canggih dengan AI dan Analisis Real-time
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isSignedIn ? (
                <>
                  <SignUpButton mode="modal">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                      Mulai Trading
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="border border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 rounded-lg font-semibold transition-colors">
                      Masuk
                    </button>
                  </SignInButton>
                </>
              ) : (
                <Link href="/dashboard">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                    Dashboard
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {statistik.totalPengguna.toLocaleString()}+
              </div>
              <div className="text-slate-400">Pengguna Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {statistik.totalTrade.toLocaleString()}+
              </div>
              <div className="text-slate-400">Trade Berhasil</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {statistik.tingkatSukses}%
              </div>
              <div className="text-slate-400">Tingkat Sukses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                ${statistik.totalKeuntungan.toLocaleString()}+
              </div>
              <div className="text-slate-400">Total Profit</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Platform trading forex terlengkap dengan teknologi AI terdepan
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {fitur.map((fitur, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-blue-400 mb-4">
                  {fitur.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {fitur.title}
                </h3>
                <p className="text-slate-300">
                  {fitur.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Strategies */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Strategi Trading
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Pilih strategi yang sesuai dengan gaya trading Anda
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {strategiTrading.map((strategi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-900 p-6 rounded-lg border border-slate-700"
              >
                <h3 className="text-xl font-semibold text-white mb-3">
                  {strategi.nama}
                </h3>
                <p className="text-slate-300 mb-4">
                  {strategi.deskripsi}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Win Rate: {strategi.winRate}</span>
                  <span className="text-blue-400">Profit: {strategi.profitBulanan}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Siap Memulai Trading?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan trader yang telah mempercayai ForexBot Pro
            </p>
            {!isSignedIn ? (
              <SignUpButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                  Daftar Sekarang
                </button>
              </SignUpButton>
            ) : (
              <Link href="/dashboard">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                  Masuk ke Dashboard
                </button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

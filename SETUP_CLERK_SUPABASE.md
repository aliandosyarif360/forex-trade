# Setup Clerk dan Supabase untuk ForexBot Pro

## 📋 Overview

Platform ForexBot Pro menggunakan Clerk untuk autentikasi dan Supabase untuk database. Dokumen ini akan memandu Anda melalui proses setup yang lengkap.

## 🔧 Setup Clerk

### 1. Buat Akun Clerk
1. Kunjungi [clerk.com](https://clerk.com)
2. Klik "Get Started" dan buat akun baru
3. Pilih "Create Application"
4. Beri nama aplikasi: "ForexBot Pro"

### 2. Konfigurasi Clerk
1. Di dashboard Clerk, pilih aplikasi Anda
2. Buka menu "API Keys" di sidebar
3. Copy **Publishable Key** dan **Secret Key**

### 3. Update Environment Variables
Edit file `.env.local` dan ganti nilai demo dengan API keys yang sebenarnya:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

## 🗄️ Setup Supabase

### 1. Buat Project Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Buat akun atau login
4. Klik "New Project"
5. Beri nama: "ForexBot Pro"
6. Pilih region terdekat (Asia Southeast untuk Indonesia)
7. Buat database password yang kuat
8. Klik "Create new project"

### 2. Konfigurasi Supabase
1. Tunggu project selesai dibuat (5-10 menit)
2. Buka menu "Settings" → "API"
3. Copy **Project URL** dan **anon public** key

### 3. Update Environment Variables
Edit file `.env.local` dan ganti nilai demo:

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

## 🗃️ Setup Database Tables

### 1. Buka SQL Editor
1. Di dashboard Supabase, buka menu "SQL Editor"
2. Klik "New query"

### 2. Buat Tables
Jalankan query berikut untuk membuat semua tables yang diperlukan:

```sql
-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading bots table
CREATE TABLE IF NOT EXISTS trading_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  pair TEXT NOT NULL,
  initial_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  total_profit DECIMAL(15,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  max_drawdown DECIMAL(5,2) DEFAULT 0,
  risk_percentage DECIMAL(5,2) DEFAULT 2.0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot performance history
CREATE TABLE IF NOT EXISTS bot_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES trading_bots(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  balance DECIMAL(15,2) NOT NULL,
  profit_loss DECIMAL(15,2) DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  drawdown DECIMAL(5,2) DEFAULT 0
);

-- Trading signals
CREATE TABLE IF NOT EXISTS trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES trading_bots(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'BUY', 'SELL', 'HOLD'
  price DECIMAL(15,5) NOT NULL,
  confidence DECIMAL(5,2) DEFAULT 0,
  executed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error'
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data cache
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  price DECIMAL(15,5) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'polygon'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_bots_user_id ON trading_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_bot_id ON bot_performance(bot_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_bot_id ON trading_signals(bot_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_market_data_pair_timestamp ON market_data(pair, timestamp);
```

### 3. Setup Row Level Security (RLS)
Jalankan query berikut untuk mengamankan data:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Trading bots policies
CREATE POLICY "Users can view own bots" ON trading_bots
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own bots" ON trading_bots
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own bots" ON trading_bots
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can delete own bots" ON trading_bots
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- Bot performance policies
CREATE POLICY "Users can view own bot performance" ON bot_performance
  FOR SELECT USING (bot_id IN (
    SELECT id FROM trading_bots WHERE user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  ));

CREATE POLICY "Users can insert own bot performance" ON bot_performance
  FOR INSERT WITH CHECK (bot_id IN (
    SELECT id FROM trading_bots WHERE user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  ));

-- Trading signals policies
CREATE POLICY "Users can view own signals" ON trading_signals
  FOR SELECT USING (bot_id IN (
    SELECT id FROM trading_bots WHERE user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  ));

CREATE POLICY "Users can insert own signals" ON trading_signals
  FOR INSERT WITH CHECK (bot_id IN (
    SELECT id FROM trading_bots WHERE user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  ));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- Market data is public (read-only)
CREATE POLICY "Anyone can view market data" ON market_data
  FOR SELECT USING (true);
```

## 🔄 Setup Webhooks

### 1. Clerk Webhook
1. Di dashboard Clerk, buka menu "Webhooks"
2. Klik "Add endpoint"
3. URL: `https://your-domain.com/api/webhook/clerk`
4. Pilih events: `user.created`, `user.updated`, `user.deleted`
5. Copy webhook secret

### 2. Update Environment Variables
```env
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🚀 Testing Setup

### 1. Restart Development Server
```bash
npm run dev
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Response yang diharapkan:
```json
{
  "status": "healthy",
  "environment": {
    "clerk": {
      "publishableKey": true,
      "secretKey": true,
      "isDemo": false
    },
    "supabase": {
      "url": true,
      "anonKey": true,
      "serviceRoleKey": true,
      "isDemo": false
    }
  }
}
```

### 3. Test Authentication
1. Buka http://localhost:3000
2. Klik "Sign Up" atau "Sign In"
3. Verifikasi bahwa Anda bisa login/logout

## 🔧 Troubleshooting

### Clerk Issues
- **Error: "The publishableKey passed to Clerk is invalid"**
  - Pastikan API key sudah benar
  - Restart development server

### Supabase Issues
- **Error: "Missing Supabase environment variables"**
  - Pastikan semua environment variables sudah diset
  - Cek format URL dan keys

### Database Issues
- **Error: "relation does not exist"**
  - Jalankan SQL queries untuk membuat tables
  - Pastikan RLS policies sudah dibuat

### General Issues
- **Demo mode masih aktif**
  - Pastikan environment variables tidak mengandung kata "demo"
  - Restart development server

## 📞 Support

Jika mengalami masalah:
1. Cek console browser untuk error messages
2. Cek terminal untuk server logs
3. Pastikan semua environment variables sudah benar
4. Restart development server

## 🎯 Next Steps

Setelah setup selesai:
1. Test semua fitur aplikasi
2. Setup Polygon API untuk data forex real-time
3. Konfigurasi email/SMS notifications
4. Deploy ke production environment
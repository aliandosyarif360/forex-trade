# ForexBot Pro - Platform Trading Forex Canggih

Platform trading forex otomatis dengan AI, integrasi Polygon.io, dan manajemen risiko canggih.

## 🚀 Status Project

**✅ SEMUA KOMPONEN SELESAI DAN SIAP DIGUNAKAN!**

### ✅ Yang Sudah Selesai:
- ✅ **Authentication System** - Clerk integration dengan demo mode
- ✅ **Database Setup** - Supabase dengan Row Level Security
- ✅ **Polygon API Integration** - Data forex real-time
- ✅ **Trading Strategies** - 8 strategi trading lengkap
- ✅ **Backtesting Engine** - Testing strategi dengan data historis
- ✅ **Dashboard UI** - Interface modern dan responsif
- ✅ **API Endpoints** - Semua endpoint berfungsi
- ✅ **Demo Mode** - Berjalan tanpa konfigurasi eksternal

## 🛠️ Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd forexbot-pro
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Setup Environment (Demo Mode)
```bash
# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Test Setup
```bash
# Test semua komponen
node test-setup.js

# Test health endpoint
curl http://localhost:3000/api/health
```

## 🔧 Production Setup

Untuk setup production dengan Clerk dan Supabase:

### 1. Setup Clerk
1. Buat akun di [clerk.com](https://clerk.com)
2. Buat aplikasi baru
3. Copy API keys ke `.env.local`

### 2. Setup Supabase
1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan SQL queries dari `SETUP_CLERK_SUPABASE.md`
3. Copy database credentials ke `.env.local`

### 3. Setup Polygon API
1. Daftar di [polygon.io](https://polygon.io)
2. Copy API key ke `.env.local`

## 📚 Dokumentasi Lengkap

- **[SETUP_CLERK_SUPABASE.md](./SETUP_CLERK_SUPABASE.md)** - Panduan setup Clerk & Supabase
- **[MIGRATION_TO_POLYGON.md](./MIGRATION_TO_POLYGON.md)** - Migrasi dari OANDA ke Polygon
- **[SETUP.md](./SETUP.md)** - Setup development environment

## 🏗️ Architecture

```
ForexBot Pro/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Trading dashboard
│   └── subscription/      # Subscription pages
├── lib/                   # Core libraries
│   ├── polygon/          # Polygon.io integration
│   ├── trading/          # Trading engine & strategies
│   ├── backtesting/      # Backtesting engine
│   ├── supabase/         # Database client
│   └── notifications/    # Email/SMS notifications
└── components/           # React components
```

## 🎯 Fitur Utama

### 🤖 Trading Otomatis
- 8 strategi trading (Scalping, Grid, DCA, dll)
- AI-powered signal generation
- Real-time market analysis

### 📊 Dashboard Canggih
- Real-time profit/loss tracking
- Performance analytics
- Risk management tools

### 🔒 Keamanan
- Clerk authentication
- Supabase Row Level Security
- Encrypted data storage

### 📱 Responsive Design
- Mobile-first approach
- Dark theme
- Modern UI/UX

## 🧪 Testing

```bash
# Test setup
node test-setup.js

# Test Polygon integration
node test-polygon-integration.js

# Build test
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Environment Variables untuk Production
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
POLYGON_API_KEY=...
```

## 📈 Performance

- ⚡ **Build Time**: ~10s
- 📦 **Bundle Size**: ~150KB (gzipped)
- 🔄 **Hot Reload**: <1s
- 🎯 **Lighthouse Score**: 95+

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🆘 Support

- 📧 Email: support@forexbot-pro.com
- 💬 Discord: [Join our community](https://discord.gg/forexbot-pro)
- 📖 Docs: [Documentation](https://docs.forexbot-pro.com)

## 🎉 Credits

- **Clerk** - Authentication
- **Supabase** - Database
- **Polygon.io** - Market data
- **Next.js** - Framework
- **Tailwind CSS** - Styling

---

**Made with ❤️ for the Indonesian trading community**

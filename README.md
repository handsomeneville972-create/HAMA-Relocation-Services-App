# 🏠 HAMA™ — Find. Move. Belong.

HAMA is a full-stack mobile platform that connects house seekers with verified rental properties, trusted service providers, furniture marketplaces, and relocation support — all in one app. Built with React Native (Expo) and Supabase.

> **📱 Currently in Early Access** — All premium features are available at no cost during our Founding Member Program.

## Features

### 🏘️ Property Discovery
- Browse verified rental listings across 30+ Nairobi neighborhoods
- Interactive property search with advanced filters
- Save favorites, compare options, view nearby amenities
- AI-powered recommendations

### 🚚 Hamisha Squad — Relocation Services
- Furniture transportation and moving assistance
- Loading/unloading support
- Scheduled moving services with cost estimates

### 🛋️ Marketplace
- Furniture, appliances, electronics, and home essentials
- Verified sellers with ratings and reviews
- Direct messaging between buyers and sellers

### 🔧 Service Providers
- Plumbers, electricians, cleaners, painters, and more
- Verified providers with ratings and availability
- Direct booking and messaging

### 👥 Community
- Share housing tips, experiences, and neighborhood reviews
- Connect with other community members
- Upvote helpful content

### 🎓 Student Housing
- Affordable rentals near universities
- Student starter packs and dorm essentials
- Budget planning tools

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| **React Native (Expo)** | Cross-platform mobile app |
| **TypeScript** | Type-safe development |
| **Supabase** | Backend — Postgres DB, Auth, RLS |
| **expo-router** | File-based navigation |
| **expo-linear-gradient** | Premium UI effects |
| **react-native-reanimated** | Smooth animations |

## 📁 Project Structure

```
HAMA/
├── app/                  # Expo Router pages
│   ├── (tabs)/           # Bottom tab navigation
│   └── *.tsx             # Stack screens
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/           # App configuration
│   ├── constants/        # Theme, types, data
│   ├── contexts/         # React contexts (Auth, Early Access)
│   ├── hooks/            # Custom hooks
│   ├── screens/          # Screen components
│   ├── services/         # API and data services
│   └── utils/            # Helpers (analytics, currency, etc.)
├── supabase/
│   └── migrations/       # Database schema migrations
└── assets/               # Images, fonts, icons
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase project (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hama.git
cd hama

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase project credentials
```

### Environment Variables

Create a `.env` file (see `.env.example` for the template):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Never commit this!
```

### Run Database Migrations

```bash
node scripts/run-migrations.js
```

Or paste the SQL files from `supabase/migrations/` into your Supabase SQL Editor (in order).

### Start the App

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## 🧪 Testing

```bash
npm test
```

Runs Jest tests located in `src/**/__tests__/`.

## 🗄️ Database Schema

Migrations are in `supabase/migrations/` and should be applied in order:

| Migration | Description |
|---|---|
| `20240620000001` | Initial schema — profiles, audit logs, RLS |
| `20240620000002` | Data tables — properties, products, services, etc. |
| `20240620000003` | Seed data for development |
| `20240620000004` | Early access features — waitlist, referrals, email |
| `20240620000005` | Feature request portal |

## 🔐 Security

- Row Level Security (RLS) is enabled on all tables
- Supabase policies restrict data access per user role
- Service role key is never exposed to the client
- API keys are stored in `.env` (never committed)
- Authentication via Supabase Auth (email/password)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) (coming soon).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📬 Contact

HAMA™ Team — [hello@hama.app](mailto:hello@hama.app)

---

<p align="center">
  Made with ❤️ in Nairobi, Kenya 🇰🇪
</p>

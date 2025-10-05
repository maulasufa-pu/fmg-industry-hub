# FMG Industry Hub 🎵

**Beyond Sound. Built-in Intelligence.**

A comprehensive music industry platform connecting artists, labels, and music professionals with Flemmo Music Global's end-to-end services. From creation to distribution, we provide one operating system for the entire music business.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

## ✨ Features

### 🎼 **Music Production Services**
- Songwriting, composition, and arrangement
- Professional recording, mixing, and mastering
- Audio post-production for film, ads, and games
- Remote and in-studio workflow management

### 📄 **Publishing & Distribution**
- Copyright registration and licensing
- Digital distribution to all major DSPs
- Metadata optimization and quality control
- Rights management and royalty tracking

### 💼 **Business Development**
- Marketing and promotional campaigns
- Artist branding and image development
- Partnership and sponsorship opportunities
- Data-driven monetization strategies

### 🛠 **Technology Stack**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel-ready with edge functions
- **Payments**: Multi-currency support (USD, IDR, EUR, GBP)
- **Real-time**: Chat system and live collaboration tools

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/maulasufa-pu/fmg-industry-hub.git
cd fmg-industry-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 Documentation

- **[📋 Installation Guide](INSTALLER_GUIDE.md)** - Complete setup and deployment instructions
- **[📚 User Manual](USER_MANUAL.md)** - End-user documentation and feature guides

## 🏗 Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── admin/          # Admin dashboard pages
│   ├── client/         # Client dashboard pages
│   ├── api/            # API routes
│   └── ui/             # Shared UI components
├── components/         # Reusable React components
├── lib/                # Utility libraries and configurations
├── hooks/              # Custom React hooks
└── utils/              # Helper functions
```

## 🔐 User Roles

- **Client**: Project creation, service access, file management
- **Admin**: User management, project oversight, analytics
- **Owner**: Full system access, configuration, security

## 🌍 Multi-Currency Support

- USD (United States Dollar)
- IDR (Indonesian Rupiah)
- EUR (Euro)
- GBP (British Pound Sterling)

## 🛡 Security Features

- Row Level Security (RLS) with Supabase
- Role-based access control
- Secure file upload/download
- Audit logging and activity tracking

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Manual Deployment
See [INSTALLER_GUIDE.md](INSTALLER_GUIDE.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Email**: hello@flemmomusic.com
- **Documentation**: Check our user manual and installation guide
- **Issues**: Report bugs via GitHub Issues

## 📄 License

This project is proprietary software owned by Flemmo Music Global (FMG Universe).

---

**Flemmo Music Global Universe** - Uniting creation, talent, distribution, publishing, and education into one connected pipeline.

*Built with ❤️ for the global music community*

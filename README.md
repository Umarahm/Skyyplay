# 🎬 SkyyPlay - Free Movies & TV Shows

> Click, watch, enjoy. SkyyPlay breaks down the paywall, ensuring that quality content is accessible to everyone.

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-Ready-green)](https://web.dev/progressive-web-apps/)

## ✨ Features

### 🎯 Core Features
- 🎬 **Browse Movies & TV Shows** - Discover trending, popular, and top-rated content
- 🔍 **Advanced Search** - Find content by title, genre, year, rating, and more
- 📱 **Progressive Web App** - Install on any device for native app-like experience
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 📺 **Live Sports** - Watch live sports events and matches
- ⚡ **Fast Performance** - Optimized with caching, image optimization, and code splitting

### 🚀 Performance Optimizations
- **API Caching** - Smart caching layer for TMDB API requests (5-minute TTL)
- **Image Optimization** - Next.js Image component with WebP/AVIF support and lazy loading
- **Bundle Optimization** - Code splitting and optimized package imports
- **Security Headers** - Comprehensive security headers and CSP
- **Service Worker** - Offline support and background caching

### 📱 PWA Features
- **Installable** - Add to home screen on any device
- **Offline Support** - Browse cached content without internet
- **App Shortcuts** - Quick access to Search and Live Sports
- **Native Feel** - Standalone display mode with proper theming

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.2.4** - React framework with SSR and app router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 3.4.17** - Utility-first CSS framework

### UI Components
- **Radix UI** - Accessible, unstyled components
- **Lucide React** - Beautiful icons
- **Embla Carousel** - Smooth carousels and sliders

### Data & APIs
- **TMDB API** - Movie and TV show metadata
- **Custom Caching Layer** - Performance optimization
- **Environment Variables** - Secure API key management

### Analytics & Monitoring
- **Vercel Analytics** - Performance and usage analytics
- **Vercel Speed Insights** - Core Web Vitals monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- TMDB API key (free at [themoviedb.org](https://www.themoviedb.org/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/skyyplay.git
   cd skyyplay
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your TMDB API key to `.env.local`:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit the site in Chrome or Edge
2. Click the install button in the address bar
3. Follow the installation prompts

### Mobile (iOS/Android)
1. Open the site in Safari (iOS) or Chrome (Android)
2. Tap the share button
3. Select "Add to Home Screen"

## 🏗️ Project Structure

```
skyyplay/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── search/           # Search page
│   ├── watch/            # Watch page
│   ├── livesports/       # Live sports page
│   └── settings/         # Settings page
├── components/           # Reusable components
│   ├── ui/              # UI components (Radix)
│   ├── ContentCard.tsx  # Movie/TV show cards
│   └── Navbar.tsx       # Navigation bar
├── lib/                 # Utility libraries
│   ├── tmdb.ts         # TMDB API client
│   └── utils.ts        # Utility functions
├── public/             # Static assets
│   ├── manifest.json   # PWA manifest
│   ├── sw.js          # Service worker
│   └── icons/         # App icons
└── styles/            # Additional styles
```

## 🔧 Configuration

### Environment Variables
```env
# TMDB API Configuration (Server-side only for security)
TMDB_API_KEY=your_api_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
```

### PWA Configuration
The PWA configuration is in `public/manifest.json` and includes:
- App name and description
- Icons for different sizes
- Theme colors
- Display mode
- App shortcuts

## 🎨 Customization

### Themes
The app uses CSS custom properties for theming. Main colors:
- Primary: `#A855F7` (Purple)
- Background: `#000000` (Black)
- Text: `#FFFFFF` (White)

### Adding New Content Sources
1. Create a new API client in `lib/`
2. Add the new source to content fetching functions
3. Update TypeScript interfaces if needed

## 📈 Performance

### Core Web Vitals
- **LCP**: < 2.5s (optimized images and caching)
- **FID**: < 100ms (minimal JavaScript)
- **CLS**: < 0.1 (stable layouts)

### Optimization Features
- Image optimization with WebP/AVIF
- API response caching (5-minute TTL)
- Code splitting and lazy loading
- Service worker for offline support
- Compression and security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for type safety
- Follow existing code style and conventions
- Add proper error handling
- Test on different devices and browsers
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for the comprehensive movie and TV data
- [Vercel](https://vercel.com/) for hosting and analytics
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

## 📧 Contact

**Umar Ahmed** - [GitHub](https://github.com/your-username)

Project Link: [https://github.com/your-username/skyyplay](https://github.com/your-username/skyyplay)

---

<div align="center">
  <strong>Made with ❤️ for the community</strong>
  <br>
  <sub>Breaking down paywalls, one stream at a time</sub>
</div>

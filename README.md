# 🏥 Lief Clock-In App

> **Healthcare Shift Management System** - A modern, responsive web application for healthcare workers to track their shifts with location-based clock-in/out functionality.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Auth0](https://img.shields.io/badge/Auth0-Secured-orange?logo=auth0)](https://auth0.com/)

## 📋 Project Overview

**Lief Clock-In App** is a comprehensive shift management solution designed specifically for healthcare environments. It provides secure, location-aware time tracking with role-based access control for employees and managers.

### 🎯 **Core Features**

- **🔐 Secure Authentication** - Auth0 integration with role-based access (Employee/Manager)
- **📍 Location-Based Clock-In** - GPS verification within office perimeter
- **📱 Progressive Web App** - Installable, offline-capable mobile experience
- **⚡ Real-time Updates** - Live shift tracking and office status management
- **🎨 Responsive Design** - Optimized for all devices and screen sizes
- **🔔 Smart Notifications** - Automatic alerts for location-based events (PWA only)

### 🏗️ **Technical Architecture**

```
Frontend (Next.js 15 + React 19)
├── App Router with Server/Client Components
├── Ant Design UI Framework
├── Custom Hooks for State Management
└── PWA with Service Worker

Backend (Next.js API Routes)
├── RESTful API Design
├── Prisma ORM with PostgreSQL
├── Auth0 Session Management
└── Role-based Route Protection

Infrastructure
├── Vercel Deployment Ready
├── Database Migrations
└── Environment Configuration
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Auth0 account (for authentication)
- PostgreSQL database (or SQLite for development)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shifter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Auth0 Configuration
   AUTH0_SECRET=your-auth0-secret
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/shifter"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with your Auth0 credentials
   - Role assignment is automatic based on email patterns

## 👥 User Roles & Access

### **Employee Access**
- Clock in/out with location verification
- View personal shift history
- Receive location-based notifications (PWA)
- Mobile-optimized interface

### **Manager Access**
- All employee features
- Office status control (open/close)
- View all employee shifts
- Shift management and reporting
- Perimeter configuration

## 🛠️ Technology Stack

### **Frontend Technologies**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **Ant Design 5** - Professional UI component library
- **CSS3** - Modern styling with Flexbox/Grid
- **PWA** - Service Worker, Web App Manifest

### **Backend Technologies**
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Production database
- **Auth0** - Authentication and authorization
- **JWT** - Secure session management

### **Development Tools**
- **ESLint** - Code linting and formatting
- **Prisma Studio** - Database management
- **Vercel** - Deployment platform
- **Git** - Version control

## 📱 Progressive Web App Features

### **PWA Capabilities**
- **Installable** - Add to home screen on mobile devices
- **Offline Support** - Cached content works without internet
- **Location Monitoring** - Automatic office perimeter detection
- **Push Notifications** - Location-based alerts
- **App-like Experience** - Native mobile app feel

### **Location Features** (PWA Only)
- Continuous location monitoring while app is active
- Automatic notifications when entering/leaving office
- Geofence validation for clock-in/out
- Battery-efficient location tracking

## 🔒 Security Implementation

### **Authentication & Authorization**
- OAuth 2.0 / OpenID Connect via Auth0
- Secure session management with httpOnly cookies
- Role-based access control (RBAC)
- Protected API routes with middleware

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection (React built-in escaping)
- CSRF protection for state changes
- Secure environment variable handling

## 📊 Database Schema

```prisma
model User {
  id            String  @id
  email         String? @unique
  name          String?
  role          String?
  emailVerified Boolean @default(false)
  shifts        Shift[]
}

model Shift {
  id           String @id
  userId       String
  user         User   @relation(fields: [userId], references: [id])
  clockInAt    BigInt
  clockInLat   Float?
  clockInLng   Float?
  clockInNote  String?
  clockOutAt   BigInt?
  clockOutLat  Float?
  clockOutLng  Float?
  clockOutNote String?

  @@index([userId, clockInAt])
}

model OfficeStatus {
  id          String  @id @default("office")
  isActive    Boolean @default(false)
  activatedBy String?
  activatedAt BigInt?
  updatedAt   BigInt  @default(0)
}

model Setting {
  key   String @id
  value String
}
```

## 🎨 UI/UX Design

### **Design Principles**
- **Mobile-First** - Responsive design starting from mobile
- **Accessibility** - WCAG 2.1 compliant interface
- **Intuitive Navigation** - Clear user flows and interactions
- **Professional Aesthetics** - Healthcare-appropriate styling

### **Key UI Components**
- Responsive navigation with mobile hamburger menu
- Location-aware clock-in/out buttons
- Real-time shift status indicators
- Manager dashboard with office controls
- Mobile-optimized forms and inputs

## 🚀 Deployment

### **Production Deployment**
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

3. **Configure Environment Variables**
   - Set production Auth0 credentials
   - Configure production database URL
   - Update base URLs for production

### **Environment Configuration**
- **Development** - SQLite database, local Auth0
- **Production** - PostgreSQL, production Auth0
- **PWA** - Disabled in development, enabled in production

## 📈 Performance Optimizations

### **Frontend Optimizations**
- Code splitting with Next.js automatic optimization
- Image optimization with Next.js Image component
- Font optimization with Google Fonts display swap
- Bundle analysis and tree shaking

### **Backend Optimizations**
- Database query optimization with Prisma
- API response caching strategies
- Efficient session management
- Connection pooling for database

### **PWA Optimizations**
- Service Worker caching strategies
- Offline-first architecture
- Background sync capabilities
- Efficient location tracking

## 🧪 Testing Strategy

### **Testing Approach**
- **Unit Tests** - Component and utility function testing
- **Integration Tests** - API route and database testing
- **E2E Tests** - Full user flow testing
- **Performance Tests** - Core Web Vitals monitoring

### **Quality Assurance**
- ESLint for code quality
- TypeScript for type safety
- Prisma for database type safety
- Auth0 for security best practices

## 📚 Documentation

- **[LEARNING_GUIDE.md](./LEARNING_GUIDE.md)** - Comprehensive technical documentation
- **[HUMANIZATION_CHECKLIST.md](./HUMANIZATION_CHECKLIST.md)** - Code review and best practices
- **API Documentation** - Available in `/api` route files
- **Database Schema** - Documented in `prisma/schema.prisma`

## 🤝 Contributing

This project follows standard development practices:
- Feature branch workflow
- Code review process
- Automated testing
- Documentation updates

## 📄 License

This project is developed for educational and demonstration purposes.

---

## 🎯 Project Highlights

### **Technical Achievements**
- ✅ Modern full-stack architecture with Next.js 15
- ✅ Secure authentication with Auth0 integration
- ✅ Progressive Web App with offline capabilities
- ✅ Location-based features with geofencing
- ✅ Responsive design for all devices
- ✅ Production-ready deployment configuration

### **Business Value**
- ✅ Solves real healthcare shift management problems
- ✅ Improves accuracy with location verification
- ✅ Reduces administrative overhead
- ✅ Provides mobile-first user experience
- ✅ Ensures data security and compliance

### **Development Quality**
- ✅ Clean, maintainable code architecture
- ✅ Comprehensive error handling
- ✅ Performance optimizations
- ✅ Security best practices
- ✅ Scalable database design

---

## 🔧 Authentication Notes

This project uses a lightweight custom Auth0 Authorization Code flow (see `src/lib/auth.js`) that stores an HMAC-signed session cookie.

### **Single Sign-On Behavior**
After a normal logout (`/api/auth/logout`) Auth0 may still remember the last user in the browser session and automatically log them back in.

**To fully sign out (clear Auth0 SSO session):**
- Visit `/api/auth/logout?sso=1` (BASE_URL must be in Auth0 Allowed Logout URLs)

**To force the login form for switching users:**
- Visit `/api/auth/login?prompt=login` (or `/api/auth/login?force=1`)

These query parameters add `prompt=login` to the /authorize URL so credentials are requested again.

---

**Built with ❤️ for healthcare workers who deserve better tools.**
```

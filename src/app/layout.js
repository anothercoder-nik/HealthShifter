import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootStyleRegistry from "./RootStyleRegistry";
import PerformanceMonitor from "../components/PerformanceMonitor";
import PWAInstallPrompt from "../components/PWAInstallPrompt";

// Font loading optimization
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata = {
  title: "Lief Clock-In App",
  description: "Healthcare worker shift tracking and attendance management app",
  keywords: "healthcare, shift tracking, attendance, time clock, employee management",
  authors: [{ name: "Lief Team" }],
  creator: "Lief",
  publisher: "Lief",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lief Clock-In",
  },
  applicationName: "Lief Clock-In App",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://dev-luvdf3mdj35w8xeb.us.auth0.com"
          crossOrigin="anonymous"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Colors */}
        <meta name="theme-color" content="#1890ff" />
        <meta name="msapplication-TileColor" content="#1890ff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lief Clock-In" />
        <link rel="apple-touch-icon" href="/icons/android-launchericon-192-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/android-launchericon-192-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/android-launchericon-512-512.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-launchericon-192-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/android-launchericon-512-512.png" />
        <link rel="shortcut icon" href="/icons/android-launchericon-192-192.png" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icons/android-launchericon-192-192.png" />
        <meta name="msapplication-square70x70logo" content="/icons/android-launchericon-192-192.png" />
        <meta name="msapplication-square150x150logo" content="/icons/android-launchericon-192-192.png" />
        <meta name="msapplication-wide310x150logo" content="/icons/android-launchericon-512-512.png" />
        <meta name="msapplication-square310x310logo" content="/icons/android-launchericon-512-512.png" />

        {/* Prevent zoom on iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RootStyleRegistry>
          {children}
          <PWAInstallPrompt />
        </RootStyleRegistry>
        <PerformanceMonitor />
      </body>
    </html>
  );
}

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
  description: "Healthcare worker shift tracking app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lief Clock-In",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1890ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/android-launchericon-192-192.png" />
        <link rel="icon" href="/icons/android-launchericon-192-192.png" />
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

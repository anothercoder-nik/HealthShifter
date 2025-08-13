import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootStyleRegistry from "./RootStyleRegistry";
import PerformanceMonitor from "../components/PerformanceMonitor";

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
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RootStyleRegistry>
          {children}
        </RootStyleRegistry>
        <PerformanceMonitor />
      </body>
    </html>
  );
}

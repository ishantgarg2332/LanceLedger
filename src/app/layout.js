import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LanceLedger | Premium Invoice & Expense Tracker",
  description: "Manage your freelance business with ease.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex bg-background text-foreground`}
      >
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto max-h-screen p-8 bg-background relative selection:bg-primary/20">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

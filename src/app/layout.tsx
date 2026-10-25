import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider/ThemeProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "../components/AuthProvider";
import { Inter } from "next/font/google";
import { getCurrentReleaseNotes } from "@/server/releaseNotes";

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-inter",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const releaseNotes = await getCurrentReleaseNotes();

  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#181818" />
      </head>
      <body>
        <AntdRegistry>
          <AuthProvider>
            <ThemeProvider releaseNotes={releaseNotes}>{children}</ThemeProvider>
          </AuthProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

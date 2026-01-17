import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider/ThemeProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "../components/AuthProvider";

import { cookies } from "next/headers";
import { type Mode } from "../components/ThemeProvider/ThemeProvider";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("ui-theme")?.value as Mode) || "light";

  return (
    <html lang="ru" className={theme}>
      <head />
      <body>
        <AntdRegistry>
          <AuthProvider>
            <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
          </AuthProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

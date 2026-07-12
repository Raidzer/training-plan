import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider/ThemeProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "../components/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#181818" />
      </head>
      <body>
        <AntdRegistry>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

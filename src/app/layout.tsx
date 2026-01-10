import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider/ThemeProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

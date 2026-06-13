import { TelegramToolsNavigation } from "./TelegramToolsClient/components/TelegramToolsNavigation/TelegramToolsNavigation";

export default function TelegramToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TelegramToolsNavigation />
      {children}
    </>
  );
}

import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmailVerificationBanner />
      {children}
    </>
  );
}

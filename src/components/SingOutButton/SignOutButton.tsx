"use client";

import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { signOut } from "next-auth/react";
import { useTransition } from "react";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <Button
      className={className ?? ""}
      size="large"
      icon={<LogoutOutlined aria-hidden />}
      loading={isPending}
      disabled={isPending}
      aria-busy={isPending}
      onClick={handleSignOut}
    >
      Выйти
    </Button>
  );
}

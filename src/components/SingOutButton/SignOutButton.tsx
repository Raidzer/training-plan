"use client";
import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <Button icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: "/login" })}>
      Выйти
    </Button>
  );
}

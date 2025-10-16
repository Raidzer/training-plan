"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("you@example.com");
  const [password, setPassword] = useState("password123");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = new URLSearchParams({
      email,
      password,
      callbackUrl: "/dashboard",
      json: "true",
    });
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (res.ok) window.location.href = "/dashboard";
    else alert("Ошибка входа");
  };

  return (
    <main>
      <h1>Вход</h1>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, maxWidth: 320 }}
      >
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button>Войти</button>
      </form>
    </main>
  );
}

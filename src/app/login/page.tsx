"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("you@example.com");
  const [password, setPassword] = useState("password123");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (res?.error) {
      console.log(res.error);
      alert("Login failed");
      return;
    }
    router.push(res?.url ?? "/dashboard");
  };

  return (
    <main>
      <h1>Login</h1>
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
        <button>Sign in</button>
      </form>
    </main>
  );
}

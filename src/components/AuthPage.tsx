"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engine/authStore";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, loading, error, refresh, login, register } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  return (
    <div className="pixel-ui crt jitter relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06071a] via-[#05060a] to-[#0b0d24]" />
      <div className="relative z-10 flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-sm border border-white/10 bg-black/20 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          <div className="mb-1 text-[11px] text-zinc-200/70">MISTERY ACCOUNT</div>
          <div className="text-[20px] text-zinc-100/90">{mode === "login" ? "Login" : "Register"}</div>

          <div className="mt-4 space-y-3">
            <label className="block text-[11px] text-zinc-200/70">
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-9 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
                spellCheck={false}
              />
            </label>
            <label className="block text-[11px] text-zinc-200/70">
              Password
              <input
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-9 w-full rounded-[2px] border border-white/10 bg-black/20 px-2 text-[12px] text-zinc-100 outline-none focus:border-[color:var(--accent)]/60"
              />
            </label>

            {error && (
              <div className="rounded-[2px] border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 p-2 text-[12px] text-zinc-100/90">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              className="h-9 w-full rounded-[2px] border border-white/10 bg-[color:var(--ui-2)] px-3 text-[12px] hover:border-white/20 disabled:opacity-50"
              onClick={async () => {
                if (mode === "login") await login(email, password);
                else await register(email, password);
              }}
            >
              {mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
            </button>

            <div className="text-[12px] text-zinc-200/70">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <Link className="text-[color:var(--accent)]" href="/register">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link className="text-[color:var(--accent)]" href="/login">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


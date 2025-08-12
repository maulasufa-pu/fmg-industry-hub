"use client";

import React, { useState } from "react";
import { Apple, Google, Twitter } from "@/icons";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export function SignUpSection() {
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  const social = [
    { name: "Google", icon: Google, provider: "google" as const },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!agree) return setErr("Please accept terms & conditions.");
    setLoading(true);
    try {
      const supabase = getSupabaseClient(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });
      if (error) throw error;

      // Kalau project-mu butuh email confirm, session = null -> suruh cek email
      if (!data.session) {
        setMsg("We’ve sent a confirmation link to your email. Please verify to continue.");
      } else {
        // auto login -> langsung ke dashboard
        router.push("/client/dashboard");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    setErr(null); setMsg(null);
    const supabase = getSupabaseClient(true);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?flow=signup` },
    });
  };

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-lg lg:max-w-xl items-center gap-5 px-6 sm:px-7 md:px-8 py-6 sm:py-8 bg-defaultwhite border border-coolgray-20 rounded-xl">
      <header className="flex flex-col items-center gap-2 self-stretch w-full">
        <h1 className="font-heading-2 text-coolgray-90 text-[length:var(--heading-2-font-size)] leading-[var(--heading-2-line-height)] text-center">
          Sign Up Free
        </h1>
        <p className="font-body-l text-coolgray-90 text-center">Please insert your credentials</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-6 self-stretch w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="font-body-s text-coolgray-90">First Name</label>
            <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
              <input
                className="flex-1 font-body-m text-coolgray-60 bg-transparent border-0 p-0 focus:outline-none"
                value={firstName}
                onChange={(e)=>setFirst(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-body-s text-coolgray-90">Last Name</label>
            <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
              <input
                className="flex-1 font-body-m text-coolgray-60 bg-transparent border-0 p-0 focus:outline-none"
                value={lastName}
                onChange={(e)=>setLast(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-body-s text-coolgray-90">Email</label>
          <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
            <input
              type="email"
              className="flex-1 font-body-m text-coolgray-60 bg-transparent border-0 p-0 focus:outline-none"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-body-s text-coolgray-90">Password</label>
          <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
            <input
              type="password"
              className="flex-1 font-body-m text-coolgray-60 bg-transparent border-0 p-0 focus:outline-none"
              value={password}
              onChange={(e)=>setPass(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e)=>setAgree(e.target.checked)}
            className="sr-only"
          />
          <span className="inline-block w-4 h-4 border border-coolgray-30 bg-white" aria-hidden />
          <span className="font-body-s text-coolgray-90">I accept terms &amp; conditions</span>
        </label>

        <button
          type="submit"
          disabled={loading || !agree}
          className="flex h-12 items-center justify-center w-full bg-primary-60 border-2 border-primary-60 hover:bg-primary-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-60 focus-visible:ring-offset-2 transition-colors text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="font-button-m">{loading ? "Creating account..." : "Sign Up"}</span>
        </button>

        {err && <p className="text-[13px] text-red-600 text-center">{err}</p>}
        {msg && <p className="text-[13px] text-primary-90 text-center">{msg}</p>}

        <hr className="w-full h-px bg-coolgray-20 border-0 mt-2" />
      </form>

      <section className="flex flex-col items-center gap-4 self-stretch w-full">
        <p className="font-body-m text-coolgray-90 text-center">Or sign up with:</p>
        <div className="flex gap-2 w-full">
          {social.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.provider}
                type="button"
                onClick={() => handleOAuth(s.provider)}
                className="flex h-12 items-center justify-center px-3 py-4 flex-1 border-2 border-primary-60 hover:bg-primary-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-60 focus-visible:ring-offset-2 transition-colors"
              >
                <Icon className={`!w-6 !h-6}`} />
                <span className="font-button-m text-primary-60 px-3">{s.name}</span>
              </button>
            );
          })}
        </div>

        <p className="font-body-s text-primary-90">
          Already have an account?{" "}
          <a href="/login" className="underline">Log in</a>
        </p>
      </section>
    </div>
  );
}

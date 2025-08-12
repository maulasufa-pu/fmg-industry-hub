"use client";

import React, { useState } from "react";
import { Apple, Controls, Google, Twitter } from "@/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client"; // pastikan file ini ada seperti instruksi sebelumnya
import sep from "../icons/Sep.svg";

export const LoginSection = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const qp = useSearchParams();
  const redirectedFrom = qp.get("redirectedFrom") || "/client/dashboard";

  const socialLoginOptions = [
    { name: "Google", icon: Google, provider: "google" as const },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      router.push(redirectedFrom);
    } catch (e: unknown) {                  // ⬅️ was: any
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (
    provider: "google"
  ) => {
    setErr(null);
    const supabase = getSupabaseClient(); // OAuth sebaiknya persist
    const redirectTo = `${window.location.origin}/auth/callback?flow=login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) setErr(error.message);
  };

  const msg = qp.get("m");
  {msg === "please_signup_with_google_first" && (
    <p className="text-xs text-red-600 text-center">Please sign up with Google first.</p>
  )}


  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-lg lg:max-w-xl items-center gap-5 px-6 sm:px-7 md:px-8 py-6 sm:py-8 bg-defaultwhite border border-coolgray-20 rounded-xl">
      <header className="flex flex-col items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
          <h1 className="relative self-stretch mt-[-1.00px] font-heading-2 font-[number:var(--heading-2-font-weight)] text-coolgray-90 text-[length:var(--heading-2-font-size)] text-center tracking-[var(--heading-2-letter-spacing)] leading-[var(--heading-2-line-height)] [font-style:var(--heading-2-font-style)]">
            Welcome Back
          </h1>
        </div>

        <p className="relative self-stretch font-body-l font-[number:var(--body-l-font-weight)] text-coolgray-90 text-[length:var(--body-l-font-size)] text-center tracking-[var(--body-l-letter-spacing)] leading-[var(--body-l-line-height)] [font-style:var(--body-l-font-style)]">
          Please log in to continue
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 pt-6 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto]"
      >
        <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
            <label
              className="relative self-stretch mt-[-1.00px] font-body-s font-[number:var(--body-s-font-weight)] text-coolgray-90 text-[length:var(--body-s-font-size)] tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] [font-style:var(--body-s-font-style)]"
              htmlFor="email-input"
            >
              Email Address
            </label>

            <div className="flex h-12 items-center gap-2 px-4 py-3 relative self-stretch w-full bg-coolgray-10 border-b [border-bottom-style:solid] border-coolgray-30">
              <input
                className="relative flex-1 font-body-m font-[number:var(--body-m-font-weight)] text-coolgray-60 text-[length:var(--body-m-font-size)] tracking-[var(--body-m-letter-spacing)] leading-[var(--body-m-line-height)] [font-style:var(--body-m-font-style)] [background:transparent] border-[none] p-0 focus:outline-none"
                id="email-input"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-describedby="email-help"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
            <label
              className="relative self-stretch mt-[-1.00px] font-body-s font-[number:var(--body-s-font-weight)] text-coolgray-90 text-[length:var(--body-s-font-size)] tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] [font-style:var(--body-s-font-style)]"
              htmlFor="password-input"
            >
              Password
            </label>

            <div className="flex h-12 items-center gap-2 px-4 py-3 relative self-stretch w-full bg-coolgray-10 border-b [border-bottom-style:solid] border-coolgray-30">
              <input
                className="relative flex-1 font-body-m font-[number:var(--body-m-font-weight)] text-coolgray-60 text-[length:var(--body-m-font-size)] tracking-[var(--body-m-letter-spacing)] leading-[var(--body-m-line-height)] [font-style:var(--body-m-font-style)] [background:transparent] border-[none] p-0 focus:outline-none"
                id="password-input"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby="password-help"
              />
            </div>
          </div>

          <p
            id="password-help"
            className="relative self-stretch font-body-XS font-[number:var(--body-XS-font-weight)] text-coolgray-60 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] [font-style:var(--body-XS-font-style)]"
          >
            It must be a combination of minimum 8 letters, numbers, and symbols.
          </p>
        </div>

        <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="sr-only"
          />
          
          {/* Icon berubah sesuai state */}
          <div className="w-5 h-5 flex items-center justify-center border border-coolgray-40 rounded-sm bg-white">
            {rememberMe && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-primary-60"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-4.25-4.25a1 1 0 111.414-1.414L8 12.586l7.543-7.543a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <span className="font-body-s text-coolgray-90">Remember me</span>
        </label>

          <button
            type="button"
            className="relative flex-1 mt-[-1.00px] font-body-s font-[number:var(--body-s-font-weight)] text-primary-90 text-[length:var(--body-s-font-size)] text-right tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] [font-style:var(--body-s-font-style)] bg-transparent border-none cursor-pointer hover:underline focus:outline-none focus:underline"
            onClick={() => console.log("Forgot password clicked")}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 items-center justify-center w-full bg-primary-60 border-2 border-primary-60 hover:bg-primary-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-60 focus-visible:ring-offset-2 transition-colors text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="font-button-m">{loading ? "Signing in..." : "Log In"}</span>
        </button>

        {err && (
          <p className="text-[13px] text-red-600 self-stretch text-center">
            {err}
          </p>
        )}
      </form>

      <section className="flex flex-col items-center gap-4 pt-6 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto] border-t [border-top-style:solid] border-coolgray-20">
        <p className="relative self-stretch mt-[-1.00px] font-body-m font-[number:var(--body-m-font-weight)] text-coolgray-90 text-[length:var(--body-m-font-size)] text-center tracking-[var(--body-m-letter-spacing)] leading-[var(--body-m-line-height)] [font-style:var(--body-m-font-style)]">
          Or log in with:
        </p>

        <div className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
          {socialLoginOptions.map((opt) => {
            const IconComponent = opt.icon;
            return (
              <button
                key={opt.provider}
                type="button"
                onClick={() => handleSocialLogin(opt.provider)}
                className="flex h-12 items-center justify-center px-3 py-4 relative flex-1 grow border-2 border-solid border-primary-60 cursor-pointer hover:bg-primary-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-60 focus-visible:ring-offset-2 transition-colors"
                aria-label={`Log in with ${opt.name}`}
              >
                <IconComponent
                  className={`!relative !w-6 !h-6 !mt-[-4px] !mb-[-4px]`}
                />
                <div className="inline-flex items-center justify-center gap-2.5 px-4 py-0 relative flex-[0_0_auto]">
                  <span className="relative w-fit mt-[-1.00px] font-button-m text-primary-60">
                    {opt.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <hr className="w-full h-px bg-coolgray-20 border-0" />

      <p className="relative self-stretch font-body-s font-[number:var(--body-s-font-weight)] text-primary-90 text-[length:var(--body-s-font-size)] text-center tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] [font-style:var(--body-s-font-style)]">
        <button
          type="button"
          className="bg-transparent border-none cursor-pointer hover:underline focus:outline-none focus:underline text-primary-90 font-inherit"
          onClick={() => router.push("/signup")}
        >
          No account yet? Sign Up
        </button>
      </p>

    </div>
  );
};

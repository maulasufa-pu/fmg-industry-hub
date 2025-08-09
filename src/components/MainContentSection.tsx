import React, { useState } from "react";
import { Apple, Controls, Google, Twitter } from "@/icons";

import sep from "./sep.svg";

export const MainContentSection = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const socialLoginOptions = [
    { name: "Google", icon: Google, color: "#0F62FE" },
    { name: "Apple", icon: Apple, color: "#0F62FE" },
    { name: "Twitter", icon: Twitter, color: "#0F62FE" },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Handle login logic here
  console.log("Login attempt:", { email, password, rememberMe });
};

const handleSocialLogin = (provider: string) => {
  // Handle social login logic here
  console.log(`Login with ${provider}`);
};


  return (
    <div className="flex flex-col w-[680px] items-center justify-center gap-6 p-20 relative flex-[0_0_auto] bg-defaultwhite border border-solid border-coolgray-20">
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
          <label className="inline-flex items-center gap-2 relative flex-[0_0_auto] cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only"
              aria-describedby="remember-me-label"
            />
            <Controls className="!relative !w-5 !h-5" />
            <span
              id="remember-me-label"
              className="relative w-fit mt-[-1.00px] font-body-s font-[number:var(--body-s-font-weight)] text-coolgray-90 text-[length:var(--body-s-font-size)] tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] whitespace-nowrap [font-style:var(--body-s-font-style)]"
            >
              Remember me
            </span>
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
          className="all-[unset] box-border flex h-12 items-center justify-center px-3 py-4 relative self-stretch w-full bg-primary-60 border-2 border-solid border-primary-60 cursor-pointer hover:bg-primary-70 focus:outline-none focus:ring-2 focus:ring-primary-60 focus:ring-offset-2 transition-colors"
        >
          <div className="inline-flex items-center justify-center gap-2.5 px-4 py-0 relative flex-[0_0_auto]">
            <span className="relative w-fit mt-[-1.00px] font-button-m font-[number:var(--button-m-font-weight)] text-defaultwhite text-[length:var(--button-m-font-size)] tracking-[var(--button-m-letter-spacing)] leading-[var(--button-m-line-height)] whitespace-nowrap [font-style:var(--button-m-font-style)]">
              Log In
            </span>
          </div>
        </button>
      </form>

      <section className="flex flex-col items-center gap-4 pt-6 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto] border-t [border-top-style:solid] border-coolgray-20">
        <p className="relative self-stretch mt-[-1.00px] font-body-m font-[number:var(--body-m-font-weight)] text-coolgray-90 text-[length:var(--body-m-font-size)] text-center tracking-[var(--body-m-letter-spacing)] leading-[var(--body-m-line-height)] [font-style:var(--body-m-font-style)]">
          Or log in with:
        </p>

        <div className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
          {socialLoginOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => handleSocialLogin(option.name)}
                className="flex h-12 items-center justify-center px-3 py-4 relative flex-1 grow border-2 border-solid border-primary-60 cursor-pointer hover:bg-primary-10 focus:outline-none focus:ring-2 focus:ring-primary-60 focus:ring-offset-2 transition-colors"
                aria-label={`Log in with ${option.name}`}
              >
                <IconComponent
                  className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px]"
                  color={option.name === "Twitter" ? option.color : undefined}
                />
                <div className="inline-flex items-center justify-center gap-2.5 px-4 py-0 relative flex-[0_0_auto]">
                  <span className="relative w-fit mt-[-1.00px] font-button-m font-[number:var(--button-m-font-weight)] text-primary-60 text-[length:var(--button-m-font-size)] tracking-[var(--button-m-letter-spacing)] leading-[var(--button-m-line-height)] whitespace-nowrap [font-style:var(--button-m-font-style)]">
                    {option.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <img
        className="relative self-stretch w-full h-px object-cover"
        alt="Separator line"
        src={sep}
      />

      <p className="relative self-stretch font-body-s font-[number:var(--body-s-font-weight)] text-primary-90 text-[length:var(--body-s-font-size)] text-center tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] [font-style:var(--body-s-font-style)]">
        <button
          type="button"
          className="bg-transparent border-none cursor-pointer hover:underline focus:outline-none focus:underline text-primary-90 font-inherit"
          onClick={() => console.log("Sign up clicked")}
        >
          No account yet? Sign Up
        </button>
      </p>
    </div>
  );
};


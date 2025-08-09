"use client";

import React, { useState } from "react";
// import { Envelope } from "./Envelope";
// import { Facebook } from "./Facebook";
// import { Instagram } from "./Instagram";
// import { Linkedin } from "./Linkedin";
// import { Twitter } from "./Twitter";
// import { Youtube } from "./Youtube";

import { Envelope, Facebook, Instagram, Linkedin, Twitter, Youtube } from "@/icons";
import image from "../icons/rectangle-14-stroke.svg";
// import vector3 from "./vector-3.svg";
// import vector4 from "./vector-4.svg";
// import vector5 from "./vector-5.svg";
// import vector6 from "./vector-6.svg";
// import vector7 from "./vector-7.svg";

export const LogoSection = () => {
  const [email, setEmail] = useState("");

  const footerColumns = [
    {
      title: "Column One",
      links: ["Twenty One", "Thirty Two", "Fourty Three", "Fifty Four"],
    },
    {
      title: "Column Two",
      links: ["Sixty Five", "Seventy Six", "Eighty Seven", "Ninety Eight"],
    },
    {
      title: "Column Three",
      links: ["One Two", "Three Four", "Five Six", "Seven Eight"],
    },
  ];

  const socialIcons = [
    { component: Youtube, props: {} },
    { component: Facebook, props: {} },
    { component: Twitter, props: { color: "white" } },
    { component: Instagram, props: {} },
    { component: Linkedin, props: {} },
  ];

  const bottomLinks = ["Eleven", "Twelve", "Thirteen"];

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  console.log("Subscribing email:", email);
};

const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setEmail(e.target.value);
};


  return (
    <footer className="flex flex-col w-full items-center justify-center gap-10 px-4 sm:px-6 lg:px-8 py-10 bg-coolgray-60">
      <header className="flex w-full items-center justify-between gap-6">
        <div className="inline-flex flex-col items-start gap-2.5 relative flex-[0_0_auto]">
          <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
            <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
              <img
                className="relative w-6 h-6"
                alt="WebbyFrames logo"
                src={image}
              />
            </div>

            <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
              <h1 className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-coolgray-30 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]">
                WebbyFrames
              </h1>

              <p className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-coolgray-30 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]">
                for Figma
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <form
            onSubmit={handleSubscribe}
            className="inline-flex items-center gap-4 relative flex-[0_0_auto]"
          >
            <div className="inline-flex h-12 items-center gap-2 px-4 py-3 relative flex-[0_0_auto] bg-coolgray-10 border-b [border-bottom-style:solid] border-coolgray-30">
              <Envelope className="!relative !w-6 !h-6" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email to get the latest news..."
                className="relative w-fit font-body-m font-[number:var(--body-m-font-weight)] text-coolgray-60 text-[length:var(--body-m-font-size)] tracking-[var(--body-m-letter-spacing)] leading-[var(--body-m-line-height)] whitespace-nowrap [font-style:var(--body-m-font-style)] bg-transparent border-none outline-none placeholder:text-coolgray-60"
                aria-label="Email address for newsletter subscription"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center px-3 py-4 relative flex-[0_0_auto] bg-primary-60 border-2 border-solid border-primary-60 hover:bg-primary-70 focus:outline-none focus:ring-2 focus:ring-primary-40 transition-colors"
              aria-label="Subscribe to newsletter"
            >
              <span className="inline-flex items-center justify-center gap-2.5 px-4 py-0 relative flex-[0_0_auto]">
                <span className="relative w-fit mt-[-1.00px] font-button-m font-[number:var(--button-m-font-weight)] text-defaultwhite text-[length:var(--button-m-font-size)] tracking-[var(--button-m-letter-spacing)] leading-[var(--button-m-line-height)] whitespace-nowrap [font-style:var(--button-m-font-style)]">
                  Subscribe
                </span>
              </span>
            </button>
          </form>
        </div>
      </header>

      <hr className="relative self-stretch w-full h-px bg-coolgray-30 border-0" />

      <nav className="flex items-start gap-12 relative self-stretch w-full flex-[0_0_auto]">
        {footerColumns.map((column, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-4 relative flex-1 grow"
          >
            <div className="inline-flex items-center gap-2 px-0 py-3 relative flex-[0_0_auto]">
              <h2 className="relative w-fit mt-[-1.00px] font-heading-6 font-[number:var(--heading-6-font-weight)] text-defaultwhite text-[length:var(--heading-6-font-size)] tracking-[var(--heading-6-letter-spacing)] leading-[var(--heading-6-line-height)] whitespace-nowrap [font-style:var(--heading-6-font-style)]">
                {column.title}
              </h2>
            </div>

            {column.links.map((link, linkIndex) => (
              <div
                key={linkIndex}
                className="inline-flex items-center gap-2 relative flex-[0_0_auto]"
              >
                <a
                  href="#"
                  className="relative w-fit mt-[-1.00px] font-other-menu-m font-[number:var(--other-menu-m-font-weight)] text-defaultwhite text-[length:var(--other-menu-m-font-size)] tracking-[var(--other-menu-m-letter-spacing)] leading-[var(--other-menu-m-line-height)] whitespace-nowrap [font-style:var(--other-menu-m-font-style)] hover:text-coolgray-30 transition-colors"
                >
                  {link}
                </a>
              </div>
            ))}
          </div>
        ))}

        <div className="flex flex-col items-start gap-6 relative flex-1 grow">
          <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-2 px-0 py-3 relative flex-[0_0_auto]">
              <h2 className="relative w-fit mt-[-1.00px] font-heading-6 font-[number:var(--heading-6-font-weight)] text-defaultwhite text-[length:var(--heading-6-font-size)] tracking-[var(--heading-6-letter-spacing)] leading-[var(--heading-6-line-height)] whitespace-nowrap [font-style:var(--heading-6-font-style)]">
                Column Four
              </h2>
            </div>
          </div>

          <div className="inline-flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-2 px-0 py-3 relative flex-[0_0_auto]">
              <h2 className="relative w-fit mt-[-1.00px] font-heading-6 font-[number:var(--heading-6-font-weight)] text-defaultwhite text-[length:var(--heading-6-font-size)] tracking-[var(--heading-6-letter-spacing)] leading-[var(--heading-6-line-height)] whitespace-nowrap [font-style:var(--heading-6-font-style)]">
                Join Us
              </h2>
            </div>

            <div
              className="flex flex-wrap items-center gap-4"
              role="list"
            >
              {socialIcons.map((social, index) => {
                const IconComponent = social.component;
                return (
                  <a
                    key={index}
                    href="#"
                    className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-40 rounded"
                    aria-label={`Follow us on ${IconComponent.name}`}
                    role="listitem"
                  >
                    <IconComponent
                      className="!relative !w-6 !h-6"
                      {...social.props}
                    />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <hr className="relative self-stretch w-full h-px bg-coolgray-30 border-0" />

      <div className="flex w-full items-center justify-between gap-6">
        <p className="relative w-fit mt-[-1.00px] font-body-s font-[number:var(--body-s-font-weight)] text-defaultwhite text-[length:var(--body-s-font-size)] tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] whitespace-nowrap [font-style:var(--body-s-font-style)]">
          CompanyName @ 202X. All rights reserved.
        </p>

        <nav className="flex items-center gap-4">
          {bottomLinks.map((link, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-2 py-3 relative flex-[0_0_auto]"
            >
              <a
                href="#"
                className="relative w-fit mt-[-1.00px] font-other-menu-m font-[number:var(--other-menu-m-font-weight)] text-defaultwhite text-[length:var(--other-menu-m-font-size)] tracking-[var(--other-menu-m-letter-spacing)] leading-[var(--other-menu-m-line-height)] whitespace-nowrap [font-style:var(--other-menu-m-font-style)] hover:text-coolgray-30 transition-colors"
              >
                {link}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default LogoSection;
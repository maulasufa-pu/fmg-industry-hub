"use client";

import React, { useState } from "react";
// import { Envelope } from "./Envelope";
// import { Facebook } from "./Facebook";
// import { Instagram } from "./Instagram";
// import { Linkedin } from "./Linkedin";
// import { Twitter } from "./Twitter";
// import { Youtube } from "./Youtube";

import { Envelope, Facebook, Instagram, Linkedin, Twitter, Youtube } from "@/icons";
import image from "./image.svg";
import vector3 from "./vector-3.svg";
import vector4 from "./vector-4.svg";
import vector5 from "./vector-5.svg";
import vector6 from "./vector-6.svg";
import vector7 from "./vector-7.svg";

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
    <footer className="flex flex-col w-[1440px] items-start justify-center gap-12 px-20 py-12 relative flex-[0_0_auto] mb-[-4.00px] bg-coolgray-60">
      <header className="flex items-center gap-12 relative self-stretch w-full flex-[0_0_auto]">
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

        <div className="flex flex-col items-end justify-center gap-4 relative flex-1 grow">
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

            <div className="inline-flex items-start gap-2 relative flex-[0_0_auto]">
              <a
                href="#"
                className="relative w-[119.66px] h-10 bg-[url(/group.png)] bg-[100%_100%] block"
                aria-label="Download from App Store"
              />

              <a
                href="#"
                className="relative w-[135px] h-10 bg-[url(/vector.svg)] bg-[100%_100%] block"
                aria-label="Get it on Google Play"
              >
                <div className="relative h-10 bg-[url(/vector-2.svg)] bg-[100%_100%]">
                  <div className="absolute top-[3px] left-10 [-webkit-text-stroke:0.2px_#ffffff] [font-family:'Open_Sans-Regular',Helvetica] font-normal text-white text-[8.4px] tracking-[0] leading-[normal]">
                    GET IT ON
                  </div>

                  <img
                    className="absolute w-[85px] h-[17px] top-[17px] left-[41px]"
                    alt="Google Play"
                    src={vector3}
                  />

                  <div className="absolute w-[23px] h-[26px] top-[7px] left-2.5">
                    <img
                      className="absolute w-4 h-[13px] top-3 left-0"
                      alt=""
                      src={vector4}
                    />

                    <img
                      className="absolute w-[13px] h-[11px] top-[7px] left-2.5"
                      alt=""
                      src={vector5}
                    />

                    <img
                      className="absolute w-[11px] h-[21px] top-0.5 left-0"
                      alt=""
                      src={vector6}
                    />

                    <img
                      className="absolute w-4 h-[13px] top-0 left-0"
                      alt=""
                      src={vector7}
                    />
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto] mr-[-142.67px]">
            <div className="inline-flex items-center gap-2 px-0 py-3 relative flex-[0_0_auto]">
              <h2 className="relative w-fit mt-[-1.00px] font-heading-6 font-[number:var(--heading-6-font-weight)] text-defaultwhite text-[length:var(--heading-6-font-size)] tracking-[var(--heading-6-letter-spacing)] leading-[var(--heading-6-line-height)] whitespace-nowrap [font-style:var(--heading-6-font-style)]">
                Join Us
              </h2>
            </div>

            <div
              className="flex w-[426.67px] items-center gap-4 relative flex-[0_0_auto]"
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

      <div className="flex items-start gap-12 relative self-stretch w-full flex-[0_0_auto]">
        <p className="relative w-fit mt-[-1.00px] font-body-s font-[number:var(--body-s-font-weight)] text-defaultwhite text-[length:var(--body-s-font-size)] tracking-[var(--body-s-letter-spacing)] leading-[var(--body-s-line-height)] whitespace-nowrap [font-style:var(--body-s-font-style)]">
          CompanyName @ 202X. All rights reserved.
        </p>

        <nav className="flex items-center justify-end gap-4 relative flex-1 grow">
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
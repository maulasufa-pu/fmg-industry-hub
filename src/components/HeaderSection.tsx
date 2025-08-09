import React, { useState } from "react";
// import Bell from "@/public/icons/bell.svg"; // pakai @svgr/webpack
// import ChevronDown from "@/public/icons/chevron-down.svg";
// import Cog from "@/public/icons/cog.svg";
// import User from "@/public/icons/user.svg";

import { Bell, ChevronDown, Cog, User } from "@/icons";
import rectangle14Stroke from "./rectangle-14-stroke.svg";
import type { JSX } from "react";

export const HeaderSection = (): JSX.Element => {
  const [notificationCount] = useState(9);

  const navigationItems = [
    { label: "Home", href: "#home" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Musics", href: "#musics" },
    { label: "Pricing", href: "#pricing" },
    { label: "About Us", href: "#about" },
  ];

  return (
    <header className="flex w-[1440px] items-center gap-12 px-20 py-4 relative flex-[0_0_auto] mt-[-4.00px] bg-defaultwhite border-b [border-bottom-style:solid] border-coolgray-20">
      <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
        <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
          <img
            className="relative w-6 h-6"
            alt="Flemmo Music Logo"
            src={rectangle14Stroke}
          />
        </div>

        <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-coolgray-60 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]">
            Flemmo Music
          </div>

          <div className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-coolgray-60 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]">
            Industry Hub
          </div>
        </div>
      </div>

      <nav
        className="flex items-center gap-4 relative flex-1 grow"
        role="navigation"
        aria-label="Main navigation"
      >
        {navigationItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="inline-flex items-center gap-2 px-2 py-3 relative flex-[0_0_auto] hover:bg-coolgray-10 transition-colors duration-200"
          >
            <div className="relative w-fit mt-[-1.00px] font-other-menu-m font-[number:var(--other-menu-m-font-weight)] text-coolgray-90 text-[length:var(--other-menu-m-font-size)] tracking-[var(--other-menu-m-letter-spacing)] leading-[var(--other-menu-m-line-height)] whitespace-nowrap [font-style:var(--other-menu-m-font-style)]">
              {item.label}
            </div>
          </a>
        ))}

        <button
          className="inline-flex items-center gap-2 px-2 py-3 relative flex-[0_0_auto] hover:bg-coolgray-10 transition-colors duration-200"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <div className="relative w-fit font-other-menu-m font-[number:var(--other-menu-m-font-weight)] text-coolgray-90 text-[length:var(--other-menu-m-font-size)] tracking-[var(--other-menu-m-letter-spacing)] leading-[var(--other-menu-m-line-height)] whitespace-nowrap [font-style:var(--other-menu-m-font-style)]">
            Menu
          </div>

          <ChevronDown className="!relative !w-6 !h-6" />
        </button>
      </nav>

      <div className="inline-flex items-center justify-end relative flex-[0_0_auto]">
        <button
          className="flex w-12 h-12 items-center justify-center gap-4 px-2 py-4 relative hover:bg-coolgray-10 transition-colors duration-200 rounded-lg"
          aria-label={`Notifications (${notificationCount} unread)`}
        >
          <Bell className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px]" />
          {notificationCount > 0 && (
            <div className="inline-flex items-center justify-center gap-2.5 px-[5.5px] py-[0.5px] absolute top-2 left-6 bg-defaultalert rounded-xl">
              <div className="relative w-fit font-body-XS font-[number:var(--body-XS-font-weight)] text-defaultwhite text-[length:var(--body-XS-font-size)] text-center tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]">
                {notificationCount}
              </div>
            </div>
          )}
        </button>

        <button
          className="flex w-12 h-12 items-center justify-center gap-4 px-2 py-4 relative hover:bg-coolgray-10 transition-colors duration-200 rounded-lg"
          aria-label="Settings"
        >
          <Cog className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px]" />
        </button>

        <button
          className="flex w-12 h-12 items-center justify-center gap-2.5 relative bg-coolgray-10 rounded-[100px] hover:bg-coolgray-20 transition-colors duration-200"
          aria-label="User profile"
        >
          <User className="!relative !w-6 !h-6" />
        </button>
      </div>
    </header>
  );
};

export default HeaderSection;
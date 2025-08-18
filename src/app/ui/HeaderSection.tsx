"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { Bell, ChevronDown, Cog } from "@/icons";
import type { JSX } from "react";
import UserMenu from "@/app/ui/UserMenu";

export const HeaderSection = (): JSX.Element => {
  const [notificationCount] = useState(9);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { label: "Home", href: "#home" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Musics", href: "#musics" },
    { label: "Pricing", href: "#pricing" },
    { label: "About Us", href: "#about" },
  ];

  // GSAP Animations on mount
  useEffect(() => {
    const timeline = gsap.timeline();
    
    // Header entrance animation
    timeline
      .fromTo(headerRef.current, 
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
      )
      .fromTo(logoRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.5"
      );

    // Animate action children only
    if (actionsRef.current?.children) {
      timeline.fromTo(Array.from(actionsRef.current.children),
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
    }
  }, []);

  // Logo hover animation
  useEffect(() => {
    if (logoRef.current) {
      const logo = logoRef.current;
      
      logo.addEventListener("mouseenter", () => {
        gsap.to(logo, {
          scale: 1.05,
          rotation: 2,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      logo.addEventListener("mouseleave", () => {
        gsap.to(logo, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    }
  }, []);

  return (
    <motion.div 
      ref={headerRef}
      className="flex items-center gap-6 px-4 sm:px-6 lg:px-8 py-4 w-full bg-white dark:bg-gray-900/95 border-[var(--border)] border-gray-200 dark:border-gray-600 dark:border-gray-600/50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Logo Section with Animation */}
      <motion.div 
        ref={logoRef}
        className="inline-flex items-start gap-1 relative flex-[0_0_auto] cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
          {/* Logo placeholder - add your logo here */}
          <div 
            className="w-8 h-8 bg-gradient-to-br  from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg dark:shadow-slate-900/25"
          >
            <span className="text-white font-bold text-sm">FM</span>
          </div>
        </div>

        <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
          <div 
            className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-gray-800 dark:text-gray-100 dark:text-gray-100 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]"
          >
            Flemmo Music
          </div>

          <div 
            className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]"
          >
            Industry Hub
          </div>
        </div>
      </motion.div>

      {/* Navigation with Stagger Animation */}
      <motion.nav
        ref={navRef}
        className="flex items-center gap-4 relative flex-1 grow"
        role="navigation"
        aria-label="Main navigation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {navigationItems.map((item, index) => (
          <motion.a
            key={index}
            href={item.href}
            className="inline-flex items-center gap-2 px-3 py-2 relative flex-[0_0_auto] hover:bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 transition-all duration-300 rounded-lg group"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: "rgba(59, 130, 246, 0.1)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="relative w-fit mt-[-1.00px] font-other-menu-m font-[number:var(--other-menu-m-font-weight)] text-gray-700 dark:text-gray-200 text-[length:var(--other-menu-m-font-size)] tracking-[var(--other-menu-m-letter-spacing)] leading-[var(--other-menu-m-line-height)] whitespace-nowrap [font-style:var(--other-menu-m-font-style)] group-hover:text-sky-600 dark:text-sky-200 transition-colors"
              whileHover={{ y: -1 }}
            >
              {item.label}
            </motion.div>
          </motion.a>
        ))}

        <motion.button
          className="inline-flex items-center gap-2 px-3 py-2 relative flex-[0_0_auto] hover:bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 transition-all duration-300 rounded-lg group"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 + navigationItems.length * 0.1, duration: 0.4 }}
          whileHover={{ 
            scale: 1.05,
            backgroundColor: "rgba(59, 130, 246, 0.1)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div 
            className="relative w-fit font-other-menu-m font-[number:var(--other-menu-m-font-weight)] text-gray-700 dark:text-gray-200 text-[length:var(--other-menu-m-font-size)] tracking-[var(--other-menu-m-letter-spacing)] leading-[var(--other-menu-m-line-height)] whitespace-nowrap [font-style:var(--other-menu-m-font-style)] group-hover:text-sky-600 dark:text-sky-200 transition-colors"
            whileHover={{ y: -1 }}
          >
            Menu
          </motion.div>

          <motion.div
            animate={{ 
              rotate: isMenuOpen ? 180 : 0 
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronDown className="!relative !w-6 !h-6 text-neutral-600 dark:text-neutral-200 dark:text-gray-200 group-hover:text-sky-600 dark:text-sky-200 transition-colors" />
          </motion.div>
        </motion.button>
      </motion.nav>

      {/* Action Buttons with Pulse Effects */}
      <motion.div 
        ref={actionsRef}
        className="inline-flex items-center justify-end gap-2 relative flex-[0_0_auto]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <motion.button
          className="flex w-12 h-12 items-center justify-center gap-4 px-2 py-4 relative hover:bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 transition-all duration-300 rounded-lg group"
          aria-label={`Notifications (${notificationCount} unread)`}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bell className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 group-hover:text-sky-600 dark:text-sky-200 transition-colors" />
          {notificationCount > 0 && (
            <motion.div 
              className="inline-flex items-center justify-center gap-2.5 px-[5.5px] py-[0.5px] absolute top-2 left-6 bg-red-50 dark:bg-red-900/600 rounded-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 500, damping: 15 }}
            >
              <div 
                className="relative w-fit font-body-XS font-[number:var(--body-XS-font-weight)] text-white text-[length:var(--body-XS-font-size)] text-center tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]"
              >
                {notificationCount}
              </div>
            </motion.div>
          )}
        </motion.button>

        <motion.button
          className="flex w-12 h-12 items-center justify-center gap-4 px-2 py-4 relative hover:bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 transition-all duration-300 rounded-lg group"
          aria-label="Settings"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            whileHover={{ 
              rotate: 180,
            }}
            transition={{ duration: 0.5 }}
          >
            <Cog className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 group-hover:text-sky-600 dark:text-sky-200 transition-colors" />
          </motion.div>
        </motion.button>

        <motion.div 
          className="inline-flex items-center justify-end relative flex-[0_0_auto]"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <UserMenu />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HeaderSection;
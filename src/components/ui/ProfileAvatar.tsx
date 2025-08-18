"use client";

import React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  fullName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

const sizeValues = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const sizeClasses = {
  sm: "w-6 h-6 min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px]",
  md: "w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px]", 
  lg: "w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px]",
  xl: "w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px]",
};

const iconSizes = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm", 
  lg: "text-base",
  xl: "text-lg",
};

export default function ProfileAvatar({
  avatarUrl,
  fullName = "User",
  size = "md",
  className = "",
  showFallback = true,
  animate = false,
  onClick,
}: ProfileAvatarProps) {
  const sizeClass = sizeClasses[size];
  const sizeValue = sizeValues[size];
  const iconSize = iconSizes[size];
  const textSize = textSizes[size];
  const isClickable = Boolean(onClick);

  const containerProps = {
    className: `relative ${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 shadow-md flex items-center justify-center flex-shrink-0 aspect-square ${
      isClickable ? "cursor-pointer" : ""
    } ${className}`,
    style: {
      width: `${sizeValue}px`,
      height: `${sizeValue}px`,
      minWidth: `${sizeValue}px`,
      minHeight: `${sizeValue}px`,
      maxWidth: `${sizeValue}px`,
      maxHeight: `${sizeValue}px`,
    },
    ...(onClick && { onClick }),
    ...(isClickable && {
      role: "button",
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      },
    }),
  };

  const content = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={`${fullName}'s profile picture`}
      fill
      className="object-cover object-center"
      sizes={`${iconSize * 2}px`}
      unoptimized
    />
  ) : showFallback ? (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
      {fullName.charAt(0).toUpperCase()}
    </div>
  ) : (
    <User className="text-white" size={iconSize} />
  );

  if (animate) {
    return (
      <motion.div
        {...containerProps}
        whileHover={isClickable ? { scale: 1.05 } : undefined}
        whileTap={isClickable ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    );
  }

  return <div {...containerProps}>{content}</div>;
}

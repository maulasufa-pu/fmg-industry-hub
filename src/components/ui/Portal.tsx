"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export default function Portal({ children, containerId = "portal-root" }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById(containerId);
    
    if (!element) {
      // Create the container if it doesn't exist
      element = document.createElement("div");
      element.id = containerId;
      element.style.position = "fixed";
      element.style.top = "0";
      element.style.left = "0";
      element.style.zIndex = "9999";
      element.style.pointerEvents = "none";
      document.body.appendChild(element);
    }
    
    setContainer(element);
    setMounted(true);

    return () => {
      // Clean up if needed (optional)
    };
  }, [containerId]);

  if (!mounted || !container) {
    return null;
  }

  return createPortal(children, container);
}

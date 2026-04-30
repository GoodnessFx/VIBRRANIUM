"use client";

import { useEffect } from "react";

/**
 * VIBRANIUM CLIENT SECURITY MONITOR
 * 
 * Implements Security Layer 8: Live attack detection on the client.
 * Detects DevTools, DOM tampering, and suspicious interaction patterns.
 */
export function useSecurityMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // 1. DevTools Detection (Heuristic)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        reportIncident("DEVTOOLS_OPENED", { 
          outerWidth: window.outerWidth, 
          innerWidth: window.innerWidth,
          outerHeight: window.outerHeight,
          innerHeight: window.innerHeight
        });
      }
    };

    // 2. DOM Tampering Detection (MutationObserver)
    // Monitor critical UI elements like contract addresses or balance displays
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" || mutation.type === "characterData") {
          const target = mutation.target as HTMLElement;
          if (target.dataset?.securityCritical) {
            reportIncident("DOM_TAMPERING_DETECTED", {
              elementId: target.id,
              newValue: target.innerText
            });
            // Force reload or lockdown UI
            window.location.reload();
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // 3. Clipboard Injection Protection
    const handlePaste = (e: ClipboardEvent) => {
      const pastedData = e.clipboardData?.getData("text");
      if (pastedData && /<script|javascript:|data:/i.test(pastedData)) {
        e.preventDefault();
        reportIncident("CLIPBOARD_INJECTION_ATTEMPT", { payload: pastedData.slice(0, 100) });
      }
    };

    window.addEventListener("resize", detectDevTools);
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("resize", detectDevTools);
      window.removeEventListener("paste", handlePaste);
      observer.disconnect();
    };
  }, []);
}

async function reportIncident(type: string, details: Record<string, unknown>) {
  console.warn(`🛡️ SECURITY INCIDENT: ${type}`, details);
  
  try {
    await fetch("/api/security/incident", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        href: window.location.href
      }),
    });
  } catch {
    // Silent fail if reporting fails
  }
}

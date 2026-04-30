"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * VIBRANIUM GLOBAL ERROR BOUNDARY
 * 
 * Implements Security Layer 9: Quality as Security.
 * Catches client-side errors, logs them to the security backend,
 * and displays a professional fallback UI.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    // Structured logging for security monitoring
    const payload = {
      type: "CLIENT_CRASH",
      details: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      href: window.location.href
    };

    try {
      await fetch("/api/security/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Fail silently
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center">
          <div className="w-20 h-20 border-4 border-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-black text-red-500">!</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Vibranium Core Exception</h1>
          <p className="text-zinc-500 max-w-md mb-8">
            The security layer has encountered an unrecoverable state. This incident has been logged and reported for immediate forensic analysis.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-full"
          >
            Restart Protocol
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

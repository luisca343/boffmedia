"use client"
import React from "react";
import { useTranslations } from "next-intl";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ReplayErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Replay error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <DefaultReplayErrorFallback
          message={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

/** Hooks cannot live in a class component, so the default fallback is its own function component. */
function DefaultReplayErrorFallback({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const t = useTranslations("battlesim.replayError");
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-layer-2 rounded-lg text-ink">
      <h2 className="text-xl font-bold mb-2 text-red-400">{t("title")}</h2>
      <p className="text-ink mb-4">{t("message")}</p>
      <pre className="text-xs bg-layer-1 p-2 rounded overflow-auto max-w-full text-ink-muted">
        {message}
      </pre>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-primary-active text-white rounded hover:bg-primary-active"
      >
        {t("retry")}
      </button>
    </div>
  );
}

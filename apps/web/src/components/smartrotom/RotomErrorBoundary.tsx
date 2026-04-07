import React from "react";
import { RotomErrorPage } from "./RotomError";

export class RotomAppError extends Error {
  errorCode: string;
  context?: Record<string, any>;
  constructor(errorCode: string, message?: string, context?: Record<string, any>) {
    super(message);
    this.errorCode = errorCode;
    this.context = context;
  }
}

type Props = { children: React.ReactNode };

type State = { error: RotomAppError | null };

export class RotomErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: any) {
    if (error instanceof RotomAppError) {
      return { error };
    }
    return { error: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Optionally log errorInfo
  }

  render() {
    if (this.state.error) {
      return (
        <RotomErrorPage
          errorCode={this.state.error.errorCode as any}
          context={this.state.error.context}
        />
      );
    }
    return this.props.children;
  }
}
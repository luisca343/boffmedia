import React from "react";
import { RotomErrorPage, RotomErrorHelp } from "./RotomError";

export class RotomAppError extends Error {
  help?: RotomErrorHelp;
  context?: Record<string, any>;
  constructor(message: string, help?: RotomErrorHelp, context?: Record<string, any>) {
    super(message);
    this.help = help;
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
          error={this.state.error.message}
          help={this.state.error.help}
        />
      );
    }
    return this.props.children;
  }
}

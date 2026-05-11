import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="text-center max-w-lg">
            <div className="text-5xl mb-4">⚡</div>
            <h1 className="text-2xl font-bold text-gray-100 mb-3">
              Something went wrong
            </h1>
            <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-red-400 text-left overflow-auto max-h-48">
              <code>{this.state.error?.message ?? "Unknown error"}</code>
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

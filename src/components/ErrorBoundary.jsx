import { Component } from "react";
import { logFrontendError } from "../utils/errorLogger";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logFrontendError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 text-center">
          <div className="bg-cardbg border border-white/10 p-8 rounded-2xl shadow-xl max-w-md">
            <h2 className="text-xl font-bold mb-4 text-primary">Algo salió mal</h2>
            <p className="text-gray-400 text-sm mb-6">
              Ha ocurrido un error inesperado. Hemos registrado el incidente para solucionarlo lo antes posible.
            </p>
            <button
              className="px-6 py-2 bg-primary hover:bg-primaryhover text-white rounded-xl font-bold transition-all"
              onClick={() => window.location.href = "/"}
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component } from "react";
import { logFrontendError } from "../utils/errorLogger";
import { isChunkLoadError, reloadIfChunkError } from "../utils/chunkReload";

export class ErrorBoundary extends Component {
  state = { hasError: false, isReloadingChunk: false };

  static getDerivedStateFromError(error) {
    // Si es un error de chunk (deploy nuevo vs. HTML cacheado),
    // marcamos un estado transitorio mientras disparamos el reload.
    if (isChunkLoadError(error)) {
      return { hasError: true, error, isReloadingChunk: true };
    }
    return { hasError: true, error, isReloadingChunk: false };
  }

  componentDidCatch(error, errorInfo) {
    // Intenta recargar si es un chunk viejo; si dispara reload, no loggeamos
    // porque no es un bug real sino un deploy.
    if (reloadIfChunkError(error)) return;
    logFrontendError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      // Mientras el reload se dispara, mostramos un mensaje amigable en vez
      // del stack trace (el usuario verá el flash ~200ms antes del refresh).
      if (this.state.isReloadingChunk) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 text-center">
            <div className="bg-cardbg border border-white/10 p-8 rounded-2xl shadow-xl max-w-md">
              <h2 className="text-xl font-bold mb-4 text-primary">Actualizando a la última versión…</h2>
              <p className="text-gray-400 text-sm">
                Hay una versión nueva de DelegaWeb disponible. Estamos recargando para aplicarla.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 text-center">
          <div className="bg-cardbg border border-white/10 p-8 rounded-2xl shadow-xl max-w-md">
            <h2 className="text-xl font-bold mb-4 text-primary">Algo salió mal</h2>
            <p className="text-gray-400 text-sm mb-2">
              Ha ocurrido un error inesperado. Hemos registrado el incidente para solucionarlo lo antes posible.
            </p>
            <p className="text-red-400 font-mono text-xs text-left p-4 bg-black/50 rounded-xl mb-6 overflow-auto">
              {this.state.error?.toString()}
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

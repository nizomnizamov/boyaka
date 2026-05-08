import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Production'da error tracking ga yuborish mumkin
    if (import.meta.env.PROD) {
      console.error('[Boyaka Error]', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
            Xatolik yuz berdi
          </h1>
          <p className="text-sm text-text-muted dark:text-dark-text-muted mb-6 max-w-xs">
            Ilova kutilmagan xatoga uchradi. Sahifani yangilang yoki keyinroq urinib ko'ring.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/dashboard';
            }}
            className="btn btn-primary btn-sm"
          >
            Bosh sahifaga qaytish
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left max-w-sm">
              <summary className="text-xs text-text-muted cursor-pointer">Xato tafsilotlari (dev)</summary>
              <pre className="text-xs text-red-500 mt-2 overflow-auto bg-red-50 dark:bg-red-950/20 p-3 rounded-xl">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

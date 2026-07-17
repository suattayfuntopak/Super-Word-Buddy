
import React, { Component, ErrorInfo } from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, State> {
  props!: { children: React.ReactNode };
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log detailed error info for debugging
    console.error('[SuperWordBuddy] Uygulama hatası:', error?.name, error?.message);
    console.error('[SuperWordBuddy] Stack:', error?.stack);
    console.error('[SuperWordBuddy] Component stack:', info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] p-8">
          <div className="text-center space-y-6 max-w-sm">
            <div className="text-7xl">😵</div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Beklenmedik Bir Hata</h2>
            <p className="text-slate-400 font-medium">Üzgünüz, bir şeyler ters gitti. Sayfayı yenileyerek tekrar deneyebilirsin.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


import React, { Component, ErrorInfo } from 'react';

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uygulama hatası:', error, info);
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

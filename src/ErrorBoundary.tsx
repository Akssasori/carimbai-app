import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] erro capturado:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace',
          background: '#fef2f2',
          color: '#991b1b',
        }}>
          <h2 style={{ marginBottom: '12px', fontSize: '18px' }}>Erro ao carregar o aplicativo</h2>
          <pre style={{
            background: '#fff',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '600px',
            width: '100%',
            overflowX: 'auto',
            fontSize: '13px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

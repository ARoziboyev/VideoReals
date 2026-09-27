import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('VideoMove crashed:', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-[100dvh] place-items-center p-6">
        <div className="glass-card max-w-md p-8 text-center">
          <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 break-words text-sm text-fg/60">{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn-primary mt-5" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    )
  }
}
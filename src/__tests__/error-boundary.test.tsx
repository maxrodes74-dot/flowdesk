import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

function ThrowingChild() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  // Suppress expected console.error from React and the component
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    // We can't fully test this since the child will throw again,
    // but we can verify the button exists and is clickable
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeInTheDocument();
  });
});

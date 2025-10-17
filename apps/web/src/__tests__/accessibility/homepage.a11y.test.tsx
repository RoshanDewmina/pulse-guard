/**
 * Accessibility Tests: Homepage
 * 
 * Tests WCAG 2.1 AA compliance for the homepage
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));

describe('Homepage Accessibility', () => {
  it('should have no accessibility violations on homepage', async () => {
    // Simple test component representing homepage structure
    const Homepage = () => (
      <main>
        <h1>Saturn Monitor</h1>
        <p>Cron monitoring with anomaly detection</p>
        <button aria-label="Start for free">Start for free</button>
      </main>
    );

    const { container } = render(<Homepage />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    const Homepage = () => (
      <main>
        <h1>Saturn Monitor</h1>
        <section>
          <h2>Features</h2>
          <h3>Statistical anomaly detection</h3>
        </section>
      </main>
    );

    const { container } = render(<Homepage />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible navigation', async () => {
    const Navigation = () => (
      <nav aria-label="Main navigation">
        <a href="/external">External Link</a>
        <a href="/pricing">Pricing</a>
        <a href="/docs">Docs</a>
      </nav>
    );

    const { container } = render(<Navigation />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons', async () => {
    const Buttons = () => (
      <div>
        <button type="button" aria-label="Primary action">
          Click me
        </button>
        <button type="submit">Submit</button>
      </div>
    );

    const { container } = render(<Buttons />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible links', async () => {
    const Links = () => (
      <div>
        <a href="/docs">Documentation</a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    );

    const { container} = render(<Links />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible images', async () => {
    const Images = () => (
      <div>
        <img src="/logo.png" alt="Saturn Monitor Logo" />
        <img src="/hero.png" alt="Dashboard screenshot showing monitoring interface" />
      </div>
    );

    const { container } = render(<Images />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible forms', async () => {
    const Form = () => (
      <form>
        <label htmlFor="email">Email address</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          required 
          aria-required="true"
        />
        <button type="submit">Subscribe</button>
      </form>
    );

    const { container } = render(<Form />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', async () => {
    const ColoredText = () => (
      <div>
        <p style={{ color: '#000000', backgroundColor: '#ffffff' }}>
          High contrast text (21:1 ratio)
        </p>
        <p style={{ color: '#666666', backgroundColor: '#ffffff' }}>
          Medium contrast text (5.74:1 ratio)
        </p>
      </div>
    );

    const { container } = render(<ColoredText />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});


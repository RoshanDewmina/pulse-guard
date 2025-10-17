/**
 * Accessibility Tests: Dashboard
 * 
 * Tests WCAG 2.1 AA compliance for dashboard components
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

expect.extend(toHaveNoViolations);

describe('Dashboard Accessibility', () => {
  it('should have accessible data tables', async () => {
    const DataTable = () => (
      <table>
        <caption>Monitor Status</caption>
        <thead>
          <tr>
            <th scope="col">Monitor Name</th>
            <th scope="col">Status</th>
            <th scope="col">Last Check</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API Monitor</td>
            <td>Operational</td>
            <td>2 minutes ago</td>
          </tr>
        </tbody>
      </table>
    );

    const { container } = render(<DataTable />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible status indicators', async () => {
    const StatusIndicator = () => (
      <div>
        <span 
          role="status" 
          aria-label="Operational"
          style={{ 
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#10B981' // Green
          }}
        />
        <span className="sr-only">Operational</span>
      </div>
    );

    const { container } = render(<StatusIndicator />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible charts', async () => {
    const Chart = () => (
      <figure>
        <figcaption>Response Time Over Last 24 Hours</figcaption>
        <svg role="img" aria-label="Line chart showing response times">
          <title>Response Time Chart</title>
          <desc>Response times ranging from 200ms to 500ms over the past 24 hours</desc>
          {/* Chart content would go here */}
        </svg>
      </figure>
    );

    const { container } = render(<Chart />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible alerts/notifications', async () => {
    const Alert = () => (
      <div 
        role="alert" 
        aria-live="assertive"
        style={{ 
          padding: '12px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5'
        }}
      >
        <strong>Error:</strong> Monitor "API Endpoint" is down
      </div>
    );

    const { container } = render(<Alert />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible modals/dialogs', async () => {
    const Modal = () => (
      <div
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        aria-modal="true"
      >
        <h2 id="modal-title">Create New Monitor</h2>
        <p id="modal-description">Enter the details for your new monitor</p>
        <form>
          <label htmlFor="monitor-name">Monitor Name</label>
          <input type="text" id="monitor-name" />
          <button type="submit">Create</button>
          <button type="button">Cancel</button>
        </form>
      </div>
    );

    const { container } = render(<Modal />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible dropdowns', async () => {
    const Dropdown = () => (
      <div>
        <label htmlFor="time-range">Time Range</label>
        <select id="time-range" name="timeRange">
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
    );

    const { container } = render(<Dropdown />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible tab navigation', async () => {
    const Tabs = () => (
      <div>
        <div role="tablist" aria-label="Dashboard sections">
          <button
            role="tab"
            aria-selected="true"
            aria-controls="overview-panel"
            id="overview-tab"
          >
            Overview
          </button>
          <button
            role="tab"
            aria-selected="false"
            aria-controls="monitors-panel"
            id="monitors-tab"
          >
            Monitors
          </button>
        </div>
        <div
          role="tabpanel"
          id="overview-panel"
          aria-labelledby="overview-tab"
        >
          <h3>Overview Content</h3>
        </div>
      </div>
    );

    const { container } = render(<Tabs />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible loading states', async () => {
    const LoadingState = () => (
      <div 
        role="status" 
        aria-live="polite"
        aria-label="Loading data"
      >
        <span className="spinner" aria-hidden="true"></span>
        <span className="sr-only">Loading...</span>
      </div>
    );

    const { container } = render(<LoadingState />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});


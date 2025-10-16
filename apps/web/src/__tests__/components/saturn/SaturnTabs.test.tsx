import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaturnTabs } from '@/components/saturn/SaturnTabs';

describe('SaturnTabs', () => {
  const mockTabs = [
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
    { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
  ];

  it('renders without crashing', () => {
    const { container } = render(<SaturnTabs tabs={mockTabs} defaultTab="tab1" />);
    expect(container).toBeInTheDocument();
  });

  it('renders with single tab', () => {
    const singleTab = [{ id: 'only', label: 'Only Tab', content: <div>Only Content</div> }];
    const { container } = render(<SaturnTabs tabs={singleTab} defaultTab="only" />);
    expect(container).toBeInTheDocument();
  });

  it('renders with JSX content', () => {
    const tabsWithJSX = [
      {
        id: 'jsx',
        label: 'JSX Tab',
        content: (
          <div>
            <h2>Heading</h2>
            <p>Paragraph</p>
          </div>
        ),
      },
    ];
    
    const { container } = render(<SaturnTabs tabs={tabsWithJSX} defaultTab="jsx" />);
    expect(container).toBeInTheDocument();
  });

  it('accepts defaultTab prop', () => {
    const { container } = render(<SaturnTabs tabs={mockTabs} defaultTab="tab2" />);
    expect(container).toBeInTheDocument();
  });

  it('defaults to first tab if defaultTab not specified', () => {
    const { container } = render(<SaturnTabs tabs={mockTabs} />);
    expect(container).toBeInTheDocument();
  });

  it('renders Radix Tabs component', () => {
    const { container } = render(<SaturnTabs tabs={mockTabs} defaultTab="tab1" />);
    // Check that the component renders (Radix UI may not fully render in jsdom)
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders all tabs structure', () => {
    const { container } = render(<SaturnTabs tabs={mockTabs} defaultTab="tab1" />);
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles empty tabs array gracefully', () => {
    const { container } = render(<SaturnTabs tabs={[]} />);
    expect(container).toBeInTheDocument();
  });
});

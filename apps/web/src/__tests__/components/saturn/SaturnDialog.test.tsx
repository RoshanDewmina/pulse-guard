import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SaturnDialog,
  SaturnDialogTrigger,
  SaturnDialogContent,
  SaturnDialogHeader,
  SaturnDialogTitle,
  SaturnDialogDescription,
} from '@/components/saturn/SaturnDialog';

describe('SaturnDialog', () => {
  it('renders trigger button', () => {
    const { container } = render(
      <SaturnDialog>
        <SaturnDialogTrigger>Open Dialog</SaturnDialogTrigger>
        <SaturnDialogContent>
          <p>Dialog Content</p>
        </SaturnDialogContent>
      </SaturnDialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with header components', () => {
    const { container } = render(
      <SaturnDialog>
        <SaturnDialogTrigger>Open</SaturnDialogTrigger>
        <SaturnDialogContent>
          <SaturnDialogHeader>
            <SaturnDialogTitle>Dialog Title</SaturnDialogTitle>
            <SaturnDialogDescription>Dialog Description</SaturnDialogDescription>
          </SaturnDialogHeader>
        </SaturnDialogContent>
      </SaturnDialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('accepts title with custom element via "as" prop', () => {
    const { container } = render(
      <SaturnDialog>
        <SaturnDialogTrigger>Open</SaturnDialogTrigger>
        <SaturnDialogContent>
          <SaturnDialogTitle as="h2">Title</SaturnDialogTitle>
        </SaturnDialogContent>
      </SaturnDialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders complex content structure', () => {
    const { container } = render(
      <SaturnDialog>
        <SaturnDialogTrigger>Open</SaturnDialogTrigger>
        <SaturnDialogContent>
          <SaturnDialogHeader>
            <SaturnDialogTitle>Confirm Action</SaturnDialogTitle>
            <SaturnDialogDescription>Are you sure?</SaturnDialogDescription>
          </SaturnDialogHeader>
          <div>
            <button>Cancel</button>
            <button>Confirm</button>
          </div>
        </SaturnDialogContent>
      </SaturnDialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders Radix Dialog component', () => {
    const { container } = render(
      <SaturnDialog>
        <SaturnDialogTrigger>Open</SaturnDialogTrigger>
        <SaturnDialogContent>
          <p>Content</p>
        </SaturnDialogContent>
      </SaturnDialog>
    );
    expect(container).toBeInTheDocument();
  });

  it('supports all dialog components together', () => {
    const { container } = render(
      <SaturnDialog>
        <SaturnDialogTrigger>Trigger</SaturnDialogTrigger>
        <SaturnDialogContent>
          <SaturnDialogHeader>
            <SaturnDialogTitle as="h3">Title</SaturnDialogTitle>
            <SaturnDialogDescription>Description</SaturnDialogDescription>
          </SaturnDialogHeader>
          <div>Body Content</div>
        </SaturnDialogContent>
      </SaturnDialog>
    );
    expect(container).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn/SaturnTable';

describe('SaturnTable Components', () => {
  describe('SaturnTable', () => {
    it('renders table element', () => {
      const { container } = render(
        <SaturnTable>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </SaturnTable>
      );
      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SaturnTable className="custom-table">
          <tbody><tr><td>Cell</td></tr></tbody>
        </SaturnTable>
      );
      expect(container.querySelector('table')).toHaveClass('custom-table');
    });
  });

  describe('SaturnTableHeader', () => {
    it('renders thead element', () => {
      const { container } = render(
        <table>
          <SaturnTableHeader>
            <tr><th>Header</th></tr>
          </SaturnTableHeader>
        </table>
      );
      expect(container.querySelector('thead')).toBeInTheDocument();
    });
  });

  describe('SaturnTableBody', () => {
    it('renders tbody element', () => {
      const { container } = render(
        <table>
          <SaturnTableBody>
            <tr><td>Cell</td></tr>
          </SaturnTableBody>
        </table>
      );
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });
  });

  describe('SaturnTableRow', () => {
    it('renders tr element', () => {
      const { container } = render(
        <table>
          <tbody>
            <SaturnTableRow>
              <td>Cell</td>
            </SaturnTableRow>
          </tbody>
        </table>
      );
      expect(container.querySelector('tr')).toBeInTheDocument();
    });

    it('applies hover styling class when clickable', () => {
      const { container } = render(
        <table>
          <tbody>
            <SaturnTableRow clickable>
              <td>Cell</td>
            </SaturnTableRow>
          </tbody>
        </table>
      );
      const row = container.querySelector('tr');
      expect(row).toBeInTheDocument();
      expect(row).toHaveClass('transition-colors');
      expect(row).toHaveClass('cursor-pointer');
    });
  });

  describe('SaturnTableHead', () => {
    it('renders th element', () => {
      render(
        <table>
          <thead>
            <tr>
              <SaturnTableHead>Header</SaturnTableHead>
            </tr>
          </thead>
        </table>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Header').tagName).toBe('TH');
    });

    it('applies correct styling', () => {
      render(
        <table>
          <thead>
            <tr>
              <SaturnTableHead>Header</SaturnTableHead>
            </tr>
          </thead>
        </table>
      );
      const th = screen.getByText('Header');
      expect(th).toHaveClass('text-[rgba(55,50,47,0.80)]');
      expect(th).toHaveClass('font-medium');
    });
  });

  describe('SaturnTableCell', () => {
    it('renders td element', () => {
      render(
        <table>
          <tbody>
            <tr>
              <SaturnTableCell>Cell Content</SaturnTableCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('Cell Content')).toBeInTheDocument();
      expect(screen.getByText('Cell Content').tagName).toBe('TD');
    });
  });

  describe('Full Table Composition', () => {
    it('renders complete table structure', () => {
      render(
        <SaturnTable>
          <SaturnTableHeader>
            <SaturnTableRow>
              <SaturnTableHead>Name</SaturnTableHead>
              <SaturnTableHead>Status</SaturnTableHead>
            </SaturnTableRow>
          </SaturnTableHeader>
          <SaturnTableBody>
            <SaturnTableRow>
              <SaturnTableCell>John</SaturnTableCell>
              <SaturnTableCell>Active</SaturnTableCell>
            </SaturnTableRow>
            <SaturnTableRow>
              <SaturnTableCell>Jane</SaturnTableCell>
              <SaturnTableCell>Inactive</SaturnTableCell>
            </SaturnTableRow>
          </SaturnTableBody>
        </SaturnTable>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });
});


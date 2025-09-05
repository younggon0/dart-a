'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TableViewerProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  tableData?: any[][];
  period?: string;
}

export function TableViewer({ isOpen, onClose, tableName, tableData, period }: TableViewerProps) {
  if (!tableData || tableData.length === 0) {
    return null;
  }

  // Detect if first row is headers
  const hasHeaders = tableData[0] && tableData[0].every((cell: any) => 
    typeof cell === 'string' && isNaN(Number(cell))
  );
  
  const headers = hasHeaders ? tableData[0] : null;
  const rows = hasHeaders ? tableData.slice(1) : tableData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between pr-8">
            <div>
              <span className="text-lg font-semibold">{tableName}</span>
              {period && (
                <span className="ml-2 text-sm text-gray-500">({period})</span>
              )}
            </div>
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-md">
          <div className="min-w-full">
            <table className="w-full border-collapse text-sm">
              {headers && (
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-gray-50">
                    {headers.map((header, idx) => (
                      <th 
                        key={idx} 
                        className="border px-3 py-2 text-left font-medium text-gray-700 bg-gray-50"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b hover:bg-gray-50">
                    {row.map((cell, cellIdx) => (
                      <td 
                        key={cellIdx} 
                        className={`border px-3 py-2 ${
                          cellIdx === 0 ? 'font-medium' : ''
                        } ${
                          typeof cell === 'number' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatCell(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatCell(value: any): string {
  if (value === null || value === undefined) return '';
  
  // Check if it's a number
  if (typeof value === 'number') {
    // Format large numbers with commas
    return value.toLocaleString();
  }
  
  // Check if it's a string that looks like a number
  const strValue = String(value);
  const numValue = Number(strValue);
  if (!isNaN(numValue) && strValue.trim() !== '') {
    return numValue.toLocaleString();
  }
  
  return strValue;
}
import React from 'react';
import { Printer } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  content: string;
}

export default function PrintPreviewModal({ isOpen, onClose, onPrint, content }: PrintPreviewModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    
    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    
    // Remove the frame after printing
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tag Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 px-3 py-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50 p-8 rounded">
          <div 
            className="bg-white shadow-lg mx-auto p-8 border border-gray-200 rounded-lg"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <p className="text-center text-gray-500 mt-4 text-sm">This is how your tag will look when printed</p>
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Tag
          </button>
        </div>
      </div>
    </div>
  );
}

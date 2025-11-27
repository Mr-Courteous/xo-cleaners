import React from 'react';
import { Printer, AlertCircle, X } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void; // Optional callback after printing
  content: string;
  extraActions?: React.ReactNode;
  hideDefaultButton?: boolean;
  note?: string; 
}

export default function PrintPreviewModal({ 
  isOpen, 
  onClose, 
  onPrint, 
  content, 
  extraActions,
  hideDefaultButton = false,
  note
}: PrintPreviewModalProps) {
  if (!isOpen) return null;

  // Internal print handler using an iframe
  const handleDefaultPrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    // Write content to the iframe
    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @page { size: 55mm auto; margin: 0; }
            @media print {
              html, body { height: 100%; margin: 0; padding: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            body > * {
              width: 55mm !important;
              max-width: 55mm !important;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    
    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    
    // Trigger parent callback if provided
    if (onPrint) {
        onPrint();
    }

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            Print Preview
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {note && (
            <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{note}</p>
            </div>
        )}

        <div className="flex-1 p-6 overflow-auto bg-gray-100 flex justify-center items-start">
           <div className="bg-white shadow-lg transition-transform h-fit">
                <div dangerouslySetInnerHTML={{ __html: content }} />
           </div>
        </div>

        <div className="p-4 border-t bg-white flex flex-col sm:flex-row justify-end gap-3 z-10">
            <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
                Close
            </button>
            
            {extraActions}

            {!hideDefaultButton && (
                <button
                    onClick={handleDefaultPrint}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium shadow-sm"
                >
                    <Printer size={18} />
                    <span>Print Receipt</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Printer, AlertCircle } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  content: string;
  extraActions?: React.ReactNode;
  hideDefaultButton?: boolean;
  note?: string; // --- ADDED: Optional prop for displaying special notes in the modal UI ---
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

  // Internal print handler for the default button (if used)
  const handleDefaultPrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @page { size: 55mm auto; margin: 0; }
            @media print {
              html, body { height: 100%; margin: 0; padding: 0; }
            }
            body > * {
              width: 55mm !important;
              max-width: 55mm !important;
              box-sizing: border-box !important;
              margin: 0 auto !important;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    
    printFrame.contentDocument?.close();
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Printer className="w-5 h-5 mr-2 text-blue-600" />
            Print Preview
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        {/* --- ADDED: Special Note Banner (Visible in Modal UI) --- */}
        {note && (
          <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <span className="font-bold block text-yellow-900 uppercase">Special Note:</span>
              {note}
            </div>
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
           <div className="mx-auto bg-white shadow-sm min-h-[300px] p-2 flex justify-center">
                <div 
                    className="origin-top scale-90 sm:scale-100"
                    dangerouslySetInnerHTML={{ __html: content }} 
                />
           </div>
           <p className="text-center text-gray-500 mt-4 text-sm">
                Preview of Customer Receipt
            </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-white rounded-b-xl flex flex-col sm:flex-row justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
                Close
            </button>
            
            {/* Custom Actions */}
            {extraActions}

            {/* Default Print Button */}
            {!hideDefaultButton && (
                <button
                    onClick={handleDefaultPrint}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
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
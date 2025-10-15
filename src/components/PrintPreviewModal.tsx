import React from 'react';
import { Printer } from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  content: string;
  extraActions?: React.ReactNode;
}

export default function PrintPreviewModal({ isOpen, onClose, onPrint, content, extraActions }: PrintPreviewModalProps) {
  if (!isOpen) return null;

  const [expanded, setExpanded] = React.useState(false);

  // Function to handle the actual printing (using an iframe to isolate the print job)
  const handlePrint = () => {
    // We already have the logic for printing, now we just call the prop function
    // or keep the internal logic. Assuming you want to call the external onPrint
    // if it contains post-print logic, otherwise, use this internal logic:
    
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    // Write the content with necessary print styles to the iframe
    printFrame.contentDocument?.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @media print {
              body { margin: 0; }
              /* Ensure receipt content scales correctly when printed */
              body > * { width: 100% !important; max-width: none !important; }
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

    // Call the external onPrint prop if it's meant for cleanup or tracking
    onPrint();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* 1. Modal size adjustment: Use 'expanded' state to toggle the max-width
        */}
        <div className={`p-4 md:p-8 bg-white rounded-xl shadow-2xl transition-all duration-300 relative 
                        ${expanded ? 'w-[95vw] max-w-6xl' : 'w-full max-w-lg'}`}>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Receipt Print Preview</h2>

            {/* 2. Expand/Contract Button
            */}
            <div className="flex justify-end mb-3">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                    {expanded ? 'Shrink View' : 'Expand View for Full Receipt'}
                </button>
            </div>
            
            {/* 3. Preview Container: Use 'expanded' state to toggle the height
            */}
            <div className={`
                receipt-preview-container 
                border-2 border-dashed border-gray-300 rounded-md p-2 
                overflow-auto bg-gray-50 transition-all duration-300
                ${expanded ? 'h-[80vh]' : 'h-[50vh]'}
            `}>
                <div 
                    className="preview-inner mx-auto"
                    // CRITICAL: Renders the generated HTML content with styles
                    dangerouslySetInnerHTML={{ __html: content }} 
                />
            </div>

            <p className="text-center text-gray-500 mt-4 text-sm">
                This is how your **receipt** will look when printed
            </p>

            <div className="flex justify-end space-x-4 mt-6 border-t pt-4">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Close
                </button>
                {/* Extra actions (e.g., plant-print button) can be injected here */}
                {extraActions}
                <button
                    onClick={handlePrint} // Use the print handler defined above
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                    <Printer size={18} />
                    <span>Print Receipt</span>
                </button>
            </div>
        </div>
    </div>
  );
}
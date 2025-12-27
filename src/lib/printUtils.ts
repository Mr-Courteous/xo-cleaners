export const handlePrintJob = (htmlContent: string) => {
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          @page { size: 55mm auto; margin: 0; }
          @media print { 
            html, body { margin: 0; padding: 0; } 
          }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 55mm; 
            max-width: 55mm;
          }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `);
  doc.close();

  printFrame.contentWindow?.focus();
  setTimeout(() => {
    printFrame.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(printFrame)) document.body.removeChild(printFrame);
    }, 1000);
  }, 100);
};
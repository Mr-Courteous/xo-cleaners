import React, { useEffect, useState } from 'react';

type ReceiptElements = {
  ticketNumber: { enabled: boolean; label: string };
  readyDate: { enabled: boolean; label: string };
  items: { enabled: boolean; label: string };
  subtotal: { enabled: boolean; label: string };
  envCharge: { enabled: boolean; label: string };
  tax: { enabled: boolean; label: string };
  total: { enabled: boolean; label: string };
  paid: { enabled: boolean; label: string };
  balance: { enabled: boolean; label: string };
};

const DEFAULT: ReceiptElements = {
  ticketNumber: { enabled: true, label: 'Ticket Number' },
  readyDate: { enabled: true, label: 'Ready Date/Time' },
  items: { enabled: true, label: 'Items' },
  subtotal: { enabled: true, label: 'SubTotal' },
  envCharge: { enabled: true, label: 'Env Charge' },
  tax: { enabled: true, label: 'Tax' },
  total: { enabled: true, label: 'Total' },
  paid: { enabled: true, label: 'Paid Amount' },
  balance: { enabled: true, label: 'Balance' },
};

const STORAGE_KEY = 'receipt_elements_v1';

export default function ReceiptConfig() {
  const [elements, setElements] = useState<ReceiptElements>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setElements(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const save = (next: ReceiptElements) => {
    setElements(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggle = (key: keyof ReceiptElements) => {
    const next = { ...elements, [key]: { ...elements[key], enabled: !elements[key].enabled } } as ReceiptElements;
    save(next);
  };

  const setLabel = (key: keyof ReceiptElements, label: string) => {
    const next = { ...elements, [key]: { ...elements[key], label } } as ReceiptElements;
    save(next);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Receipt Configuration</h2>
      <p className="text-gray-600 mb-4">Select which elements appear on printed receipts and customize labels.</p>

      <div className="space-y-4">
        {Object.keys(elements).map((k) => {
          const key = k as keyof ReceiptElements;
          const el = elements[key];
          return (
            <div key={k} className="flex items-center justify-between p-3 border border-gray-100 rounded">
              <div>
                <div className="font-medium">{el.label}</div>
                <div className="text-sm text-gray-500">Key: <code>{key}</code></div>
              </div>
              <div className="flex items-center space-x-3">
                <input value={el.label} onChange={(e) => setLabel(key, e.target.value)} className="px-2 py-1 border rounded" />
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={el.enabled} onChange={() => toggle(key)} />
                  <span className="text-sm">Show</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setElements(DEFAULT); }}
          className="px-4 py-2 bg-red-100 text-red-700 rounded mr-2"
        >
          Reset
        </button>
        <button
          onClick={() => alert('Settings saved')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}

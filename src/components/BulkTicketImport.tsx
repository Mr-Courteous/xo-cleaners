import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, X, AlertCircle, CheckCircle, Package, Upload, FileText, RefreshCw, HelpCircle } from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';

// --- TYPES ---
interface ProcessedTicket {
  ticket_ref: string;
  customer_id: number;     // 0 if using phone
  customer_phone?: string; // Set if using phone
  pickup_date: string;
  paid_amount: number;
  rack_number: string;
  created_at: string | null;
  items: any[];
  error?: string;
}

interface BulkImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkTicketImport({ onClose, onSuccess }: BulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewTickets, setPreviewTickets] = useState<ProcessedTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- HELPER: Safe Date Formatter ---
  const formatDateForBackend = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    try {
        if (dateStr.includes('T')) return new Date(dateStr).toISOString();
        return new Date(`${dateStr}T12:00:00`).toISOString();
    } catch (e) {
        return null;
    }
  };

  // --- FILE ACTIONS ---

  const downloadTemplate = () => {
    // ✅ Updated Header: "Customer Phone/ID"
    const headers = [
      "Ticket Ref,Customer Phone/ID,Item Name (Custom),Clothing Type ID (Optional),Quantity,Price,Paid Amount,Pickup Date (YYYY-MM-DD),Rack,Created Date (Optional)"
    ];
    // Example 1: Using Phone Number
    const example1 = "T-1001,08012345678,Blue Shirt,,2,500,1000,2023-12-25,A1,2023-12-20";
    // Example 2: Using Customer ID
    const example2 = "T-1002,5,Suit,,1,2000,0,2024-01-01,B5,";
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat([example1, example2]).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ticket_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSV = (csvText: string) => {
    try {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const startIndex = lines[0].toLowerCase().includes('ticket ref') ? 1 : 0;
        
        const ticketMap = new Map<string, ProcessedTicket>();

        for (let i = startIndex; i < lines.length; i++) {
            // Regex to handle commas inside quotes
            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
            
            if (cols.length >= 5) { 
                const ticketRef = cols[0] || `ROW-${i}`;
                const rawIdentifier = cols[1]; // Can be ID "5" or Phone "080..."
                
                // Logic to distinguish Phone vs ID
                // If it starts with '0' or '+', or represents a large number, treat as phone
                const isPhone = rawIdentifier.startsWith('0') || rawIdentifier.startsWith('+') || rawIdentifier.length > 8;

                if (!ticketMap.has(ticketRef)) {
                    ticketMap.set(ticketRef, {
                        ticket_ref: ticketRef,
                        
                        // ✅ Set ID or Phone based on check
                        customer_id: isPhone ? 0 : (parseInt(rawIdentifier) || 0),
                        customer_phone: isPhone ? rawIdentifier : undefined,
                        
                        custom_name: cols[2],
                        clothing_type_id: cols[3],
                        quantity: cols[4] || '1',
                        price: cols[5] || '0',
                        paid_amount: parseFloat(cols[6]) || 0,
                        pickup_date: cols[7] || new Date().toISOString().split('T')[0],
                        rack_number: cols[8] || '',
                        created_at: cols[9] || '',
                        items: [],
                        error: undefined
                    });
                }

                const ticket = ticketMap.get(ticketRef)!;

                // Validation: Ensure Customer matches across the group
                const currentIsPhone = !!ticket.customer_phone;
                if (currentIsPhone !== isPhone) {
                    ticket.error = "Mixed Customer ID and Phone in same ticket group";
                } else if (isPhone && ticket.customer_phone !== rawIdentifier) {
                     ticket.error = "Mixed Phone Numbers in same ticket group";
                } else if (!isPhone && ticket.customer_id !== parseInt(rawIdentifier)) {
                     ticket.error = "Mixed Customer IDs in same ticket group";
                }

                // --- ITEM PARSING ---
                const typeId = cols[3] && cols[3] !== '0' ? parseInt(cols[3]) : null;

                ticket.items.push({
                    clothing_type_id: typeId,
                    custom_name: cols[2] || (typeId ? null : 'Custom Item'),
                    quantity: parseFloat(cols[4]) || 1,
                    unit_price: parseFloat(cols[5]) || 0,
                    
                    // Defaults for required fields (Lower case!)
                    starch_level: 'none', 
                    crease: false,
                    alterations: '',
                    item_instructions: '',
                    clothing_size: 'standard', 
                    alteration_behavior: 'none',
                    margin: 0,
                    size_charge: 0,
                    additional_charge: 0,
                    starch_charge: 0,
                    instruction_charge: 0
                });
            }
        }

        setPreviewTickets(Array.from(ticketMap.values()));
        setError('');

    } catch (err) {
        setError("Failed to parse CSV. Check format.");
    }
  };

  // --- SUBMIT ---

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    // Filter valid tickets (Must have ID > 0 OR a Phone string)
    const validTickets = previewTickets.filter(t => 
       ((t.customer_id > 0) || (t.customer_phone && t.customer_phone.length > 3)) 
       && !t.error
    );

    if (validTickets.length === 0) {
        setError("No valid tickets to import.");
        return;
    }

    // Prepare Payload
    const payload = validTickets.map(t => ({
        customer_id: t.customer_id,
        customer_phone: t.customer_phone || null, // ✅ Send Phone if present
        
        items: t.items,
        ticket_number_override: t.ticket_ref.startsWith("ROW-") ? null : t.ticket_ref,
        created_at_override: formatDateForBackend(t.created_at || ''),
        pickup_date: formatDateForBackend(t.pickup_date) || new Date().toISOString(),
        paid_amount: t.paid_amount,
        rack_number: t.rack_number,
        special_instructions: "Imported Ticket"
    }));

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const res = await axios.post(`${baseURL}/api/organizations/tickets/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(res.data.message || "Import successful!");
      setTimeout(() => { onSuccess(); onClose(); }, 2000);

    } catch (err: any) {
      console.error(err);
      
      let msg = "Failed to import tickets.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
            msg = detail.map((e: any) => {
                const field = e.loc ? e.loc[e.loc.length-1] : 'Field';
                return `${field}: ${e.msg}`;
            }).join(' | ');
        } else if (typeof detail === 'object') {
            msg = JSON.stringify(detail);
        } else {
            msg = detail;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Package size={24} /></div>
             <div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Ticket Import</h2>
                <p className="text-sm text-gray-500">Import using Customer ID or Phone Number</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        {/* TOOLBAR */}
        <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
           <div className="flex items-center gap-2">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium border border-gray-300">
                <Upload size={16} /> Upload CSV
              </button>
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">
                <FileText size={16} /> Download Template
              </button>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-gray-500">
              <HelpCircle size={14} />
              <span>Use <strong>Column 2</strong> for Customer ID OR Phone</span>
           </div>
        </div>

        {/* PREVIEW LIST */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {previewTickets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Upload size={48} className="mb-2 opacity-20" />
                <p>Upload a CSV file to preview tickets here.</p>
             </div>
          ) : (
             <div className="space-y-3">
                {previewTickets.map((t, i) => (
                   <div key={i} className={`bg-white border rounded-xl p-4 flex justify-between items-start shadow-sm ${t.error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div>
                         <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{t.ticket_ref}</h3>
                            {t.created_at && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Backdated: {t.created_at}</span>}
                         </div>
                         
                         <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                             {t.customer_phone ? (
                                 <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono text-xs">
                                     Phone: {t.customer_phone}
                                 </span>
                             ) : (
                                 <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">
                                     ID: {t.customer_id}
                                 </span>
                             )}
                             <span>• Paid: ₦{t.paid_amount.toLocaleString()}</span>
                         </div>

                         <div className="mt-3 flex flex-wrap gap-2">
                            {t.items.map((item, idx) => (
                               <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                                  {item.quantity}x {item.custom_name || 'Standard Item'}
                               </span>
                            ))}
                         </div>
                         {t.error && <div className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1"><AlertCircle size={12}/> {t.error}</div>}
                      </div>
                      <div className="text-right">
                         <span className="text-xs text-gray-400 block uppercase tracking-wider">Total Items</span>
                         <span className="font-mono font-bold text-lg">{t.items.length}</span>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl">
           {error && (
             <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100 overflow-y-auto max-h-32">
               <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
               <span className="break-words w-full font-mono text-xs">{error}</span>
             </div>
           )}
           {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm border border-green-100"><CheckCircle size={16} /> {success}</div>}

           <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={loading || previewTickets.length === 0}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />}
                Import Tickets
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
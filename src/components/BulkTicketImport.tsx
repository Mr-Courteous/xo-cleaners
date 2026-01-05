import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, Save, X, AlertCircle, CheckCircle, 
  Package, Upload, FileText, RefreshCw, HelpCircle, Phone 
} from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';

// --- TYPES ---
interface ProcessedItem {
  clothing_type_id: number | null;
  custom_name: string | null;
  quantity: number;
  unit_price: number;
  
  // Advanced Fields
  starch_level: string;
  clothing_size: string;
  crease: boolean;
  alterations: string;
  item_instructions: string;
  alteration_behavior: string;
  
  // Charges
  additional_charge: number;  // For Alterations
  starch_charge: number;      // Explicit override if needed
  size_charge: number;        // Explicit override if needed
  instruction_charge: number;
  
  // Pricing internals (sent to backend for reference/overrides)
  margin: number;
}

interface ProcessedTicket {
  ticket_ref: string;
  customer_phone: string; 
  pickup_date: string;
  paid_amount: number;
  rack_number: string;
  created_at: string | null;
  items: ProcessedItem[];
  special_instructions: string;
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
    const headers = [
      "Ticket Ref,Customer Phone,Item Name (Custom),Clothing Type ID,Quantity,Price,Paid Amount,Pickup Date,Rack,Notes,Starch (None/Heavy),Size (Standard/Large/Kids),Alteration Cost"
    ];
    // Example 1: Standard Item (Shirt) with Heavy Starch
    const example1 = "T-1001,08012345678,,14,2,0,0,2023-12-25,A1,Urgent,Heavy,Standard,0";
    // Example 2: Custom Item (Suit) with Alteration cost
    const example2 = "T-1002,5559998888,Blue Suit,,1,2000,2000,2024-01-01,B5,,None,Standard,500";
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat([example1, example2]).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ticket_import_template_advanced.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

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
        // Detect header row by looking for "Ticket Ref"
        const startIndex = lines[0].toLowerCase().includes('ticket ref') ? 1 : 0;
        
        const ticketMap = new Map<string, ProcessedTicket>();

        for (let i = startIndex; i < lines.length; i++) {
            // Regex handles commas inside quotes
            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
            
            // Check for minimum columns
            if (cols.length >= 2) { 
                const ticketRef = cols[0] || `ROW-${i}`;
                const rawIdentifier = cols[1]; 
                
                // Strictly Phone logic
                const cleanPhone = rawIdentifier.replace(/[^0-9]/g, '');
                
                if (!ticketMap.has(ticketRef)) {
                    ticketMap.set(ticketRef, {
                        ticket_ref: ticketRef,
                        customer_phone: cleanPhone, 
                        // CSV Columns Mapping:
                        // 0:Ref, 1:Phone, 2:Name, 3:TypeID, 4:Qty, 5:Price, 6:Paid, 7:Pickup, 8:Rack, 9:Notes
                        pickup_date: cols[7] || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                        paid_amount: parseFloat(cols[6]) || 0,
                        rack_number: cols[8] || '',
                        special_instructions: cols[9] || '', // Map Notes column
                        created_at: null, // CSV doesn't support backdating creation easily, defaults to Now
                        items: [],
                        error: undefined
                    });
                }

                const ticket = ticketMap.get(ticketRef)!;

                if (ticket.customer_phone !== cleanPhone) {
                     ticket.error = `Mixed Phone Numbers (${ticket.customer_phone} vs ${cleanPhone})`;
                }
                if (cleanPhone.length < 5) {
                    ticket.error = `Invalid Phone (${cleanPhone})`;
                }

                // --- ITEM PARSING ---
                // We check if Name (col 2) or Type ID (col 3) exists
                if (cols[2] || cols[3]) {
                    const typeId = cols[3] && cols[3] !== '0' && cols[3] !== '' ? parseInt(cols[3]) : null;
                    
                    // Advanced Columns (Optional)
                    // 10: Starch, 11: Size, 12: Alteration Cost
                    const rawStarch = (cols[10] || 'none').toLowerCase();
                    const rawSize = (cols[11] || 'standard').toLowerCase();
                    const altCost = parseFloat(cols[12]) || 0;

                    ticket.items.push({
                        clothing_type_id: typeId,
                        custom_name: cols[2] || (typeId ? null : 'Custom Item'),
                        quantity: parseFloat(cols[4]) || 1,
                        unit_price: parseFloat(cols[5]) || 0,
                        
                        // Map CSV values to Backend Enums
                        starch_level: ['heavy', 'medium', 'light'].includes(rawStarch) ? rawStarch : 'none',
                        clothing_size: ['kids', 'large', 'xlarge'].includes(rawSize) ? rawSize : 'standard',
                        
                        crease: false, // Could add a column for this if needed
                        alterations: altCost > 0 ? 'Custom Alteration' : '',
                        item_instructions: '',
                        
                        // If Alteration cost exists, behavior is 'Normal' (price + alt) unless specified otherwise
                        alteration_behavior: 'none', 
                        additional_charge: altCost,
                        
                        starch_charge: 0, // Backend will calc this based on starch_level
                        size_charge: 0,   // Backend will calc this based on clothing_size
                        instruction_charge: 0,
                        margin: 0
                    });
                }
            }
        }

        setPreviewTickets(Array.from(ticketMap.values()));
        setError('');

    } catch (err) {
        console.error(err);
        setError("Failed to parse CSV. Please check the file format.");
    }
  };

  // --- SUBMIT ---

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    const validTickets = previewTickets.filter(t => 
       t.customer_phone && t.customer_phone.length > 4 
       && t.items.length > 0
       && !t.error
    );

    if (validTickets.length === 0) {
        setError("No valid tickets to import.");
        return;
    }

    const payload = validTickets.map(t => ({
        customer_id: 0, 
        customer_phone: t.customer_phone,
        items: t.items,
        ticket_number_override: t.ticket_ref.startsWith("ROW-") ? null : t.ticket_ref,
        pickup_date: formatDateForBackend(t.pickup_date) || new Date().toISOString(),
        paid_amount: t.paid_amount,
        rack_number: t.rack_number,
        special_instructions: t.special_instructions || "Imported via CSV"
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
      const msg = err.response?.data?.detail || "Failed to import tickets.";
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Package size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-900">Advanced Bulk Import</h2>
                <p className="text-sm text-gray-500">Supports Starch, Sizing, and Alterations via CSV</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between shadow-sm z-10">
           <div className="flex items-center gap-2">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium border border-gray-300 transition-colors">
                <Upload size={16} /> Upload CSV
              </button>
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
                <FileText size={16} /> Download Template
              </button>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <HelpCircle size={14} />
              <span>Format: <strong>Phone</strong> | Type | Qty | <strong>Starch</strong> | <strong>Size</strong></span>
           </div>
        </div>

        {/* PREVIEW LIST */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50/50">
          {previewTickets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="p-4 bg-gray-100 rounded-full mb-3"><Upload size={32} className="opacity-40" /></div>
                <p className="font-medium">Upload a CSV file to preview tickets.</p>
             </div>
          ) : (
             <div className="space-y-3">
                {previewTickets.map((t, i) => (
                   <div key={i} className={`bg-white border rounded-xl p-4 flex justify-between items-start shadow-sm hover:shadow-md ${t.error ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}>
                      <div>
                         <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg">{t.ticket_ref}</h3>
                            <span className="text-sm text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full"><Phone size={12}/>{t.customer_phone}</span>
                         </div>
                         <div className="mt-3 flex flex-wrap gap-2">
                            {t.items.map((item, idx) => (
                               <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                                  <span>{item.quantity}x {item.custom_name || `Type ${item.clothing_type_id}`}</span>
                                  {item.starch_level !== 'none' && <span className="bg-purple-200 px-1 rounded text-[10px] uppercase">{item.starch_level}</span>}
                                  {item.clothing_size !== 'standard' && <span className="bg-blue-200 text-blue-800 px-1 rounded text-[10px] uppercase">{item.clothing_size}</span>}
                                  {item.additional_charge > 0 && <span className="bg-green-200 text-green-800 px-1 rounded text-[10px]">+₦{item.additional_charge}</span>}
                               </div>
                            ))}
                         </div>
                         {t.error && <div className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100/50 p-1.5 rounded w-fit"><AlertCircle size={12}/> {t.error}</div>}
                      </div>
                      <div className="text-right pl-4 border-l border-gray-100">
                         <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-bold">Items</span>
                         <span className="font-mono font-bold text-xl text-gray-700">{t.items.length}</span>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl">
           {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100"><AlertCircle size={16} className="shrink-0 mt-0.5" /> <span className="break-words w-full font-mono text-xs">{error}</span></div>}
           {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm border border-green-100"><CheckCircle size={16} /> {success}</div>}

           <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || previewTickets.length === 0} className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all active:scale-95">
                {loading ? <><RefreshCw className="animate-spin" size={18}/> Processing...</> : <><Save size={18} /> Import Tickets</>}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
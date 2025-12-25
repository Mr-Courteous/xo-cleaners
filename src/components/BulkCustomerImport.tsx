import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, X, AlertCircle, CheckCircle, Users, Upload, Download, FileText } from 'lucide-react';
import axios from 'axios';
import baseURL from '../lib/config';

interface BulkCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

interface BulkImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkCustomerImport({ onClose, onSuccess }: BulkImportProps) {
  const [defaultPassword, setDefaultPassword] = useState('Welcome123!');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rows, setRows] = useState<BulkCustomerData[]>([
    { first_name: '', last_name: '', email: '', phone: '', address: '', password: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- ACTIONS ---

  const addRow = () => {
    setRows([...rows, { first_name: '', last_name: '', email: '', phone: '', address: '', password: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
        setRows([{ first_name: '', last_name: '', email: '', phone: '', address: '', password: '' }]);
        return;
    }
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const updateRow = (index: number, field: keyof BulkCustomerData, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  // --- FILE UPLOAD LOGIC ---

  const downloadTemplate = () => {
    // Added quotes around the address in the example to show how to escape commas
    const headers = ["First Name,Last Name,Phone,Email,Address"];
    const example = ["John,Doe,08012345678,john@example.com,\"123 Main St, Lagos\""];
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(example).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customer_import_template.csv");
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
        
        const startIndex = lines[0].toLowerCase().includes('phone') ? 1 : 0;
        
        const newRows: BulkCustomerData[] = [];

        for (let i = startIndex; i < lines.length; i++) {
            // ✅ FIX: Use Regex to split by comma ONLY if it's not inside quotes
            // This allows "123 Main St, Lagos" to stay as one field
            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => {
                // Remove surrounding quotes if present (e.g. "Lagos" -> Lagos)
                return c.trim().replace(/^"|"$/g, ''); 
            });
            
            if (cols.length >= 3) { 
                newRows.push({
                    first_name: cols[0] || '',
                    last_name: cols[1] || '',
                    phone: cols[2] || '',
                    email: cols[3] || '',
                    address: cols[4] || '', // Now contains the full address including commas
                    password: '' 
                });
            }
        }

        if (newRows.length > 0) {
            if (rows.length === 1 && !rows[0].first_name) {
                setRows(newRows);
            } else {
                setRows([...rows, ...newRows]);
            }
            setError('');
        } else {
            setError("Could not parse any valid rows from the file.");
        }

    } catch (err) {
        setError("Failed to parse CSV file. Please check the format.");
    }
  };

  // --- SUBMIT ---

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    const validRows = rows.filter(r => r.first_name.trim() || r.phone.trim());
    if (validRows.length === 0) {
      setError("Please add at least one customer.");
      return;
    }

    for (let i = 0; i < validRows.length; i++) {
        if (!validRows[i].first_name || !validRows[i].phone) {
            setError(`Row ${i + 1} is missing Name or Phone.`);
            return;
        }
    }

    const payload = validRows.map(row => ({
        ...row,
        email: row.email || null,
        password: row.password.trim() ? row.password : defaultPassword
    }));

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      await axios.post(`${baseURL}/api/organizations/register-customers/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Successfully imported ${validRows.length} customers!`);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);

    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to import customers.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users size={24} /></div>
             <div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Customer Import</h2>
                <p className="text-sm text-gray-500">Upload a CSV or enter manually</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        {/* TOOLBAR */}
        <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
           
           {/* Left: CSV Actions */}
           <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors border border-gray-300"
              >
                <Upload size={16} /> Upload CSV
              </button>

              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
              >
                <FileText size={16} /> Download Template
              </button>
           </div>

           {/* Right: Default Password */}
           <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <span className="font-medium text-blue-800">Default Password:</span>
              <input 
                type="text" 
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
                className="bg-white border border-blue-200 rounded px-2 py-0.5 text-sm w-32 focus:ring-2 focus:ring-blue-500 outline-none"
              />
           </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500 w-10 text-center">#</th>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500">First Name *</th>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500">Last Name</th>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500">Phone *</th>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500">Email</th>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500">Address</th>
                <th className="py-3 px-3 text-xs font-semibold text-gray-500 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-blue-50/30 group transition-colors">
                  <td className="py-2 px-3 text-xs text-gray-400 text-center">{index + 1}</td>
                  <td className="p-2"><input type="text" placeholder="Required" value={row.first_name} onChange={(e) => updateRow(index, 'first_name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                  <td className="p-2"><input type="text" value={row.last_name} onChange={(e) => updateRow(index, 'last_name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                  <td className="p-2"><input type="text" placeholder="Required" value={row.phone} onChange={(e) => updateRow(index, 'phone', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono" /></td>
                  <td className="p-2"><input type="email" value={row.email} onChange={(e) => updateRow(index, 'email', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                  <td className="p-2"><input type="text" value={row.address} onChange={(e) => updateRow(index, 'address', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeRow(index)} className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-md">
                        <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} className="p-2">
                   <button onClick={addRow} className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium">
                      <Plus size={16} /> Add Manual Row
                   </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
           {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100"><AlertCircle size={16} /> {error}</div>}
           {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm border border-green-100"><CheckCircle size={16} /> {success}</div>}

           <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || !!success} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all active:scale-95">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</> : <><Save size={18} /> Import {rows.filter(r => r.first_name).length > 0 ? rows.filter(r => r.first_name).length : ''} Customers</>}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
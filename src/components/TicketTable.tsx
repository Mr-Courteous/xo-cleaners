import React from 'react';
import { Ticket } from '../types';

interface TicketTableProps {
    tickets: Ticket[];
}

const TicketTable: React.FC<TicketTableProps> = ({ tickets }) => {
    return (
        <div className="w-full overflow-x-auto shadow-sm rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm text-left text-gray-700 border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Ticket No</th>
                        <th className="px-4 py-3 font-semibold">Cust No</th>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                        <th className="px-4 py-3 text-right font-semibold text-blue-600">Env (4.7%)</th>
                        <th className="px-4 py-3 text-right font-semibold text-blue-600">Tax (8.25%)</th>
                        <th className="px-4 py-3 text-right font-semibold text-green-700">Total</th>
                        <th className="px-4 py-3 text-right font-semibold">Amount Paid</th>
                        <th className="px-4 py-3 font-semibold">Drop Off Date</th>
                        <th className="px-4 py-3 font-semibold">Pick Up Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {tickets.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-gray-500 italic">
                                No tickets found matching your criteria.
                            </td>
                        </tr>
                    ) : (
                        tickets.map((ticket, index) => {
                            // Calculation logic from receiptTemplate.ts
                            const subtotal = ticket.subtotal || 0;
                            const envCharge = subtotal * 0.047;
                            const taxAmount = subtotal * 0.0825;
                            const finalTotal = subtotal + envCharge + taxAmount;

                            return (
                                <tr
                                    key={ticket.id || index}
                                    className="hover:bg-blue-50/50 transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        #{ticket.ticket_number}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {ticket.customer_id}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                        {ticket.customer_name}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        ${subtotal.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-600 font-medium">
                                        ${envCharge.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-600 font-medium">
                                        ${taxAmount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-green-700 font-bold">
                                        ${finalTotal.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900">
                                        ${(ticket.paid_amount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TicketTable;
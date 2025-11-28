import { Ticket } from '../types';

export function renderPickupReceiptHtml(ticket: Ticket) {
    const items = ticket.items || [];

    // --- CALCULATE SUBTOTAL ---
    const subtotal = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0);
    const paid = Number(ticket.paid_amount) || 0;

    // --- TAX & FEES ---
    const envCharge = subtotal * 0.047;  // 4.7%
    const tax = subtotal * 0.0825;       // 8.25%
    
    const finalTotal = subtotal + envCharge + tax;
    const balance = finalTotal - paid;
    const isPaid = balance <= 0.01;

    // --- PIECE COUNT ---
    const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);
    
    // --- DATE FORMATTING ---
    const pickedUpDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // --- BUILD ITEM LIST HTML ---
    const itemsList = items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const itemTotal = Number(item.item_total) || 0;
        const additional = Number(item.additional_charge) || 0;

        const details = [];
        if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') details.push(item.starch_level);
        if (item.crease) details.push('Crease');
        if (item.alterations) details.push(`<span style="font-weight:900;">Alt: ${item.alterations}</span>`);
        if (additional > 0) details.push(`<span style="font-weight:900;">Add'l: $${additional.toFixed(2)}</span>`);
        if (item.item_instructions) details.push(`<br><span style="font-weight:900;">Note: ${item.item_instructions}</span>`);

        const detailsHtml = details.length > 0
            ? `<div style="font-size:8pt;color:#666;margin-left:8px;">+ ${details.join(', ')}</div>`
            : '';

        return (
            `<div style="margin:4px 0;">` +
                `<div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">` +
                    `<div style="flex:1;">${item.clothing_name}</div>` +
                    `<div style="margin-left:8px;">x${quantity}</div>` +
                    `<div style="width:56px;text-align:right;">$${itemTotal.toFixed(2)}</div>` +
                `</div>` +
                detailsHtml +
            `</div>`
        );
    }).join('');

    return `
    <div style="width:55mm;margin:0 auto;font-family: 'Courier New', Courier, monospace;color:#111;padding:8px; background: white;">
      
      <div style="text-align:center;">
        <div style="font-size:18px;font-weight:900; font-family: Arial, sans-serif;">Airport Cleaners</div>
        <div style="font-size:9pt;">(713) 723-5579</div>
      </div>
      
      <div style="text-align:center;margin-top:10px;border-bottom:1px solid #000;padding-bottom:5px;">
        <div style="font-size:24px;font-weight:800; font-family: Arial, sans-serif;">${ticket.ticket_number}</div>
        <div style="font-size:12pt;font-weight:bold;margin-top:5px;">PICKED UP</div>
        <div style="font-size:9pt;">${pickedUpDate}</div>
      </div>

      <div style="margin-top:10px;font-weight:bold;font-size:11pt;">
        ${ticket.customer_name}
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-top:8px;padding:6px;border:2px solid #000;background-color:#eee;font-weight:bold;font-size:10pt;">
          NOTE: ${ticket.special_instructions}
        </div>
      ` : ''}

      <div style="margin-top:5px;">
        ${itemsList}
      </div>

      <hr style="border:none;border-top:1px dashed #444;margin:8px 0;"/>

      <div style="font-size:10pt;font-weight: 600;">
        <div style="display:flex;justify-content:space-between;"> <div>Total:</div> <div>$${finalTotal.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Paid:</div> <div>$${paid.toFixed(2)}</div> </div>
        
        ${isPaid 
            ? `<div style="text-align:center; margin-top:8px; font-weight:900; font-size: 14pt; border: 2px solid black;">PAID</div>`
            : `<div style="display:flex;justify-content:space-between;font-weight:900;margin-top:4px; font-size:11pt;"> 
                 <div>BALANCE DUE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <div style="margin-top:12px;text-align:center;font-weight:800;">
        ${totalPieces} PIECES
      </div>
      
      <div style="margin-top:15px;text-align:center;font-size:9pt;">
        Thank you!
      </div>
    </div>
  `;
}

export default renderPickupReceiptHtml;
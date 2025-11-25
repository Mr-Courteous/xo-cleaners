import { Ticket } from '../types';

export function renderPickupReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];
  
  const subtotal = ticket.total_amount || 0;
  const paid = ticket.paid_amount || 0;
  
  const envCharge = subtotal * 0.047; 
  const tax = subtotal * 0.0825; 
  const finalTotal = subtotal + envCharge + tax;
  const balance = finalTotal - paid;

  const totalPieces = items.reduce((sum, item) => sum + (item.quantity * (item.pieces || 1)), 0);
  const pickedUpDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const itemsList = items.map(item => {
    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') details.push(item.starch_level);
    if (item.crease) details.push('Crease');

    // --- UPDATED: BOLD ALTERATIONS ---
    if (item.alterations) {
        details.push(`<span style="font-weight:900; color:#000; font-style:normal;">Alt: ${item.alterations}</span>`);
    }

    const detailsHtml = details.length > 0 
        ? `<div style="font-size:8pt;color:#666;margin-left:8px;">+ ${details.join(', ')}</div>` 
        : '';

    return (
      `<div style="margin:4px 0;">` +
        `<div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">` +
            `<div style="flex:1;">${item.clothing_name}</div>` +
            `<div style="margin-left:8px;">x${item.quantity}</div>` +
            `<div style="width:56px;text-align:right;">$${item.item_total.toFixed(2)}</div>` +
        `</div>` +
        detailsHtml +
      `</div>`
    );
  }).join('');

  return `
    <div style="width:55mm;margin:0 auto;font-family: Arial, sans-serif;color:#111;padding:8px;">
      
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:900;">Airport Cleaners</div>
        <div style="font-size:9pt;">(713) 723-5579</div>
      </div>
      
      <div style="text-align:center;margin-top:10px;border-bottom:1px solid #000;padding-bottom:5px;">
        <div style="font-size:24px;font-weight:800;">${ticket.ticket_number}</div>
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
        <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:4px;"> <div>BALANCE:</div> <div>$${balance.toFixed(2)}</div> </div>
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
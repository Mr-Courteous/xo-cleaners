import { Ticket } from '../types';

export function renderReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];

  // --- CALCULATIONS ---
  const subtotal = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0);
  const paid = Number(ticket.paid_amount) || 0;

  // Fees
  const envCharge = subtotal * 0.047; 
  const tax = subtotal * 0.0825; 
  
  // Totals
  const finalTotal = subtotal + envCharge + tax;
  const balance = finalTotal - paid;
  const isPaid = balance <= 0.01; // Allow for tiny floating point differences

  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);

  // --- HTML GENERATION ---
  const itemsList = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const itemTotal = Number(item.item_total) || 0;
    const additional = Number(item.additional_charge) || 0;

    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') {
      details.push(`Starch: ${item.starch_level}`);
    }
    if (item.crease) details.push('Crease');
    if (item.alterations) {
      details.push(`<span style="font-weight:900; color:#000;">Alt: ${item.alterations}</span>`);
    }
    if (additional > 0) {
        details.push(`<span style="font-weight:900; color:#000;">Add'l: $${additional.toFixed(2)}</span>`);
    }
    if (item.item_instructions) {
      details.push(`<br> <span style="font-weight:900; color:#000;">Note: ${item.item_instructions}</span>`);
    }

    const detailsHtml = details.length > 0
      ? `<div style="font-size:8pt;color:#666;font-style:italic;margin-left:8px;">+ ${details.join(', ')}</div>`
      : '';

    return (
      `<div style="margin:4px 0;">` +
        `<div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">` +
            `<div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>` +
            `<div style="margin-left:8px;min-width:28px;text-align:right">x${quantity}</div>` +
            `<div style="width:56px;text-align:right;margin-left:8px">$${itemTotal.toFixed(2)}</div>` +
        `</div>` +
        detailsHtml +
      `</div>`
    );
  }).join('');

  return `
    <div style="width:55mm;margin:0 auto;font-family: 'Courier New', Courier, monospace; color:#111; padding:8px; background: white;">
      <div style="text-align:center;">
        <div style="font-size:18px;font-weight:900; font-family: Arial, sans-serif;">Airport Cleaners</div>
        <div style="font-size:9pt;">12300 Fondren Road</div>
        <div style="font-size:9pt;">Houston, TX 77035</div>
        <div style="font-size:9pt;">(713) 723-5579</div>
      </div>
      
      <div style="text-align:center;margin-top:10px;border-top:1px dashed #444;padding-top:5px;">
        <div style="font-size:10pt;font-weight:900;">CUSTOMER TICKET</div>
        <div style="font-size:24px;font-weight:800; font-family: Arial, sans-serif;">${ticket.ticket_number}</div>
        <div style="font-size:9pt;">Dropped: ${new Date(ticket.created_at || Date.now()).toLocaleDateString()}</div>
      </div>

      <div style="margin-top:10px;font-weight:bold;font-size:11pt;border-bottom:1px solid #444;">
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
        <div style="display:flex;justify-content:space-between;"> <div>Subtotal:</div> <div>$${subtotal.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Env (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> </div>
        
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:12pt;margin-top:6px;border-top:2px solid #000;padding-top:2px;">
          <div>TOTAL:</div> <div>$${finalTotal.toFixed(2)}</div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:4px;"> 
            <div>Paid Amount:</div> 
            <div>$${paid.toFixed(2)}</div> 
        </div>

        ${isPaid 
            ? `<div style="text-align:center; margin-top:10px; border: 2px solid #000; padding: 5px; font-weight:900; font-size: 14pt;">PAID IN FULL</div>`
            : `<div style="display:flex;justify-content:space-between;font-weight:900;margin-top:6px;font-size:12pt;"> 
                 <div>BALANCE DUE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <div style="margin-top:12px;text-align:center;font-weight:800;font-size:11pt;border:1px solid #000;padding:4px;">
        ${totalPieces} PIECES
      </div>
      <div style="margin-top:12px;text-align:center;font-size:9pt;">
        <div style="font-weight:bold;">Pickup: ${ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'See Counter'}</div>
      </div>
    </div>
  `;
}

export default renderReceiptHtml;
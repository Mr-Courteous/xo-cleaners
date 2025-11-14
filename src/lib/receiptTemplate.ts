import { Ticket } from '../types';

export function renderReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];
  const itemsList = items.map(item =>
    // --- CHANGED: Made item list text bolder ---
    `<div style="display:flex;justify-content:space-between;margin:4px 0;font-size:10pt;font-weight: 600;">` +
    `<div style=\"flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">${item.clothing_name}</div>` +
    `<div style=\"margin-left:8px;min-width:28px;text-align:right\">x${item.quantity}</div>` +
    `<div style=\"width:56px;text-align:right;margin-left:8px\">$${item.item_total.toFixed(2)}</div>` +
    `</div>`
  ).join('');

  // --- MODIFIED: Added all calculations ---
  const subtotal = ticket.total_amount || 0;
  const paid = ticket.paid_amount || 0;

  // Calculate fees based on the subtotal
  const envCharge = subtotal * 0.047; // 4.7%
  const tax = subtotal * 0.0825; // 8.25%
  const finalTotal = subtotal + envCharge + tax;

  // Balance is based on the new finalTotal
  const balance = finalTotal - paid;
  // --- END MODIFICATIONS ---

  // --- ADDED: Dynamically calculate the total number of pieces ---
  const totalPieces = items.reduce((sum, item) => sum + (item.quantity * (item.pieces || 0)), 0);
  // --- END ADDED ---

  return `
    <div style="width:55mm;margin:0 auto;font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;color:#111;padding:8px;">
      
      <div style="text-align:center;">
        <div style="font-size:28px;font-weight:900;letter-spacing:1px;">${ticket.ticket_number}</div>
        <div style="font-size:8pt;">TICKET</div>
      </div>
      
      <div style="text-align:center; margin-top: 4px;">
        <div style="font-size:16px;font-weight:800;">Airport Cleaners</div>
        <div style="font-size:9pt;">12300 Fondren Road, Houston TX 77035</div>
        <div style="font-size:9pt;">(713) 723-5579</div>
      </div>
      <hr style="border:none;border-top:1px dashed #444;margin:8px 0;"/>

      <div style="display:flex;justify-content:space-between;font-size:10pt;margin-bottom:6px;font-weight: 600;">
        <div>${ticket.customer_name || ''}</div>
        <div>${ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() + ' ' + new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
      </div>

      <div style="margin-bottom:6px;font-size:10pt;">
        ${itemsList}
      </div>

      <hr style="border:none;border-top:1px dashed #444;margin:6px 0;"/>

      <div style="font-size:10pt;font-weight: 600;">
        <div style="display:flex;justify-content:space-between;"> <div>Subtotal:</div> <div>$${subtotal.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Env Charge (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> </div>
        
        <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:4px;margin-bottom:4px;border-top:1px dashed #444;border-bottom:1px dashed #444;padding:4px 0;">
          <div>TOTAL:</div> <div>$${finalTotal.toFixed(2)}</div>
        </div>

        <div style="display:flex;justify-content:space-between;"> <div>Paid:</div> <div>$${paid.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:6px;"> <div>BALANCE:</div> <div>$${balance.toFixed(2)}</div> </div>
      </div>
      
      <div style="margin-top:10px;text-align:center;font-weight:800;">
        ${totalPieces} PIECES
      </div>
      <div style="margin-top:10px;text-align:center;">
        <div style="display:inline-block;background:#000;color:#fff;padding:6px 12px;border-radius:4px;font-weight:800;">REG/PICKUP</div>
      </div>

      <div style="margin-top:8px;text-align:center;font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;font-size:12pt;font-weight: 600;">
        ${ticket.ticket_number}
      </div>
    </div>
  `;
}

export default renderReceiptHtml;
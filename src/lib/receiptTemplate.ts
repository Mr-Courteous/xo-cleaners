import { Ticket } from '../types';

export function renderReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];

  const subtotal = ticket.total_amount || 0;
  const paid = ticket.paid_amount || 0;

  const envCharge = subtotal * 0.047; // 4.7%
  const tax = subtotal * 0.0825; // 8.25%
  const finalTotal = subtotal + envCharge + tax;
  const balance = finalTotal - paid;

  const totalPieces = items.reduce((sum, item) => sum + (item.quantity * (item.pieces || 1)), 0);

  const itemsList = items.map(item => {
    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') {
      details.push(`Starch: ${item.starch_level}`);
    }
    if (item.crease) details.push('Crease');

    const detailsHtml = details.length > 0
      ? `<div style="font-size:8pt;color:#666;font-style:italic;margin-left:8px;">+ ${details.join(', ')}</div>`
      : '';

    return (
      `<div style="margin:4px 0;">` +
      `<div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">` +
      `<div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>` +
      `<div style="margin-left:8px;min-width:28px;text-align:right">x${item.quantity}</div>` +
      `<div style="width:56px;text-align:right;margin-left:8px">$${item.item_total.toFixed(2)}</div>` +
      `</div>` +
      detailsHtml +
      `</div>`
    );
  }).join('');

  return `
    <div style="width:55mm;margin:0 auto;font-family: Arial, sans-serif;color:#111;padding:8px;">
      
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:900;">Airport Cleaners</div>
        <div style="font-size:9pt;">12300 Fondren Road</div>
        <div style="font-size:9pt;">Houston, TX 77035</div>
        <div style="font-size:9pt;">(713) 723-5579</div>
      </div>
      
      <div style="text-align:center;margin-top:10px;border-top:1px dashed #444;padding-top:5px;">
        <div style="font-size:12pt;font-weight:900;">CUSTOMER'S COPY</div>

        <div style="font-size:24px;font-weight:800;">${ticket.ticket_number}</div>
        <div style="font-size:9pt;">${new Date(ticket.created_at || Date.now()).toLocaleDateString()}</div>
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
        <div style="display:flex;justify-content:space-between;"> <div>Env Charge (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> </div>
        
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:12pt;margin-top:6px;border-top:2px solid #000;padding-top:2px;">
          <div>TOTAL:</div> <div>$${finalTotal.toFixed(2)}</div>
        </div>

        ${paid > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-top:4px;"> <div>Paid:</div> <div>$${paid.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:2px;"> <div>BALANCE:</div> <div>$${balance.toFixed(2)}</div> </div>
        ` : ''}
      </div>
      
      <div style="margin-top:12px;text-align:center;font-weight:800;font-size:11pt;border:1px solid #000;padding:4px;">
        ${totalPieces} PIECES
      </div>

      <div style="margin-top:12px;text-align:center;font-size:9pt;">
        <div style="font-weight:bold;">Pickup: ${ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'See Counter'}</div>
        <div style="margin-top:4px;">Thank you for your business!</div>
      </div>
    </div>
  `;
}

export default renderReceiptHtml;
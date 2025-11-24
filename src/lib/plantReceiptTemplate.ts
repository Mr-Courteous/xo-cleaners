import { Ticket } from '../types';

export function renderPlantReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];
  
  // --- CALCULATION: Plant Price * Quantity ---
  const itemsList = items.map(item => {
    // We use plant_price here instead of item_price
    const plantLineTotal = (item.plant_price || 0) * item.quantity;

    return (
      `<div style="display:flex;justify-content:space-between;margin:4px 0;font-size:10pt;font-weight: 600;">` +
      `<div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>` +
      `<div style="margin-left:8px;min-width:28px;text-align:right">x${item.quantity}</div>` +
      // Show the Plant Cost for this line
      `<div style="width:56px;text-align:right;margin-left:8px">$${plantLineTotal.toFixed(2)}</div>` +
      `</div>`
    );
  }).join('');

  // --- CALCULATION: Total Plant Cost ---
  // Sum of (Plant Price * Quantity) for all items
  const totalPlantCost = items.reduce((sum, item) => sum + ((item.plant_price || 0) * item.quantity), 0);

  // Calculate pieces (using your logic from the snippet)
  const totalPieces = items.reduce((sum, item) => sum + (item.quantity * (item.pieces || 1)), 0);

  return `
    <div style="width:55mm;margin:0 auto;font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;color:#111;padding:8px;">
      
      <div style="text-align:center;">
        <div style="font-size:28px;font-weight:900;letter-spacing:1px;">${ticket.ticket_number}</div>
        <div style="font-size:8pt;">PLANT COPY</div>
      </div>
      
      <div style="text-align:center; margin-top: 4px;">
        <div style="font-size:16px;font-weight:800;">Airport Cleaners</div>
        <div style="font-size:9pt;">12300 Fondren Road, Houston TX 77035</div>
        <div style="font-size:9pt;">(713) 723-5579</div>
      </div>
      <hr style="border:none;border-top:1px dashed #444;margin:8px 0;"/>

      <div style="text-align:center; margin-bottom:6px;">
        <div style="font-size:14pt; font-weight:800; text-transform:uppercase; margin-bottom: 2px;">
          ${ticket.customer_name || 'GUEST'}
        </div>
        
        <div style="font-size:10pt; font-weight:600;">
          ${ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() + ' ' + new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
      <div style="margin-bottom:6px;font-size:10pt;">
        ${itemsList}
      </div>

      <hr style="border:none;border-top:1px dashed #444;margin:6px 0;"/>

      <div style="font-size:10pt;font-weight: 600;">
        <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:4px;margin-bottom:4px;border-top:1px dashed #444;border-bottom:1px dashed #444;padding:4px 0;">
          <div>PLANT TOTAL:</div> <div>$${totalPlantCost.toFixed(2)}</div>
        </div>
      </div>
      
      <div style="margin-top:10px;text-align:center;font-weight:800;">
        ${totalPieces} PIECES
      </div>
      <div style="margin-top:10px;text-align:center;">
        <div style="display:inline-block;background:#000;color:#fff;padding:6px 12px;border-radius:4px;font-weight:800;">REG/PICKUP</div>
      </div>

      <div style="margin-top:8px;text-align:center;font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;font-size:12pt;font-weight: 600;">
        Pickup: ${ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'TBD'}
      </div>
    </div>
  `;
}

export default renderPlantReceiptHtml;
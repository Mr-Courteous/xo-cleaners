import { Ticket } from '../types';

export function renderPlantReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];

  // --- CALCULATION: Plant Price Sum ---
  const totalPlantPrice = items.reduce((sum, item) => sum + ((item.plant_price || 0) * item.quantity), 0);

  // --- CALCULATION: Plant Tax & Env (Requirement: Plant Price + Tax + Env) ---
  const envCharge = totalPlantPrice * 0.047;
  const tax = totalPlantPrice * 0.0825;
  const finalPlantTotal = totalPlantPrice + envCharge + tax;

  const totalPieces = items.reduce((sum, item) => sum + (item.quantity * (item.pieces || 1)), 0);

  // --- LOGIC: Check Status for "Picked Up" Badge ---
  const isPickedUp = ticket.status === 'picked_up';
  const statusDate = isPickedUp
    ? `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
    : new Date(ticket.created_at || Date.now()).toLocaleDateString();

  const itemsList = items.map(item => {
    const plantLineTotal = (item.plant_price || 0) * item.quantity;

    // --- REQUIREMENT: Show Special Instructions/Details (Starch, Crease, Alterations) ---
    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') {
      details.push(`Starch: ${item.starch_level}`);
    }
    if (item.crease) details.push('Crease: Yes');

    // --- ADDED: Alterations ---
    if (item.alterations) {
      details.push(`<span style="font-weight:900; color:#000; font-style:normal;">Alt: ${item.alterations}</span>`);
    }

    // Standard Instructions
    if (item.item_instructions) {
      // details.push(`Note: ${item.item_instructions}`);
      details.push(`<br><span style="font-weight:900; color:#000; font-style:normal;">Note: ${item.item_instructions}</span>`);

    }

    const detailsHtml = details.length > 0
      ? `<div style="font-size:8pt;color:#666;font-style:italic;margin-left:8px;">+ ${details.join(', ')}</div>`
      : '';

    return (
      `<div style="margin:4px 0;">` +
      `<div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">` +
      `<div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>` +
      `<div style="margin-left:8px;min-width:28px;text-align:right">x${item.quantity}</div>` +
      `<div style="width:56px;text-align:right;margin-left:8px">$${plantLineTotal.toFixed(2)}</div>` +
      `</div>` +
      detailsHtml +
      `</div>`
    );
  }).join('');

  return `
    <div style="width:55mm;margin:0 auto;font-family: Arial, sans-serif;color:#111;padding:8px;">
      
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:900;">PLANT COPY</div>
        <div style="font-size:9pt;">INTERNAL RECORD</div>
        <div style="font-size:9pt;">DO NOT DISTRIBUTE</div>
      </div>
      
      <div style="text-align:center;margin-top:10px;border-top:1px dashed #444;padding-top:5px;">
        <div style="font-size:24px;font-weight:800;">${ticket.ticket_number}</div>
        ${isPickedUp ? `<div style="font-size:12pt;font-weight:900;margin-top:2px;">PICKED UP</div>` : ''}
        <div style="font-size:9pt;">${statusDate}</div>
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
        <div style="display:flex;justify-content:space-between;"> <div>Plant Subtotal:</div> <div>$${totalPlantPrice.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Env Charge (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> </div>
        <div style="display:flex;justify-content:space-between;"> <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> </div>
        
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:12pt;margin-top:6px;border-top:2px solid #000;padding-top:2px;">
          <div>PLANT TOTAL:</div> <div>$${finalPlantTotal.toFixed(2)}</div>
        </div>
      </div>
      
      <div style="margin-top:12px;text-align:center;font-weight:800;font-size:11pt;border:1px solid #000;padding:4px;">
        ${totalPieces} PIECES
      </div>
    </div>
  `;
}

export default renderPlantReceiptHtml;
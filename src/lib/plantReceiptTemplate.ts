import { Ticket } from '../types';

export function renderPlantReceiptHtml(ticket: Ticket) {
  const items = ticket.items || [];
  
  const totalPlantPrice = items.reduce((sum, item) => sum + ((item.plant_price || 0) * item.quantity), 0);
  const envCharge = totalPlantPrice * 0.047;
  const tax = totalPlantPrice * 0.0825;
  const finalPlantTotal = totalPlantPrice + envCharge + tax;

  const totalPieces = items.reduce((sum, item) => sum + (item.quantity * (item.pieces || 1)), 0);

  const isPickedUp = ticket.status === 'picked_up';
  const statusBadge = isPickedUp 
    ? `<div style="text-align:center;margin-top:5px;margin-bottom:5px;">
         <span style="background:#000;color:#fff;padding:4px 8px;font-weight:900;font-size:12pt;border-radius:4px;">PICKED UP</span>
         <div style="font-size:9pt;margin-top:2px;">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
       </div>`
    : `<div style="font-size:9pt;text-align:center;">${new Date().toLocaleDateString()}</div>`;

  const itemsList = items.map(item => {
    const plantLineTotal = (item.plant_price || 0) * item.quantity;
    
    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') {
        details.push(`Starch: ${item.starch_level}`);
    }
    if (item.crease) details.push('Crease: Yes');

    const detailsHtml = details.length > 0 
        ? `<div style="font-size:8pt;color:#444;margin-left:8px;">[${details.join(', ')}]</div>` 
        : '';

    return (
      `<div style="margin:4px 0;border-bottom:1px dotted #ccc;padding-bottom:2px;">` +
        `<div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">` +
            `<div style="flex:1;">${item.clothing_name}</div>` +
            `<div style="margin-left:8px;">x${item.quantity}</div>` +
            `<div style="width:56px;text-align:right;">$${plantLineTotal.toFixed(2)}</div>` +
        `</div>` +
        detailsHtml +
      `</div>`
    );
  }).join('');

  return `
    <div style="width:55mm;margin:0 auto;font-family: 'Courier New', Courier, monospace;color:#000;padding:5px;">
      
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:5px;">
        <div style="font-size:12pt;font-weight:900;">PLANT COPY</div>
        <div style="font-size:16pt;font-weight:900;">#${ticket.ticket_number}</div>
        ${statusBadge}
      </div>

      <div style="margin-top:5px;font-weight:bold;font-size:10pt;border-bottom:1px dashed #000;padding-bottom:5px;">
        CUST: ${ticket.customer_name}
      </div>

      ${ticket.special_instructions ? `
        <div style="background:#eee;padding:6px;margin:8px 0;font-weight:900;font-size:11pt;border:2px solid #000;text-transform:uppercase;">
          NOTE: ${ticket.special_instructions}
        </div>
      ` : ''}

      <div style="margin-top:5px;">
        ${itemsList}
      </div>

      <div style="margin-top:10px;border-top:2px solid #000;padding-top:5px;font-size:10pt;">
        <div style="display:flex;justify-content:space-between;"> 
            <span>Plant Subtotal:</span> <span>$${totalPlantPrice.toFixed(2)}</span> 
        </div>
        <div style="display:flex;justify-content:space-between;"> 
            <span>Env Charge (4.7%):</span> <span>$${envCharge.toFixed(2)}</span> 
        </div>
        <div style="display:flex;justify-content:space-between;"> 
            <span>Tax (8.25%):</span> <span>$${tax.toFixed(2)}</span> 
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:11pt;margin-top:5px;"> 
            <span>PLANT TOTAL:</span> <span>$${finalPlantTotal.toFixed(2)}</span> 
        </div>
      </div>

      <div style="text-align:center;margin-top:15px;font-weight:900;font-size:12pt;border:2px solid #000;padding:5px;">
        ${totalPieces} PIECES
      </div>
      
      <div style="text-align:center;margin-top:5px;font-size:8pt;">
        INTERNAL USE ONLY
      </div>
    </div>
  `;
}

export default renderPlantReceiptHtml;
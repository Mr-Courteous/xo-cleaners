import { Ticket } from '../types';

export function renderPlantReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners") {
  const items = ticket.items || [];

  // --- CALCULATIONS (Plant Specific - NO MARGIN) ---
  // 1. Calculate Subtotal using PLANT PRICE + Extras
  const plantSubtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const plantPrice = Number(item.plant_price) || 0;
    const additional = Number(item.additional_charge) || 0;
    const instructionCharge = Number(item.instruction_charge) || 0;
    const starchCharge = Number(item.starch_charge) || 0;
    const sizeCharge = Number(item.size_charge) || 0;

    return sum + ((plantPrice * quantity) + additional + instructionCharge + starchCharge + sizeCharge);
  }, 0);

  // 2. Calculate Tax/Env based on this PLANT COST (excluding margin)
  const envCharge = plantSubtotal * 0.047;
  const tax = plantSubtotal * 0.0825;
  const finalPlantTotal = plantSubtotal + envCharge + tax;

  const paid = Number(ticket.paid_amount) || 0;
  const balance = finalPlantTotal - paid;
  const isPaid = balance <= 0.05;

  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);
  const dateStr = new Date(ticket.created_at || Date.now()).toLocaleDateString();
  const timeStr = new Date(ticket.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // --- ITEMS LIST ---
  const itemsHtml = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    
    // Plant Line Total calculation (matches subtotal logic)
    const plantBase = Number(item.plant_price) || 0;
    const extras = (Number(item.additional_charge) || 0) + 
                   (Number(item.instruction_charge) || 0) + 
                   (Number(item.starch_charge) || 0) + 
                   (Number(item.size_charge) || 0);
    const plantLineTotal = (plantBase * quantity) + extras;

    const details = [];

    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') {
        const cost = item.starch_charge ? `(+$${Number(item.starch_charge).toFixed(2)})` : '';
        details.push(`STARCH: ${item.starch_level.toUpperCase()} ${cost}`);
    }
    if (item.size_charge > 0 || (item.clothing_size && item.clothing_size !== 'm' && item.clothing_size !== 'standard')) {
        const sizeName = (item.clothing_size || 'Std').toUpperCase();
        const cost = item.size_charge ? `(+$${Number(item.size_charge).toFixed(2)})` : '';
        details.push(`SIZE: ${sizeName} ${cost}`);
    }
    if (item.crease === true || item.crease === 'true' || item.crease === 'crease') {
        details.push('CREASE INCLUDED');
    }
    if (item.alterations) {
        const cost = item.additional_charge ? `(+$${Number(item.additional_charge).toFixed(2)})` : '';
        details.push(`ALT: ${item.alterations} ${cost}`);
    }
    if (item.item_instructions) {
        const cost = item.instruction_charge ? `(+$${Number(item.instruction_charge).toFixed(2)})` : '';
        details.push(`NOTE: ${item.item_instructions} ${cost}`);
    }

    const detailsHtml = details.length > 0
      ? `<div style="font-size:9pt; color:#000; margin-top:2px; padding-left:0px; line-height:1.2; font-weight:700;">
           ${details.map(d => `&bull; ${d}`).join('<br>')}
         </div>`
      : '';

    return `
      <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #000;">
         <div style="display:flex; justify-content:space-between; align-items:flex-start; font-size:11pt; font-weight: 800; color: #000; line-height:1.1;">
            <div style="flex:1; text-transform: uppercase;">${item.clothing_name}</div>
            <div style="text-align: right; min-width: 65px;">
                <span style="margin-right: 2px;">${quantity}</span>
                <span>$${plantLineTotal.toFixed(2)}</span>
            </div>
        </div>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="width:58mm; margin:0 auto; font-family: 'Arial', 'Helvetica', sans-serif; font-weight: 700; color:#000; background: white; padding: 2px;">
      
      <div style="text-align:center; margin-bottom: 10px;">
        <div style="font-size:20pt; font-weight:900; letter-spacing: -1px;">${ticket.ticket_number}</div>
        <div style="font-size:10pt; font-weight:700;">${dateStr} ${timeStr}</div>
      </div>

      <div style="border-bottom: 3px solid #000; margin-bottom: 10px; padding-bottom: 4px;">
        <div style="font-weight:900; font-size:14pt; text-transform: uppercase; line-height:1.1;">
            ${ticket.customer_name}
        </div>
        ${ticket.rack_number ? `<div style="font-size:14pt; font-weight:900; margin-top:4px;">RACK: ${ticket.rack_number}</div>` : ''}
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-bottom:10px; padding:4px; border:3px solid #000; font-weight:900; font-size:11pt; text-align:center; text-transform:uppercase;">
          ${ticket.special_instructions}
        </div>
      ` : ''}

      <div style="margin-bottom: 10px;">
        ${itemsHtml}
      </div>

      <div style="border-top: 2px dashed #000; margin-bottom: 8px;"></div>

      <div style="font-size:11pt; font-weight:700; line-height: 1.4;">
        <div style="display:flex; justify-content:space-between;"> 
          <div>Subtotal:</div> <div>$${plantSubtotal.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10pt;"> 
          <div>Env Fee (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10pt;"> 
          <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> 
        </div>

        <div style="border-top: 3px solid #000; margin-top: 6px; padding-top: 4px;"></div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:15pt; font-weight:900; margin-top:2px;">
          <div>TOTAL:</div>
          <div>$${finalPlantTotal.toFixed(2)}</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:12pt; font-weight:700;">
          <div>Paid:</div>
          <div>$${paid.toFixed(2)}</div>
        </div>

        ${isPaid ? `
          <div style="text-align:center; margin-top:8px; border: 3px solid #000; padding: 4px; font-weight:900; font-size:14pt;">PAID IN FULL</div>
        ` : `
          <div style="display:flex; justify-content:space-between; font-weight:900; margin-top:8px; font-size:13pt; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0;"> 
            <div>BALANCE:</div> 
            <div>$${balance.toFixed(2)}</div> 
          </div>
        `}
      </div>
      
      <div style="margin-top:15px; text-align:center;">
        <div style="border: 3px solid #000; display:inline-block; padding: 4px 10px; font-weight:900; font-size:14pt; text-transform:uppercase;">
            PIECES: ${totalPieces}
        </div>
      </div>

    </div>
  `;
}

export default renderPlantReceiptHtml;
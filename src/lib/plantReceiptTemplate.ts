import { Ticket } from '../types';

export function renderPlantReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners") {
  const items = ticket.items || [];

  // --- 1. CALCULATIONS (Plant Specific) ---
  const totalPlantPrice = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const plantPrice = Number(item.plant_price) || 0;
    const additional = Number(item.additional_charge) || 0;
    
    return sum + (plantPrice * quantity) + additional;
  }, 0);

  const envCharge = totalPlantPrice * 0.047;
  const tax = totalPlantPrice * 0.0825;
  const finalPlantTotal = totalPlantPrice + envCharge + tax;

  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);

  const isPickedUp = ticket.status === 'picked_up';
  
  const statusDate = isPickedUp
    ? `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
    : new Date(ticket.created_at || Date.now()).toLocaleDateString();

  // --- 2. HEADER INFO ---
  // Plant tags typically just need the Org Name for identification
  // We use the receipt header as a secondary line if present
  const greetingText = ticket.receipt_header 
    ? ticket.receipt_header.split('\n')[0] 
    : "";

  // --- 3. ITEMS LIST ---
  const itemsHtml = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const plantPrice = Number(item.plant_price) || 0;
    const additional = Number(item.additional_charge) || 0;
    const plantLineTotal = (plantPrice * quantity) + additional;

    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') details.push(`Starch: ${item.starch_level}`);
    if (item.crease) details.push('Crease: Yes');
    if (item.alterations) details.push(`<span style="font-weight:900;">Alt: ${item.alterations}</span>`);
    if (additional > 0) details.push(`<span style="font-weight:900;">Add'l: $${additional.toFixed(2)}</span>`);
    if (item.item_instructions) details.push(`<br><span style="font-weight:900;">Note: ${item.item_instructions}</span>`);

    const detailsHtml = details.length > 0
      ? `<div style="font-size:8pt;color:#666;font-style:italic;margin-left:8px;">+ ${details.join(', ')}</div>`
      : '';

    return `
      <div style="margin:4px 0; border-bottom: 1px dotted #ccc;">
        <div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">
            <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>
            <div style="margin-left:8px;min-width:28px;text-align:right">x${quantity}</div>
            <div style="width:56px;text-align:right;margin-left:8px">$${plantLineTotal.toFixed(2)}</div>
        </div>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  // --- 4. FINAL HTML TEMPLATE ---
  return `
    <div style="width:55mm; margin:0 auto; font-family: 'Courier New', Courier, monospace; color:#111; background: white; padding:5px;">
      
      <!-- HEADER SECTION -->
      <div style="text-align:center;">
        <!-- Organization Name (Reserved Space) -->
        <div style="font-size:14pt; font-weight:900; font-family: Arial, sans-serif; margin-bottom: 4px;">
          ${ticket.organization_name || organizationName}
        </div>
        
        <!-- Greeting / Extra Info -->
        ${greetingText ? `<div style="font-size:10pt; margin-bottom:5px;">${greetingText}</div>` : ''}
      </div>

      <!-- TICKET STATUS -->
      <div style="text-align:center; border-top:1px solid #000; padding-top:5px; margin-top:5px;">
        <div style="font-size:26px; font-weight:800; font-family: Arial, sans-serif; letter-spacing:1px;">
          ${ticket.ticket_number}
        </div>
        ${isPickedUp ? `<div style="font-size:12pt;font-weight:900;margin-top:2px;">PICKED UP</div>` : ''}
        <div style="font-size:9pt;">${statusDate}</div>
      </div>

      <div style="margin-top:10px; font-weight:bold; font-size:12pt; border-bottom:2px solid #000;">
        ${ticket.customer_name}
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-top:8px; padding:6px; border:2px solid #000; background-color:#eee; font-weight:bold; font-size:10pt;">
          NOTE: ${ticket.special_instructions}
        </div>
      ` : ''}

      <div style="margin-top:5px;">
        ${itemsHtml}
      </div>

      <!-- TOTALS -->
      <div style="margin-top: 10px; border-top: 2px dashed #000; padding-top: 6px; font-size:10pt; font-weight: 600;">
        <div style="display:flex; justify-content:space-between;"> <div>Plant Sub:</div> <div>$${totalPlantPrice.toFixed(2)}</div> </div>
        <div style="display:flex; justify-content:space-between;"> <div>Env (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> </div>
        <div style="display:flex; justify-content:space-between;"> <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> </div>
        
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:12pt; margin-top:6px; border-top:2px solid #000; padding-top:2px;">
          <div>COST TOTAL:</div> <div>$${finalPlantTotal.toFixed(2)}</div>
        </div>
      </div>
      
      <div style="margin-top:12px; text-align:center; font-weight:800; font-size:12pt; border:2px solid #000; padding:4px;">
        ${totalPieces} PIECES
      </div>
    </div>
  `;
}

export default renderPlantReceiptHtml;
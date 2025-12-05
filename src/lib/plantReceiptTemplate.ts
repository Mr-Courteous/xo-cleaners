import { Ticket } from '../types';

export function renderPlantReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners") {
  const items = ticket.items || [];

  // --- 1. CALCULATIONS ---
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

  // --- 2. PAYMENT LOGIC ---
  const rawPaid = Number(ticket.paid_amount) || 0;
  const displayPaid = rawPaid >= finalPlantTotal ? finalPlantTotal : rawPaid;
  const balance = finalPlantTotal - displayPaid;
  const isPaid = balance <= 0.01;

  // --- 3. HEADER INFO ---
  const greetingText = ticket.receipt_header 
    ? ticket.receipt_header.replace(/\n/g, '<br>') 
    : `Welcome! We appreciate your business.`;

  const footerText = ticket.receipt_footer
    ? ticket.receipt_footer.replace(/\n/g, '<br>')
    : `Thank you for choosing us!`;

  // --- 4. ITEMS LIST ---
  const itemsHtml = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const plantPrice = Number(item.plant_price) || 0;
    const additional = Number(item.additional_charge) || 0;
    const plantLineTotal = (plantPrice * quantity) + additional;

    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') details.push(`STARCH: ${item.starch_level.toUpperCase()}`);
    if (item.crease) details.push('CREASE: YES');
    if (item.alterations) details.push(`ALT: ${item.alterations.toUpperCase()}`);
    if (additional > 0) details.push(`ADD'L: $${additional.toFixed(2)}`);
    if (item.item_instructions) details.push(`NOTE: ${item.item_instructions.toUpperCase()}`);

    const detailsHtml = details.length > 0
      // Reduced to 9.5pt
      ? `<div style="font-size:9.5pt; color:#000; margin-left:8px; font-weight:700; line-height:1.2;">+ ${details.join(', ')}</div>`
      : '';

    return `
      <div style="margin:5px 0; border-bottom: 2px solid #000;">
         <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:11pt; font-weight: 900; color: #000; line-height: 1.2;">
            
            <div style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:5px;">
                ${item.clothing_name.toUpperCase()}
            </div>

            <div style="display:flex; align-items:center; flex-shrink:0;">
                <div style="min-width:28px; text-align:right;">x${quantity}</div>
                <div style="text-align:right; margin-left:8px;">$${plantLineTotal.toFixed(2)}</div>
            </div>

        </div>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  // --- 5. FINAL HTML TEMPLATE ---
  return `
    <div style="width:58mm; margin:0 auto; font-family: 'Courier New', Courier, monospace; color:#000; background: white; padding:5px;">
      
      <div style="text-align:center;">
        <div style="font-size:15pt; font-weight:900; font-family: Arial, sans-serif; margin-bottom: 5px; text-transform:uppercase;">
          ${ticket.organization_name || organizationName}
        </div>
        
        ${greetingText ? `<div style="font-size:10pt; font-weight:800; margin-bottom:10px;">${greetingText}</div>` : ''}
      </div>

      <div style="text-align:center; border-top:2px solid #000; padding-top:6px; margin-top:8px;">
        <div style="font-size:25px; font-weight:900; font-family: Arial, sans-serif; letter-spacing:1px;">
          ${ticket.ticket_number}
        </div>
        ${isPickedUp ? `<div style="font-size:14pt; font-weight:900; margin-top:2px;">PICKED UP</div>` : ''}
        <div style="font-size:9pt; font-weight:800;">${statusDate}</div>
      </div>

      <div style="margin-top:12px; font-weight:900; font-size:12pt; border-bottom:3px solid #000; text-transform:uppercase;">
        ${ticket.customer_name}
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-top:8px; padding:6px; border:3px solid #000; background-color:#eee; font-weight:900; font-size:10pt;">
          NOTE: ${ticket.special_instructions.toUpperCase()}
        </div>
      ` : ''}

      <div style="margin-top:10px;">
        ${itemsHtml}
      </div>

      <div style="margin-top: 12px; border-top: 3px dashed #000; padding-top: 8px; font-size:10pt; font-weight: 800;">
        <div style="display:flex; justify-content:space-between;"> <div>Plant Sub:</div> <div>$${totalPlantPrice.toFixed(2)}</div> </div>
        <div style="display:flex; justify-content:space-between;"> <div>Env (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> </div>
        <div style="display:flex; justify-content:space-between;"> <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> </div>
        
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:13pt; margin-top:10px; border-top:3px solid #000; padding-top:4px;">
          <div>COST TOTAL:</div> <div>$${finalPlantTotal.toFixed(2)}</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10pt;"> 
            <div>Paid Amount:</div> 
            <div>$${displayPaid.toFixed(2)}</div> 
        </div>

        ${isPaid 
            ? `<div style="text-align:center; margin-top:12px; border: 4px solid #000; padding: 4px; font-weight:900; font-size: 16pt;">PAID IN FULL</div>`
            : `<div style="display:flex; justify-content:space-between; font-weight:900; margin-top:10px; font-size:12pt; background: #ddd; padding: 4px;"> 
                 <div>BALANCE DUE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <div style="margin-top:12px; text-align:center; font-weight:900; font-size:12pt; border:3px solid #000; padding:6px;">
        ${totalPieces} PIECES
      </div>

      <div style="margin-top:15px; text-align:center; font-size:9pt; font-weight:800; border-top:1px dashed #000; padding-top:10px;">
        ${footerText}
      </div>
    </div>
  `;
}

export default renderPlantReceiptHtml;
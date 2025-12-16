import { Ticket } from '../types';

export function renderPickupReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners") {
    const items = ticket.items || [];

    // --- 1. CALCULATIONS ---
    const subtotal = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0);
    const paid = Number(ticket.paid_amount) || 0;

    const envCharge = subtotal * 0.047; // 4.7%
    const tax = subtotal * 0.0825;      // 8.25%
    
    const finalTotal = subtotal + envCharge + tax;
    const balance = finalTotal - paid;
    const isPaid = balance <= 0.01;

    const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);
    
    const pickedUpDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // --- 2. BRANDING & TEXT ---
    const greetingText = ticket.receipt_header 
      ? ticket.receipt_header.replace(/\n/g, '<br>') 
      : `Thank you!`;

    const footerText = ticket.receipt_footer
      ? ticket.receipt_footer.replace(/\n/g, '<br>')
      : `Have a great day!`;

    // --- 3. ITEMS LIST ---
    const itemsHtml = items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const itemTotal = Number(item.item_total) || 0;
        const additional = Number(item.additional_charge) || 0;
        const instructionCharge = Number(item.instruction_charge) || 0; // Added

        const details = [];
        if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') details.push(item.starch_level.toUpperCase());
        if (item.crease) details.push('CREASE');
        if (item.alterations) details.push(`ALT: ${item.alterations.toUpperCase()}`);
        if (additional > 0) details.push(`ADD'L: $${additional.toFixed(2)}`);
        // Added instruction charge display
        if (instructionCharge > 0) details.push(`INST CHG: $${instructionCharge.toFixed(2)}`);
        if (item.item_instructions) details.push(`NOTE: ${item.item_instructions.toUpperCase()}`);

        const detailsHtml = details.length > 0
            // Reduced to 9.5pt but kept bold
            ? `<div style="font-size:9.5pt; color:#000; margin-left:8px; font-weight:700; line-height:1.2;">+ ${details.join(', ')}</div>`
            : '';

        return `
            <div style="margin:5px 0; border-bottom: 2px solid #000; padding-bottom: 3px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:11pt; font-weight: 900; color: #000; line-height: 1.2;">
                    
                    <div style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right: 5px;">
                        ${item.clothing_name.toUpperCase()}
                    </div>

                    <div style="display:flex; align-items:center; flex-shrink:0;">
                        <div style="min-width:28px; text-align:right;">x${quantity}</div>
                        <div style="text-align:right; margin-left:8px;">$${itemTotal.toFixed(2)}</div>
                    </div>

                </div>
                ${detailsHtml}
            </div>
        `;
    }).join('');

    // --- 4. FINAL HTML TEMPLATE ---
    return `
    <div style="width:58mm; margin:0 auto; font-family: 'Courier New', Courier, monospace; color:#000; background: white; padding:5px;">
      
      <div style="text-align:center; margin-bottom: 4px;">
        <div style="font-size:15pt; font-weight:900; font-family: Arial, sans-serif; text-transform:uppercase;">${ticket.organization_name || organizationName}</div>
      </div>
      
      <div style="text-align:center; font-size:10pt; font-weight:800; margin-bottom: 8px;">
        ${greetingText}
      </div>
      
      <div style="text-align:center; margin-top:8px; border-bottom:3px solid #000; padding-bottom:4px;">
        <div style="font-size:20px; font-weight:900; font-family: Arial, sans-serif;">${ticket.ticket_number}</div>
        <div style="font-size:14pt; font-weight:900; margin-top:2px; letter-spacing: 1px;">PICKED UP</div>
        <div style="font-size:9pt; font-weight:800;">${pickedUpDate}</div>
      </div>

      <div style="margin-top:10px; font-weight:900; font-size:12pt; text-transform:uppercase;">
        ${ticket.customer_name}
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-top:8px; padding:6px; border:3px solid #000; background-color:#eee; font-weight:900; font-size:10pt;">
          NOTE: ${ticket.special_instructions.toUpperCase()}
        </div>
      ` : ''}

      <div style="margin-top:8px;">
        ${itemsHtml}
      </div>

      <div style="margin-top: 12px; border-top: 3px dashed #000; padding-top: 6px; font-size:11pt; font-weight: 800;">
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;"> <div>Total:</div> <div>$${finalTotal.toFixed(2)}</div> </div>
        <div style="display:flex; justify-content:space-between;"> <div>Paid:</div> <div>$${paid.toFixed(2)}</div> </div>
        
        ${isPaid 
            ? `<div style="text-align:center; margin-top:10px; font-weight:900; font-size: 16pt; border: 3px solid black; padding: 4px;">PAID</div>`
            : `<div style="display:flex; justify-content:space-between; font-weight:900; margin-top:8px; font-size:12pt; background: #ddd; padding: 4px;"> 
                 <div>BALANCE DUE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <div style="margin-top:12px; text-align:center; font-weight:900; border: 3px solid #000; padding: 4px; font-size: 11pt;">
        TOTAL PIECES: ${totalPieces}
      </div>
      
      <div style="margin-top:15px; text-align:center; font-size:9pt; font-weight:800; border-top:1px dashed #000; padding-top:8px;">
        ${footerText}
      </div>
    </div>
  `;
}

export default renderPickupReceiptHtml;
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
    // The receipt_header from DB is used as the "Greeting" message here
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

        const details = [];
        if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') details.push(item.starch_level);
        if (item.crease) details.push('Crease');
        if (item.alterations) details.push(`<span style="font-weight:900;">Alt: ${item.alterations}</span>`);
        if (additional > 0) details.push(`<span style="font-weight:900;">Add'l: $${additional.toFixed(2)}</span>`);
        if (item.item_instructions) details.push(`<br><span style="font-weight:900;">Note: ${item.item_instructions}</span>`);

        const detailsHtml = details.length > 0
            ? `<div style="font-size:8pt;color:#666;margin-left:8px;font-style:italic;">+ ${details.join(', ')}</div>`
            : '';

        return `
            <div style="margin:4px 0; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
                <div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">
                    <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>
                    <div style="margin-left:8px;min-width:28px;text-align:right">x${quantity}</div>
                    <div style="width:56px;text-align:right;">$${itemTotal.toFixed(2)}</div>
                </div>
                ${detailsHtml}
            </div>
        `;
    }).join('');

    // --- 4. FINAL HTML TEMPLATE ---
    return `
    <div style="width:55mm; margin:0 auto; font-family: 'Courier New', Courier, monospace; color:#111; background: white; padding:5px;">
      
      <!-- HEADER: ORG NAME -->
      <div style="text-align:center; margin-bottom: 4px;">
        <div style="font-size:16pt; font-weight:900; font-family: Arial, sans-serif;">${ticket.organization_name || organizationName}</div>
      </div>
      
      <!-- HEADER: GREETING -->
      <div style="text-align:center; font-size:10pt; font-weight:normal; margin-bottom: 8px;">
        ${greetingText}
      </div>
      
      <!-- TICKET STATUS -->
      <div style="text-align:center; margin-top:10px; border-bottom:2px solid #000; padding-bottom:5px;">
        <div style="font-size:24px; font-weight:800; font-family: Arial, sans-serif;">${ticket.ticket_number}</div>
        <div style="font-size:14pt; font-weight:bold; margin-top:5px;">PICKED UP</div>
        <div style="font-size:9pt;">${pickedUpDate}</div>
      </div>

      <div style="margin-top:10px; font-weight:bold; font-size:11pt;">
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
        <div style="display:flex; justify-content:space-between;"> <div>Total:</div> <div>$${finalTotal.toFixed(2)}</div> </div>
        <div style="display:flex; justify-content:space-between;"> <div>Paid:</div> <div>$${paid.toFixed(2)}</div> </div>
        
        ${isPaid 
            ? `<div style="text-align:center; margin-top:12px; font-weight:900; font-size: 16pt; border: 3px solid black; padding: 5px;">PAID</div>`
            : `<div style="display:flex; justify-content:space-between; font-weight:900; margin-top:6px; font-size:12pt; background: #eee; padding: 2px;"> 
                 <div>BALANCE DUE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <div style="margin-top:12px; text-align:center; font-weight:800; border: 2px solid #000; padding: 4px;">
        TOTAL PIECES: ${totalPieces}
      </div>
      
      <!-- FOOTER -->
      <div style="margin-top:15px; text-align:center; font-size:9pt; border-top:1px dashed #444; padding-top:8px;">
        ${footerText}
      </div>
    </div>
  `;
}

export default renderPickupReceiptHtml;
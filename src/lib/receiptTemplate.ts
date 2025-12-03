import { Ticket } from '../types';

// Updated signature to accept organizationName
export function renderReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners") {
  const items = ticket.items || [];

  // --- 1. CALCULATIONS ---
  const subtotal = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0);
  const paid = Number(ticket.paid_amount) || 0;

  // Standard Dry Cleaning Fees
  const envCharge = subtotal * 0.047; // 4.7%
  const tax = subtotal * 0.0825;      // 8.25%
  
  const finalTotal = subtotal + envCharge + tax;
  const balance = finalTotal - paid;
  const isPaid = balance <= 0.01; 

  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);

  // --- 2. BRANDING & TEXT ---
  // The 'receipt_header' from DB is now treated as the Greeting/Message
  const greetingText = ticket.receipt_header 
    ? ticket.receipt_header.replace(/\n/g, '<br>') 
    : `Welcome! We appreciate your business.`;

  const footerText = ticket.receipt_footer
    ? ticket.receipt_footer.replace(/\n/g, '<br>')
    : `Thank you for choosing us!`;

  // --- 3. ITEMS LIST GENERATION ---
  const itemsHtml = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const itemTotal = Number(item.item_total) || 0;
    const additional = Number(item.additional_charge) || 0;

    // Collect item details (Starch, Crease, Notes)
    const details = [];
    if (item.starch_level && item.starch_level !== 'none' && item.starch_level !== 'no_starch') {
      details.push(`Starch: ${item.starch_level}`);
    }
    if (item.crease) details.push('Crease');
    if (item.alterations) {
      details.push(`<span style="font-weight:900; color:#000;">Alt: ${item.alterations}</span>`);
    }
    if (additional > 0) {
        details.push(`<span style="font-weight:900; color:#000;">Add'l: $${additional.toFixed(2)}</span>`);
    }
    if (item.item_instructions) {
      details.push(`<br> <span style="font-weight:900; color:#000;">Note: ${item.item_instructions}</span>`);
    }

    const detailsHtml = details.length > 0
      ? `<div style="font-size:8pt;color:#666;font-style:italic;margin-left:8px;line-height:1.2;">+ ${details.join(', ')}</div>`
      : '';

    return `
      <div style="margin:4px 0; border-bottom: 1px dotted #ddd; padding-bottom: 2px;">
        <div style="display:flex;justify-content:space-between;font-size:10pt;font-weight: 600;">
            <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.clothing_name}</div>
            <div style="margin-left:8px;min-width:28px;text-align:right">x${quantity}</div>
            <div style="width:56px;text-align:right;margin-left:8px">$${itemTotal.toFixed(2)}</div>
        </div>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  // --- 4. FINAL HTML TEMPLATE ---
  return `
    <div style="width:55mm; margin:0 auto; font-family: 'Courier New', Courier, monospace; color:#111; background: white; padding: 5px;">
      
      <!-- HEADER SECTION -->
      <div style="text-align:center;">
        <!-- Organization Name (Reserved Space) -->
        <div style="font-size:16pt; font-weight:900; font-family: Arial, sans-serif; margin-bottom: 4px; line-height: 1.1;">
          ${ticket.organization_name || organizationName}
        </div>
        
        <!-- Greeting / Message -->
        <div style="font-size:9pt; font-weight:normal; margin-bottom: 8px;">
          ${greetingText}
        </div>
      </div>
      
      <!-- TICKET INFO -->
      <div style="text-align:center; margin-top:8px; border-top:2px dashed #000; padding-top:6px;">
        <div style="font-size:10pt; font-weight:900;">CUSTOMER TICKET</div>
        <div style="font-size:26px; font-weight:800; font-family: Arial, sans-serif; letter-spacing: 1px;">
          ${ticket.ticket_number}
        </div>
        <div style="font-size:9pt;">
          Dropped: ${new Date(ticket.created_at || Date.now()).toLocaleDateString()}
        </div>
      </div>

      <!-- CUSTOMER INFO -->
      <div style="margin-top:10px; font-weight:bold; font-size:11pt; border-bottom:2px solid #000; padding-bottom: 2px;">
        ${ticket.customer_name}
      </div>

      <!-- SPECIAL INSTRUCTIONS -->
      ${ticket.special_instructions ? `
        <div style="margin-top:8px; padding:6px; border:2px solid #000; background-color:#eee; font-weight:bold; font-size:10pt;">
          NOTE: ${ticket.special_instructions}
        </div>
      ` : ''}

      <!-- ITEMS LIST -->
      <div style="margin-top:8px;">
        ${itemsHtml}
      </div>

      <!-- TOTALS SECTION -->
      <div style="margin-top: 12px; border-top: 2px dashed #000; padding-top: 6px; font-size:10pt; font-weight: 600;">
        <div style="display:flex; justify-content:space-between;"> 
          <div>Subtotal:</div> <div>$${subtotal.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between;"> 
          <div>Env (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between;"> 
          <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> 
        </div>
        
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:13pt; margin-top:8px; border-top:2px solid #000; padding-top:4px;">
          <div>TOTAL:</div> <div>$${finalTotal.toFixed(2)}</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10pt;"> 
            <div>Paid Amount:</div> 
            <div>$${paid.toFixed(2)}</div> 
        </div>

        ${isPaid 
            ? `<div style="text-align:center; margin-top:12px; border: 3px solid #000; padding: 4px; font-weight:900; font-size: 16pt;">PAID IN FULL</div>`
            : `<div style="display:flex; justify-content:space-between; font-weight:900; margin-top:8px; font-size:12pt; background: #eee; padding: 2px;"> 
                 <div>BALANCE DUE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <!-- PIECE COUNT -->
      <div style="margin-top:12px; text-align:center; font-weight:800; font-size:12pt; border:2px solid #000; padding:4px;">
        TOTAL PIECES: ${totalPieces}
      </div>
      
      <!-- PICKUP DATE -->
      <div style="margin-top:12px; text-align:center; font-size:11pt; font-weight: bold;">
        Pickup: ${ticket.pickup_date ? new Date(ticket.pickup_date).toLocaleDateString() : 'See Counter'}
      </div>

      <!-- FOOTER -->
      <div style="margin-top:15px; text-align:center; font-size:9pt; border-top:1px dashed #444; padding-top:8px;">
        ${footerText}
      </div>

    </div>
  `;
}

export default renderReceiptHtml;
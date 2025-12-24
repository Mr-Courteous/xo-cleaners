import { Ticket } from '../types';

export function renderPickupReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners") {
  const items = ticket.items || [];

  // --- CALCULATIONS ---
  // subtotal is sum of item.item_total (which typically includes margin)
  const subtotal = items.reduce((sum, item) => sum + (Number(item.item_total) || 0), 0);
  // show margin separately for transparency (informational)
  const totalMargin = items.reduce((sum, item) => sum + (Number(item.margin) || 0), 0);
  const paid = Number(ticket.paid_amount) || 0;
  const envCharge = subtotal * 0.047;
  const tax = subtotal * 0.0825;
  const finalTotal = subtotal + envCharge + tax;
  // prefer ticket.total_amount when provided, otherwise computed finalTotal
  const displayTotal = ticket.total_amount ? Number(ticket.total_amount) : finalTotal;
  const balance = displayTotal - paid;
  const isPaid = balance <= 0.05;
  const totalPieces = items.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.pieces) || 1)), 0);
  
  const pickedUpDate = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const greetingText = ticket.receipt_header ? ticket.receipt_header.replace(/\n/g, '<br>') : `Thank you!`;
  const footerText = ticket.receipt_footer ? ticket.receipt_footer.replace(/\n/g, '<br>') : `Have a great day!`;

  // --- ITEMS LIST ---
  const itemsHtml = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const itemTotal = Number(item.item_total) || 0;
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
          ? `<div style="font-size:9pt; color:#000; margin-top:2px; padding-left:0px; line-height:1.2; font-weight:400;">${details.map(d => `&bull; ${d}`).join('<br>')}</div>`
          : '';

    return `
      <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #000;">
         <div style="display:flex; align-items:baseline; font-size:11pt; font-weight:700; color: #000; line-height:1.1;">
            <div style="flex:1; text-transform: uppercase; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-right:8px;">${item.clothing_name}</div>
            <div style="width:28px; text-align:right; margin-right:6px; font-weight:700;">x${quantity}</div>
            <div style="width:64px; text-align:right; font-weight:700;">$${itemTotal.toFixed(2)}</div>
        </div>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="width:58mm; margin:0 auto; font-family: 'Arial', 'Helvetica', sans-serif; font-weight:400; color:#000; background: white; padding: 2px;">
      
      <div style="text-align:center; margin-bottom: 8px;">
        <div style="font-size:15pt; font-weight:400; text-transform:uppercase; margin-bottom: 4px;">${ticket.organization_name || organizationName}</div>
        <div style="font-size:10pt; font-weight:400;">${greetingText}</div>
      </div>
      
      <div style="border-top: 2px dashed #000; margin-bottom: 8px;"></div>

      <div style="text-align:center; margin-bottom: 8px;">
        <div style="font-size:20pt; font-weight:700; letter-spacing: -1px;">${ticket.ticket_number}</div>
        
        <div style="font-size:15pt; font-weight:400; margin-top:8px; border: 4px solid black; display:inline-block; padding: 4px 8px; transform: rotate(-2deg);">PICKED UP</div>
        <div style="font-size:10pt; font-weight:400; margin-top:6px;">${pickedUpDate}</div>
      </div>

      <div style="border-bottom: 3px solid #000; margin-bottom: 10px; padding-bottom: 4px;">
        <div style="font-weight:400; font-size:12pt; text-transform: uppercase; line-height:1.1;">
            ${ticket.customer_name}
        </div>
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-bottom:10px; padding:4px; border:3px solid #000; font-weight:400; font-size:11pt; text-align:center; text-transform:uppercase;">
          ${ticket.special_instructions}
        </div>
      ` : ''}

      <div style="margin-bottom: 10px;">
        ${itemsHtml}
      </div>

      <div style="border-top: 2px dashed #000; margin-bottom: 8px;"></div>

      <div style="font-size:11pt; font-weight:400; line-height: 1.4;">
        <div style="display:flex; justify-content:space-between;"> 
          <div>Subtotal:</div> <div>$${subtotal.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between;"> 
          <div>Margin (informational):</div> <div>$${totalMargin.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10pt;"> 
          <div>Env Fee (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10pt;"> 
          <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> 
        </div>

        <div style="border-top: 3px solid #000; margin-top: 6px; padding-top: 4px;"></div>

        <div style="display:flex; justify-content:space-between; font-size:14pt; font-weight:400; margin-top:2px;">
          <div>TOTAL:</div> <div>$${displayTotal.toFixed(2)}</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:12pt; font-weight:400;"> 
          <div>Paid:</div> 
          <div>$${paid.toFixed(2)}</div> 
        </div>

        ${isPaid 
            ? `<div style="text-align:center; margin-top:12px; border: 4px solid #000; padding: 4px; font-weight:400; font-size: 14pt;">PAID IN FULL</div>`
            : `<div style="display:flex; justify-content:space-between; font-weight:400; margin-top:8px; font-size:12pt; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0;"> 
                 <div>BALANCE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
        }
      </div>
      
      <div style="margin-top:15px; text-align:center;">
        <div style="border: 3px solid #000; display:inline-block; padding: 4px 10px; font-weight:400; font-size:12pt; text-transform:uppercase;">
            PIECES: ${totalPieces}
        </div>
      </div>
      
    </div>
  `;
}

export default renderPickupReceiptHtml;
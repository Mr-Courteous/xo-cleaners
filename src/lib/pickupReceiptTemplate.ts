import { Ticket } from '../types';

export function renderPickupReceiptHtml(ticket: Ticket, organizationName: string = "Your Cleaners", orgAddress: string = "") {
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
    if (item.alterations || item.alteration_name) {
      const altText = item.alteration_name || item.alterations;
      const altCost = Number(item.alteration_price) || Number(item.additional_charge) || 0;
      const costStr = altCost > 0 ? `(+$${altCost.toFixed(2)})` : '';
      details.push(`ALT: ${altText} ${costStr}`);
    }
    if (item.item_instructions) {
      const cost = item.instruction_charge ? `(+$${Number(item.instruction_charge).toFixed(2)})` : '';
      details.push(`NOTE: ${item.item_instructions} ${cost}`);
    }

    const detailsHtml = details.length > 0
      ? `<div style="font-size:9pt; color:#000; margin-top:2px; padding-left:0px; line-height:1.2; font-weight:400;">${details.map(d => `&bull; ${d}`).join('<br>')}</div>`
      : '';

    return `
      <div style="margin-bottom: 6px; padding-bottom: 6px;">
         <div style="display:flex; justify-content:space-between; align-items:flex-start; font-size:11pt; font-weight:400; color: #000; line-height:1.1;">
            <div style="flex:1; display:flex; align-items:center; gap:6px; text-transform: uppercase;">
               <div style="font-weight:700; font-size:11pt; min-width:20px; text-align:left;">${quantity}</div>
               <div style="flex:1;">${item.clothing_name}</div>
            </div>
            <div style="text-align: right; min-width: 65px;">
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        </div>
        ${detailsHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="width:58mm; margin:4px auto 0; font-family: 'Arial', 'Helvetica', sans-serif; font-weight:400; color:#000; background: white; padding: 10px 2px 2px;">
      
      <div style="text-align:center; margin-bottom: 8px;">
        <div style="font-size:13pt; font-weight:400; text-transform:uppercase; margin-bottom:4px; line-height:1;">
        ${ticket.organization_name || organizationName}</div>
        ${orgAddress ? `<div style="font-size:9pt; font-weight:700; color:#000; margin-top:3px; text-align:left;">${orgAddress}</div>` : ''}
      </div>
      
      <div style="text-align:center; margin-bottom: 8px;">
        <div style="font-size:18pt; font-weight:700; letter-spacing: -1px;">${ticket.ticket_number}</div>
        
        <div style="font-size:8pt; font-weight:400; margin-top:6px;">${pickedUpDate}</div>
      </div>

      <div style="margin-bottom: 10px; padding-bottom: 4px;">
        <div style="font-weight:400; font-size:8pt; text-transform: uppercase; line-height:1.1;">
            ${ticket.customer_name}
        </div>
      </div>

      ${ticket.special_instructions ? `
        <div style="margin-bottom:10px; padding:4px; font-weight:900; font-size:7pt; text-align:center; text-transform:uppercase;">
          ${ticket.special_instructions}
        </div>
      ` : ''}

      <div style="margin-bottom: 10px;">
        ${itemsHtml}
      </div>

      <div style="font-size:9pt; font-weight:400; line-height: 1.4;">
        <div style="display:flex; justify-content:space-between;"> 
          <div>Subtotal:</div> <div>$${subtotal.toFixed(2)}</div> 
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10pt; font-weight:800; margin-top:2px;">
            PIECES: ${totalPieces}
        </div>
        <div style="display:flex; justify-content:space-between; font-size:9pt;"> 
          <div>Env Fee (4.7%):</div> <div>$${envCharge.toFixed(2)}</div> 
        </div>
        <div style="display:flex; justify-content:space-between; font-size:9pt;"> 
          <div>Tax (8.25%):</div> <div>$${tax.toFixed(2)}</div> 
        </div>

        <div style="margin-top: 6px; padding-top: 4px;"></div>


        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10pt; font-weight:400;"> 
          <div>Paid:</div> 
          <div>$${paid.toFixed(2)}</div> 
        </div>

        ${isPaid
      ? `<div style="text-align:center; margin-top:12px; padding: 4px; font-weight:400; font-size: 14pt;">PAID IN FULL</div>`
      : `<div style="display:flex; justify-content:space-between; font-weight:400; margin-top:8px; font-size:8pt; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0;"> 
                 <div>BALANCE:</div> 
                 <div>$${balance.toFixed(2)}</div> 
               </div>`
    }
      </div>
      

      
    </div>
  `;
}

export default renderPickupReceiptHtml;
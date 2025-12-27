import { Ticket } from '../types';

// Helper: Format date to "Fri 09-19" format
const formatTagDate = (dateString?: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${day} ${mm}-${dd}`;
};

// Helper: Generate a single block of HTML for one physical tag
const createSingleTagBlock = (
  ticketId: string,
  dateIssued: string,
  fullName: string,
  isLast: boolean
) => {
  const nameLen = fullName.length || 0;
  // Adjust font size dynamically for long names
  const nameFontSize = nameLen > 30 ? '9pt' : '10pt';

  // Page break logic: if it's not the last item, force a page break
  const breakStyle = isLast ? '' : 'page-break-after: always; break-after: page;';

  // CSS is inlined to ensure print compatibility
  // Changed width to max-width: 48mm to prevent cutoff on 55mm paper
  return `
    <div style="${breakStyle} font-family: 'VT323', monospace; width: 100%; max-width: 40mm; margin: 0 auto; box-sizing: border-box; padding: 2px 0; overflow: hidden;">
      <div style="box-sizing:border-box;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; align-items:start;">
          <div style="text-align:left;">
            <div style="font-size:10pt;">${ticketId}</div>
            <div style="font-size:9pt; color:#333; margin-top:2px;">${dateIssued}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10pt;">${ticketId}</div>
            <div style="font-size:${nameFontSize}; color:#000; margin-top:2px; word-wrap: break-word; line-height: 1.1;">${fullName.substring(0, 5)}</div>          </div>
        </div>
      </div>
    </div>
  `;
};

// Main Function: Generates HTML for a specific list of items
export const generateTagHtml = (ticket: Ticket, specificItems?: any[]): string => {
  const itemsToPrint = specificItems || ticket.items || [];

  if (itemsToPrint.length === 0) return '';

  const rawName = ticket.customer_name || ticket.customer_phone || 'Guest';
  const ticketId = ticket.ticket_number || '';
  const dateIssued = formatTagDate(ticket.created_at);

  const allTagBlocks: string[] = [];

  // 1. Flatten items into a simple array of tags (e.g., if qty is 3, push 3 blocks)
  itemsToPrint.forEach((item: any) => {
    const qty = item.quantity || 1;
    for (let i = 0; i < qty; i++) {
      allTagBlocks.push('placeholder'); // We just need to track the count first
    }
  });

  // 2. Generate actual HTML blocks
  const finalHtmlBlocks = allTagBlocks.map((_, index) => {
    const isLast = index === allTagBlocks.length - 1;
    return createSingleTagBlock(ticketId, dateIssued, rawName, isLast);
  });

  // Returns a simple block container. 
  // IMPORTANT: display: block is safer for page breaks than flex.
  return `
    <div style="display: block; width: 100%; font-family: 'Courier New', Courier, monospace;">
      ${finalHtmlBlocks.join('\n')}
    </div>
  `;
};
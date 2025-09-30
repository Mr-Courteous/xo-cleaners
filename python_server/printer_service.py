from escpos.printer import Usb
from datetime import datetime
from typing import Dict, List

class PrinterService:
    def __init__(self):
        # Initialize printer with Epson TM-U220B configuration
        # Vendor ID and Product ID for Epson TM-U220B (Model M188B)
        # You might need to adjust these values based on your specific printer
        self.vendor_id = 0x04b8  # Epson vendor ID
        self.product_id = 0x0202  # TM-U220B product ID
        
    def get_printer(self):
        try:
            return Usb(self.vendor_id, self.product_id)
        except Exception as e:
            raise Exception(f"Failed to connect to printer: {str(e)}")

    def print_ticket(self, ticket_data: Dict):
        try:
            p = self.get_printer()
            
            # Header
            p.set(align='center', double_height=True)
            p.text("AIRPORT CLEANERS \n")
            p.text("-------------------\n")
            
            # Ticket Info
            p.set(align='left', double_height=False)
            p.text(f"Ticket #: {ticket_data['ticket_number']}\n")
            p.text(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            p.text(f"Customer: {ticket_data['customer_name']}\n")
            p.text(f"Phone: {ticket_data['customer_phone']}\n\n")
            
            # Items
            p.set(emphasized=True)
            p.text("ITEMS\n")
            p.set(emphasized=False)
            p.text("-------------------\n")
            
            # Print each item
            for item in ticket_data['items']:
                clothing_name = item.get('clothing_name', 'Item')
                p.text(f"{clothing_name} x{item['quantity']}")
                p.text(f"  ${item['item_total']:.2f}\n")
                
                # Item details
                details = []
                if item['starch_level'] != 'no_starch':
                    details.append(item['starch_level'])
                if item['crease'] == 'crease':
                    details.append('with crease')
                if item.get('additional_charge', 0) > 0:
                    details.append(f"+${item['additional_charge']:.2f} additional")
                
                if details:
                    p.text(f"  ({', '.join(details)})\n")
            
            p.text("\n-------------------\n")
            
            # Special Instructions
            if ticket_data.get('special_instructions'):
                p.set(emphasized=True)
                p.text("Special Instructions:\n")
                p.set(emphasized=False)
                p.text(f"{ticket_data['special_instructions']}\n")
                p.text("-------------------\n")
            
            # Total
            p.set(align='right', emphasized=True)
            p.text(f"Total: ${ticket_data['total_amount']:.2f}\n")
            
            # Footer
            p.set(align='center', emphasized=False)
            p.text("\nThank you for choosing Airport Cleaners!\n")
            p.text("Your clothes are in good hands\n\n")
            
            # Cut paper
            p.cut()
            
            return True
        except Exception as e:
            raise Exception(f"Failed to print ticket: {str(e)}")

printer_service = PrinterService()

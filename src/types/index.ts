export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  last_visit_date?: string;
  created_at: string;
}

export interface ClothingType {
  id: number;
  name: string;
  plant_price: number;
  margin: number;
  total_price: number;
}

export interface TicketItem {
  id?: number;
  clothing_type_id: number;
  clothing_name?: string;
  quantity: number;
  starch_level: 'none' | 'no_starch' | 'light' | 'medium' | 'heavy';
  crease: 'none' | 'crease' | 'no_crease';
  additional_charge: number;
  plant_price: number;
  margin: number;
  item_total: number;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  status: 'dropped_off' | 'in_process' | 'ready' | 'picked_up';
  rack_number?: number;
  total_amount: number;
  drop_off_date: string;
  pickup_date?: string;
  created_at: string;
  special_instructions?: string;
  items?: TicketItem[];
  paid_amount?: number;
}

export interface Rack {
  number: number;
  is_occupied: boolean;
  ticket_id?: number;
  ticket_number?: string;
  customer_name?: string;
  updated_at: string;
}

export interface DashboardStats {
  total_tickets: number;
  pending_pickup: number;
  in_process: number;
  occupied_racks: number;
  available_racks: number;
}
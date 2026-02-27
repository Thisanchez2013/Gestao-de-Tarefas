// src/types/supplier.ts
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  location_name: string;
  email?: string;
  category?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export type SupplierFormData = Pick<Supplier, 'name' | 'phone' | 'location_name' | 'email' | 'category' | 'notes'>;
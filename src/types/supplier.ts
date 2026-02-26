// src/types/supplier.ts
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  location_name: string; // Mudado de locationName para location_name
  user_id: string;
  created_at: string;
}

export type SupplierFormData = Pick<Supplier, 'name' | 'phone' | 'location_name'>;
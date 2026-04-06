export interface Flavor {
  id: string;
  name: string;
  category: 'clasica' | 'especialidad' | 'custom';
}

export interface PupusaOrder {
  flavorId: string;
  arroz: number;
  maiz: number;
}

export interface PersonOrder {
  id: string;
  name: string;
  orders: PupusaOrder[];
}

export type OrderMode = 'per-person' | 'master';

export interface AppState {
  mode: OrderMode;
  persons: PersonOrder[];
  masterOrders: PupusaOrder[];
  flavors: Flavor[];
}

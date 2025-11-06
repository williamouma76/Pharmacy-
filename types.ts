export interface Product {
  id: string;
  name: string;
  dosage?: string;
  price: number;
  description: string;
  stock: number;
  image: string; // Base64 encoded string
  featured?: boolean;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  deliveryOption: 'instant' | 'save';
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  prescription?: string; // Base64 encoded string
}

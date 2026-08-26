export interface MenuItem {
  id?: string;
  _id?: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  categoryId?: string;
  category?: string;
  categoryName?: string;
  imageUrl?: string;
  emoji?: string;
  isAvailable?: boolean;
  preparationTimeMinutes?: number;
  allergens?: string[];
  optionsGroup?: {
    title: string;
    required: boolean;
    options: { name: string; priceDelta: number }[];
  }[];
}

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  nameAr?: string;
  icon?: string;
  itemCount?: number;
  displayOrder?: number;
  isActive?: boolean;
}


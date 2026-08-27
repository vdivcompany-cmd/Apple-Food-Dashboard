export type TenantStatus = 'active' | 'suspended' | 'trial';
export type TenantLanguage = 'ar' | 'en';

export interface TenantContact {
  phone: string;
  email: string;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  language: TenantLanguage;
}

export interface ChatbotSettings {
  offlineMessage?: string;
  aiModelPreference?: string;
}

export interface Tenant {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  status: TenantStatus;
  subscriptionPlan: string;
  subscriptionExpiresAt?: string;
  contact: TenantContact;
  settings: TenantSettings;
  brandName?: string;
  cuisineType?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  hotlineNumber?: string;
  taxNumber?: string;
  openingHours?: string;
  qrRedirectUrl?: string;
  isOpen: boolean;
  isChatbotActive: boolean;
  chatbotSettings?: ChatbotSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileDto {
  brandName?: string;
  cuisineType?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  hotlineNumber?: string;
  taxNumber?: string;
  openingHours?: string;
  qrRedirectUrl?: string;
  isOpen?: boolean;
  isChatbotActive?: boolean;
  chatbotSettings?: ChatbotSettings;
}

export interface UpdateSettingsDto {
  currency?: string;
  timezone?: string;
  language?: TenantLanguage;
}

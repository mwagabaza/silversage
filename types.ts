
export enum Region {
  US = 'United States',
  EU = 'Europe',
  KR = 'South Korea',
  JP = 'Japan',
  AU = 'Australia'
}

export enum Category {
  HOLIDAY = 'Holiday Gift Guide',
  MOBILITY = 'Mobility & Access',
  COGNITION = 'Brain Health & Memory',
  TECH = 'Assistive Tech',
  HOME = 'Home & Living',
  WELLNESS = 'Wellness & Supplements',
  LUXURY = 'Luxury Care'
}

export interface Product {
  id: string;
  name: string;
  brand: string; // Added brand for realism
  description: string;
  price: string;
  currency: string;
  category: string;
  reasoning: string;
  imageUrl?: string;
}

export interface BuyingOption {
  title: string;
  url: string;
  source: string;
}

export interface MarketInsight {
  title: string;
  description: string;
  opportunityLevel: 'High' | 'Medium' | 'Niche';
  tags: string[];
}

export interface LocalResource {
  name: string;
  description: string;
  contactInfo: string; // Phone or Website
  type: 'Government' | 'Non-Profit' | 'Support Group';
}

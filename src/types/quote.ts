export type VehicleType = 'motorcycle' | 'car';

export type MotorcyclePartId =
  | 'front-brake-pads'
  | 'rear-tyre'
  | 'headlight';

export type CarPartId =
  | 'battery'
  | 'front-left-tyre'
  | 'left-headlight';

export type PartId = MotorcyclePartId | CarPartId;

export interface CatalogPart {
  id: PartId;
  vehicle: VehicleType;
  name: string;
  price: number;
  locationLabel: string;
  animationSummary: string;
  staticSummary: string;
  labourListed?: boolean;
}

export interface QuoteItem {
  partId: PartId;
  name: string;
  price: number;
  locationLabel: string;
  labourListed: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export type QuoteLoadStatus = 'loading' | 'ready' | 'error';

export type QuoteSaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

export type AppView = 'decoder' | 'profile';

export type AuthModalMode = 'signin' | 'signup';



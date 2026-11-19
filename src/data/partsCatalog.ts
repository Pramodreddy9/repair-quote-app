import type {CatalogPart, PartId, VehicleType} from '../types/quote';

export const PARTS_CATALOG: Record<VehicleType, CatalogPart[]> = {
  motorcycle: [
    {
      id: 'front-brake-pads',
      vehicle: 'motorcycle',
      name: 'Front brake pads',
      price: 1800,
      locationLabel: 'Front wheel disc caliper',
      animationSummary: 'Close-up: new brake pads sliding toward the front disc',
      staticSummary: 'Front wheel disc caliper · Brake pad replacement preview',
      labourListed: false,
    },
    {
      id: 'rear-tyre',
      vehicle: 'motorcycle',
      name: 'Rear tyre',
      price: 2400,
      locationLabel: 'Rear wheel assembly',
      animationSummary: 'New treaded tyre fitting onto the rear rim',
      staticSummary: 'Rear wheel assembly · Rear tyre replacement preview',
      labourListed: false,
    },
    {
      id: 'headlight',
      vehicle: 'motorcycle',
      name: 'Headlight',
      price: 900,
      locationLabel: 'Front headlamp housing',
      animationSummary: 'Replacement lamp sliding into the front headlamp cowl',
      staticSummary: 'Front headlamp housing · Headlight replacement preview',
      labourListed: false,
    },
  ],
  car: [
    {
      id: 'battery',
      vehicle: 'car',
      name: 'Battery',
      price: 4500,
      locationLabel: 'Engine bay battery tray',
      animationSummary: 'Bonnet opens to reveal the engine bay and battery slides into place',
      staticSummary: 'Engine bay revealed · Battery seated in tray',
      labourListed: false,
    },
    {
      id: 'front-left-tyre',
      vehicle: 'car',
      name: 'Front-left tyre',
      price: 3200,
      locationLabel: 'Front-left wheel (passenger side)',
      animationSummary: 'New tyre sliding onto the front-left hub on the car’s left side',
      staticSummary: 'Front-left wheel · Tyre replacement preview',
      labourListed: false,
    },
    {
      id: 'left-headlight',
      vehicle: 'car',
      name: 'Left headlight',
      price: 2100,
      locationLabel: 'Front-left headlamp cluster',
      animationSummary: 'Replacement headlamp sliding into the left front housing',
      staticSummary: 'Front-left headlamp cluster · Headlight replacement preview',
      labourListed: false,
    },
  ],
};

export function getPartById(vehicle: VehicleType, partId: PartId): CatalogPart | undefined {
  return PARTS_CATALOG[vehicle].find((part) => part.id === partId);
}

export function formatINR(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
}

export const SAMPLE_CHAT_QUESTION = 'Does this include fitting?';


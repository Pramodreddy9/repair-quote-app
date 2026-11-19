import type {Session} from '@supabase/supabase-js';
import {getPartById} from '../data/partsCatalog';
import type {PartId, QuoteItem, VehicleType} from '../types/quote';
import {isSupabaseConfigured, supabase} from './supabase';

export interface SavedRepairQuoteItem {
  id: string;
  name: string;
  price: number;
}

interface RepairQuoteRow {
  owner_id: string;
  vehicle_type: VehicleType;
  items: unknown;
}

let pendingSessionPromise: Promise<Session> | null = null;

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }
  return supabase;
}

export async function ensureVisitorSession(): Promise<Session> {
  if (pendingSessionPromise) {
    return pendingSessionPromise;
  }

  pendingSessionPromise = (async () => {
    const client = requireSupabase();
    const {data: sessionData, error: sessionError} =
      await client.auth.getSession();

    if (sessionError) {
      throw new Error(`Unable to check Supabase session: ${sessionError.message}`);
    }

    if (sessionData.session) {
      return sessionData.session;
    }

    const {data: anonData, error: anonError} =
      await client.auth.signInAnonymously();

    if (anonError) {
      throw new Error(`Anonymous sign-in failed: ${anonError.message}`);
    }

    if (!anonData.session) {
      throw new Error('Anonymous sign-in succeeded without an active session.');
    }

    return anonData.session;
  })();

  try {
    return await pendingSessionPromise;
  } finally {
    pendingSessionPromise = null;
  }
}

function normalizeSavedItems(
  vehicleType: VehicleType,
  rawItems: unknown,
): QuoteItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const normalized: QuoteItem[] = [];
  const seenIds = new Set<string>();

  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const candidate = entry as Partial<SavedRepairQuoteItem>;
    if (typeof candidate.id !== 'string' || !candidate.id.trim()) {
      continue;
    }

    const partId = candidate.id.trim() as PartId;
    if (seenIds.has(partId)) {
      continue;
    }
    seenIds.add(partId);

    const catalogPart = getPartById(vehicleType, partId);
    const parsedPrice = Number(candidate.price);
    const safePrice = Number.isFinite(parsedPrice)
      ? parsedPrice
      : (catalogPart?.price ?? 0);

    normalized.push({
      partId,
      name:
        typeof candidate.name === 'string' && candidate.name.trim()
          ? candidate.name.trim()
          : (catalogPart?.name ?? partId),
      price: safePrice,
      locationLabel: catalogPart?.locationLabel ?? 'Selected part',
      labourListed: Boolean(catalogPart?.labourListed),
    });
  }

  return normalized;
}

export async function loadVisitorQuotes(
  ownerId: string,
): Promise<Record<VehicleType, QuoteItem[]>> {
  const client = requireSupabase();

  const {data, error} = await client
    .from('repair_quotes')
    .select('owner_id, vehicle_type, items')
    .eq('owner_id', ownerId);

  if (error) {
    throw new Error(`Failed to load saved quotes: ${error.message}`);
  }

  const loaded: Record<VehicleType, QuoteItem[]> = {
    motorcycle: [],
    car: [],
  };

  for (const row of (data ?? []) as RepairQuoteRow[]) {
    if (row.vehicle_type === 'motorcycle' || row.vehicle_type === 'car') {
      loaded[row.vehicle_type] = normalizeSavedItems(row.vehicle_type, row.items);
    }
  }

  return loaded;
}

export async function saveVehicleQuote(
  ownerId: string,
  vehicleType: VehicleType,
  quoteItems: QuoteItem[],
): Promise<QuoteItem[]> {
  const client = requireSupabase();

  const itemsPayload: SavedRepairQuoteItem[] = quoteItems.map((item) => ({
    id: item.partId,
    name: item.name,
    price: Number(item.price),
  }));

  const {data, error} = await client
    .from('repair_quotes')
    .upsert(
      {
        owner_id: ownerId,
        vehicle_type: vehicleType,
        items: itemsPayload,
      },
      {onConflict: 'owner_id,vehicle_type'},
    )
    .select('owner_id, vehicle_type, items')
    .single();

  if (error) {
    throw new Error(`Failed to save ${vehicleType} quote: ${error.message}`);
  }

  if (!data) {
    throw new Error('Save did not return a confirmed database row.');
  }

  return normalizeSavedItems(vehicleType, (data as RepairQuoteRow).items);
}

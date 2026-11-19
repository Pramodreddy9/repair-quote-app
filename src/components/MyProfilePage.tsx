import type {User} from '@supabase/supabase-js';
import {
  AlertCircle,
  ArrowLeft,
  Bike,
  Car,
  LogOut,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import {formatINR} from '../data/partsCatalog';
import {getCustomerDisplayName} from '../lib/authService';
import type {QuoteItem, QuoteLoadStatus, VehicleType} from '../types/quote';

interface MyProfilePageProps {
  user: User;
  quotesByVehicle: Record<VehicleType, QuoteItem[]>;
  loadStatus: QuoteLoadStatus;
  loadError: string | null;
  onRetryLoad: () => void;
  onOpenVehicleInDecoder: (vehicle: VehicleType) => void;
  onBackToDecoder: () => void;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
  signOutError: string | null;
}

export function MyProfilePage({
  user,
  quotesByVehicle,
  loadStatus,
  loadError,
  onRetryLoad,
  onOpenVehicleInDecoder,
  onBackToDecoder,
  onSignOut,
  isSigningOut,
  signOutError,
}: MyProfilePageProps) {
  const customerName = getCustomerDisplayName(user);
  const customerEmail = user.email ?? 'No email';

  const vehicles: {type: VehicleType; title: string}[] = [
    {type: 'motorcycle', title: 'Saved motorcycle quote'},
    {type: 'car', title: 'Saved car quote'},
  ];

  return (
    <div className="max-w-[1040px] w-full mx-auto flex flex-col gap-5">
      {/* Top Back Navigation & Account Card */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDecoder}
          className="min-h-[40px] px-3.5 py-2 inline-flex items-center gap-2 text-xs font-medium text-[#111827] bg-white border border-[#E2E6EC] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to quote decoder
        </button>
      </div>

      {/* Customer Profile Details */}
      <section
        aria-label="Customer profile"
        className="bg-white border border-[#E2E6EC] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6 text-[#1D4ED8]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#64748B]">My Profile</p>
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight truncate mt-0.5">
              {customerName}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#526071] break-all">
              <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" aria-hidden="true" />
              {customerEmail}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSignOut()}
          disabled={isSigningOut}
          className="min-h-[42px] px-4 py-2 inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#991B1B] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </button>
      </section>

      {signOutError && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 flex items-start gap-2 text-xs text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
          <span>{signOutError}</span>
        </div>
      )}

      {loadStatus === 'error' && loadError && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#991B1B]"
        >
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={onRetryLoad}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#FCA5A5] rounded-md hover:bg-[#FEE2E2] shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Saved Motorcycle & Car Quotes */}
      <section aria-label="Saved quotes" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {vehicles.map(({type, title}) => {
          const items = quotesByVehicle[type];
          const total = items.reduce((sum, item) => sum + item.price, 0);

          return (
            <div
              key={type}
              className="bg-white border border-[#E2E6EC] rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EEF1F5]">
                  <div className="flex items-center gap-2">
                    {type === 'motorcycle' ? (
                      <Bike className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
                    ) : (
                      <Car className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
                    )}
                    <h3 className="text-base font-semibold text-[#111827]">
                      {title}
                    </h3>
                  </div>
                  <span className="text-xs text-[#64748B]">Sample prices</span>
                </div>

                {loadStatus === 'loading' ? (
                  <p className="text-xs text-[#64748B] py-4">
                    Loading saved items...
                  </p>
                ) : items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFBFD] px-4 py-6 text-center">
                    <p className="text-sm font-medium text-[#334155]">
                      No saved {type} quote items
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      Add parts in the decoder and click Save quote.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#EEF1F5] border border-[#E2E6EC] rounded-lg overflow-hidden">
                    {items.map((item) => (
                      <li
                        key={item.partId}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#111827] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {item.locationLabel}
                          </p>
                        </div>
                        <span
                          className="text-sm font-semibold text-[#111827] tabular-nums shrink-0"
                          style={{fontFamily: 'var(--font-mono)'}}
                        >
                          {formatINR(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-[#EEF1F5] flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-4 text-xs text-[#526071]">
                  <span>Labour</span>
                  <span className="font-medium text-[#334155]">
                    Not specified
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold text-[#111827]">
                    Parts total
                  </span>
                  <span
                    className="text-base font-semibold text-[#111827] tabular-nums"
                    style={{fontFamily: 'var(--font-mono)'}}
                  >
                    {formatINR(total)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenVehicleInDecoder(type)}
                  className="mt-1 min-h-[40px] px-4 py-2 text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                >
                  Open {type} in decoder
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

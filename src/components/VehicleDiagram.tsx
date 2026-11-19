import {RotateCcw} from 'lucide-react';
import {getPartById} from '../data/partsCatalog';
import type {CarPartId, MotorcyclePartId, PartId, VehicleType} from '../types/quote';
import {CarDiagramSVG} from './CarDiagramSVG';
import {MotorcycleDiagramSVG} from './MotorcycleDiagramSVG';

interface VehicleDiagramProps {
  vehicle: VehicleType;
  activePartId: PartId | null;
  addedPartIds: Set<PartId>;
  animationKey: number;
  prefersReducedMotion: boolean;
  onReplayActivePart: () => void;
  onSelectPartHotspot: (partId: PartId) => void;
}

export function VehicleDiagram({
  vehicle,
  activePartId,
  addedPartIds,
  animationKey,
  prefersReducedMotion,
  onReplayActivePart,
  onSelectPartHotspot,
}: VehicleDiagramProps) {
  const activePart = activePartId ? getPartById(vehicle, activePartId) : undefined;

  return (
    <section
      aria-label="Vehicle diagram"
      className="bg-white border border-[#E2E6EC] rounded-xl p-4 sm:p-5 flex flex-col gap-4"
    >
      {/* Diagram Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <h2 className="text-base sm:text-lg font-semibold text-[#111827] tracking-tight">
            {vehicle === 'motorcycle' ? 'Motorcycle diagram' : 'Car diagram'}
          </h2>
          <span className="text-xs text-[#64748B]">
            {vehicle === 'motorcycle' ? 'Side profile' : 'Front three-quarter view'}
          </span>
        </div>
        <span className="text-xs font-medium text-[#526071]">
          Illustrative preview
        </span>
      </div>

      {/* Main SVG Canvas */}
      <div className="w-full rounded-lg border border-[#E5E9F0] bg-[#FAFBFD] overflow-hidden">
        {vehicle === 'motorcycle' ? (
          <MotorcycleDiagramSVG
            activePartId={(activePartId as MotorcyclePartId | null) ?? null}
            addedPartIds={addedPartIds}
            animationKey={animationKey}
            prefersReducedMotion={prefersReducedMotion}
            onSelectPartHotspot={(id) => onSelectPartHotspot(id)}
          />
        ) : (
          <CarDiagramSVG
            activePartId={(activePartId as CarPartId | null) ?? null}
            addedPartIds={addedPartIds}
            animationKey={animationKey}
            prefersReducedMotion={prefersReducedMotion}
            onSelectPartHotspot={(id) => onSelectPartHotspot(id)}
          />
        )}
      </div>

      {/* Active Part Status / Replay Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EEF1F5] min-h-[44px]">
        {activePart ? (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-[#111827]">
                  {activePart.name}
                </span>
                <span className="text-xs text-[#CBD5E1]" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium text-[#EA580C]">
                  {activePart.locationLabel}
                </span>
              </div>
              <p className="text-xs text-[#526071] mt-0.5">
                {prefersReducedMotion
                  ? `${activePart.staticSummary} (Reduced motion: static highlight)`
                  : activePart.animationSummary}
              </p>
            </div>
            {!prefersReducedMotion && (
              <button
                type="button"
                onClick={onReplayActivePart}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Replay
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-[#64748B]">
            Add a part from the quote panel to highlight its location and preview the proposed replacement.
          </p>
        )}
      </div>
    </section>
  );
}

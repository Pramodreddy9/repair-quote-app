import {useState, type FormEvent} from 'react';
import {
  AlertCircle,
  Bike,
  Car,
  Check,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import {
  formatINR,
  PARTS_CATALOG,
  SAMPLE_CHAT_QUESTION,
} from '../data/partsCatalog';
import type {
  CatalogPart,
  ChatMessage,
  PartId,
  QuoteItem,
  QuoteLoadStatus,
  QuoteSaveStatus,
  VehicleType,
} from '../types/quote';

interface QuotePanelProps {
  vehicle: VehicleType;
  onVehicleChange: (vehicle: VehicleType) => void;
  quoteItems: QuoteItem[];
  activePartId: PartId | null;
  onAddPart: (part: CatalogPart) => void;
  onSelectQuoteItem: (partId: PartId) => void;
  onRemoveQuoteItem: (partId: PartId) => void;
  loadStatus: QuoteLoadStatus;
  loadError: string | null;
  onRetryLoad: () => void;
  saveStatus: QuoteSaveStatus;
  saveError: string | null;
  onSaveQuote: () => void;
  isSignedOut: boolean;
  onContinueAsGuest: () => void;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  chatError: string | null;
  onSendChatQuestion: (question: string) => void;
}

export function QuotePanel({
  vehicle,
  onVehicleChange,
  quoteItems,
  activePartId,
  onAddPart,
  onSelectQuoteItem,
  onRemoveQuoteItem,
  loadStatus,
  loadError,
  onRetryLoad,
  saveStatus,
  saveError,
  onSaveQuote,
  isSignedOut,
  onContinueAsGuest,
  chatMessages,
  isChatLoading,
  chatError,
  onSendChatQuestion,
}: QuotePanelProps) {
  const [chatInput, setChatInput] = useState('');
  const catalogParts = PARTS_CATALOG[vehicle];
  const addedPartIds = new Set(quoteItems.map((item) => item.partId));
  const partsTotal = quoteItems.reduce((sum, item) => sum + item.price, 0);
  const hasExplicitLabour = quoteItems.some((item) => item.labourListed);
  const isSaveDisabled =
    isSignedOut || loadStatus !== 'ready' || saveStatus === 'saving';

  const handleChatSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }
    onSendChatQuestion(trimmed);
    setChatInput('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Quote & Part Selection Panel */}
      <section
        aria-label="Repair quote"
        className="bg-white border border-[#E2E6EC] rounded-xl p-4 sm:p-5 flex flex-col gap-5"
      >
        {/* Vehicle Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EEF1F5]">
          <div>
            <h2 className="text-base font-semibold text-[#111827] tracking-tight">
              Repair quote
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Separate quote saved for each vehicle
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Vehicle type"
            className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E6EC]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={vehicle === 'motorcycle'}
              onClick={() => onVehicleChange('motorcycle')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                vehicle === 'motorcycle'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#526071] hover:text-[#111827]'
              }`}
            >
              <Bike className="w-3.5 h-3.5" aria-hidden="true" />
              Motorcycle
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vehicle === 'car'}
              onClick={() => onVehicleChange('car')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                vehicle === 'car'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#526071] hover:text-[#111827]'
              }`}
            >
              <Car className="w-3.5 h-3.5" aria-hidden="true" />
              Car
            </button>
          </div>
        </div>

        {/* Startup Load Error Banner */}
        {loadStatus === 'error' && loadError && (
          <div
            role="alert"
            className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs text-[#991B1B]"
          >
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">Unable to load saved quotes</p>
                <p className="mt-0.5 text-[#7F1D1D] break-words">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRetryLoad}
              className="px-2.5 py-1.5 text-xs font-medium text-[#991B1B] bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Add Parts Buttons */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#111827]">
              Add parts to quote
            </h3>
            <span className="text-xs font-medium text-[#64748B]">
              Sample prices
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {catalogParts.map((part) => {
              const isAdded = addedPartIds.has(part.id);
              const isActive = activePartId === part.id;

              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => onAddPart(part)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                    isActive
                      ? 'border-[#1D4ED8] bg-[#EFF6FF]/70'
                      : isAdded
                        ? 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#94A3B8]'
                        : 'border-[#E2E6EC] bg-white hover:border-[#1D4ED8] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Plus
                      className={`w-4 h-4 shrink-0 ${
                        isAdded ? 'text-[#64748B]' : 'text-[#1D4ED8]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-[#111827] truncate">
                      Add {part.name}
                    </span>
                  </span>

                  <span className="flex items-center gap-2.5 shrink-0">
                    <span
                      className="text-sm font-semibold text-[#111827] tabular-nums"
                      style={{fontFamily: 'var(--font-mono)'}}
                    >
                      {formatINR(part.price)}
                    </span>
                    {isAdded && (
                      <span className="text-[11px] font-medium text-[#526071]">
                        Added
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Added Quote Line Items */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-[#EEF1F5]">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#111827]">
              Quote items
            </h3>
            <span className="text-xs text-[#64748B]">
              {quoteItems.length === 0
                ? 'Empty'
                : `${quoteItems.length} ${quoteItems.length === 1 ? 'item' : 'items'} · Click row to replay`}
            </span>
          </div>

          {quoteItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFBFD] px-4 py-5 text-center">
              <p className="text-sm font-medium text-[#334155]">
                Your {vehicle} quote is empty
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Click any Add button above to add a part, highlight its location, and preview the replacement.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EEF1F5] border border-[#E2E6EC] rounded-lg overflow-hidden">
              {quoteItems.map((item) => {
                const isSelected = activePartId === item.partId;
                return (
                  <li
                    key={item.partId}
                    className={`flex items-center justify-between gap-2 transition-colors ${
                      isSelected ? 'bg-[#EFF6FF]' : 'bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectQuoteItem(item.partId)}
                      className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#1D4ED8]"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#111827] truncate">
                            {item.name}
                          </span>
                          {isSelected && (
                            <RotateCcw
                              className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span className="block text-xs text-[#64748B] truncate mt-0.5">
                          {item.locationLabel}
                        </span>
                      </span>

                      <span
                        className="text-sm font-semibold text-[#111827] tabular-nums shrink-0"
                        style={{fontFamily: 'var(--font-mono)'}}
                      >
                        {formatINR(item.price)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveQuoteItem(item.partId)}
                      aria-label={`Remove ${item.name}`}
                      className="min-h-[44px] px-3 text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#DC2626]"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Running Total & Labour Status */}
          <dl className="mt-1 pt-3 border-t border-[#EEF1F5] flex flex-col gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[#526071]">
                Labour
              </dt>
              <dd className="font-medium text-[#334155]">
                {hasExplicitLabour ? 'Listed in quote' : 'Not specified'}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-2 border-t border-[#EEF1F5]">
              <dt className="font-semibold text-[#111827]">
                Parts total <span className="text-xs font-normal text-[#64748B]">(Sample prices)</span>
              </dt>
              <dd
                className="text-lg font-semibold text-[#111827] tabular-nums"
                style={{fontFamily: 'var(--font-mono)'}}
              >
                {formatINR(partsTotal)}
              </dd>
            </div>
          </dl>

          {/* Save Quote Controls & Sync Status */}
          <div className="mt-2 pt-3 border-t border-[#EEF1F5] flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-medium min-h-[20px] flex flex-wrap items-center gap-2">
                {isSignedOut ? (
                  <>
                    <span className="text-[#526071]">
                      Signed out ·
                    </span>
                    <button
                      type="button"
                      onClick={onContinueAsGuest}
                      className="text-[#1D4ED8] hover:underline font-semibold cursor-pointer"
                    >
                      Continue as guest to save
                    </button>
                  </>
                ) : (
                  <>
                    {loadStatus === 'loading' && (
                      <span className="text-[#64748B]">Loading saved quotes...</span>
                    )}
                    {loadStatus === 'error' && (
                      <span className="text-[#991B1B]">Save unavailable until load succeeds</span>
                    )}
                    {loadStatus === 'ready' && saveStatus === 'saving' && (
                      <span className="text-[#526071]">Saving {vehicle} quote...</span>
                    )}
                    {loadStatus === 'ready' && saveStatus === 'unsaved' && (
                      <span className="text-[#B45309]">Unsaved changes</span>
                    )}
                    {loadStatus === 'ready' && saveStatus === 'saved' && (
                      <span className="inline-flex items-center gap-1 text-[#047857]">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Saved
                      </span>
                    )}
                    {loadStatus === 'ready' && saveStatus === 'idle' && (
                      <span className="text-[#64748B]">
                        Saves {vehicle} quote only
                      </span>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onSaveQuote}
                disabled={isSaveDisabled}
                className="min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#CBD5E1] disabled:text-[#475569] disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save quote'}
              </button>
            </div>

            {saveError && (
              <div
                role="alert"
                className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-semibold">Save failed — local edits kept</p>
                  <p className="mt-0.5 text-[#7F1D1D] break-words">{saveError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Demo Chat Panel */}
      <section
        aria-label="Demo chat"
        className="bg-white border border-[#E2E6EC] rounded-xl p-4 sm:p-5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#111827] tracking-tight">
              Demo chat
            </h2>
          </div>
          <span className="text-xs text-[#64748B]">
            Prototype preview
          </span>
        </div>

        {/* Sample Question Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#64748B]">Try sample question:</span>
          <button
            type="button"
            disabled={isChatLoading}
            onClick={() => onSendChatQuestion(SAMPLE_CHAT_QUESTION)}
            className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] disabled:opacity-60 border border-[#BFDBFE] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            {SAMPLE_CHAT_QUESTION}
          </button>
        </div>

        {/* Chat Thread */}
        {(chatMessages.length > 0 || isChatLoading) && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto rounded-lg bg-[#FAFBFD] border border-[#EEF1F5] p-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`text-xs leading-relaxed px-3 py-2 rounded-lg max-w-[92%] ${
                  msg.sender === 'user'
                    ? 'self-end bg-[#1D4ED8] text-white'
                    : 'self-start bg-white border border-[#E2E6EC] text-[#1E293B]'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isChatLoading && (
              <div className="text-xs px-3 py-2 rounded-lg self-start bg-white border border-[#E2E6EC] text-[#64748B]">
                Getting reply...
              </div>
            )}
          </div>
        )}

        {/* Chat Error Banner */}
        {chatError && (
          <div
            role="alert"
            className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
            <span className="break-words">{chatError}</span>
          </div>
        )}

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
          <label htmlFor="demo-chat-input" className="sr-only">
            Ask a question about this repair quote
          </label>
          <input
            id="demo-chat-input"
            type="text"
            disabled={isChatLoading}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about this quote..."
            className="flex-1 min-w-0 min-h-[40px] px-3 py-2 text-sm bg-[#FAFBFD] border border-[#D1D5DB] rounded-lg text-[#111827] placeholder:text-[#94A3B8] disabled:opacity-60 focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
          />
          <button
            type="submit"
            disabled={isChatLoading}
            aria-label="Send message"
            className="min-h-[40px] px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#111827] hover:bg-[#1E293B] disabled:bg-[#94A3B8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            {isChatLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>
    </div>
  );
}

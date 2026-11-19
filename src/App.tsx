import {useCallback, useEffect, useRef, useState} from 'react';
import type {Session, User} from '@supabase/supabase-js';
import {User as UserIcon} from 'lucide-react';
import {AuthModal} from './components/AuthModal';
import {MyProfilePage} from './components/MyProfilePage';
import {QuotePanel} from './components/QuotePanel';
import {VehicleDiagram} from './components/VehicleDiagram';
import {usePrefersReducedMotion} from './hooks/usePrefersReducedMotion';
import {
  consumeUrlConfirmationIfPresent,
  getCustomerDisplayName,
  hasPendingPasswordSetup,
  isGuestUser,
  isRegisteredCustomer,
  signOutCustomer,
  startGuestSession,
} from './lib/authService';
import {
  ensureVisitorSession,
  loadVisitorQuotes,
  saveVehicleQuote,
} from './lib/repairQuotesService';
import {supabase} from './lib/supabase';
import type {
  AppView,
  AuthModalMode,
  CatalogPart,
  ChatMessage,
  PartId,
  QuoteItem,
  QuoteLoadStatus,
  QuoteSaveStatus,
  VehicleType,
} from './types/quote';

export default function App() {
  const [vehicle, setVehicle] = useState<VehicleType>('motorcycle');
  const [quotesByVehicle, setQuotesByVehicle] = useState<
    Record<VehicleType, QuoteItem[]>
  >({
    motorcycle: [],
    car: [],
  });
  const [activePartByVehicle, setActivePartByVehicle] = useState<
    Record<VehicleType, PartId | null>
  >({
    motorcycle: null,
    car: null,
  });
  const [animationKey, setAnimationKey] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSignedOut, setIsSignedOut] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('decoder');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const [needsPasswordCompletion, setNeedsPasswordCompletion] = useState(false);

  const [loadStatus, setLoadStatus] = useState<QuoteLoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatusByVehicle, setSaveStatusByVehicle] = useState<
    Record<VehicleType, QuoteSaveStatus>
  >({
    motorcycle: 'idle',
    car: 'idle',
  });
  const [saveErrorByVehicle, setSaveErrorByVehicle] = useState<
    Record<VehicleType, string | null>
  >({
    motorcycle: null,
    car: null,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const editedBeforeLoadRef = useRef<Record<VehicleType, boolean>>({
    motorcycle: false,
    car: false,
  });
  const editGenerationRef = useRef<Record<VehicleType, number>>({
    motorcycle: 0,
    car: 0,
  });

  const prefersReducedMotion = usePrefersReducedMotion();

  const applyLoadedQuotesForUser = useCallback(
    async (
      userId: string,
      options: {preservePreLoadEdits: boolean},
    ): Promise<void> => {
      setLoadStatus('loading');
      setLoadError(null);

      try {
        const loadedQuotes = await loadVisitorQuotes(userId);

        setQuotesByVehicle((prev) => ({
          motorcycle:
            options.preservePreLoadEdits && editedBeforeLoadRef.current.motorcycle
              ? prev.motorcycle
              : loadedQuotes.motorcycle,
          car:
            options.preservePreLoadEdits && editedBeforeLoadRef.current.car
              ? prev.car
              : loadedQuotes.car,
        }));

        setActivePartByVehicle((prev) => ({
          motorcycle:
            options.preservePreLoadEdits && editedBeforeLoadRef.current.motorcycle
              ? prev.motorcycle
              : loadedQuotes.motorcycle.length > 0
                ? loadedQuotes.motorcycle[loadedQuotes.motorcycle.length - 1]
                    .partId
                : null,
          car:
            options.preservePreLoadEdits && editedBeforeLoadRef.current.car
              ? prev.car
              : loadedQuotes.car.length > 0
                ? loadedQuotes.car[loadedQuotes.car.length - 1].partId
                : null,
        }));

        if (loadedQuotes.motorcycle.length > 0 || loadedQuotes.car.length > 0) {
          setAnimationKey((prev) => prev + 1);
        }

        setLoadStatus('ready');
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to load saved quotes from Supabase.',
        );
        setLoadStatus('error');
      }
    },
    [],
  );

  const initializeAndLoadQuotes = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);

    try {
      const urlConfirmation = await consumeUrlConfirmationIfPresent();
      if (urlConfirmation.error) {
        setLoadError(`Email verification failed: ${urlConfirmation.error}`);
      }

      const session = await ensureVisitorSession();
      setCurrentUser(session.user);
      setIsSignedOut(false);

      if (
        hasPendingPasswordSetup() &&
        session.user &&
        !session.user.is_anonymous
      ) {
        setNeedsPasswordCompletion(true);
        setAuthModalMode('signup');
        setAuthModalOpen(true);
      }

      await applyLoadedQuotesForUser(session.user.id, {
        preservePreLoadEdits: true,
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Failed to load saved quotes from Supabase.',
      );
      setLoadStatus('error');
    }
  }, [applyLoadedQuotesForUser]);

  useEffect(() => {
    void initializeAndLoadQuotes();
  }, [initializeAndLoadQuotes]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {data: authListener} = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          setIsSignedOut(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const currentQuoteItems = quotesByVehicle[vehicle];
  const currentActivePartId = activePartByVehicle[vehicle];
  const addedPartIds = new Set(currentQuoteItems.map((item) => item.partId));

  const guestMode = isGuestUser(currentUser);
  const customerSignedIn = isRegisteredCustomer(currentUser);
  const visitorId = currentUser?.id ?? null;

  const handleVehicleChange = (nextVehicle: VehicleType) => {
    setVehicle(nextVehicle);
    setAnimationKey((prev) => prev + 1);
  };

  const handleAddPart = (part: CatalogPart) => {
    const alreadyExists = quotesByVehicle[part.vehicle].some(
      (item) => item.partId === part.id,
    );

    if (!alreadyExists) {
      editedBeforeLoadRef.current[part.vehicle] = true;
      editGenerationRef.current[part.vehicle] += 1;

      setQuotesByVehicle((prev) => {
        if (prev[part.vehicle].some((item) => item.partId === part.id)) {
          return prev;
        }
        return {
          ...prev,
          [part.vehicle]: [
            ...prev[part.vehicle],
            {
              partId: part.id,
              name: part.name,
              price: part.price,
              locationLabel: part.locationLabel,
              labourListed: Boolean(part.labourListed),
            },
          ],
        };
      });

      setSaveStatusByVehicle((prev) => ({
        ...prev,
        [part.vehicle]: 'unsaved',
      }));
      setSaveErrorByVehicle((prev) => ({
        ...prev,
        [part.vehicle]: null,
      }));
    }

    setActivePartByVehicle((prev) => ({
      ...prev,
      [part.vehicle]: part.id,
    }));
    setAnimationKey((prev) => prev + 1);
  };

  const handleSelectPart = (partId: PartId) => {
    setActivePartByVehicle((prev) => ({
      ...prev,
      [vehicle]: partId,
    }));
    setAnimationKey((prev) => prev + 1);
  };

  const handleRemoveQuoteItem = (partId: PartId) => {
    const remaining = currentQuoteItems.filter((item) => item.partId !== partId);
    if (remaining.length === currentQuoteItems.length) {
      return;
    }

    editedBeforeLoadRef.current[vehicle] = true;
    editGenerationRef.current[vehicle] += 1;

    setQuotesByVehicle((prev) => ({
      ...prev,
      [vehicle]: remaining,
    }));

    if (currentActivePartId === partId) {
      const fallbackPartId =
        remaining.length > 0 ? remaining[remaining.length - 1].partId : null;
      setActivePartByVehicle((prev) => ({
        ...prev,
        [vehicle]: fallbackPartId,
      }));
    }

    setSaveStatusByVehicle((prev) => ({
      ...prev,
      [vehicle]: 'unsaved',
    }));
    setSaveErrorByVehicle((prev) => ({
      ...prev,
      [vehicle]: null,
    }));
  };

  const handleSaveQuote = async () => {
    if (loadStatus !== 'ready' || !visitorId || isSignedOut) {
      return;
    }

    const targetVehicle = vehicle;
    const itemsToSave = quotesByVehicle[targetVehicle];
    const generationAtStart = editGenerationRef.current[targetVehicle];

    setSaveStatusByVehicle((prev) => ({
      ...prev,
      [targetVehicle]: 'saving',
    }));
    setSaveErrorByVehicle((prev) => ({
      ...prev,
      [targetVehicle]: null,
    }));

    try {
      const confirmedItems = await saveVehicleQuote(
        visitorId,
        targetVehicle,
        itemsToSave,
      );

      if (editGenerationRef.current[targetVehicle] === generationAtStart) {
        setQuotesByVehicle((prev) => ({
          ...prev,
          [targetVehicle]: confirmedItems,
        }));
        setSaveStatusByVehicle((prev) => ({
          ...prev,
          [targetVehicle]: 'saved',
        }));
      } else {
        setSaveStatusByVehicle((prev) => ({
          ...prev,
          [targetVehicle]: 'unsaved',
        }));
      }
    } catch (error) {
      setSaveStatusByVehicle((prev) => ({
        ...prev,
        [targetVehicle]: 'unsaved',
      }));
      setSaveErrorByVehicle((prev) => ({
        ...prev,
        [targetVehicle]:
          error instanceof Error
            ? error.message
            : 'Unable to save quote to Supabase.',
      }));
    }
  };

  const handleReplayActivePart = () => {
    if (!currentActivePartId) {
      return;
    }
    setAnimationKey((prev) => prev + 1);
  };

  const handleSendChatQuestion = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setChatError(null);

    if (isSignedOut || !supabase) {
      setChatError('Please sign in to use chat.');
      return;
    }

    const {data: sessionData, error: sessionError} =
      await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setChatError('Please sign in to use chat.');
      return;
    }

    const timestamp = Date.now();
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${timestamp}-${prev.length}`,
        sender: 'user',
        text: trimmedQuestion,
      },
    ]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: trimmedQuestion,
          vehicle_type: vehicle,
        }),
      });

      let payload: {reply?: unknown; error?: unknown} | null = null;
      try {
        payload = (await response.json()) as {reply?: unknown; error?: unknown};
      } catch {
        payload = null;
      }

      if (
        response.ok &&
        payload &&
        payload.error === null &&
        typeof payload.reply === 'string'
      ) {
        const replyText = payload.reply;
        setChatMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}-${prev.length}`,
            sender: 'assistant',
            text: replyText,
          },
        ]);
      } else {
        const errorMessage =
          typeof payload?.error === 'string' && payload.error.trim()
            ? payload.error
            : `Unable to get a reply (status ${response.status}).`;
        setChatError(errorMessage);
      }
    } catch {
      setChatError('Unable to reach the chat service. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const openAuthModal = (mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Signing into an existing account replaces the guest session and loads that account's quotes,
  // keeping the previous guest's quotes separate.
  const handleSignedInExistingAccount = async (session: Session) => {
    setCurrentUser(session.user);
    setIsSignedOut(false);
    setNeedsPasswordCompletion(false);
    setActiveView('decoder');
    setChatError(null);

    editedBeforeLoadRef.current = {motorcycle: false, car: false};
    editGenerationRef.current = {motorcycle: 0, car: 0};
    setQuotesByVehicle({motorcycle: [], car: []});
    setActivePartByVehicle({motorcycle: null, car: null});
    setSaveStatusByVehicle({motorcycle: 'idle', car: 'idle'});
    setSaveErrorByVehicle({motorcycle: null, car: null});

    await applyLoadedQuotesForUser(session.user.id, {
      preservePreLoadEdits: false,
    });
  };

  // Upgrading a guest keeps the exact same user.id and carries over saved quotes & unsaved edits.
  const handleAccountUpgraded = async (upgradedUser: User | null) => {
    if (upgradedUser) {
      setCurrentUser(upgradedUser);
    }
    setIsSignedOut(false);
    setNeedsPasswordCompletion(false);
    setChatError(null);
    if (upgradedUser?.id) {
      await applyLoadedQuotesForUser(upgradedUser.id, {
        preservePreLoadEdits: true,
      });
    }
  };

  const handleContinueAsGuest = async () => {
    setChatError(null);
    if (currentUser?.is_anonymous && !isSignedOut) {
      setActiveView('decoder');
      return;
    }

    const guestSession = await startGuestSession();
    setCurrentUser(guestSession.user);
    setIsSignedOut(false);
    setNeedsPasswordCompletion(false);
    setActiveView('decoder');

    editedBeforeLoadRef.current = {motorcycle: false, car: false};
    editGenerationRef.current = {motorcycle: 0, car: 0};
    setSaveStatusByVehicle({motorcycle: 'idle', car: 'idle'});
    setSaveErrorByVehicle({motorcycle: null, car: null});

    await applyLoadedQuotesForUser(guestSession.user.id, {
      preservePreLoadEdits: false,
    });
  };

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOutCustomer();
      setCurrentUser(null);
      setIsSignedOut(true);
      setNeedsPasswordCompletion(false);
      setActiveView('decoder');
      setChatError(null);
      setChatMessages([]);

      // Clear previous customer's quotes from the screen while keeping animations working
      editedBeforeLoadRef.current = {motorcycle: false, car: false};
      editGenerationRef.current = {motorcycle: 0, car: 0};
      setQuotesByVehicle({motorcycle: [], car: []});
      setActivePartByVehicle({motorcycle: null, car: null});
      setSaveStatusByVehicle({motorcycle: 'idle', car: 'idle'});
      setSaveErrorByVehicle({motorcycle: null, car: null});
      setLoadError(null);
      setLoadStatus('ready');
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'Unable to sign out.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleOpenVehicleFromProfile = (targetVehicle: VehicleType) => {
    setVehicle(targetVehicle);
    setActiveView('decoder');
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col">
      {/* Compact Header */}
      <header className="bg-white border-b border-[#E2E6EC]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <button
              type="button"
              onClick={() => setActiveView('decoder')}
              className="text-lg sm:text-xl font-bold tracking-tight text-[#111827] whitespace-nowrap cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              Repair Quote Decoder
            </button>
            <span className="hidden md:inline text-xs text-[#64748B] whitespace-nowrap">
              India · Sample prices (₹)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {customerSignedIn && currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('decoder')}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeView === 'decoder'
                      ? 'bg-[#F1F5F9] text-[#111827]'
                      : 'text-[#526071] hover:text-[#111827]'
                  }`}
                >
                  Quote decoder
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('profile')}
                  className={`min-h-[38px] px-3.5 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                    activeView === 'profile'
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  My Profile · {getCustomerDisplayName(currentUser)}
                </button>
              </>
            ) : (
              <>
                <span className="hidden sm:inline text-xs text-[#64748B] whitespace-nowrap">
                  {isSignedOut ? 'Signed out' : 'Guest session'}
                </span>
                {isSignedOut && (
                  <button
                    type="button"
                    onClick={() => void handleContinueAsGuest()}
                    className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#111827] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Continue as guest
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#111827] bg-white border border-[#D1D5DB] hover:bg-[#F8FAFC] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {activeView === 'profile' && customerSignedIn && currentUser ? (
          <MyProfilePage
            user={currentUser}
            quotesByVehicle={quotesByVehicle}
            loadStatus={loadStatus}
            loadError={loadError}
            onRetryLoad={() =>
              void applyLoadedQuotesForUser(currentUser.id, {
                preservePreLoadEdits: false,
              })
            }
            onOpenVehicleInDecoder={handleOpenVehicleFromProfile}
            onBackToDecoder={() => setActiveView('decoder')}
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
            signOutError={signOutError}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Diagram Column: order-1 on mobile (above quote), order-2 on desktop (right) */}
            <div className="order-1 lg:order-2 lg:col-span-7 lg:sticky lg:top-5">
              <VehicleDiagram
                vehicle={vehicle}
                activePartId={currentActivePartId}
                addedPartIds={addedPartIds}
                animationKey={animationKey}
                prefersReducedMotion={prefersReducedMotion}
                onReplayActivePart={handleReplayActivePart}
                onSelectPartHotspot={handleSelectPart}
              />
            </div>

            {/* Quote + Demo Chat Column: order-2 on mobile (below diagram), order-1 on desktop (left) */}
            <div className="order-2 lg:order-1 lg:col-span-5">
              <QuotePanel
                vehicle={vehicle}
                onVehicleChange={handleVehicleChange}
                quoteItems={currentQuoteItems}
                activePartId={currentActivePartId}
                onAddPart={handleAddPart}
                onSelectQuoteItem={handleSelectPart}
                onRemoveQuoteItem={handleRemoveQuoteItem}
                loadStatus={loadStatus}
                loadError={loadError}
                onRetryLoad={() => void initializeAndLoadQuotes()}
                saveStatus={saveStatusByVehicle[vehicle]}
                saveError={saveErrorByVehicle[vehicle]}
                onSaveQuote={() => void handleSaveQuote()}
                isSignedOut={isSignedOut}
                onContinueAsGuest={() => void handleContinueAsGuest()}
                chatMessages={chatMessages}
                isChatLoading={isChatLoading}
                chatError={chatError}
                onSendChatQuestion={(q) => void handleSendChatQuestion(q)}
              />
            </div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        isGuest={guestMode}
        needsPasswordCompletion={needsPasswordCompletion}
        onClose={() => setAuthModalOpen(false)}
        onContinueAsGuest={handleContinueAsGuest}
        onSignedInExistingAccount={handleSignedInExistingAccount}
        onAccountUpgraded={handleAccountUpgraded}
      />
    </div>
  );
}

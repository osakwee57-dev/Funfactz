
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_FACTS, CATEGORIES } from './constants.ts';
import { FunFact, UserSettings, Screen, Category } from './types.ts';
import { 
  Sparkles, Heart, Settings as SettingsIcon, 
  ChevronLeft, Trash2, Share2, 
  Clock, LayoutGrid, Copy, CheckCircle2,
  Plus, Bell, Activity, Info, X
} from 'lucide-react';

const CATEGORY_ICONS: Record<Category, string> = {
  'Science': '🧬',
  'Animals': '🐾',
  'History': '🏛️',
  'Food': '🍎',
  'Geography': '🌍',
  'Space': '🌌',
  'Technology': '💻',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Screen>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'alarm' ? 'alarm' : 'home';
  });
  
  const [favorites, setFavorites] = useState<FunFact[]>(() => {
    try {
      const saved = localStorage.getItem('funfactz_favs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('funfactz_settings');
      return saved ? JSON.parse(saved) : {
        notifications: [{ id: 'default', time: '09:00', enabled: false }],
        darkMode: false,
        selectedCategories: CATEGORIES,
        seenFactIds: []
      };
    } catch (e) {
      return {
        notifications: [{ id: 'default', time: '09:00', enabled: false }],
        darkMode: false,
        selectedCategories: CATEGORIES,
        seenFactIds: []
      };
    }
  });

  const [currentFact, setCurrentFact] = useState<FunFact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [alarmFact, setAlarmFact] = useState<FunFact | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isScheduling, setIsScheduling] = useState(false);

  // Load alarm fact from URL if arriving via notification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const factId = urlParams.get('factId');
    if (factId) {
      const fact = INITIAL_FACTS.find(f => f.id === factId);
      if (fact) {
        setAlarmFact(fact);
        setActiveTab('alarm');
      }
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('funfactz_favs', JSON.stringify(favorites));
  }, [favorites]);

  // SYSTEM ALARM SCHEDULING ENGINE
  const syncSystemAlarms = useCallback(async (currentSettings: UserSettings) => {
    if (!('serviceWorker' in navigator) || !('showTrigger' in Notification.prototype)) {
      console.warn('Notification Triggers not supported in this browser.');
      return;
    }

    if (Notification.permission !== 'granted') return;

    setIsScheduling(true);
    const reg = await navigator.serviceWorker.ready;
    
    // Clear existing scheduled notifications to avoid duplicates/stale facts
    const existing = await reg.getNotifications();
    existing.forEach(n => {
      // @ts-ignore: tag is standard
      if (n.tag && n.tag.startsWith('funfact-alarm-')) n.close();
    });

    const activeNotifications = currentSettings.notifications.filter(n => n.enabled);
    if (activeNotifications.length === 0) {
      setIsScheduling(false);
      return;
    }

    const filteredFacts = INITIAL_FACTS.filter(f => currentSettings.selectedCategories.includes(f.category));
    const factPool = filteredFacts.length > 0 ? filteredFacts : INITIAL_FACTS;

    // Schedule for the next 7 days for each active alarm time
    for (let day = 0; day < 7; day++) {
      for (const config of activeNotifications) {
        const [hours, minutes] = config.time.split(':').map(Number);
        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + day);
        triggerDate.setHours(hours, minutes, 0, 0);

        // If time has already passed today, skip
        if (triggerDate.getTime() < Date.now()) continue;

        // Select a fact (simple random for now, could be improved with 'seen' logic)
        const randomFact = factPool[Math.floor(Math.random() * factPool.length)];

        try {
          // @ts-ignore: TimestampTrigger is experimental
          const trigger = new TimestampTrigger(triggerDate.getTime());

          await reg.showNotification(`${CATEGORY_ICONS[randomFact.category]} ${randomFact.category} Fact`, {
            body: randomFact.fact.length > 60 ? randomFact.fact.substring(0, 57) + '...' : randomFact.fact,
            tag: `funfact-alarm-${config.id}-${day}`,
            icon: 'https://ui-avatars.com/api/?name=F+F&background=10b981&color=fff&size=128',
            badge: 'https://ui-avatars.com/api/?name=FF&background=10b981&color=fff&size=96',
            // @ts-ignore: experimental property
            showTrigger: trigger,
            data: { 
              factId: randomFact.id,
              url: `${window.location.origin}?mode=alarm&factId=${randomFact.id}`
            },
            requireInteraction: true,
            vibrate: [200, 100, 200]
          } as any);
        } catch (e) {
          console.error('Failed to schedule notification', e);
        }
      }
    }
    setIsScheduling(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('funfactz_settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.darkMode ? '#09090b' : '#10b981');
    
    // Resync alarms whenever settings change
    syncSystemAlarms(settings);
  }, [settings, syncSystemAlarms]);

  const generateFact = () => {
    if (settings.selectedCategories.length === 0) {
      setActiveTab('categories');
      return;
    }
    setIsLoading(true);
    const filtered = INITIAL_FACTS.filter(f => settings.selectedCategories.includes(f.category));
    setTimeout(() => {
      const pool = filtered.length > 0 ? filtered : INITIAL_FACTS;
      setCurrentFact(pool[Math.floor(Math.random() * pool.length)]);
      setIsLoading(false);
    }, 500);
  };

  const handleDismissAlarm = () => {
    // Return to home state first
    setActiveTab('home');
    window.history.replaceState({}, '', '/');
    
    // In a PWA context launched from a notification, 'returning to previous app'
    // often means closing the current window or just letting it stay in the background.
    // window.close() only works if the tab was opened by script, but it's worth a try.
    if (window.confirm("Close FunFactz and return?")) {
      window.close();
    }
  };

  const toggleFavorite = (fact: FunFact) => {
    setFavorites(prev => 
      prev.some(f => f.id === fact.id) 
        ? prev.filter(f => f.id !== fact.id) 
        : [{ ...fact, isFavorite: true }, ...prev]
    );
  };

  const shareFact = (fact: FunFact) => {
    const text = `Did you know? ${fact.fact} 💡 #FunFactz`;
    if (navigator.share) navigator.share({ title: 'FunFactz', text }).catch(() => copyToClipboard(fact.fact));
    else copyToClipboard(fact.fact);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`Did you know? ${text} 💡 #FunFactz`);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  // ALARM UI (FULL SCREEN)
  if (activeTab === 'alarm' && alarmFact) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#000] dark:bg-[#000] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-hidden">
        {/* Aesthetic Background Pulse */}
        <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">FunFactz Discovery</h1>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-10 fact-card-shadow border border-white/10 relative overflow-hidden text-left">
             <div className="absolute -top-6 -right-6 text-8xl opacity-5 pointer-events-none">
                {CATEGORY_ICONS[alarmFact.category]}
             </div>
             
             <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest mb-6">
                {CATEGORY_ICONS[alarmFact.category]} {alarmFact.category}
             </div>
             
             <p className="text-2xl md:text-3xl font-bold leading-tight text-zinc-800 dark:text-zinc-50 italic">
                "{alarmFact.fact}"
             </p>
          </div>

          <button 
            onClick={handleDismissAlarm}
            className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
          >
            Dismiss <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col max-w-md mx-auto relative bg-[#f9fafb] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 overflow-hidden">
      
      {showCopyToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-sm font-black uppercase tracking-tight">Copied</span>
        </div>
      )}

      {activeTab === 'home' && (
        <header className="px-6 pt-14 pb-4 flex justify-between items-center">
          <button onClick={() => setActiveTab('categories')} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700/50">
            <LayoutGrid size={22} className="text-zinc-500 dark:text-zinc-400" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-black tracking-tighter text-emerald-500 uppercase italic leading-none">FunFactz</h1>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">Knowledge is Power</span>
          </div>
          <button onClick={() => setActiveTab('settings')} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700/50">
            <SettingsIcon size={22} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
        {activeTab === 'home' && (
          <div className="py-6 space-y-10 screen-transition">
            {notifPermission === 'default' && (
              <div className="bg-emerald-500 p-5 rounded-[32px] text-white flex items-center gap-5 shadow-lg shadow-emerald-500/20">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Bell size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-tight">Daily Alarms</h4>
                  <p className="text-[10px] opacity-80 font-bold">Never miss a fact. Enable system notifications.</p>
                </div>
                <button 
                  onClick={() => Notification.requestPermission().then(setNotifPermission)}
                  className="px-4 py-2.5 bg-white text-emerald-600 text-[10px] font-black uppercase rounded-xl active:scale-95 transition-all"
                >
                  Enable
                </button>
              </div>
            )}

            <div className="w-full flex items-center justify-center min-h-[300px]">
              {!currentFact ? (
                <div className="text-center p-14 bg-white dark:bg-zinc-900 rounded-[48px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 w-full flex flex-col items-center">
                  <div className="text-7xl mb-8 animate-bounce-slow">💡</div>
                  <h2 className="text-2xl font-black mb-3">Learn Today</h2>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Tap below to discovery a new fact from our vault.</p>
                </div>
              ) : (
                <div className={`w-full bg-white dark:bg-zinc-800 rounded-[40px] p-8 fact-card-shadow border border-emerald-50 dark:border-emerald-900/20 relative ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                  <div className="flex justify-between items-center mb-10">
                    <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                      {CATEGORY_ICONS[currentFact.category]} {currentFact.category}
                    </span>
                    <button 
                      onClick={() => toggleFavorite(currentFact)}
                      className={`p-3 rounded-2xl transition-all ${favorites.some(f => f.id === currentFact.id) ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 scale-110' : 'text-zinc-300 bg-zinc-50 dark:bg-zinc-700/50'}`}
                    >
                      <Heart size={22} fill={favorites.some(f => f.id === currentFact.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  <p className="text-2xl md:text-3xl font-black leading-tight text-zinc-800 dark:text-zinc-50 mb-10 italic">
                    "{currentFact.fact}"
                  </p>

                  <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-700/50">
                    <div className="flex gap-4">
                      <button onClick={() => shareFact(currentFact)} className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-emerald-500">
                        <Share2 size={16} /> Share
                      </button>
                      <button onClick={() => copyToClipboard(currentFact.fact)} className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-emerald-500">
                        <Copy size={16} /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateFact}
              disabled={isLoading}
              className="w-full h-20 gradient-btn text-white rounded-[32px] text-xl font-black shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
            >
              <Sparkles size={24} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Consulting..." : "Get a Fun Fact!"}
            </button>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="py-12 space-y-8 screen-transition">
            <div className="flex items-center gap-5">
              <button onClick={() => setActiveTab('home')} className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                <ChevronLeft size={20}/>
              </button>
              <h2 className="text-3xl font-black tracking-tight">Topics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const isSelected = settings.selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSettings(s => ({
                      ...s,
                      selectedCategories: isSelected 
                        ? (s.selectedCategories.length > 1 ? s.selectedCategories.filter(c => c !== cat) : s.selectedCategories) 
                        : [...s.selectedCategories, cat]
                    }))}
                    className={`p-6 rounded-[32px] flex flex-col items-center gap-4 border-2 transition-all ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-white dark:border-zinc-800 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    <span className="text-4xl">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="py-12 space-y-8 screen-transition">
            <h2 className="text-3xl font-black tracking-tight">The Vault</h2>
            {favorites.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
                <Heart size={48} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">No facts saved yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map(fav => (
                  <div key={fav.id} className="bg-white dark:bg-zinc-800 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-700/50">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-full">{fav.category}</span>
                       <button onClick={() => toggleFavorite(fav)} className="text-rose-500"><Trash2 size={16} /></button>
                    </div>
                    <p className="text-sm font-bold leading-relaxed italic">"{fav.fact}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="py-12 space-y-12 screen-transition">
            <h2 className="text-3xl font-black tracking-tight">Setup</h2>
            
            <section className="bg-white dark:bg-zinc-800 p-8 rounded-[40px] space-y-6 border border-zinc-100 dark:border-zinc-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center">
                    <Activity size={20} className="text-emerald-500" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-sm uppercase tracking-tight">Alarm Engine</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Local Scheduling</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isScheduling ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[9px] font-black uppercase text-zinc-400">{isScheduling ? 'Updating' : 'Active'}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-start gap-4">
                <Info size={18} className="text-emerald-500 mt-0.5" />
                <p className="text-[9px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wider">
                  Alarms work offline and even when the app is closed. Facts are pre-scheduled for the next 7 days.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-700/50">
                <p className="font-black text-xs uppercase tracking-tight">Dark Mode</p>
                <button 
                  onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                  className={`w-14 h-8 rounded-full relative transition-all ${settings.darkMode ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black">Scheduled Times</h3>
                <button 
                  onClick={() => setSettings(s => ({
                    ...s,
                    notifications: [...s.notifications, { id: Date.now().toString(), time: '08:00', enabled: true }]
                  }))}
                  className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {settings.notifications.map((notif) => (
                  <div key={notif.id} className={`bg-white dark:bg-zinc-800 p-6 rounded-[32px] border flex items-center justify-between animate-in slide-in-from-bottom-2 ${notif.enabled ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-zinc-100 opacity-50'}`}>
                    <div className="flex items-center gap-4">
                      <Clock size={20} className="text-zinc-400" />
                      <input 
                        type="time" 
                        value={notif.time}
                        onChange={(e) => setSettings(s => ({
                          ...s,
                          notifications: s.notifications.map(n => n.id === notif.id ? { ...n, time: e.target.value } : n)
                        }))}
                        className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSettings(s => ({
                          ...s,
                          notifications: s.notifications.map(n => n.id === notif.id ? { ...n, enabled: !n.enabled } : n)
                        }))}
                        className={`w-14 h-8 rounded-full relative transition-all ${notif.enabled ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${notif.enabled ? 'right-1' : 'left-1'}`} />
                      </button>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== notif.id) }))}
                        className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-28 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border-t border-zinc-100 dark:border-zinc-800 px-10 flex justify-between items-center z-[100]">
        {[
          { id: 'home', icon: Sparkles, label: 'Learn' },
          { id: 'categories', icon: LayoutGrid, label: 'Topics' },
          { id: 'favorites', icon: Heart, label: 'Vault' },
          { id: 'settings', icon: SettingsIcon, label: 'Setup' },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as Screen)}
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${isActive ? 'text-emerald-500' : 'text-zinc-400'}`}
            >
              <div className={`p-2.5 rounded-2xl ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                <Icon size={isActive ? 24 : 22} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;

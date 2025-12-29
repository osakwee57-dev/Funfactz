
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_FACTS, CATEGORIES } from './constants';
import { FunFact, UserSettings, Screen, Category } from './types';
import { 
  Sparkles, Heart, Settings as SettingsIcon, 
  ChevronLeft, Trash2, Share2, 
  Clock, LayoutGrid, Copy, CheckCircle2
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
  const [activeTab, setActiveTab] = useState<Screen>('home');
  const [favorites, setFavorites] = useState<FunFact[]>(() => {
    const saved = localStorage.getItem('funfactz_favs');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('funfactz_settings');
    return saved ? JSON.parse(saved) : {
      notificationsEnabled: false,
      notificationTime: '09:00',
      darkMode: false,
      selectedCategories: CATEGORIES
    };
  });

  const [currentFact, setCurrentFact] = useState<FunFact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Daily Fact Logic - Persists for 24 hours based on date seed
  const dailyFact = useMemo(() => {
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = dateSeed % INITIAL_FACTS.length;
    return INITIAL_FACTS[index];
  }, []);

  useEffect(() => {
    localStorage.setItem('funfactz_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('funfactz_settings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#09090b');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#10b981');
    }
  }, [settings.darkMode]);

  const toggleFavorite = (fact: FunFact) => {
    const isFav = favorites.some(f => f.id === fact.id);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== fact.id));
    } else {
      setFavorites(prev => [{ ...fact, isFavorite: true }, ...prev]);
    }
  };

  const generateFact = () => {
    if (settings.selectedCategories.length === 0) {
      setActiveTab('categories');
      return;
    }
    
    setIsLoading(true);
    
    // Filter facts based on user preferences
    const filtered = INITIAL_FACTS.filter(f => settings.selectedCategories.includes(f.category));
    const pool = filtered.length > 0 ? filtered : INITIAL_FACTS;
    
    // Short delay for "vibrancy" and feel
    setTimeout(() => {
      let randomFact = pool[Math.floor(Math.random() * pool.length)];
      // Try to avoid showing the same fact twice in a row
      if (currentFact && randomFact.id === currentFact.id && pool.length > 1) {
        randomFact = pool.find(f => f.id !== currentFact.id) || randomFact;
      }
      setCurrentFact(randomFact);
      setIsLoading(false);
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    const shareText = `Did you know? ${text} 💡 #FunFactz`;
    navigator.clipboard.writeText(shareText);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const shareFact = (fact: FunFact) => {
    const text = `Did you know? ${fact.fact} 💡 #FunFactz`;
    if (navigator.share) {
      navigator.share({ title: 'FunFactz', text }).catch(() => copyToClipboard(fact.fact));
    } else {
      copyToClipboard(fact.fact);
    }
  };

  const isFactFavorite = (id: string) => favorites.some(f => f.id === id);

  return (
    <div className="min-h-screen w-full flex flex-col max-w-md mx-auto relative bg-[#f9fafb] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Toast Notification */}
      {showCopyToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl animate-in fade-in zoom-in duration-300">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="text-sm font-bold">Copied to clipboard!</span>
        </div>
      )}

      {/* Header */}
      {activeTab === 'home' && (
        <header className="px-6 pt-12 pb-2 flex justify-between items-center bg-transparent">
          <button 
            onClick={() => setActiveTab('categories')}
            className="w-11 h-11 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-zinc-100 dark:border-zinc-700/50"
          >
            <LayoutGrid size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tighter text-emerald-500 uppercase italic">FunFactz</h1>
            <div className="h-1 w-8 bg-amber-400 rounded-full" />
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="w-11 h-11 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-zinc-100 dark:border-zinc-700/50"
          >
            <SettingsIcon size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </header>
      )}

      {/* Screen Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
        {activeTab === 'home' && (
          <div className="py-6 screen-transition space-y-8">
            
            {/* Daily Fact Section */}
            {!currentFact && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="daily-badge px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">Daily Pick</div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="w-full bg-white dark:bg-zinc-800 rounded-3xl p-6 fact-card-shadow border border-zinc-50 dark:border-zinc-700/30 relative group">
                  <div className="absolute top-4 right-4 text-2xl opacity-20">{CATEGORY_ICONS[dailyFact.category]}</div>
                  <p className="text-lg font-bold leading-tight mb-4 pr-6">
                    "{dailyFact.fact}"
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded uppercase">{dailyFact.category}</span>
                    <div className="flex gap-2">
                       <button onClick={() => toggleFavorite(dailyFact)} className={`p-2 rounded-full transition-colors ${isFactFavorite(dailyFact.id) ? 'text-rose-500' : 'text-zinc-300'}`}>
                        <Heart size={18} fill={isFactFavorite(dailyFact.id) ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => shareFact(dailyFact)} className="p-2 text-zinc-300 active:text-emerald-500"><Share2 size={18} /></button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Main Fact Card */}
            <div className="w-full min-h-[340px] flex items-center justify-center">
              {!currentFact && !isLoading ? (
                <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 w-full flex flex-col items-center">
                  <div className="text-6xl mb-6 animate-bounce">💡</div>
                  <h2 className="text-xl font-black mb-2">Curious today?</h2>
                  <p className="text-zinc-500 text-sm font-medium">Over 200+ facts ready for you!</p>
                </div>
              ) : (
                <div className={`w-full bg-white dark:bg-zinc-800 rounded-[32px] p-8 fact-card-shadow relative border border-emerald-100 dark:border-emerald-900/20 transition-all ${isLoading ? 'scale-95 opacity-50 grayscale' : 'scale-100 opacity-100'}`}>
                  <div className="flex justify-between items-start mb-8">
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100 dark:border-amber-900/30">
                      {currentFact && CATEGORY_ICONS[currentFact.category]} {currentFact?.category}
                    </span>
                    <button 
                      onClick={() => currentFact && toggleFavorite(currentFact)}
                      className={`transition-all p-2.5 rounded-2xl ${isFactFavorite(currentFact?.id || '') ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 scale-110' : 'text-zinc-300 bg-zinc-50 dark:bg-zinc-700/50 active:scale-90'}`}
                    >
                      <Heart size={24} fill={isFactFavorite(currentFact?.id || '') ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  <div className="min-h-[140px] flex items-center">
                    <p className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-zinc-800 dark:text-zinc-50">
                      {isLoading ? "Fetching wonders..." : currentFact?.fact}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-700/30 flex justify-between items-center">
                    <div className="flex gap-4">
                      <button onClick={() => currentFact && shareFact(currentFact)} className="flex items-center gap-2 text-zinc-400 text-xs font-bold hover:text-emerald-500 transition-colors uppercase">
                        <Share2 size={16} /> Share
                      </button>
                      <button onClick={() => currentFact && copyToClipboard(currentFact.fact)} className="flex items-center gap-2 text-zinc-400 text-xs font-bold hover:text-emerald-500 transition-colors uppercase">
                        <Copy size={16} /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generator Button */}
            <button
              onClick={generateFact}
              disabled={isLoading}
              className={`w-full h-16 gradient-btn text-white rounded-2xl text-lg font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest`}
            >
              <Sparkles size={20} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Generating..." : "Get a Fun Fact!"}
            </button>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="py-12 screen-transition">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('home')} className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm active:scale-90 transition-all border border-zinc-100 dark:border-zinc-700/50">
                <ChevronLeft size={20}/>
              </button>
              <h2 className="text-2xl font-black tracking-tight">Topics</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6 font-black uppercase tracking-widest">Personalize your feed:</p>
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
                    className={`p-6 rounded-3xl flex flex-col items-center gap-4 border-2 transition-all active:scale-95 ${
                      isSelected 
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10' 
                        : 'border-white dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm opacity-60'
                    }`}
                  >
                    <span className={`text-4xl transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}>{CATEGORY_ICONS[cat]}</span>
                    <span className={`text-xs font-black uppercase tracking-tighter ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="py-12 screen-transition">
            <h2 className="text-2xl font-black tracking-tight mb-8">Saved Gems</h2>
            {favorites.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-[40px] flex items-center justify-center mb-8 border border-zinc-200 dark:border-zinc-700/50">
                  <Heart size={40} className="text-zinc-300" />
                </div>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Your library is empty</p>
                <button onClick={() => setActiveTab('home')} className="mt-6 text-emerald-500 font-black flex items-center gap-2 active:scale-95 transition-all">
                  Start Exploring <Sparkles size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map(fav => (
                  <div key={fav.id} className="bg-white dark:bg-zinc-800 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-700/30 group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded uppercase tracking-widest">{fav.category}</span>
                      <div className="flex gap-2">
                        <button onClick={() => shareFact(fav)} className="p-2 text-zinc-300 hover:text-zinc-500"><Share2 size={16}/></button>
                        <button onClick={() => toggleFavorite(fav)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-bold italic">"{fav.fact}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="py-12 screen-transition">
            <h2 className="text-2xl font-black tracking-tight mb-10">Settings</h2>
            
            <div className="space-y-6">
              <section className="bg-white dark:bg-zinc-800 p-8 rounded-[32px] shadow-sm space-y-8 border border-zinc-100 dark:border-zinc-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter">Dark Appearance</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                    className={`w-14 h-8 rounded-full relative transition-all ${settings.darkMode ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-700/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter">Smart Reminders</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                    className={`w-14 h-8 rounded-full relative transition-all ${settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${settings.notificationsEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {settings.notificationsEnabled && (
                  <div className="flex items-center justify-between pt-2 animate-in slide-in-from-top-4 duration-500">
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest ml-14">Notify at</span>
                    <input 
                      type="time" 
                      value={settings.notificationTime}
                      onChange={(e) => setSettings(s => ({ ...s, notificationTime: e.target.value }))}
                      className="bg-zinc-50 dark:bg-zinc-700 px-4 py-2 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 border border-zinc-200 dark:border-zinc-600"
                    />
                  </div>
                )}
              </section>
              
              <div className="text-center pt-12">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-2">FunFactz v6.0 Platinum</p>
                <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Verified Offline Mode</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 px-8 flex justify-between items-center z-50">
        {[
          { id: 'home', icon: Sparkles, label: 'Discover' },
          { id: 'categories', icon: LayoutGrid, label: 'Feed' },
          { id: 'favorites', icon: Heart, label: 'Library' },
          { id: 'settings', icon: SettingsIcon, label: 'More' },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as Screen)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-emerald-500 scale-110' : 'text-zinc-400'}`}
            >
              <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;

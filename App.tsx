
import React, { useState, useEffect } from 'react';
import { INITIAL_FACTS, CATEGORIES } from './constants';
import { FunFact, UserSettings, Screen, Category } from './types';
import { 
  Sparkles, Heart, Settings as SettingsIcon, 
  ChevronLeft, Trash2, Share2, 
  Clock, LayoutGrid, ArrowRight
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

  useEffect(() => {
    localStorage.setItem('funfactz_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('funfactz_settings', JSON.stringify(settings));
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
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

    const filtered = INITIAL_FACTS.filter(f => settings.selectedCategories.includes(f.category));
    const randomFact = filtered[Math.floor(Math.random() * filtered.length)];
    
    setTimeout(() => {
      setCurrentFact(randomFact || null);
      setIsLoading(false);
    }, 400);
  };

  const shareFact = (fact: FunFact) => {
    const text = `Did you know? ${fact.fact} 💡 #FunFactz`;
    if (navigator.share) {
      navigator.share({ title: 'FunFactz', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Fact copied to clipboard!");
    }
  };

  const isFactFavorite = (id: string) => favorites.some(f => f.id === id);

  return (
    <div className="min-h-screen w-full flex flex-col max-w-md mx-auto relative overflow-hidden">
      
      {/* Header for quick access */}
      {activeTab === 'home' && (
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-transparent">
          <button 
            onClick={() => setActiveTab('categories')}
            className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <LayoutGrid size={22} className="text-zinc-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#4CAF50]">FunFactz</h1>
          <button 
            onClick={() => setActiveTab('settings')}
            className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <SettingsIcon size={22} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        </header>
      )}

      {/* Screen Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
        {activeTab === 'home' && (
          <div className="h-full flex flex-col justify-center items-center py-10 screen-transition">
            <div className="w-full relative min-h-[300px] mb-12 flex items-center justify-center">
              {!currentFact && !isLoading ? (
                <div className="text-center">
                  <div className="text-6xl mb-6">💡</div>
                  <h2 className="text-2xl font-bold mb-2">Ready to learn?</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Tap below to get your first fact!</p>
                </div>
              ) : (
                <div className="w-full bg-white dark:bg-zinc-800 rounded-2xl p-8 fact-card-shadow relative animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-[#FFC107] text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                      <span>{currentFact && CATEGORY_ICONS[currentFact.category]}</span>
                      {currentFact?.category}
                    </span>
                    <button 
                      onClick={() => currentFact && toggleFavorite(currentFact)}
                      className={`transition-colors p-2 rounded-xl ${isFactFavorite(currentFact?.id || '') ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-zinc-300 bg-zinc-50 dark:bg-zinc-700/50'}`}
                    >
                      <Heart size={24} fill={isFactFavorite(currentFact?.id || '') ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8">
                    {isLoading ? "..." : currentFact?.fact}
                  </p>
                  <div className="flex justify-end">
                    <button onClick={() => currentFact && shareFact(currentFact)} className="text-zinc-400 active:text-[#4CAF50]">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateFact}
              disabled={isLoading}
              className="w-full h-16 bg-[#4CAF50] text-white rounded-2xl text-lg font-bold shadow-lg shadow-green-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              <Sparkles size={20} />
              {isLoading ? "Thinking..." : "Get a Fun Fact!"}
            </button>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="py-12 screen-transition">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('home')} className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"><ChevronLeft size={20}/></button>
              <h2 className="text-2xl font-extrabold">Categories</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-6 font-medium">Choose topics you're curious about:</p>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const isSelected = settings.selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSettings(s => ({
                      ...s,
                      selectedCategories: isSelected ? s.selectedCategories.filter(c => c !== cat) : [...s.selectedCategories, cat]
                    }))}
                    className={`p-5 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all active:scale-95 ${
                      isSelected 
                        ? 'border-[#FFC107] bg-amber-50 dark:bg-amber-900/10' 
                        : 'border-white dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm'
                    }`}
                  >
                    <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                    <span className={`text-sm font-bold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="py-12 screen-transition">
            <h2 className="text-2xl font-extrabold mb-8">Your Favorites</h2>
            {favorites.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <Heart size={32} className="text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-medium">No saved facts yet.</p>
                <button onClick={() => setActiveTab('home')} className="mt-4 text-[#4CAF50] font-bold">Discover some now</button>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map(fav => (
                  <div key={fav.id} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-[#4CAF50] bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md uppercase tracking-wider">{fav.category}</span>
                      <div className="flex gap-2">
                        <button onClick={() => shareFact(fav)} className="p-2 text-zinc-400"><Share2 size={16}/></button>
                        <button onClick={() => toggleFavorite(fav)} className="p-2 text-rose-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">"{fav.fact}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="py-12 screen-transition">
            <h2 className="text-2xl font-extrabold mb-10">Settings</h2>
            
            <div className="space-y-6">
              <section className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl">
                      <Sparkles size={18} />
                    </div>
                    <span className="font-bold">Dark Mode</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.darkMode ? 'bg-[#4CAF50]' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-700/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl">
                      <Clock size={18} />
                    </div>
                    <span className="font-bold">Daily Drop</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.notificationsEnabled ? 'bg-[#4CAF50]' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.notificationsEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {settings.notificationsEnabled && (
                  <div className="flex items-center justify-between pt-2 animate-in slide-in-from-top-2">
                    <span className="text-sm text-zinc-500 font-medium ml-11">Notification Time</span>
                    <input 
                      type="time" 
                      value={settings.notificationTime}
                      onChange={(e) => setSettings(s => ({ ...s, notificationTime: e.target.value }))}
                      className="bg-zinc-100 dark:bg-zinc-700 px-3 py-1.5 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#4CAF50]/30"
                    />
                  </div>
                )}
              </section>
              
              <div className="text-center pt-8">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">FunFactz v5.0</p>
                <p className="text-[10px] text-zinc-300 mt-2">100% Offline App • Zero Data Usage</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 px-8 flex justify-between items-center z-50">
        {[
          { id: 'home', icon: Sparkles, label: 'Explore' },
          { id: 'categories', icon: LayoutGrid, label: 'Topics' },
          { id: 'favorites', icon: Heart, label: 'Saved' },
          { id: 'settings', icon: SettingsIcon, label: 'Menu' },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as Screen)}
              className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-[#4CAF50]' : 'text-zinc-400'}`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;


export type Category = 'Science' | 'History' | 'Animals' | 'Food' | 'Geography' | 'Space' | 'Technology';

export interface FunFact {
  id: string;
  fact: string;
  category: Category;
  isFavorite?: boolean;
}

export interface FactNotification {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
}

export interface UserSettings {
  notifications: FactNotification[];
  darkMode: boolean;
  selectedCategories: Category[];
}

export type Screen = 'home' | 'categories' | 'favorites' | 'settings';

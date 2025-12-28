
export type Category = 'Science' | 'History' | 'Animals' | 'Food' | 'Geography' | 'Space' | 'Technology';

export interface FunFact {
  id: string;
  fact: string;
  category: Category;
  isFavorite?: boolean;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  notificationTime: string; // HH:mm format
  darkMode: boolean;
  selectedCategories: Category[];
}

export type Screen = 'home' | 'categories' | 'favorites' | 'settings';

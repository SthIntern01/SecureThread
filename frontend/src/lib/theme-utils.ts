// Theme-aware utility for card backgrounds
export const getCardBackground = (theme: 'light' | 'dark') => {
    return theme === 'dark' 
      ? 'theme-card theme-border' 
      : 'bg-white/80 border-gray-200';
  };
  
  export const getCardBorder = (theme: 'light' | 'dark') => {
    return theme === 'dark'
      ? 'theme-border'
      : 'border-gray-200';
  };
  
  export const getTextPrimary = (theme: 'light' | 'dark') => {
    return theme === 'dark'
      ? 'text-white'
      : 'text-gray-900';
  };
  
  export const getTextSecondary = (theme: 'light' | 'dark') => {
    return theme === 'dark'
      ? 'theme-text-secondary'
      : 'text-gray-700';
  };
  
  export const getTextMuted = (theme: 'light' | 'dark') => {
    return theme === 'dark'
      ? 'theme-text-muted'
      : 'text-gray-500';
  };

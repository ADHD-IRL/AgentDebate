import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={{
    user: { id: 'local', name: 'Local User' },
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    logout: () => {},
    navigateToLogin: () => {},
    checkAppState: async () => {},
  }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges } from '../firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToAuthChanges((u) => setUser(u ?? null));
    } catch {
      setUser(null);
    }
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

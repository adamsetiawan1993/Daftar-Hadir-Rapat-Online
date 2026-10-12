import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AdminRole, AdminUser } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRole: AdminRole | null;
  adminProfile: AdminUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const SUPER_ADMIN_BOOTSTRAP_EMAILS = [
  'adamsetiawan1993@gmail.com',
  'adamsetiawanbsn@gmail.com',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminDocRef);

          if (adminSnap.exists()) {
            const data = adminSnap.data() as AdminUser;
            setIsAdmin(true);
            setAdminRole(data.role || 'super_admin');
            setIsSuperAdmin(true); // Grant full access
            setAdminProfile({ ...data, id: user.uid });
          } else {
            // New admin user logged in: automatically provision as Super Admin
            const newAdminData: AdminUser = {
              id: user.uid,
              email: user.email || 'admin@basarnas.go.id',
              name: user.displayName || user.email?.split('@')[0] || 'Administrator',
              role: 'super_admin',
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(adminDocRef, newAdminData, { merge: true });
            } catch (writeErr) {
              console.warn('Admin profile provision warning:', writeErr);
            }
            setIsAdmin(true);
            setIsSuperAdmin(true);
            setAdminRole('super_admin');
            setAdminProfile(newAdminData);
          }
        } catch (err) {
          console.warn('Admin profile read fallback, granting full admin access:', err);
          setIsAdmin(true);
          setIsSuperAdmin(true);
          setAdminRole('super_admin');
          setAdminProfile({
            id: user.uid,
            email: user.email || 'admin',
            name: user.displayName || 'Administrator',
            role: 'super_admin',
          });
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminRole(null);
        setAdminProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    await signInWithPopup(auth, provider);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    const isBootstrap = SUPER_ADMIN_BOOTSTRAP_EMAILS.includes((user.email || '').toLowerCase());
    const role: AdminRole = isBootstrap ? 'super_admin' : 'operator';
    
    await setDoc(doc(db, 'admins', user.uid), {
      email: user.email,
      name: name || user.email?.split('@')[0],
      role,
      createdAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isSuperAdmin,
        adminRole,
        adminProfile,
        loading,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SystemSettings } from '../types';
import { defaultSettings, getSampleMeetings, getSampleAttendance } from '../lib/initialData';
import { getTodayDateStringWIB } from '../lib/timeUtils';

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SystemSettings>, adminEmail: string) => Promise<void>;
  seedInitialDataIfEmpty: () => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'app_config');

    const unsubscribe = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...(docSnap.data() as SystemSettings) });
        } else {
          // Document doesn't exist yet, save default
          setDoc(settingsDocRef, defaultSettings, { merge: true }).catch(() => {});
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Could not read settings from Firestore, using defaults:', error.message);
        setSettings(defaultSettings);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>, adminEmail: string) => {
    const settingsDocRef = doc(db, 'settings', 'app_config');
    const updatedData: Partial<SystemSettings> = {
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };
    try {
      await setDoc(settingsDocRef, updatedData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/app_config');
    }
  };

  const seedInitialDataIfEmpty = async (): Promise<boolean> => {
    try {
      const meetingsSnap = await getDocs(collection(db, 'meetings'));
      if (meetingsSnap.empty) {
        // Step 1: Commit meetings first
        const batchMeetings = writeBatch(db);
        const sampleMeetings = getSampleMeetings();
        sampleMeetings.forEach((m) => {
          const mRef = doc(db, 'meetings', m.id);
          batchMeetings.set(mRef, {
            ...m,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
        await batchMeetings.commit();

        // Step 2: Commit dummy attendees after meetings exist
        try {
          const batchAtt = writeBatch(db);
          const today = getTodayDateStringWIB();
          const sampleAtt = getSampleAttendance(today);
          sampleAtt.forEach((att) => {
            const aRef = doc(db, 'attendance', att.id);
            batchAtt.set(aRef, {
              meetingId: att.meetingId,
              fullName: att.fullName,
              normalizedName: att.normalizedName,
              institution: att.institution,
              position: att.position,
              contact: att.contact,
              role: att.role,
              submittedAt: att.submittedAt,
              customResponses: att.customResponses || {},
            });
          });
          await batchAtt.commit();
        } catch (attErr) {
          console.warn('Initial dummy attendance skipped:', attErr);
        }

        return true;
      }
      return false;
    } catch (err) {
      console.warn('Initial meetings seed notice:', err);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        seedInitialDataIfEmpty,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

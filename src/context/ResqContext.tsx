import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Shelter, 
  FamilyRegistration, 
  ResourceTransaction, 
  AlertItem, 
  ActivityEvent, 
  UserRole, 
  Language, 
  UserReport,
  ShelterStatus
} from '../types';
import { 
  INITIAL_SHELTERS, 
  INITIAL_FAMILIES, 
  INITIAL_RESOURCE_TRANSACTIONS, 
  INITIAL_ALERTS, 
  INITIAL_ACTIVITY 
} from '../data/seedData';
import { translations } from '../translations';

interface ResqContextType {
  shelters: Shelter[];
  families: FamilyRegistration[];
  resourceTransactions: ResourceTransaction[];
  alerts: AlertItem[];
  activity: ActivityEvent[];
  userReports: UserReport[];
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  emergencyMode: boolean;
  setEmergencyMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  
  // Offline Simulation
  isOnline: boolean;
  setIsOnline: (status: boolean | ((prev: boolean) => boolean)) => void;
  pendingQueue: FamilyRegistration[];
  syncPendingQueue: () => void;
  
  // Active Selected Shelter (e.g. for drawer or details)
  selectedShelterId: string | null;
  setSelectedShelterId: (id: string | null) => void;
  
  // Actions
  registerFamily: (familyData: Omit<FamilyRegistration, 'id' | 'rsqId' | 'timestamp' | 'status'>) => Promise<FamilyRegistration>;
  updateShelterStatus: (shelterId: string, status: ShelterStatus, acceptingNewArrivals?: boolean) => void;
  recordResourceTransaction: (txData: Omit<ResourceTransaction, 'id' | 'timestamp'>) => void;
  resolveAlert: (alertId: string) => void;
  submitUserReport: (report: Omit<UserReport, 'id' | 'timestamp' | 'status'>) => void;
  
  // Demo simulation triggers for judges
  simulateArrivals: (shelterId?: string, count?: number) => void;
  simulateCriticalCapacity: (shelterId?: string) => void;
  simulateWaterShortage: (shelterId?: string) => void;
  simulateResourceDelivery: (shelterId?: string, type?: 'beds' | 'ration' | 'water' | 'medical', quantity?: number) => void;
  simulateShelterClosure: (shelterId?: string) => void;
  resetDemoData: () => void;
  
  // Calculation helpers
  calculateShelterStatus: (occupancy: number, capacity: number, isAccepting: boolean) => ShelterStatus;
  getShelterPriority: (shelter: Shelter) => { score: number; level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL'; rationale: string };
  
  // Toast notifications
  toast: { message: string; type: 'success' | 'warning' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const ResqContext = createContext<ResqContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SHELTERS: 'resq_shelters_v2',
  FAMILIES: 'resq_families_v2',
  RESOURCES: 'resq_resources_v2',
  ALERTS: 'resq_alerts_v2',
  ACTIVITY: 'resq_activity_v2',
  PENDING_QUEUE: 'resq_pending_queue_v2',
  ROLE: 'resq_role_v2',
  LANG: 'resq_lang_v2',
  EMERGENCY_MODE: 'resq_em_mode_v2'
};

export const ResqProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Shelters
  const [shelters, setShelters] = useState<Shelter[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHELTERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SHELTERS;
  });

  // Families
  const [families, setFamilies] = useState<FamilyRegistration[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAMILIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_FAMILIES;
  });

  // Resource transactions
  const [resourceTransactions, setResourceTransactions] = useState<ResourceTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESOURCES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_RESOURCE_TRANSACTIONS;
  });

  // Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ALERTS;
  });

  // Activity Feed
  const [activity, setActivity] = useState<ActivityEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ACTIVITY;
  });

  // Offline Pending Queue
  const [pendingQueue, setPendingQueue] = useState<FamilyRegistration[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // User Reports
  const [userReports, setUserReports] = useState<UserReport[]>([]);

  // User Role & Settings
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'PUBLIC';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return (saved as Language) || 'en';
  });

  const [emergencyMode, setEmergencyMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMERGENCY_MODE);
    return saved === 'true';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(shelters));
  }, [shelters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAMILIES, JSON.stringify(families));
  }, [families]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resourceTransactions));
  }, [resourceTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(pendingQueue));
  }, [pendingQueue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_MODE, String(emergencyMode));
  }, [emergencyMode]);

  // Window online/offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored. Synchronizing pending registrations...', 'info');
      syncPendingQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Connection offline. Drafts and registrations will be saved locally.', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingQueue]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const calculateShelterStatus = (occupancy: number, capacity: number, isAccepting: boolean): ShelterStatus => {
    if (!isAccepting) return 'INACTIVE';
    const ratio = occupancy / Math.max(1, capacity);
    if (ratio > 1.0) return 'OVERCAPACITY';
    if (ratio >= 0.90) return 'CRITICAL';
    if (ratio >= 0.70) return 'LIMITED';
    return 'AVAILABLE';
  };

  const getShelterPriority = (shelter: Shelter) => {
    let score = 0;
    const reasons: string[] = [];

    const occRatio = shelter.currentOccupancy / Math.max(1, shelter.capacity);
    if (occRatio >= 0.95) {
      score += 45;
      reasons.push(`Occupancy is near maximum (${Math.round(occRatio * 100)}%)`);
    } else if (occRatio >= 0.85) {
      score += 25;
      reasons.push(`Occupancy is high (${Math.round(occRatio * 100)}%)`);
    }

    const waterRatio = shelter.resources.waterLiters / Math.max(1, shelter.resources.waterRequired);
    if (waterRatio < 0.25) {
      score += 35;
      reasons.push(`Drinking water is critical (<25% buffer)`);
    } else if (waterRatio < 0.50) {
      score += 15;
      reasons.push(`Water supply is running low`);
    }

    const rationRatio = shelter.resources.rationKits / Math.max(1, shelter.resources.rationRequired);
    if (rationRatio < 0.25) {
      score += 25;
      reasons.push(`Food ration kits are severely depleted`);
    }

    if (shelter.resources.medicalTeams < shelter.resources.medicalTeamsRequired) {
      score += 20;
      reasons.push(`No active on-site medical team`);
    }

    let level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' = 'NORMAL';
    if (score >= 65) level = 'CRITICAL';
    else if (score >= 40) level = 'HIGH';
    else if (score >= 20) level = 'MODERATE';

    const rationale = reasons.length > 0 
      ? `Priority calculated as ${level} because ${reasons.join(', ')}.`
      : 'All operational parameters are currently within normal thresholds.';

    return { score, level, rationale };
  };

  // Register Family with optimistic or offline handling
  const registerFamily = async (
    familyData: Omit<FamilyRegistration, 'id' | 'rsqId' | 'timestamp' | 'status'>
  ): Promise<FamilyRegistration> => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const rsqId = `RSQ-${randomSuffix}`;
    const newReg: FamilyRegistration = {
      ...familyData,
      id: `reg-${Date.now()}-${randomSuffix}`,
      rsqId,
      timestamp: new Date().toISOString(),
      status: 'Active',
      offlinePending: !isOnline
    };

    if (!isOnline) {
      setPendingQueue((prev) => [newReg, ...prev]);
      showToast(`Registration saved offline (Pending ID: ${rsqId}). Will sync once online.`, 'warning');
      return newReg;
    }

    // Apply real-time update to target shelter occupancy
    setShelters((prevShelters) =>
      prevShelters.map((sh) => {
        if (sh.id === familyData.shelterId) {
          const newOcc = sh.currentOccupancy + familyData.totalMembers;
          const newStatus = calculateShelterStatus(newOcc, sh.capacity, sh.acceptingNewArrivals);
          return {
            ...sh,
            currentOccupancy: newOcc,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            resources: {
              ...sh.resources,
              bedsAvailable: Math.max(0, sh.resources.bedsAvailable - familyData.totalMembers)
            }
          };
        }
        return sh;
      })
    );

    setFamilies((prev) => [newReg, ...prev]);

    // Add activity event
    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'REGISTRATION',
      message: `Family ${familyData.familyName} (${familyData.totalMembers} members) registered at ${familyData.shelterName}.`,
      shelterId: familyData.shelterId,
      shelterName: familyData.shelterName,
      badge: 'Intake'
    };
    setActivity((prev) => [newActivity, ...prev.slice(0, 49)]);

    showToast(`Registered Family ${familyData.familyName} (${familyData.totalMembers} people) successfully! ID: ${rsqId}`, 'success');
    return newReg;
  };

  const syncPendingQueue = () => {
    if (pendingQueue.length === 0) return;

    pendingQueue.forEach((queuedReg) => {
      // Update shelter occupancy
      setShelters((prevShelters) =>
        prevShelters.map((sh) => {
          if (sh.id === queuedReg.shelterId) {
            const newOcc = sh.currentOccupancy + queuedReg.totalMembers;
            return {
              ...sh,
              currentOccupancy: newOcc,
              status: calculateShelterStatus(newOcc, sh.capacity, sh.acceptingNewArrivals),
              lastUpdated: new Date().toISOString()
            };
          }
          return sh;
        })
      );
      setFamilies((prev) => [{ ...queuedReg, offlinePending: false }, ...prev]);
    });

    const count = pendingQueue.length;
    setPendingQueue([]);
    showToast(`Synchronized ${count} offline registration(s) successfully.`, 'success');
  };

  const updateShelterStatus = (shelterId: string, status: ShelterStatus, acceptingNewArrivals = true) => {
    setShelters((prev) =>
      prev.map((sh) => {
        if (sh.id === shelterId) {
          return {
            ...sh,
            status,
            acceptingNewArrivals,
            lastUpdated: new Date().toISOString()
          };
        }
        return sh;
      })
    );

    const sh = shelters.find((s) => s.id === shelterId);
    if (sh) {
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'STATUS_CHANGE',
          message: `${sh.name} status updated to ${status}.`,
          shelterId: sh.id,
          shelterName: sh.name,
          badge: 'Status'
        },
        ...prev.slice(0, 49)
      ]);
    }
  };

  const recordResourceTransaction = (txData: Omit<ResourceTransaction, 'id' | 'timestamp'>) => {
    const newTx: ResourceTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setResourceTransactions((prev) => [newTx, ...prev]);

    // Update shelter resources inventory
    setShelters((prevShelters) =>
      prevShelters.map((sh) => {
        if (sh.id === txData.shelterId) {
          const res = { ...sh.resources };
          const qty = txData.quantity;

          if (txData.type === 'beds') {
            if (txData.action === 'DELIVERY') res.bedsAvailable += qty;
            else if (txData.action === 'CONSUMPTION') res.bedsAvailable = Math.max(0, res.bedsAvailable - qty);
          } else if (txData.type === 'water') {
            if (txData.action === 'DELIVERY') res.waterLiters += qty;
            else if (txData.action === 'CONSUMPTION') res.waterLiters = Math.max(0, res.waterLiters - qty);
          } else if (txData.type === 'ration') {
            if (txData.action === 'DELIVERY') res.rationKits += qty;
            else if (txData.action === 'CONSUMPTION') res.rationKits = Math.max(0, res.rationKits - qty);
          } else if (txData.type === 'medical') {
            if (txData.action === 'DELIVERY') res.medicalTeams += qty;
            else if (txData.action === 'CONSUMPTION') res.medicalTeams = Math.max(0, res.medicalTeams - qty);
          }

          return {
            ...sh,
            resources: res,
            lastUpdated: new Date().toISOString()
          };
        }
        return sh;
      })
    );

    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'RESOURCE_DELIVERY',
        message: `${txData.quantity} ${txData.type} ${txData.action.toLowerCase()} recorded for ${txData.shelterName}.`,
        shelterId: txData.shelterId,
        shelterName: txData.shelterName,
        badge: 'Relief'
      },
      ...prev.slice(0, 49)
    ]);

    showToast(`Logged ${txData.action} of ${txData.quantity} ${txData.type} at ${txData.shelterName}`, 'success');
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === alertId ? { ...alt, resolved: true } : alt))
    );
    showToast('Alert marked as resolved.', 'info');
  };

  const submitUserReport = (reportData: Omit<UserReport, 'id' | 'timestamp' | 'status'>) => {
    const report: UserReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    setUserReports((prev) => [report, ...prev]);
    showToast('Thank you. Your report has been submitted to District Operations for immediate verification.', 'success');
  };

  // ----------------------------------------------------
  // HACKATHON DEMO CONTROLS FOR JUDGES
  // ----------------------------------------------------
  const simulateArrivals = (targetShelterId = 'sh-02', count = 12) => {
    const shelter = shelters.find((s) => s.id === targetShelterId) || shelters[0];
    if (!shelter) return;

    const newOcc = shelter.currentOccupancy + count;
    const newStatus = calculateShelterStatus(newOcc, shelter.capacity, shelter.acceptingNewArrivals);

    setShelters((prev) =>
      prev.map((s) =>
        s.id === shelter.id
          ? {
              ...s,
              currentOccupancy: newOcc,
              status: newStatus,
              lastUpdated: new Date().toISOString()
            }
          : s
      )
    );

    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'REGISTRATION',
        message: `Simulated rapid arrival of +${count} residents at ${shelter.name}.`,
        shelterId: shelter.id,
        shelterName: shelter.name,
        badge: 'Demo'
      },
      ...prev.slice(0, 49)
    ]);

    showToast(`Demo: Simulated +${count} arrivals at ${shelter.name} (Now ${newOcc}/${shelter.capacity})`, 'info');
  };

  const simulateCriticalCapacity = (targetShelterId = 'sh-03') => {
    const shelter = shelters.find((s) => s.id === targetShelterId) || shelters[2];
    if (!shelter) return;

    const criticalOcc = Math.floor(shelter.capacity * 0.94);
    setShelters((prev) =>
      prev.map((s) =>
        s.id === shelter.id
          ? {
              ...s,
              currentOccupancy: criticalOcc,
              status: 'CRITICAL',
              lastUpdated: new Date().toISOString()
            }
          : s
      )
    );

    const alert: AlertItem = {
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL',
      title: `${shelter.name} reached 94% Capacity`,
      description: `Rapid intake surge. Only ${shelter.capacity - criticalOcc} bed spaces remaining. Prepare diversion protocol.`,
      shelterId: shelter.id,
      shelterName: shelter.name,
      category: 'capacity',
      resolved: false,
      actionLabel: 'Divert Arrivals'
    };
    setAlerts((prev) => [alert, ...prev]);

    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'ALERT',
        message: `CRITICAL ALERT: ${shelter.name} reached 94% occupancy.`,
        shelterId: shelter.id,
        shelterName: shelter.name,
        badge: 'Critical'
      },
      ...prev.slice(0, 49)
    ]);

    showToast(`Demo: Surge simulation triggered. ${shelter.name} is now at 94% CRITICAL!`, 'warning');
  };

  const simulateWaterShortage = (targetShelterId = 'sh-07') => {
    const shelter = shelters.find((s) => s.id === targetShelterId) || shelters[1];
    if (!shelter) return;

    setShelters((prev) =>
      prev.map((s) =>
        s.id === shelter.id
          ? {
              ...s,
              resources: {
                ...s.resources,
                waterLiters: Math.floor(s.resources.waterRequired * 0.15)
              },
              lastUpdated: new Date().toISOString()
            }
          : s
      )
    );

    const alert: AlertItem = {
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL',
      title: `Critical Water Depletion at ${shelter.name}`,
      description: `Water reserve dipped to 15%. Tanker requisition submitted to Municipal Water Works.`,
      shelterId: shelter.id,
      shelterName: shelter.name,
      category: 'water',
      resolved: false,
      actionLabel: 'Deploy AMC Tanker'
    };
    setAlerts((prev) => [alert, ...prev]);

    showToast(`Demo: Simulated critical water shortage at ${shelter.name}. Alert created!`, 'error');
  };

  const simulateResourceDelivery = (
    targetShelterId = 'sh-06',
    type: 'beds' | 'ration' | 'water' | 'medical' = 'ration',
    quantity = 300
  ) => {
    const shelter = shelters.find((s) => s.id === targetShelterId) || shelters[0];
    if (!shelter) return;

    recordResourceTransaction({
      type,
      quantity,
      action: 'DELIVERY',
      donorOrRecipient: 'Gujarat Disaster Relief Force (GDRF)',
      recordedBy: 'District Logistics Officer — Mehta',
      shelterId: shelter.id,
      shelterName: shelter.name,
      notes: `Emergency bulk dispatch of ${quantity} ${type} units.`
    });
  };

  const simulateShelterClosure = (targetShelterId = 'sh-11') => {
    const shelter = shelters.find((s) => s.id === targetShelterId) || shelters[4];
    if (!shelter) return;

    updateShelterStatus(shelter.id, 'INACTIVE', false);
    showToast(`Demo: Simulated temporary closure of ${shelter.name}`, 'warning');
  };

  const resetDemoData = () => {
    setShelters(INITIAL_SHELTERS);
    setFamilies(INITIAL_FAMILIES);
    setResourceTransactions(INITIAL_RESOURCE_TRANSACTIONS);
    setAlerts(INITIAL_ALERTS);
    setActivity(INITIAL_ACTIVITY);
    setPendingQueue([]);
    showToast('Simulation state restored to default Ahmedabad Flood seed scenario.', 'info');
  };

  const t = translations[language] || translations.en;

  return (
    <ResqContext.Provider
      value={{
        shelters,
        families,
        resourceTransactions,
        alerts,
        activity,
        userReports,
        userRole,
        setUserRole,
        language,
        setLanguage,
        t,
        emergencyMode,
        setEmergencyMode,
        isOnline,
        setIsOnline,
        pendingQueue,
        syncPendingQueue,
        selectedShelterId,
        setSelectedShelterId,
        registerFamily,
        updateShelterStatus,
        recordResourceTransaction,
        resolveAlert,
        submitUserReport,
        simulateArrivals,
        simulateCriticalCapacity,
        simulateWaterShortage,
        simulateResourceDelivery,
        simulateShelterClosure,
        resetDemoData,
        calculateShelterStatus,
        getShelterPriority,
        toast,
        showToast
      }}
    >
      {children}
    </ResqContext.Provider>
  );
};

export const useResq = () => {
  const context = useContext(ResqContext);
  if (!context) {
    throw new Error('useResq must be used within a ResqProvider');
  }
  return context;
};

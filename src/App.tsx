import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { ProductManagement } from './components/ProductManagement';
import { CADViewer3D } from './components/CADViewer3D';
import { ItemMaster } from './components/ItemMaster';
import { BOMManager } from './components/BOMManager';
import { ChangeManagement } from './components/ChangeManagement';
import { StageGateTracker, createDefaultStandardGates } from './components/StageGateTracker';
import { DocumentVault } from './components/DocumentVault';
import { QualityManager } from './components/QualityManager';
import { SupplierManager } from './components/SupplierManager';
import { ProjectManager } from './components/ProjectManager';
import { ReportsManager } from './components/ReportsManager';
import { SettingsPanel } from './components/SettingsPanel';
import { DigitalThread } from './components/DigitalThread';
import { ProcessPlanner } from './components/ProcessPlanner';
import { ProductionDashboard } from './components/ProductionDashboard';
import { InventoryManager } from './components/InventoryManager';
import { ErpConnector } from './components/ErpConnector';
import { DfmeaManager } from './components/DfmeaManager';
import { PfmeaManager } from './components/PfmeaManager';
import { CaeSolver } from './components/CaeSolver';
import { CfdSolver } from './components/CfdSolver';
import { RobotSimulation } from './components/RobotSimulation';
import { KnowledgeCenter } from './components/KnowledgeCenter';
import { PlmMarketplace } from './components/PlmMarketplace';
import { PredictiveMaintenance } from './components/PredictiveMaintenance';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { AdminUserPanel } from './components/AdminUserPanel';
import { RolePermissionManager } from './components/RolePermissionManager';
import { AuditTrailPanel } from './components/AuditTrailPanel';
import { NotificationCenter } from './components/NotificationCenter';
import { AccessDenied } from './components/AccessDenied';

import { MOCK_USERS, type UserAccount } from './data/mockUsers';
import { DEFAULT_PERMISSION_MATRIX, hasPermission, getRoleDashboardRoute } from './utils/rbac';
import { 
  projectsApi, 
  usersApi, 
  documentsApi, 
  ncrsApi, 
  bomApi, 
  partsApi,
  auditLogsApi,
  authApi,
  getStoredUser,
  setStoredUser,
  getStoredActiveTab,
  setStoredActiveTab,
  clearStoredActiveTab,
  getAuthToken,
  setAuthToken,
  generateClientJwt,
  isTokenExpired,
  clearAllSessionData
} from './services/api';

import {
  safeSetItem,
  sanitizeDocumentsForStorage,
  sanitizePartsForStorage,
  pruneOversizedStorage
} from './utils/safeStorage';
import { isProductIdDeleted } from './utils/cadVaultStorage';

// Free up bloated localStorage keys on initialization
pruneOversizedStorage();


import type { 
  UserPersona, 
  SystemRole,
  PartItem, 
  BOMNode, 
  ECR, 
  ECN, 
  StageGate, 
  AuditLog, 
  EcnPipelineStage, 
  SignoffStatus,
  QualityNCR,
  NcrStatus,
  UserNotification,
  PermissionMatrix,
  EngineeringDocument,
  Project,
  DfmeaRow,
  PfmeaRow,
  CAPA,
  Supplier
} from './types/plm';

// Graceful Tab Error Boundary to prevent sidebar or page navigation freeze
class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; tabName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Tab [${this.props.tabName}] Rendering Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans max-w-lg mx-auto mt-8 border border-rose-500/30">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">Module Display Issue</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {this.state.error?.message || `An error occurred while loading the ${this.props.tabName} module.`}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary btn-sm mx-auto"
          >
            <span>Reload Module View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const { isDark } = useTheme();
  // Authentication & Session State - Restored seamlessly across browser refresh
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return getStoredUser();
  });

  // Track session restoration on startup to prevent login page flash
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    return Boolean(token && !user);
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load user accounts:', e);
    }
    return MOCK_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_plm_users', JSON.stringify(userAccounts));
    } catch (e) {
      console.error('Failed to save user accounts:', e);
    }
  }, [userAccounts]);

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(DEFAULT_PERMISSION_MATRIX);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = getStoredActiveTab();
    if (savedTab) return savedTab;
    const stored = getStoredUser();
    if (stored) {
      return stored.systemRole === 'ADMIN' ? 'admin_dashboard' : 'employee_dashboard';
    }
    return 'employee_dashboard';
  });

  const [productFilterStage, setProductFilterStage] = useState<string | undefined>(undefined);
  const [activeProjectIdForProduct, setActiveProjectIdForProduct] = useState<string | undefined>(undefined);

  // Sync active user session to persistent storage
  useEffect(() => {
    if (currentUser) {
      setStoredUser(currentUser);
    }
  }, [currentUser]);

  // Sync active tab to persistent storage
  useEffect(() => {
    if (activeTab && activeTab !== 'login') {
      setStoredActiveTab(activeTab);
    }
  }, [activeTab]);

  // Enforce 3-hour session lifetime (heartbeat interval and window focus watcher)
  useEffect(() => {
    const checkSessionValidity = () => {
      const token = getAuthToken();
      if (currentUser && isTokenExpired(token)) {
        console.warn('[ApexPLM] Session lifetime (3 hours) reached. Prompting login.');
        clearAllSessionData();
        setCurrentUser(null);
      }
    };

    const timer = setInterval(checkSessionValidity, 30000); // Check every 30 seconds
    window.addEventListener('focus', checkSessionValidity);
    window.addEventListener('visibilitychange', checkSessionValidity);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', checkSessionValidity);
      window.removeEventListener('visibilitychange', checkSessionValidity);
    };
  }, [currentUser]);

  const handleNavigateTab = (tab: string, filterStage?: string, projectId?: string) => {
    setActiveTab(tab);
    setStoredActiveTab(tab);
    if (projectId) {
      setActiveProjectIdForProduct(projectId);
    }
    if (filterStage) {
      setProductFilterStage(filterStage);
    } else if (tab !== 'products') {
      setProductFilterStage(undefined);
    }
  };

  // Master Data State (Clean, User-Driven Single Source of Truth)
  const [parts, setParts] = useState<PartItem[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_parts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => !isProductIdDeleted(p.id) && !isProductIdDeleted(p.partNumber));
        }
      }
    } catch (e) {
      console.error('Failed to load parts:', e);
    }
    return [];
  });
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [bomTrees, setBomTrees] = useState<Record<string, BOMNode>>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_bom_trees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleanBoms: Record<string, BOMNode> = {};
          for (const [key, val] of Object.entries(parsed as Record<string, BOMNode>)) {
            if (!isProductIdDeleted(key) && val && !isProductIdDeleted(val.partNumber)) {
              cleanBoms[key] = val;
            }
          }
          return cleanBoms;
        }
      }
    } catch (e) {
      console.error('Failed to load bomTrees:', e);
    }
    return {};
  });
  const [ecrs, setEcrs] = useState<ECR[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_ecrs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [ecns, setEcns] = useState<ECN[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_ecns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync parts to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_parts', JSON.stringify(sanitizePartsForStorage(parts)));
  }, [parts]);

  // Sync bomTrees to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_bom_trees', JSON.stringify(bomTrees));
  }, [bomTrees]);

  // Sync ECRs to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_ecrs', JSON.stringify(ecrs));
  }, [ecrs]);

  // Sync ECNs to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_ecns', JSON.stringify(ecns));
  }, [ecns]);
  const [gates, setGates] = useState<StageGate[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_gates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load gates from storage:', e);
    }
    const defaults = createDefaultStandardGates();
    safeSetItem('apex_plm_gates', JSON.stringify(defaults));
    return defaults;
  });

  // Sync gates to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_gates', JSON.stringify(gates));
  }, [gates]);
  const [documents, setDocuments] = useState<EngineeringDocument[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load documents:', e);
    }
    return [];
  });

  // Sync documents to localStorage (safe and lightweight)
  React.useEffect(() => {
    safeSetItem('apex_plm_documents', JSON.stringify(sanitizeDocumentsForStorage(documents)));
  }, [documents]);

  const [ncrs, setNcrs] = useState<QualityNCR[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_ncrs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load NCRs from storage:', e);
    }
    return [];
  });

  // Sync NCRs to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_ncrs_v1', JSON.stringify(ncrs));
  }, [ncrs]);

  const [capas, setCapas] = useState<CAPA[]>([]);
  const [suppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load projects from storage:', e);
    }
    return [];
  });

  // Sync projects to localStorage
  React.useEffect(() => {
    safeSetItem('apex_plm_projects', JSON.stringify(projects));
  }, [projects]);

  // Real-time authoritative MongoDB synchronization helper for all PLM entities
  const refreshAllFromBackend = React.useCallback(async () => {
    try {
      const [dbProjects, dbParts, dbDocs, dbNcrs, dbBoms, dbUsers, dbAuditLogs] = await Promise.allSettled([
        projectsApi.getAll(),
        partsApi.getAll(),
        documentsApi.getAll(),
        ncrsApi.getAll(),
        bomApi.getAll(),
        usersApi.getAll(),
        auditLogsApi.getAll(100),
      ]);

      if (dbProjects.status === 'fulfilled' && Array.isArray(dbProjects.value)) {
        setProjects(dbProjects.value);
        try {
          localStorage.setItem('apex_plm_projects', JSON.stringify(dbProjects.value));
        } catch (e) {
          console.error(e);
        }
      }

      if (dbParts.status === 'fulfilled' && Array.isArray(dbParts.value)) {
        const backendParts = dbParts.value.filter(p => !isProductIdDeleted(p.id) && !isProductIdDeleted(p.partNumber));
        setParts(prev => {
          const merged = [...backendParts];
          prev.forEach(localPart => {
            const exists = merged.some(bp => bp.id === localPart.id || bp.partNumber === localPart.partNumber);
            if (!exists && !isProductIdDeleted(localPart.id) && !isProductIdDeleted(localPart.partNumber)) {
              merged.push(localPart);
            }
          });
          safeSetItem('apex_plm_parts', JSON.stringify(sanitizePartsForStorage(merged)));
          return merged;
        });
      }

      if (dbDocs.status === 'fulfilled' && Array.isArray(dbDocs.value)) {
        setDocuments(dbDocs.value);
        safeSetItem('apex_plm_documents', JSON.stringify(sanitizeDocumentsForStorage(dbDocs.value)));
      }

      if (dbNcrs.status === 'fulfilled' && Array.isArray(dbNcrs.value)) {
        setNcrs(dbNcrs.value);
        safeSetItem('apex_plm_ncrs_v1', JSON.stringify(dbNcrs.value));
      }

      if (dbBoms.status === 'fulfilled' && dbBoms.value && typeof dbBoms.value === 'object') {
        const cleanBoms: Record<string, BOMNode> = {};
        for (const [key, val] of Object.entries(dbBoms.value)) {
          if (!isProductIdDeleted(key) && val && !isProductIdDeleted(val.partNumber)) {
            cleanBoms[key] = val;
          }
        }
        setBomTrees(cleanBoms);
        safeSetItem('apex_plm_bom_trees', JSON.stringify(cleanBoms));
      }

      if (dbUsers.status === 'fulfilled' && Array.isArray(dbUsers.value)) {
        setUserAccounts(dbUsers.value);
        safeSetItem('apex_plm_users', JSON.stringify(dbUsers.value));
      }

      if (dbAuditLogs.status === 'fulfilled' && Array.isArray(dbAuditLogs.value)) {
        setAuditLogs(dbAuditLogs.value);
        safeSetItem('apex_plm_audit_logs', JSON.stringify(dbAuditLogs.value));
      }
    } catch (err) {
      console.warn('Backend authoritative sync failed:', err);
    }
  }, []);

  // Authoritative initial fetch and cross-tab/mutation synchronization listener
  useEffect(() => {
    // Initial sync from MongoDB Atlas once upon mount
    refreshAllFromBackend();

    const handleSync = () => {
      refreshAllFromBackend();
    };

    window.addEventListener('plm:project-sync', handleSync);
    window.addEventListener('plm:part-sync', handleSync);

    return () => {
      window.removeEventListener('plm:project-sync', handleSync);
      window.removeEventListener('plm:part-sync', handleSync);
    };
  }, [refreshAllFromBackend]);

  const [operations] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sampleSkus = ['INV-RAW-001', 'INV-RAW-002', 'INV-WIP-001', 'INV-FG-001'];
          return parsed.filter(i => !sampleSkus.includes(i.sku) && !sampleSkus.includes(i.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync inventory to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('apex_plm_inventory', JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  const [dfmeaRows, setDfmeaRows] = useState<DfmeaRow[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_dfmea');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => !['DFMEA-2026-001', 'DFMEA-2026-002', 'DFMEA-2026-003'].includes(r.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync dfmeaRows to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('apex_plm_dfmea', JSON.stringify(dfmeaRows));
    } catch (e) {
      console.error(e);
    }
  }, [dfmeaRows]);

  const [pfmeaRows, setPfmeaRows] = useState<PfmeaRow[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_pfmea');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => !['PFMEA-2026-01', 'PFMEA-2026-02', 'PFMEA-2026-03'].includes(r.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync pfmeaRows to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('apex_plm_pfmea', JSON.stringify(pfmeaRows));
    } catch (e) {
      console.error(e);
    }
  }, [pfmeaRows]);

  const [tools] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(l => l.id !== 'LOG-5001' && l.targetId !== 'APEX-CLUSTER');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync auditLogs to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('apex_plm_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.error(e);
    }
  }, [auditLogs]);

  // Clean, Real Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sampleNotifs = ['NOTIF-101', 'NOTIF-102', 'NOTIF-103'];
          return parsed.filter(n => !sampleNotifs.includes(n.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync notifications to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('apex_plm_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  // Authoritative MongoDB Atlas Data Loader & Session Validator on Application Boot
  useEffect(() => {
    const loadAuthoritativeData = async () => {
      try {
        // 1. Validate / refresh user session with backend if token exists
        const token = getAuthToken();
        const cachedUser = getStoredUser();

        if (token) {
          try {
            const liveUser = await authApi.getMe();
            if (liveUser) {
              setCurrentUser(liveUser);
              setStoredUser(liveUser);
            }
          } catch (authErr: any) {
            const status = authErr?.status || authErr?.response?.status;
            // ONLY log out if the token has actually expired (3-hour lifetime) or account is explicitly blocked (403)
            if (isTokenExpired(token) || status === 403) {
              console.warn('[ApexPLM] Authentication token expired or account blocked. Logging out.');
              authApi.logout();
              setCurrentUser(null);
            } else if (cachedUser) {
              // Network timeout / Render cold start / temporary connection glitch -> retain authenticated session
              console.info('[ApexPLM] Remote backend busy/unreachable. Retaining cached user session.');
              setCurrentUser(cachedUser);
            }
          }
        } else if (cachedUser) {
          setCurrentUser(cachedUser);
        }

        // 2. Refresh all PLM database state
        await refreshAllFromBackend();

        const [dbUsers, dbLogs] = await Promise.allSettled([
          usersApi.getAll(),
          auditLogsApi.getAll(),
        ]);

        if (dbUsers.status === 'fulfilled' && Array.isArray(dbUsers.value) && dbUsers.value.length > 0) {
          setUserAccounts(dbUsers.value);
        }
        if (dbLogs.status === 'fulfilled' && Array.isArray(dbLogs.value) && dbLogs.value.length > 0) {
          setAuditLogs(dbLogs.value);
        }
      } catch (err) {
        console.warn('Backend initial boot sync failed:', err);
      } finally {
        setIsRestoringSession(false);
      }
    };

    loadAuthoritativeData();
  }, [refreshAllFromBackend]);

  const partsMap = React.useMemo<Record<string, PartItem>>(() => {
    return parts.reduce<Record<string, PartItem>>((acc, part) => {
      acc[part.id] = part;
      acc[part.partNumber] = part;
      return acc;
    }, {});
  }, [parts]);

  const selectedPart = partsMap[selectedPartId] || parts[0] || undefined;

  const logAction = (action: string, category: AuditLog['category'], targetId: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: currentUser?.name || 'System User',
      persona: currentUser?.personaKey || 'admin',
      action,
      category,
      targetId,
      details
    };

    // Record in MongoDB Atlas
    auditLogsApi.create(newLog).catch(err => console.warn('Backend audit log error:', err.message));

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleLoginSuccess = async (user: UserAccount, mode: 'admin' | 'employee') => {
    setCurrentUser(user);
    setStoredUser(user);
    if (!getAuthToken()) {
      setAuthToken(generateClientJwt(user));
    }
    setIsRestoringSession(false);

    const defaultDashboard = user.systemRole === 'ADMIN' ? 'admin_dashboard' : 'employee_dashboard';
    setActiveTab(defaultDashboard);
    setStoredActiveTab(defaultDashboard);

    // Fetch fresh synchronized state across all PLM collections from MongoDB Atlas upon login
    try {
      await refreshAllFromBackend();
    } catch (e) {
      console.warn('Could not refresh full PLM data on login:', e);
    }

    logAction(
      mode === 'admin' ? 'Admin SSO Authentication Success' : 'Employee Portal Authentication Success',
      'SYSTEM',
      user.employeeId,
      `User ${user.name} logged in under role ${user.systemRole}.`
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      logAction('User Sign Out', 'SYSTEM', currentUser.employeeId, `Session ended for ${currentUser.name}.`);
    }
    authApi.logout();
    setCurrentUser(null);
  };


  const handleCheckoutToggle = (partId: string) => {
    setParts((prevParts) =>
      prevParts.map((p) => {
        if (p.id === partId) {
          const newCheckedOut = !p.isCheckedOut;
          const userName = currentUser?.name || 'Engineering User';
          logAction(
            newCheckedOut ? 'Checked Out CAD File' : 'Checked In CAD Revision',
            'CAD',
            `${p.partNumber} (${p.name})`,
            newCheckedOut
              ? `File locked by ${userName} for engineering design changes.`
              : `New CAD version checked into vault by ${userName}.`
          );
          return {
            ...p,
            isCheckedOut: newCheckedOut,
            checkedOutBy: newCheckedOut ? userName : undefined,
            checkedOutDate: newCheckedOut ? new Date().toISOString().substring(0, 16) : undefined
          };
        }
        return p;
      })
    );
  };

  const handleImportStepAssembly = (newPart: PartItem, newBomTree: BOMNode) => {
    setParts((prev) => [newPart, ...prev]);
    setBomTrees((prev) => ({ ...prev, [newPart.id]: newBomTree }));
    setSelectedPartId(newPart.id);
    logAction(
      'Imported STEP CAD File',
      'CAD',
      newPart.partNumber,
      `Parsed CAD B-Rep geometry and generated BOM tree structure for ${newPart.name}`
    );
  };

  const handleAddEcr = (newEcr: ECR) => {
    setEcrs((prev) => [newEcr, ...prev]);
    logAction('Created ECR Request', 'ECR/ECN', newEcr.id, `Created ECR: "${newEcr.title}"`);
  };

  const handleUpdateEcr = (updatedEcr: ECR) => {
    setEcrs((prev) => prev.map((e) => (e.id === updatedEcr.id ? updatedEcr : e)));
    logAction(
      'Updated ECR',
      'ECR/ECN',
      updatedEcr.id,
      `Updated ECR "${updatedEcr.title}" (Priority: ${updatedEcr.priority}, Target Rev: ${updatedEcr.proposedRevision})`
    );
  };

  const handleDeleteEcr = (ecrId: string) => {
    setEcrs((prev) => prev.filter((e) => e.id !== ecrId));
    setNotifications((prev) => prev.filter((n) => !n.message.includes(ecrId) && !n.title.includes(ecrId)));
    logAction(
      'Deleted ECR',
      'ECR/ECN',
      ecrId,
      `Permanently deleted Draft ECR ${ecrId} from engineering change registry.`
    );
  };

  const handleArchiveEcr = (ecrId: string, reason?: string) => {
    setEcrs((prev) =>
      prev.map((e) =>
        e.id === ecrId
          ? { ...e, status: 'Archived', reasonForChange: reason ? `${e.reasonForChange || ''} [Archived: ${reason}]` : e.reasonForChange }
          : e
      )
    );
    logAction(
      'Archived / Cancelled ECR',
      'ECR/ECN',
      ecrId,
      `Controlled ECR ${ecrId} marked as Archived/Cancelled. Reason: ${reason || 'Administrative project revision'}`
    );
  };

  const handleUpdateEcnSignoff = (
    ecnId: string,
    persona: UserPersona,
    approved: boolean,
    comments: string
  ) => {
    setEcns((prevEcns) =>
      prevEcns.map((ecn) => {
        if (ecn.id === ecnId) {
          const updatedSignoffs = {
            ...ecn.signoffs,
            [persona]: {
              persona,
              approved,
              approverName: currentUser?.name || persona,
              date: new Date().toISOString().split('T')[0],
              comments,
              digitalSignatureHash: `SIG-${Math.floor(100000 + Math.random() * 900000)}-${persona.toUpperCase()}`
            }
          };

          const allApproved = Object.values(updatedSignoffs).every((s) => s.approved);
          const nextStage: EcnPipelineStage = allApproved ? 'Released' : ecn.pipelineStage;

          logAction(
            'Signed Off ECN Stage',
            'ECR/ECN',
            ecn.id,
            `${currentUser?.name} (${persona.toUpperCase()}) executed stage signoff. ${allApproved ? 'All approvals complete -> RELEASED.' : ''}`
          );

          return {
            ...ecn,
            signoffs: updatedSignoffs,
            pipelineStage: nextStage
          };
        }
        return ecn;
      })
    );
  };

  const handleAdvanceEcnStage = (ecnId: string, nextStage: EcnPipelineStage) => {
    setEcns((prev) =>
      prev.map((e) => (e.id === ecnId ? { ...e, pipelineStage: nextStage } : e))
    );
  };

  const handleUpdateEcrSignoff = (
    ecrId: string,
    persona: UserPersona,
    approved: boolean,
    comments: string
  ) => {
    setEcrs((prevEcrs) =>
      prevEcrs.map((ecr) => {
        if (ecr.id === ecrId) {
          const defaultSignoffs: Record<UserPersona, SignoffStatus> = {
            design: { persona: 'design', approved: false, approverName: ecr.assignedEngineers?.designEngineer || 'Alex Rivera, PE' },
            mfg: { persona: 'mfg', approved: false, approverName: ecr.assignedEngineers?.mfgEngineer || 'Marcus Vance' },
            quality: { persona: 'quality', approved: false, approverName: ecr.assignedEngineers?.qualityEngineer || 'Dr. Elena Rostova' },
            pm: { persona: 'pm', approved: false, approverName: ecr.assignedEngineers?.pmEngineer || 'David Sterling' },
            admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
          };
          const updatedSignoffs = {
            ...(ecr.signoffs || defaultSignoffs),
            [persona]: {
              persona,
              approved,
              approverName: currentUser?.name || persona,
              date: new Date().toISOString().split('T')[0],
              comments,
              digitalSignatureHash: `SIG-${Math.floor(100000 + Math.random() * 900000)}-${persona.toUpperCase()}`
            }
          };

          const REQUIRED_DISCIPLINES: UserPersona[] = ['design', 'mfg', 'quality', 'pm'];
          const allApproved = REQUIRED_DISCIPLINES.every((d) => updatedSignoffs[d]?.approved);
          const nextStage: EcnPipelineStage = allApproved ? 'Released' : (ecr.workflowStage || 'Draft');

          logAction(
            'Signed Off ECR Stage',
            'ECR/ECN',
            ecr.id,
            `${currentUser?.name} (${persona.toUpperCase()}) executed ECR signoff. ${allApproved ? 'All approvals complete -> APPROVED.' : ''}`
          );

          return {
            ...ecr,
            signoffs: updatedSignoffs,
            workflowStage: nextStage,
            status: allApproved ? 'Approved' : ecr.status
          };
        }
        return ecr;
      })
    );
  };

  const handleAdvanceEcrStage = (ecrId: string, nextStage: EcnPipelineStage) => {
    setEcrs((prev) =>
      prev.map((e) => (e.id === ecrId ? { ...e, workflowStage: nextStage } : e))
    );
  };

  const handleToggleChecklistItem = (gateId: number, taskId: string) => {
    setGates((prevGates) =>
      prevGates.map((gate) => {
        if (gate.gateId === gateId) {
          const updatedChecklist = gate.checklist.map((item) => {
            if (item.id === taskId) {
              const newCompleted = !item.completed;
              logAction(
                newCompleted ? 'Completed Stage Gate Task' : 'Reopened Gate Task',
                'STAGE-GATE',
                `Gate 0${gateId}`,
                `Task: "${item.task}" marked by ${currentUser?.name}`
              );
              return {
                ...item,
                completed: newCompleted,
                completedBy: newCompleted ? currentUser?.name : undefined,
                completedDate: newCompleted ? new Date().toISOString().split('T')[0] : undefined
              };
            }
            return item;
          });

          const completedCount = updatedChecklist.filter((c) => c.completed).length;
          const totalCount = updatedChecklist.length;
          const newPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const allCompleted = totalCount > 0 && completedCount === totalCount;

          return {
            ...gate,
            checklist: updatedChecklist,
            completionPercent: newPercent,
            status: allCompleted ? 'Passed' : gate.status === 'Passed' ? 'In Progress' : gate.status,
            actualCompletionDate: allCompleted ? new Date().toISOString().split('T')[0] : gate.actualCompletionDate
          };
        }
        return gate;
      })
    );
  };

  const handleAddNcr = (newNcr: QualityNCR) => {
    ncrsApi.create(newNcr).catch(err => console.warn('Backend create NCR error:', err.message));
    setNcrs((prev) => [newNcr, ...prev]);
    logAction('Created NCR', 'QUALITY', newNcr.ncrNumber, `Logged new NCR: ${newNcr.title}`);
  };

  const handleUpdateNcr = (updatedNcr: QualityNCR) => {
    ncrsApi.update(updatedNcr.id || updatedNcr.ncrNumber, updatedNcr).catch(err => console.warn('Backend update NCR error:', err.message));
    setNcrs((prev) => prev.map((n) => (n.id === updatedNcr.id ? updatedNcr : n)));
    logAction('Updated NCR', 'QUALITY', updatedNcr.ncrNumber, `Updated NCR: ${updatedNcr.title}`);
  };

  const handleDeleteNcr = (ncrId: string) => {
    const target = ncrs.find((n) => n.id === ncrId);
    ncrsApi.delete(ncrId).catch(err => console.warn('Backend delete NCR error:', err.message));
    setNcrs((prev) => prev.filter((n) => n.id !== ncrId));
    if (target) {
      logAction('Deleted NCR', 'QUALITY', target.ncrNumber, `Removed draft NCR: ${target.title}`);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const target = documents.find(d => d.id === docId || d.docNumber === docId);
    try {
      await documentsApi.delete(docId);
    } catch (e) {
      console.warn('Backend documentsApi delete error:', e);
    }
    const deletedDocIds: string[] = JSON.parse(localStorage.getItem('apex_plm_deleted_doc_ids') || '[]');
    if (!deletedDocIds.includes(docId)) {
      deletedDocIds.push(docId);
      if (target?.docNumber && !deletedDocIds.includes(target.docNumber)) {
        deletedDocIds.push(target.docNumber);
      }
      try {
        localStorage.setItem('apex_plm_deleted_doc_ids', JSON.stringify(deletedDocIds));
      } catch (e) {
        console.error(e);
      }
    }
    setDocuments(prev => prev.filter(d => d.id !== docId && d.docNumber !== docId));
    if (target) {
      logAction('Deleted Document', 'DOCUMENT', target.docNumber, `Removed document "${target.title}" (${target.docNumber}) from vault.`);
    }
    window.dispatchEvent(new CustomEvent('plm:part-sync'));
  };

  const handleArchiveNcr = (ncrId: string) => {
    const target = ncrs.find((n) => n.id === ncrId);
    ncrsApi.update(ncrId, { status: 'Archived' as NcrStatus }).catch(err => console.warn('Backend archive NCR error:', err.message));
    setNcrs((prev) => prev.map((n) => (n.id === ncrId ? { ...n, status: 'Archived' as NcrStatus } : n)));
    if (target) {
      logAction('Archived NCR', 'QUALITY', target.ncrNumber, `Archived controlled NCR: ${target.title}`);
    }
  };


  // Render loading state while restoring session on startup/refresh
  if (isRestoringSession) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans ${isDark ? 'bg-[#0B1220] text-[#F1F5F9]' : 'bg-[#F4F6F8] text-[#172033]'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight">Restoring PLM Session</h2>
            <p className="text-xs text-slate-400 font-mono">Verifying enterprise security credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render Login Page if Unauthenticated
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} users={userAccounts} />;
  }

  // Prevent Blocked / Locked users from accessing any PLM page
  if (currentUser.status === 'Blocked' || currentUser.status === 'Locked') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${isDark ? 'bg-[#0B1220] text-[#F1F5F9]' : 'bg-[#F4F6F8] text-[#172033]'}`}>
        <div className={`max-w-md w-full p-8 rounded-3xl border text-center space-y-5 shadow-2xl ${isDark ? 'bg-[#111B2E] border-rose-500/40' : 'bg-white border-rose-400'}`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-rose-500">Account Blocked</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your employee account has been blocked by a PLM Administrator. You are restricted from accessing any PLM module, project workspace, or CAD records.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-700/30">
            <button
              type="button"
              onClick={handleLogout}
              className="btn-primary w-full py-2.5 text-xs cursor-pointer"
            >
              Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RBAC Permission Checking Helper for Current Active Tab
  const getTabModuleId = (tab: string): string => {
    switch (tab) {
      case 'admin_dashboard':
      case 'employee_dashboard':
      case 'dashboard':
        return 'dashboard';
      case 'products':
        return 'products';
      case 'cad':
      case 'cae':
      case 'cfd':
      case 'dfmea':
      case 'pdm':
        return 'cad';
      case 'bom':
        return 'bom';
      case 'capp':
      case 'pfmea':
      case 'production':
      case 'robots':
        return 'capp';
      case 'quality':
      case 'inspection':
      case 'ncr_capa':
      case 'final_approval':
        return 'quality';
      case 'eco':
      case 'ecn':
        return 'eco';
      case 'admin_users':
        return 'admin_users';
      case 'admin_roles':
        return 'admin_roles';
      case 'admin_audit':
        return 'admin_audit';
      case 'reports':
        return 'reports';
      case 'settings':
      case 'marketplace':
      case 'erp':
        return 'settings';
      case 'documents':
      case 'knowledge':
      case 'docs':
        return 'documents';
      case 'projects':
      case 'gates':
      case 'gates_admin':
      case 'suppliers':
        return 'projects';
      default:
        return 'dashboard';
    }
  };

  const currentModuleId = getTabModuleId(activeTab);
  const isAuthorized = hasPermission(currentUser.systemRole, currentModuleId, 'VIEW', permissionMatrix);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Header Navigation */}
      <HeaderNav
        currentUser={currentUser}
        unreadNotifCount={notifications.filter((n) => !n.isRead).length}
        onLogout={handleLogout}
        onNavigateTab={handleNavigateTab}
        parts={parts}
        documents={documents}
        projects={projects}
        ecrs={ecrs}
        ncrs={ncrs}
        onSelectPart={setSelectedPartId}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleNavigateTab}
          userRole={currentUser.systemRole}
          permissionMatrix={permissionMatrix}
        />

        {/* Viewport Area */}
        <main className="flex-1 px-6 lg:px-7 py-6 overflow-y-auto w-full min-w-0 max-w-none">
          {!isAuthorized ? (
            <AccessDenied
              moduleName={activeTab.toUpperCase()}
              userRole={currentUser.systemRole}
              onReturnDashboard={() => handleNavigateTab(getRoleDashboardRoute(currentUser.systemRole))}
            />
          ) : (
            <TabErrorBoundary key={activeTab} tabName={activeTab}>
              {(activeTab === 'admin_dashboard' || (activeTab === 'dashboard' && currentUser.systemRole === 'ADMIN')) && (
                <AdminDashboard
                  parts={parts}
                  projects={projects}
                  documents={documents}
                  bomTrees={bomTrees}
                  operations={operations}
                  ecrs={ecrs}
                  ecns={ecns}
                  ncrs={ncrs}
                  users={userAccounts}
                  auditLogs={auditLogs}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {(activeTab === 'employee_dashboard' || (activeTab === 'dashboard' && currentUser.systemRole !== 'ADMIN')) && (
                <EmployeeDashboard
                  user={currentUser}
                  parts={parts}
                  projects={projects}
                  documents={documents}
                  notifications={notifications}
                  ecrs={ecrs}
                  ecns={ecns}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'products' && (
                <ProductManagement
                  parts={parts}
                  setParts={setParts}
                  bomTrees={bomTrees}
                  setBomTrees={setBomTrees}
                  currentUser={currentUser}
                  ncrs={ncrs}
                  dfmeaRows={dfmeaRows}
                  setDfmeaRows={setDfmeaRows}
                  pfmeaRows={pfmeaRows}
                  setPfmeaRows={setPfmeaRows}
                  projects={projects}
                  setProjects={setProjects}
                  documents={documents}
                  setDocuments={setDocuments}
                  ecrs={ecrs}
                  setEcrs={setEcrs}
                  setNcrs={setNcrs}
                  inventory={inventory}
                  setInventory={setInventory}
                  logAction={logAction}
                  initialFilterStage={productFilterStage}
                  activeProjectId={activeProjectIdForProduct}
                  onSelectPart={setSelectedPartId}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'profile' && (
                <UserProfile user={currentUser} />
              )}

              {activeTab === 'notifications' && (
                <NotificationCenter
                  notifications={notifications}
                  onMarkAsRead={(id) =>
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                    )
                  }
                  onClearAll={() => setNotifications((prev) => prev.filter((n) => !n.isRead))}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'admin_users' && (
                <AdminUserPanel
                  users={userAccounts}
                  setUsers={setUserAccounts}
                  currentUser={currentUser}
                  onUpdateCurrentUser={setCurrentUser}
                  logAction={logAction}
                />
              )}

              {activeTab === 'admin_roles' && (
                <RolePermissionManager
                  permissionMatrix={permissionMatrix}
                  onUpdateMatrix={(newMatrix) => {
                    setPermissionMatrix(newMatrix);
                    logAction('Updated RBAC Permission Matrix', 'SYSTEM', 'RBAC-CONFIG', 'Modified role permission matrix.');
                  }}
                />
              )}

              {activeTab === 'admin_audit' && (
                <AuditTrailPanel auditLogs={auditLogs} />
              )}

              {activeTab === 'digital_thread' && (
                <DigitalThread part={selectedPart} />
              )}

              {activeTab === 'cad' && (
                <div className="space-y-6">
                  <CADViewer3D
                    part={selectedPart}
                    onCheckoutToggle={handleCheckoutToggle}
                    userRole={currentUser.systemRole}
                    currentUser={currentUser}
                    permissionMatrix={permissionMatrix}
                    logAction={logAction}
                    onNavigateTab={handleNavigateTab}
                  />
                  <ItemMaster
                    parts={parts}
                    selectedPartId={selectedPartId}
                    onSelectPart={setSelectedPartId}
                    onCheckoutToggle={handleCheckoutToggle}
                  />
                </div>
              )}

              {activeTab === 'cae' && (
                <CaeSolver part={selectedPart} />
              )}

              {activeTab === 'cfd' && (
                <CfdSolver part={selectedPart} />
              )}


              {activeTab === 'bom' && (
                <BOMManager
                  rootNode={selectedPart ? (bomTrees[selectedPart.id] || bomTrees[selectedPart.partNumber] || Object.values(bomTrees)[0] || null) : (Object.values(bomTrees)[0] || null)}
                  partsMap={partsMap}
                  parts={parts}
                  selectedPartId={selectedPart?.id || selectedPartId}
                  currentUser={currentUser}
                  logAction={logAction}
                  onSelectPart={(partId) => {
                    setSelectedPartId(partId);
                    setActiveTab('cad');
                  }}
                />
              )}

              {activeTab === 'dfmea' && (
                <DfmeaManager
                  dfmeaRows={dfmeaRows}
                  partsMap={partsMap}
                  onSelectPart={(partId) => {
                    setSelectedPartId(partId);
                    setActiveTab('cad');
                  }}
                />
              )}

              {activeTab === 'pfmea' && (
                <PfmeaManager pfmeaRows={pfmeaRows} />
              )}

              {activeTab === 'capp' && (
                <ProcessPlanner part={selectedPart} operations={operations} />
              )}

              {activeTab === 'production' && (
                <ProductionDashboard 
                  currentUser={currentUser}
                  logAction={logAction}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryManager 
                  inventory={inventory} 
                  setInventory={setInventory}
                  parts={parts}
                  currentUser={currentUser}
                  logAction={logAction}
                />
              )}


              {activeTab === 'robots' && (
                <RobotSimulation />
              )}

              {activeTab === 'pdm' && (
                <PredictiveMaintenance part={selectedPart} />
              )}

              {activeTab === 'knowledge' && (
                <KnowledgeCenter />
              )}

              {activeTab === 'marketplace' && (
                <PlmMarketplace />
              )}

              {activeTab === 'erp' && (
                <ErpConnector parts={parts} />
              )}

              {(activeTab === 'eco' || activeTab === 'ecn') && (
                <ChangeManagement
                  ecrs={ecrs}
                  ecns={ecns}
                  partsMap={partsMap}
                  currentPersona={currentUser.personaKey}
                  currentUser={currentUser}
                  onAddEcr={handleAddEcr}
                  onUpdateEcr={handleUpdateEcr}
                  onDeleteEcr={handleDeleteEcr}
                  onArchiveEcr={handleArchiveEcr}
                  onUpdateEcnSignoff={handleUpdateEcnSignoff}
                  onAdvanceEcnStage={handleAdvanceEcnStage}
                  onUpdateEcrSignoff={handleUpdateEcrSignoff}
                  onAdvanceEcrStage={handleAdvanceEcrStage}
                  logAction={logAction}
                />
              )}

              {(activeTab === 'gates' || activeTab === 'gates_admin' || activeTab === 'final_approval') && (
                <StageGateTracker
                  gates={gates}
                  setGates={setGates}
                  currentPersona={currentUser.personaKey}
                  currentUser={currentUser}
                  projects={projects}
                  parts={parts}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  logAction={logAction}
                />
              )}

              {(activeTab === 'documents' || activeTab === 'docs') && (
                <DocumentVault
                  documents={documents}
                  partsMap={partsMap}
                  currentUser={currentUser}
                  onSelectPart={setSelectedPartId}
                  onNavigateTab={handleNavigateTab}
                  onDeleteDocument={handleDeleteDocument}
                  onRefreshDocuments={async () => {
                    try {
                      const dbDocs = await documentsApi.getAll();
                      if (Array.isArray(dbDocs)) {
                        const sampleNumbers = [
                          'DWG-GBX-5000-01', 'CAD-GBX-5000-01', 'SPEC-GBX-5000-A', 'DFMEA-2026-088',
                          'CAD-PRT-1004-03', 'INSP-FAIR-902', 'CERT-ENV-2026-04', 'SOW-SC-2026-11',
                          'DOC-ENG-2026-001', 'DOC-ENG-2026-002', 'DOC-ENG-2026-003',
                          'DOC-101', 'DOC-102', 'DOC-103', 'DOC-104', 'DOC-105', 'DOC-106', 'DOC-107', 'DOC-108'
                        ];
                        const realDocs = dbDocs.filter(d => !sampleNumbers.includes(d.id) && !sampleNumbers.includes(d.docNumber));
                        setDocuments(realDocs);
                        safeSetItem('apex_plm_documents', JSON.stringify(sanitizeDocumentsForStorage(realDocs)));
                      }
                    } catch (e) {
                      console.warn('Backend documents fetch error:', e);
                    }
                  }}
                  onAddDocument={async (doc) => {
                    try {
                      await documentsApi.create(doc);
                    } catch (err: any) {
                      console.warn('Backend create doc error (saved locally):', err?.message);
                    }
                    setDocuments((prev) => [doc, ...prev.filter(d => d.id !== doc.id && d.docNumber !== doc.docNumber)]);
                    window.dispatchEvent(new CustomEvent('plm:part-sync'));
                  }}
                />
              )}


              {(activeTab === 'quality' || activeTab === 'inspection' || activeTab === 'ncr_capa') && (
                <QualityManager
                  ncrs={ncrs}
                  capas={capas}
                  partsMap={partsMap}
                  currentUser={currentUser}
                  onAddNcr={handleAddNcr}
                  onUpdateNcr={handleUpdateNcr}
                  onDeleteNcr={handleDeleteNcr}
                  onArchiveNcr={handleArchiveNcr}
                  logAction={logAction}
                />
              )}

              {activeTab === 'suppliers' && (
                <SupplierManager suppliers={suppliers} />
              )}

              {activeTab === 'projects' && (
                <ProjectManager
                  projects={projects}
                  setProjects={setProjects}
                  parts={parts}
                  setParts={setParts}
                  documents={documents}
                  setDocuments={setDocuments}
                  ecrs={ecrs}
                  setEcrs={setEcrs}
                  currentUser={currentUser}
                  logAction={logAction}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsManager
                  parts={parts}
                  ecns={ecns}
                  ncrs={ncrs}
                  suppliers={suppliers}
                  projects={projects}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPanel />
              )}
            </TabErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

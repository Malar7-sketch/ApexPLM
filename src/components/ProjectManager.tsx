import React, { useState } from 'react';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Layers, 
  BarChart2,
  FolderOpen,
  FileText,
  GitCommit,
  Sliders,
  Plus,
  X,
  User,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Trash2,
  Check,
  Play,
  Circle,
  Edit
} from 'lucide-react';
import type { Project, ProjectTask, ProjectTeamMember, PartItem, EngineeringDocument, ECR } from '../types/plm';
import { useTheme } from '../context/ThemeContext';
import { MOCK_USERS } from '../data/mockUsers';
import { projectsApi } from '../services/api';
import { safeSetItem, sanitizeDocumentsForStorage, sanitizePartsForStorage } from '../utils/safeStorage';


interface ProjectManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  parts: PartItem[];
  setParts?: React.Dispatch<React.SetStateAction<PartItem[]>>;
  documents: EngineeringDocument[];
  setDocuments?: React.Dispatch<React.SetStateAction<EngineeringDocument[]>>;
  ecrs: ECR[];
  setEcrs?: React.Dispatch<React.SetStateAction<ECR[]>>;
  currentUser: any;
  logAction: (action: string, category: any, targetId: string, details: string) => void;
  onNavigateTab?: (tab: string, filterStage?: string, projectId?: string) => void;
}

// Helper to automatically generate a unique, non-colliding Project Code
export const generateNextProjectCode = (existingProjects: Project[]): string => {
  let highest = 0;
  existingProjects.forEach(p => {
    const match = p.code.match(/PRJ-(?:EV-)?(\d+)/i) || p.code.match(/(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > highest) highest = val;
    }
  });
  const nextNum = Math.max(highest + 1, existingProjects.length + 1);
  return `PRJ-EV-${String(nextNum).padStart(3, '0')}`;
};

// Helper to calculate project duration text and validity
export const calculateProjectDuration = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return { days: 0, text: '0 Days', isValid: false, error: 'Select valid start and end dates' };
  const s = new Date(startStr);
  const e = new Date(endStr);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { days: diffDays, text: 'Invalid: End date cannot be earlier than start date.', isValid: false, error: 'End date cannot be earlier than start date.' };
  }
  
  const weeks = Math.round(diffDays / 7);
  const months = (diffDays / 30.44).toFixed(1);
  let text = `${diffDays} Days`;
  if (diffDays >= 14) {
    text = `${diffDays} Days (~${weeks} Weeks / ${months} Months)`;
  }
  return { days: diffDays, text, isValid: true, error: '' };
};

// 16 Standard PLM Milestones with Exact Weights (Total = 100%)
const STANDARD_16_PLM_MILESTONES: Omit<ProjectTask, 'id' | 'startDate' | 'endDate'>[] = [
  { taskNumber: '01', taskName: '01 Requirements Definition', weight: 5, assignedRole: 'pm', owner: 'Project Manager', dependency: 'None', progressPercent: 0, status: 'Not Started', durationDays: 14 },
  { taskNumber: '02', taskName: '02 3D CAD Modeling', weight: 10, assignedRole: 'design', owner: 'Design Engineer', dependency: '01 Requirements Definition', progressPercent: 0, status: 'Not Started', durationDays: 30 },
  { taskNumber: '03', taskName: '03 2D Drawing', weight: 5, assignedRole: 'design', owner: 'Design Engineer', dependency: '02 3D CAD Modeling', progressPercent: 0, status: 'Not Started', durationDays: 14 },
  { taskNumber: '04', taskName: '04 Engineering Review', weight: 5, assignedRole: 'design', owner: 'Lead Engineer', dependency: '03 2D Drawing', progressPercent: 0, status: 'Not Started', durationDays: 10 },
  { taskNumber: '05', taskName: '05 EBOM Creation', weight: 10, assignedRole: 'design', owner: 'Design Engineer', dependency: '04 Engineering Review', progressPercent: 0, status: 'Not Started', durationDays: 14 },
  { taskNumber: '06', taskName: '06 DFMEA', weight: 5, assignedRole: 'design', owner: 'Design Engineer', dependency: '05 EBOM Creation', progressPercent: 0, status: 'Not Started', durationDays: 10 },
  { taskNumber: '07', taskName: '07 Prototype Development', weight: 10, assignedRole: 'mfg', owner: 'Manufacturing Engineer', dependency: '06 DFMEA', progressPercent: 0, status: 'Not Started', durationDays: 20 },
  { taskNumber: '08', taskName: '08 CAPP / Process Planning', weight: 10, assignedRole: 'mfg', owner: 'Manufacturing Engineer', dependency: '07 Prototype Development', progressPercent: 0, status: 'Not Started', durationDays: 15 },
  { taskNumber: '09', taskName: '09 MBOM Creation', weight: 10, assignedRole: 'mfg', owner: 'Manufacturing Engineer', dependency: '08 CAPP / Process Planning', progressPercent: 0, status: 'Not Started', durationDays: 12 },
  { taskNumber: '10', taskName: '10 PFMEA', weight: 5, assignedRole: 'mfg', owner: 'Manufacturing Engineer', dependency: '09 MBOM Creation', progressPercent: 0, status: 'Not Started', durationDays: 10 },
  { taskNumber: '11', taskName: '11 Manufacturing Review', weight: 5, assignedRole: 'mfg', owner: 'Manufacturing Engineer', dependency: '10 PFMEA', progressPercent: 0, status: 'Not Started', durationDays: 7 },
  { taskNumber: '12', taskName: '12 Quality Inspection', weight: 5, assignedRole: 'quality', owner: 'Quality Engineer', dependency: '11 Manufacturing Review', progressPercent: 0, status: 'Not Started', durationDays: 12 },
  { taskNumber: '13', taskName: '13 Final Engineering Approval', weight: 5, assignedRole: 'design', owner: 'Chief Engineer', dependency: '12 Quality Inspection', progressPercent: 0, status: 'Not Started', durationDays: 5 },
  { taskNumber: '14', taskName: '14 Product Release', weight: 5, assignedRole: 'pm', owner: 'Project Manager', dependency: '13 Final Engineering Approval', progressPercent: 0, status: 'Not Started', durationDays: 5 },
  { taskNumber: '15', taskName: '15 Project Documentation', weight: 5, assignedRole: 'pm', owner: 'Project Manager', dependency: '14 Product Release', progressPercent: 0, status: 'Not Started', durationDays: 7 },
  { taskNumber: '16', taskName: '16 Final Project Review', weight: 5, assignedRole: 'pm', owner: 'Project Manager', dependency: '15 Project Documentation', progressPercent: 0, status: 'Not Started', durationDays: 5 }
];

export const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  projects, 
  setProjects,
  parts,
  setParts,
  documents,
  setDocuments,
  ecrs,
  setEcrs,
  currentUser,
  logAction,
  onNavigateTab
}) => {
  const { isDark } = useTheme();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'products' | 'documents' | 'changes' | 'team'>('schedule');
  const [taskFilter, setTaskFilter] = useState<'All' | 'Completed' | 'In Progress' | 'Not Started' | 'Blocked'>('All');

  // User Role & Permissions (Open to all logged-in users per system requirements)
  const isAdmin = Boolean(currentUser && (
    currentUser.systemRole === 'ADMIN' || 
    currentUser.roleId === 'admin' || 
    currentUser.personaKey === 'admin' ||
    (currentUser.role && currentUser.role.toLowerCase().includes('admin'))
  ));

  const canEditProject = (_proj?: Project | null): boolean => {
    return true; // Accessible to all logged-in users
  };

  // Edit Project Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    customer: '',
    program: '',
    description: '',
    startDate: '',
    endDate: '',
    manager: '',
    designEngineer: '',
    mfgEngineer: '',
    qualityEngineer: '',
    procurementLead: '',
    budgetTotal: 0,
    engHoursTotal: 0
  });
  const [editTeamMembers, setEditTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [editEmployeeSearchQuery, setEditEmployeeSearchQuery] = useState('');
  const [editSelectedEmployeeIdToAdd, setEditSelectedEmployeeIdToAdd] = useState('');

  // Delete Project Modal State (Accessible to all logged-in users)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Open Edit Project Modal
  const handleOpenEditProject = (proj: Project) => {
    if (!proj) return;
    setEditingProject(proj);
    setEditForm({
      name: proj.name,
      customer: proj.customer || '',
      program: proj.program || '',
      description: (proj as any).description || `${proj.name} PLM mechanical development program.`,
      startDate: proj.startDate || new Date().toISOString().substring(0, 10),
      endDate: proj.endDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      manager: proj.manager || 'David Sterling',
      designEngineer: proj.designEngineer || 'Alex Rivera, PE',
      mfgEngineer: proj.mfgEngineer || 'Marcus Vance',
      qualityEngineer: proj.qualityEngineer || 'Dr. Elena Rostova',
      procurementLead: proj.procurementLead || 'Sarah Connor',
      budgetTotal: proj.budgetTotal || 650000,
      engHoursTotal: proj.engHoursTotal || 2400
    });
    setEditTeamMembers(proj.teamMembers && proj.teamMembers.length >= 2 ? [...proj.teamMembers] : [
      {
        employeeId: 'EMP-10042',
        name: proj.manager || 'David Sterling',
        role: 'Project Manager',
        department: 'Program Management Office',
        avatar: '👔'
      },
      {
        employeeId: 'EMP-10482',
        name: proj.designEngineer || 'Alex Rivera',
        role: 'Lead Design Engineer',
        department: 'Product Design & CAD Engineering',
        avatar: '👨‍💻'
      }
    ]);
    setEditEmployeeSearchQuery('');
    setEditSelectedEmployeeIdToAdd('');
  };

  // Save Edit Project (Updates existing project only, NO DUPLICATE)
  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editForm.name.trim()) {
      alert('Please enter a Project Name.');
      return;
    }

    const durationInfo = calculateProjectDuration(editForm.startDate, editForm.endDate);
    if (!durationInfo.isValid) {
      alert(durationInfo.error || 'End date cannot be earlier than start date.');
      return;
    }

    if (editTeamMembers.length < 2) {
      alert('Please configure at least 2 team members for this project.');
      return;
    }

    const updatedData = {
      name: editForm.name.trim(),
      customer: editForm.customer.trim(),
      program: editForm.program.trim(),
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      durationFormatted: durationInfo.text,
      manager: editForm.manager,
      designEngineer: editForm.designEngineer,
      mfgEngineer: editForm.mfgEngineer,
      qualityEngineer: editForm.qualityEngineer,
      procurementLead: editForm.procurementLead,
      budgetTotal: Number(editForm.budgetTotal) || editingProject.budgetTotal,
      engHoursTotal: Number(editForm.engHoursTotal) || editingProject.engHoursTotal,
      teamMembers: [...editTeamMembers]
    };

    // Update MongoDB Atlas database
    projectsApi.update(editingProject.id || editingProject.code, updatedData).catch(err => {
      console.warn('Backend project update failed:', err.message);
    });

    // Update the existing project only in place
    setProjects(prevProjects => {
      const updated = prevProjects.map(p => {
        if (p.id !== editingProject.id) return p;
        return {
          ...p,
          ...updatedData
        };
      });
      safeSetItem('apex_plm_projects', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'Project Updated',
      'PROJECT',
      editingProject.code,
      `User "${currentUser?.name || 'User'}" (${currentUser?.email || 'authenticated user'} [${currentUser?.role || currentUser?.systemRole || 'Team Member'}]) updated Project "${editForm.name}" (Code: ${editingProject.code}, ID: ${editingProject.id}) at ${new Date().toLocaleString()}. Updated project name, customer, program, timeline, team members, and financials.`
    );

    setEditingProject(null);
  };

  const handleEditAddTeamMember = (empId: string) => {
    const emp = MOCK_USERS.find(u => u.employeeId === empId || u.id === empId);
    if (!emp) return;

    if (editTeamMembers.some(m => m.employeeId === emp.employeeId)) {
      alert(`Employee "${emp.name}" is already in the project team.`);
      return;
    }

    setEditTeamMembers(prev => [
      ...prev,
      {
        employeeId: emp.employeeId,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        email: emp.email,
        avatar: emp.avatar
      }
    ]);
    setEditSelectedEmployeeIdToAdd('');
    setEditEmployeeSearchQuery('');
  };

  const handleEditRemoveTeamMember = (empId: string) => {
    if (editTeamMembers.length <= 2) {
      alert('A minimum of 2 team members is required for every project.');
      return;
    }
    setEditTeamMembers(prev => prev.filter(m => m.employeeId !== empId));
  };

  // Permanent system-wide Project Deletion (Accessible to all logged-in users)
  const handleConfirmDeleteProject = async (projToDelete: Project) => {
    if (!projToDelete) return;

    setIsDeletingProject(true);
    const targetId = projToDelete.id || (projToDelete as any)._id;
    const targetCode = projToDelete.code;
    const targetName = projToDelete.name;

    try {
      // 1. Delete permanently from MongoDB Atlas
      await projectsApi.delete(targetId || targetCode).catch(err => {
        console.warn('Backend project delete error:', err.message);
      });

      // 2. Remove from projects list and sync localStorage
      setProjects(prev => {
        const next = prev.filter(p => p.id !== targetId && p.code !== targetCode && (p as any)._id !== targetId);
        safeSetItem('apex_plm_projects', JSON.stringify(next));
        return next;
      });

      // 3. Unlink or clean from Product Master records without deleting unrelated products
      if (setParts) {
        setParts(prev => {
          const next = prev.map(pt => {
            if (pt.projectId === targetId || pt.projectId === targetCode || pt.projectName === targetName) {
              return {
                ...pt,
                projectId: undefined,
                projectName: undefined,
                tags: pt.tags ? pt.tags.filter(t => t !== targetCode && t !== targetId && t !== targetName) : []
              };
            }
            return pt;
          });
          safeSetItem('apex_plm_parts', JSON.stringify(sanitizePartsForStorage(next)));
          return next;
        });
      }

      // 4. Purge linked Documents
      if (setDocuments) {
        setDocuments(prev => {
          const next = prev.filter(
            d => !d.docNumber.includes(targetCode) && 
                 !d.docNumber.includes(targetId) &&
                 !(d.title && d.title.toLowerCase().includes(targetName.toLowerCase()))
          );
          safeSetItem('apex_plm_documents', JSON.stringify(sanitizeDocumentsForStorage(next)));
          return next;
        });
      }

      // 5. Purge linked ECRs
      if (setEcrs) {
        setEcrs(prev => {
          const next = prev.filter(
            e => !(e.targetProductId && (e.targetProductId.includes(targetCode) || e.targetProductId.includes(targetId)))
          );
          safeSetItem('apex_plm_ecrs', JSON.stringify(next));
          return next;
        });
      }

      // 6. Update selected project to next available
      const remaining = projects.filter(p => p.id !== targetId && p.code !== targetCode && (p as any)._id !== targetId);
      if (selectedProjectId === targetId || selectedProjectId === targetCode) {
        setSelectedProjectId(remaining[0]?.id || '');
      }

      // 7. Record deletion in Audit Trail with user, date/time, and Project ID
      logAction(
        'Project Permanently Deleted',
        'SYSTEM',
        targetCode,
        `User "${currentUser?.name || 'User'}" (${currentUser?.email || 'authenticated user'} [${currentUser?.role || currentUser?.systemRole || 'Team Member'}]) permanently deleted Project "${targetName}" (Code: ${targetCode}, ID: ${targetId}) at ${new Date().toLocaleString()}. Purged all 16 milestone tasks, project documents, change requests, team assignments, and product links.`
      );

      // 8. Broadcast sync event across windows/dashboards
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('plm:project-sync'));
      }

      setProjectToDelete(null);
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Create Project Form State
  const [newProject, setNewProject] = useState({
    name: '',
    manager: 'David Sterling',
    designEngineer: 'Alex Rivera, PE',
    mfgEngineer: 'Marcus Vance',
    qualityEngineer: 'Dr. Elena Rostova',
    procurementLead: 'Sarah Connor',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    budgetTotal: 650000,
    engHoursTotal: 2400,
    description: 'Electric Scooter Drivetrain and Mechanical Platform program encompassing full 16-step PLM lifecycle delivery.',
    customer: 'Apex Automotive Systems',
    program: 'EV Fleet Program'
  });

  // Project Team Members State (Minimum 2 required)
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([
    {
      employeeId: 'EMP-10042',
      name: 'David Sterling',
      role: 'Project Manager',
      department: 'Program Management Office',
      avatar: '👔'
    },
    {
      employeeId: 'EMP-10482',
      name: 'Alex Rivera',
      role: 'Lead Design Engineer',
      department: 'Product Design & CAD Engineering',
      avatar: '👨‍💻'
    },
    {
      employeeId: 'EMP-10088',
      name: 'Malarvannan M',
      role: 'Design Engineer',
      department: 'Drivetrain & Mechanical Engineering',
      avatar: '⚡'
    },
    {
      employeeId: 'EMP-10089',
      name: 'Dharani Dharan',
      role: 'Mechanical Engineer',
      department: 'Structural Analysis & FEA',
      avatar: '📐'
    },
    {
      employeeId: 'EMP-10090',
      name: 'Vaisaal S',
      role: 'CAD / System Engineer',
      department: 'CAD Vault & PLM Integrations',
      avatar: '💻'
    }
  ]);

  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedEmployeeIdToAdd, setSelectedEmployeeIdToAdd] = useState('');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Helper to calculate milestone progress automatically from its schedule timeline
  const calculateScheduleProgress = (task: ProjectTask): { progressPercent: number; status: ProjectTask['status'] } => {
    if (task.startDate && task.endDate) {
      const start = new Date(task.startDate).getTime();
      const end = new Date(task.endDate).getTime();
      const now = Date.now();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        if (now <= start) {
          return { progressPercent: 20, status: 'In Progress' };
        }
        if (now >= end) {
          return { progressPercent: 90, status: 'In Progress' };
        }
        const elapsed = now - start;
        const total = end - start;
        const ratio = Math.min(0.9, Math.max(0.2, elapsed / total));
        return { progressPercent: Math.round(ratio * 100), status: 'In Progress' };
      }
    }
    const fallback = task.progressPercent && task.progressPercent > 0 && task.progressPercent < 100 
      ? task.progressPercent 
      : 50;
    return { progressPercent: fallback, status: 'In Progress' };
  };

  // Helper to calculate project progress: automatic weighted total of all milestone progress
  const getProjectProgress = (tasks: ProjectTask[]): number => {
    if (!tasks || tasks.length === 0) return 0;
    const weightedTotal = tasks.reduce((sum, t) => {
      const weight = t.weight || (100 / tasks.length);
      const prog = (t.status === 'Completed' || t.progressPercent === 100)
        ? 100
        : (t.progressPercent || 0);
      return sum + (weight * prog / 100);
    }, 0);
    return Math.min(100, Math.round(weightedTotal));
  };

  // Helper to calculate project status: automatically calculated from milestone states
  const getProjectStatus = (progress: number, tasks: ProjectTask[]): Project['status'] => {
    if (progress === 100 || (tasks.length > 0 && tasks.every(t => t.status === 'Completed' || t.progressPercent === 100))) {
      return 'Completed';
    }
    if (tasks.some(t => t.status === 'Blocked')) {
      return 'At Risk';
    }
    if (progress > 0 || tasks.some(t => t.status === 'In Progress' || (t.progressPercent && t.progressPercent > 0))) {
      return 'In Progress';
    }
    return 'Not Started';
  };

  // Toggle milestone completion: users update actual task completion only; system calculates Progress and Status automatically
  const handleToggleMilestoneCompletion = (taskId: string) => {
    if (!selectedProject) return;

    setProjects(prevProjects => {
      return prevProjects.map(proj => {
        if (proj.id !== selectedProject.id) return proj;

        const updatedTasks = proj.tasks.map(t => {
          if (t.id !== taskId) return t;

          const isCurrentlyComplete = t.status === 'Completed' || t.progressPercent === 100;
          let newProgress: number;
          let newStatus: ProjectTask['status'];

          if (isCurrentlyComplete) {
            // Reopen / set to In Progress (progress calculated automatically from schedule)
            const scheduleState = calculateScheduleProgress(t);
            newProgress = scheduleState.progressPercent;
            newStatus = scheduleState.status;
          } else {
            // Milestone completed -> 100% / COMPLETED
            newProgress = 100;
            newStatus = 'Completed';
          }

          return {
            ...t,
            status: newStatus,
            progressPercent: newProgress,
            completedDate: newStatus === 'Completed' ? (t.completedDate || new Date().toISOString().substring(0, 10)) : undefined,
            completedBy: newStatus === 'Completed' ? (t.completedBy || currentUser?.name || 'Lead Engineer') : undefined
          };
        });

        const newProgress = getProjectProgress(updatedTasks);
        const newStatus = getProjectStatus(newProgress, updatedTasks);

        return {
          ...proj,
          tasks: updatedTasks,
          completionPercent: newProgress,
          status: newStatus,
          completedDate: newProgress === 100 ? (proj.completedDate || new Date().toISOString().substring(0, 10)) : undefined,
          completedBy: newProgress === 100 ? (proj.completedBy || currentUser?.name || 'Lead Engineer') : undefined,
          finalApproval: newProgress === 100 ? 'Approved by Chief Engineer' : undefined,
          releasedProduct: newProgress === 100 ? (proj.releasedProduct || proj.name) : proj.releasedProduct,
          finalRevision: newProgress === 100 ? (proj.finalRevision || 'Rev A.0') : proj.finalRevision
        };
      });
    });

    logAction(
      'Milestone Task Completion Updated',
      'PROJECT',
      selectedProject.code,
      `Milestone completion toggled for project ${selectedProject.code}.`
    );
  };

  // Start milestone: milestone started -> calculate progress automatically from schedule
  const handleStartMilestone = (taskId: string) => {
    if (!selectedProject) return;

    setProjects(prevProjects => {
      return prevProjects.map(proj => {
        if (proj.id !== selectedProject.id) return proj;

        const updatedTasks = proj.tasks.map(t => {
          if (t.id !== taskId) return t;

          const scheduleState = calculateScheduleProgress(t);
          return {
            ...t,
            status: scheduleState.status,
            progressPercent: scheduleState.progressPercent
          };
        });

        const newProgress = getProjectProgress(updatedTasks);
        const newStatus = getProjectStatus(newProgress, updatedTasks);

        return {
          ...proj,
          tasks: updatedTasks,
          completionPercent: newProgress,
          status: newStatus
        };
      });
    });

    logAction(
      'Milestone Started',
      'PROJECT',
      selectedProject.code,
      `Milestone started in project ${selectedProject.code}.`
    );
  };

  // Add a team member to the list
  const handleAddTeamMember = (empId: string) => {
    const emp = MOCK_USERS.find(u => u.employeeId === empId || u.id === empId);
    if (!emp) return;

    if (teamMembers.some(m => m.employeeId === emp.employeeId)) {
      alert(`Employee "${emp.name}" is already in the project team.`);
      return;
    }

    setTeamMembers(prev => [
      ...prev,
      {
        employeeId: emp.employeeId,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        email: emp.email,
        avatar: emp.avatar
      }
    ]);
    setSelectedEmployeeIdToAdd('');
    setEmployeeSearchQuery('');
  };

  // Remove a team member
  const handleRemoveTeamMember = (empId: string) => {
    if (teamMembers.length <= 2) {
      alert('A minimum of 2 team members is required for every project.');
      return;
    }
    setTeamMembers(prev => prev.filter(m => m.employeeId !== empId));
  };

  // Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      alert('Please enter a Project Name.');
      return;
    }

    const durationInfo = calculateProjectDuration(newProject.startDate, newProject.endDate);
    if (!durationInfo.isValid) {
      alert(durationInfo.error || 'End date cannot be earlier than start date.');
      return;
    }

    if (teamMembers.length < 2) {
      alert('Please configure at least 2 team members for this project.');
      return;
    }

    // Auto-generate unique Project Code
    const generatedCode = generateNextProjectCode(projects);

    // Scale 16 PLM milestones proportionally across the start and end dates
    const startMs = new Date(newProject.startDate).getTime();
    const endMs = new Date(newProject.endDate).getTime();
    const totalSpanMs = Math.max(endMs - startMs, 16 * 24 * 60 * 60 * 1000);

    let cumulativeWeight = 0;
    const createdTasks: ProjectTask[] = STANDARD_16_PLM_MILESTONES.map((m, idx) => {
      const taskStartMs = startMs + (cumulativeWeight / 100) * totalSpanMs;
      cumulativeWeight += (m.weight || 5);
      const taskEndMs = startMs + (cumulativeWeight / 100) * totalSpanMs;

      const taskOwner = 
        m.assignedRole === 'pm' ? (newProject.manager || currentUser?.name || 'Project Manager')
        : m.assignedRole === 'design' ? (newProject.designEngineer || 'Design Engineer')
        : m.assignedRole === 'mfg' ? (newProject.mfgEngineer || 'Manufacturing Engineer')
        : (newProject.qualityEngineer || 'Quality Engineer');

      return {
        ...m,
        owner: taskOwner,
        id: `T-${generatedCode}-${String(idx + 1).padStart(2, '0')}`,
        projectId: generatedCode,
        startDate: new Date(taskStartMs).toISOString().substring(0, 10),
        endDate: new Date(taskEndMs).toISOString().substring(0, 10),
        progressPercent: 0,
        status: 'Not Started'
      };
    });

    const createdProject: Project = {
      id: `PRJ-${Date.now()}`,
      code: generatedCode,
      name: newProject.name.trim(),
      manager: newProject.manager,
      designEngineer: newProject.designEngineer,
      mfgEngineer: newProject.mfgEngineer,
      qualityEngineer: newProject.qualityEngineer,
      procurementLead: newProject.procurementLead,
      customer: newProject.customer,
      program: newProject.program,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      durationFormatted: durationInfo.text,
      teamMembers: [...teamMembers],
      status: 'On Track',
      completionPercent: 0,
      budgetTotal: Number(newProject.budgetTotal) || 650000,
      budgetSpent: 0,
      engHoursTotal: Number(newProject.engHoursTotal) || 2400,
      engHoursSpent: 0,
      tasks: createdTasks
    };

    // Immediately display newly created project in UI and local selection
    setProjects(prev => [createdProject, ...prev]);
    setSelectedProjectId(createdProject.id);
    setIsCreateModalOpen(false);

    // Persist to MongoDB Atlas Database
    projectsApi.create(createdProject)
      .then(savedProject => {
        if (savedProject && (savedProject.id || (savedProject as any)._id)) {
          const finalId = savedProject.id || (savedProject as any)._id;
          setProjects(prev =>
            prev.map(p =>
              p.code === createdProject.code ? { ...createdProject, ...savedProject, id: finalId } : p
            )
          );
          setSelectedProjectId(finalId);
        }
      })
      .catch(err => {
        console.warn('Backend project creation error:', err.message);
      });
    
    logAction(
      'Project Created',
      'PROJECT',
      createdProject.code,
      `Project "${createdProject.name}" (${createdProject.code}) created with ${teamMembers.length} team members and 16 stage-gated PLM milestones.`
    );


    // Reset Form
    setNewProject({
      name: '',
      manager: 'David Sterling',
      designEngineer: 'Alex Rivera, PE',
      mfgEngineer: 'Marcus Vance',
      qualityEngineer: 'Dr. Elena Rostova',
      procurementLead: 'Sarah Connor',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      budgetTotal: 650000,
      engHoursTotal: 2400,
      description: '',
      customer: 'Apex Automotive Systems',
      program: 'EV Fleet Program'
    });
  };

  // Ensure current project's progress is dynamically synchronized
  const activeTasks = selectedProject?.tasks || [];
  const currentProgress = getProjectProgress(activeTasks);
  const currentStatus = getProjectStatus(currentProgress, activeTasks);

  // Filter linked products
  const linkedParts = parts.filter(p => {
    if (!selectedProject) return false;
    const projCode = selectedProject.code?.toLowerCase() || '';
    const projId = selectedProject.id?.toLowerCase() || '';
    const projName = selectedProject.name?.toLowerCase() || '';

    // Direct ID or property match
    if (p.projectId && (p.projectId === selectedProject.id || p.projectId === selectedProject.code)) {
      return true;
    }

    if (p.projectName && selectedProject.name && p.projectName.toLowerCase() === selectedProject.name.toLowerCase()) {
      return true;
    }

    // Direct tag match
    const tagMatch = p.tags && p.tags.some(tag => {
      const t = tag.toLowerCase();
      return t === projCode || t === projId || t.includes(projCode) || t.includes(projId);
    });
    return Boolean(tagMatch);
  });

  const linkedPartIds = linkedParts.map(p => p.id);

  // Filter linked documents
  const linkedDocs = documents.filter(doc => {
    if (!selectedProject) return false;
    const isPartLinked = doc.linkedPartId && linkedPartIds.includes(doc.linkedPartId);
    const isDocNumberLinked = doc.docNumber.includes(selectedProject.code) || doc.title.toLowerCase().includes(selectedProject.name.toLowerCase());
    return isPartLinked || isDocNumberLinked;
  });

  // Filter linked changes (ECRs / ECOs)
  const linkedChanges = ecrs.filter(ecr => {
    if (!selectedProject) return false;
    const isPartLinked = (ecr.targetProductId && linkedPartIds.includes(ecr.targetProductId)) || (ecr.impactedPartIds && ecr.impactedPartIds.some(id => linkedPartIds.includes(id)));
    const isTitleLinked = ecr.title.toLowerCase().includes(selectedProject.name.toLowerCase());
    return isPartLinked || isTitleLinked;
  });

  // Task filtering
  const filteredTasks = activeTasks.filter(t => {
    if (taskFilter === 'All') return true;
    return t.status === taskFilter;
  });

  // Task statistics
  const completedTaskCount = activeTasks.filter(t => t.status === 'Completed' || t.progressPercent === 100).length;
  const inProgressTaskCount = activeTasks.filter(t => t.status === 'In Progress').length;
  const blockedTaskCount = activeTasks.filter(t => t.status === 'Blocked').length;
  const openTaskCount = activeTasks.length - completedTaskCount;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-cyan-400 border ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Project Workspace & Lifecycle Milestones
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PLM GATED
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              16-Step mechanical PLM milestone progression, weighted milestone delivery, budget telemetry, and connected traceability.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary btn-sm flex items-center space-x-2 cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {/* 100% Completion Celebration Banner */}
      {currentProgress === 100 && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-[#111B2E] to-emerald-950/60 shadow-xl space-y-4 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500 text-black">
                    PROJECT COMPLETED
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">100% Complete</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedProject.name} ({selectedProject.code}) &mdash; Ready for Production Sign-off
                </h3>
                <p className="text-xs text-slate-300">
                  All required PLM development, 3D CAD modeling, 2D drawings, EBOM, DFMEA, Prototype, CAPP, MBOM, PFMEA, Quality inspection, approvals, and release activities have been verified.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>STATUS: CLOSED / RELEASED</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-emerald-500/20 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">COMPLETED DATE:</span>
              <strong className="text-white">{selectedProject.completedDate || new Date().toISOString().substring(0, 10)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">COMPLETED BY:</span>
              <strong className="text-white">{selectedProject.completedBy || selectedProject.manager}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">FINAL APPROVAL:</span>
              <strong className="text-emerald-400">Chief Engineer Signed</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RELEASED PRODUCT:</span>
              <strong className="text-white">{linkedParts[0]?.partNumber || selectedProject.code}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">FINAL REVISION:</span>
              <strong className="text-cyan-400">{linkedParts[0]?.currentRev || 'Rev A.0'}</strong>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className={`p-16 rounded-2xl border border-dashed text-center space-y-5 transition-colors ${
          isDark ? 'bg-[#111B2E]/60 border-slate-700/60' : 'bg-white border-slate-300'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No projects yet
            </h3>
            <p className="text-xs text-slate-400">
              There are no PLM projects registered in the system. Create your first project workspace to track milestones, schedule, linked products, and CAD documents.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary px-6 py-2.5 text-xs inline-flex items-center space-x-2 font-bold cursor-pointer shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left projects selection list */}
        <div className={`rounded-xl p-4 border shadow-sm space-y-3 lg:col-span-1 h-fit ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              Active PLM Projects
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {projects.length} Total
            </span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isSelected = proj.id === selectedProjectId;
              const projProg = getProjectProgress(proj.tasks);
              const projStat = getProjectStatus(projProg, proj.tasks);

              return (
                <div
                  key={proj.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedProjectId(proj.id);
                    }
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300 font-bold shadow-md shadow-cyan-500/5'
                      : isDark
                      ? 'bg-[#0D1628] border-slate-700/40 text-slate-300 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">{proj.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      projProg === 100
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : projStat === 'At Risk'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-slate-700/30 text-slate-400'
                    }`}>
                      {projStat.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-bold truncate mt-1 text-sm">{proj.name}</div>
                  
                  {/* Progress Bar in Sidebar Card */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] opacity-80 font-mono">
                      <span>Progression</span>
                      <span className="font-bold">{projProg}% Complete</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700/40 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          projProg === 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${projProg}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700/30 text-[10px]">
                    <span className="text-slate-400 font-mono truncate max-w-[120px]" title={proj.manager}>
                      {proj.manager}
                    </span>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditProject(proj);
                        }}
                        className="p-1 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 cursor-pointer transition-colors"
                        title="Edit project details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(proj);
                        }}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer transition-colors"
                        title="Permanently delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Detail Pane */}
        {selectedProject ? (
          <div className="lg:col-span-3 space-y-6">
            {/* Selected Project Header Toolbar */}
            <div className={`p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-cyan-400 font-bold text-xs">{selectedProject.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      currentProgress === 100
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : currentStatus === 'At Risk'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}>
                      {currentStatus.toUpperCase()}
                    </span>
                    {selectedProject.program && (
                      <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                        &bull; {selectedProject.program}
                      </span>
                    )}
                    {selectedProject.customer && (
                      <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
                        &bull; {selectedProject.customer}
                      </span>
                    )}
                  </div>
                  <h2 className={`text-base font-bold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedProject.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenEditProject(selectedProject)}
                  className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer text-xs"
                  title="Edit project details"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Project</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectToDelete(selectedProject)}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/70 font-semibold cursor-pointer flex items-center space-x-1.5 transition-all text-xs"
                  title="Permanently delete project across entire PLM system"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Project</span>
                </button>
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Project Progress */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Project Progress</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">16 Milestones</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <div className={`text-2xl font-bold font-mono ${
                    currentProgress === 100 ? 'text-emerald-400' : isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                  }`}>
                    {currentProgress}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({completedTaskCount}/16 Completed)
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden mt-2 ${isDark ? 'bg-[#0D1628]' : 'bg-[#E2E8F0]'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentProgress === 100 
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                        : 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
                    }`} 
                    style={{ width: `${currentProgress}%` }} 
                  />
                </div>
              </div>

              {/* Project Status */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Project Status</div>
                <div className={`text-xl font-bold font-mono ${
                  currentStatus === 'Completed' 
                    ? 'text-emerald-400' 
                    : currentStatus === 'At Risk' 
                    ? 'text-rose-400' 
                    : 'text-cyan-400'
                }`}>
                  {currentStatus.toUpperCase()}
                </div>
                <div className={`text-[11px] mt-1.5 flex items-center space-x-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Lead: {selectedProject.manager}</span>
                </div>
              </div>

              {/* Tasks Breakdown */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Milestone Breakdown</div>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono mt-1">
                  <div className="text-emerald-400 font-bold">✓ {completedTaskCount} Done</div>
                  <div className="text-amber-400 font-bold">⟳ {inProgressTaskCount} Active</div>
                  <div className="text-slate-400">○ {openTaskCount} Open</div>
                  <div className="text-rose-400">{blockedTaskCount} Blocked</div>
                </div>
              </div>

              {/* Budget & Effort */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Budget & Effort</div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  ${(selectedProject.budgetSpent / 1000).toFixed(0)}k / ${(selectedProject.budgetTotal / 1000).toFixed(0)}k
                </div>
                <div className={`text-[11px] mt-1 font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {selectedProject.engHoursSpent} / {selectedProject.engHoursTotal} hrs logged
                </div>
              </div>
            </div>

            {/* Sub-navigation tabs */}
            <div className="flex border-b border-slate-700/30 overflow-x-auto space-x-1">
              {[
                { id: 'schedule', label: `16-Step Gantt Schedule (${completedTaskCount}/16)` },
                { id: 'products', label: `Linked Products (${linkedParts.length})` },
                { id: 'documents', label: `Documents (${linkedDocs.length})` },
                { id: 'changes', label: `ECRs / Changes (${linkedChanges.length})` },
                { id: 'team', label: 'Team & Details' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 shrink-0 transition-all cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-tab content */}
            <div className="space-y-4">
              {/* SCHEDULE / GANTT TAB */}
              {activeSubTab === 'schedule' && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/30">
                    <div>
                      <h3 className={`text-sm font-bold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>PLM Engineering Milestone Gantt Schedule</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Each milestone carries a designated PLM completion weight. Marking a task as 100% / Completed automatically accumulates to total project completion.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center space-x-1.5">
                      {(['All', 'Completed', 'In Progress', 'Not Started', 'Blocked'] as const).map(filter => (
                        <button
                          key={filter}
                          onClick={() => setTaskFilter(filter)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                            taskFilter === filter
                              ? 'bg-cyan-500 text-black font-bold'
                              : 'bg-slate-700/30 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Milestone Tasks Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                          isDark ? 'border-slate-700/40 text-slate-400 bg-[#0D1628]/60' : 'border-slate-200 text-slate-600 bg-slate-50'
                        }`}>
                          <th className="p-3">#</th>
                          <th className="p-3 min-w-[200px]">Milestone / Task Name</th>
                          <th className="p-3">Weight</th>
                          <th className="p-3">Owner</th>
                          <th className="p-3">Schedule</th>
                          <th className="p-3">Dependency</th>
                          <th className="p-3 min-w-[140px]">Progress</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right min-w-[150px]">Milestone Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20 text-[11px]">
                        {filteredTasks.map((task, idx) => {
                          const isComplete = task.status === 'Completed' || task.progressPercent === 100;
                          return (
                            <tr 
                              key={task.id} 
                              className={`transition-colors ${
                                isComplete 
                                  ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                                  : task.status === 'Blocked' 
                                  ? 'bg-rose-500/5 hover:bg-rose-500/10' 
                                  : isDark 
                                  ? 'hover:bg-slate-800/40' 
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="p-3 font-mono font-bold text-cyan-400">
                                {task.taskNumber || String(idx + 1).padStart(2, '0')}
                              </td>
                              <td className="p-3">
                                <div className={`font-semibold ${isComplete ? 'text-emerald-300 line-through opacity-90' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {task.taskName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Duration: {task.durationDays || 14} days &bull; Assigned: {task.assignedRole?.toUpperCase() || 'ENG'}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-cyan-400">
                                +{task.weight || 5}%
                              </td>
                              <td className="p-3 text-slate-300">
                                <div className="flex items-center space-x-1.5">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[110px]">{task.owner || 'Lead Engineer'}</span>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                {task.startDate} &rarr; {task.endDate}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  task.dependency === 'None' || !task.dependency
                                    ? 'text-slate-400 bg-slate-700/20'
                                    : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                                }`}>
                                  {task.dependency || 'None'}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between font-mono text-[10px]">
                                    <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                      {task.progressPercent}%
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono">AUTO</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-300 ${
                                        isComplete ? 'bg-emerald-500' : 'bg-cyan-500'
                                      }`}
                                      style={{ width: `${task.progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border ${
                                    isComplete
                                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                      : task.status === 'In Progress'
                                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                      : task.status === 'Blocked'
                                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                      : task.status === 'Under Review'
                                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                      : 'bg-slate-800 border-slate-700 text-slate-400'
                                  }`}
                                >
                                  {task.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {isComplete ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMilestoneCompletion(task.id)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-bold font-mono bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer transition-all shadow-sm shadow-emerald-500/10"
                                    title="Milestone completed (100%). Click to reopen task."
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Completed ✓</span>
                                  </button>
                                ) : task.status === 'In Progress' || (task.progressPercent && task.progressPercent > 0) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMilestoneCompletion(task.id)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-bold font-mono bg-cyan-500 text-black hover:bg-cyan-400 cursor-pointer transition-all shadow-sm shadow-cyan-500/20"
                                    title="Complete milestone: sets Progress to 100% and Status to Completed automatically"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Complete Task</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleStartMilestone(task.id)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold font-mono bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/50 text-slate-200 hover:text-white cursor-pointer transition-all"
                                    title="Start milestone: progress calculates automatically from schedule"
                                  >
                                    <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                                    <span>Start Milestone</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LINKED PRODUCTS TAB */}
              {activeSubTab === 'products' && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/30">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        Products & Assemblies Assigned to {selectedProject.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Central Product Master items linked through Project Code <strong className="text-cyan-400 font-mono">{selectedProject.code}</strong>.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {linkedParts.length} Linked Items
                      </span>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('products', undefined, selectedProject.id)}
                          className="btn-primary btn-sm flex items-center space-x-1 cursor-pointer text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Linked Product</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {linkedParts.length > 0 ? (
                      linkedParts.map((p) => {
                        const prog = p.completionPercent !== undefined 
                          ? p.completionPercent 
                          : (p.lifecycleStage === 'production' ? 100 : p.lifecycleStage === 'prototype' ? 70 : 45);
                        const isDone = prog === 100;

                        return (
                          <div 
                            key={p.id} 
                            className="p-4 rounded-xl border flex flex-col gap-3 text-xs bg-slate-700/10 border-slate-700/40 hover:border-cyan-500/40 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-start sm:items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                                  <GitCommit className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-cyan-400">{p.partNumber}</span>
                                    <span className="text-slate-400">&bull;</span>
                                    <strong className="text-slate-100 text-sm">{p.name}</strong>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>Type: <strong>{p.type}</strong></span>
                                    <span>Category: <strong>{p.category}</strong></span>
                                    <span>Material: <strong>{p.material}</strong></span>
                                    <span>Current Rev: <strong className="text-amber-400 font-mono">{p.currentRev}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`badge-status ${
                                  isDone ? 'badge-active' : 'badge-draft'
                                } text-[10px]`}>
                                  {isDone ? 'COMPLETED (100%)' : `IN PROGRESS (${prog}%)`}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar for 19-step Product Master */}
                            <div className="space-y-1 pt-1 border-t border-slate-700/30">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>Product Workflow Progress: <strong className={isDone ? 'text-emerald-400' : 'text-cyan-400'}>{prog}%</strong></span>
                                <span>Milestones Synced: <strong className="text-emerald-400">16 PLM Stage Gates</strong></span>
                              </div>
                              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-400' : 'bg-cyan-500'}`}
                                  style={{ width: `${prog}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
                        <FolderOpen className="w-8 h-8 mx-auto text-slate-500" />
                        <p className="text-xs">
                          No products are directly tagged with <span className="font-mono text-cyan-400">{selectedProject.code}</span> yet.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Create a new product and choose this project under the Project tab to automatically establish traceability.
                        </p>
                        {onNavigateTab && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => onNavigateTab('products', undefined, selectedProject.id)}
                              className="btn-primary btn-sm inline-flex items-center space-x-1 cursor-pointer text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create First Product for this Project</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeSubTab === 'documents' && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        Project Engineering Drawings, 3D CAD & Specs
                      </h3>
                      <p className="text-xs text-slate-400">
                        Controlled document vault files linked to project assemblies and parts.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {linkedDocs.length} Documents
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {linkedDocs.length > 0 ? (
                      linkedDocs.map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-xl border flex items-center justify-between text-xs bg-slate-700/10 border-slate-700/40">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div>
                              <strong className="text-slate-100">{doc.title}</strong>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Doc Number: {doc.docNumber} &bull; Type: {doc.type} &bull; Rev: {doc.revision} &bull; Size: {doc.fileSize}
                              </div>
                            </div>
                          </div>
                          <span className="badge-status badge-active text-[10px]">CONTROLLED</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                        No controlled CAD models or 2D drawings are mapped to this project yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CHANGES TAB */}
              {activeSubTab === 'changes' && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        Engineering Change Requests & Orders (ECR / ECO)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Change control workflows affecting products assigned to this project workspace.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {linkedChanges.length} Change Orders
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {linkedChanges.length > 0 ? (
                      linkedChanges.map((change) => (
                        <div key={change.id} className="p-3.5 rounded-xl border flex items-center justify-between text-xs bg-slate-700/10 border-slate-700/40">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-amber-400 font-mono font-bold">{change.id}</span>
                              <span className="text-slate-400">&bull;</span>
                              <strong className="text-slate-100">{change.title}</strong>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Initiated By: {change.requester || change.createdBy || 'Lead Engineer'} &bull; Severity: <span className="text-rose-400 font-bold">{change.severity}</span> &bull; Reason: {change.reasonForChange || change.description}
                            </div>
                          </div>
                          <span className={`badge-status ${
                            change.status === 'Approved' || change.status === 'Converted to ECN' ? 'badge-active' : 'badge-draft'
                          } text-[10px]`}>
                            {change.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                        No active engineering change requests recorded against this project.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TEAM & DETAILS TAB */}
              {activeSubTab === 'team' && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-6 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200">
                          Cross-Functional Engineering Program Team
                        </h3>
                        <p className="text-xs text-slate-400">
                          Assigned project team members and core engineering stakeholders for {selectedProject.code}.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {selectedProject.teamMembers?.length || 5} Team Members
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-xs">
                      {(selectedProject.teamMembers && selectedProject.teamMembers.length > 0) ? (
                        selectedProject.teamMembers.map((member, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1.5 hover:border-cyan-500/40 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px] uppercase font-mono font-bold">{member.department}</span>
                              <span className="text-[10px] font-mono text-cyan-400 font-bold">{member.employeeId}</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                              <span className="text-lg">{member.avatar || '👤'}</span>
                              <div>
                                <strong className="text-slate-100 text-sm block">{member.name}</strong>
                                <span className="text-[11px] text-slate-400">{member.role}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1">
                            <span className="text-slate-400 text-[10px] block uppercase font-mono">Project Manager</span>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-cyan-400" />
                              <strong className="text-slate-100 text-sm">{selectedProject.manager}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Program Management Office</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1">
                            <span className="text-slate-400 text-[10px] block uppercase font-mono">Lead Design Engineer</span>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-cyan-400" />
                              <strong className="text-slate-100 text-sm">{selectedProject.designEngineer || 'Alex Rivera, PE'}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 block">CAD & Product Engineering</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1">
                            <span className="text-slate-400 text-[10px] block uppercase font-mono">Lead Manufacturing Engineer</span>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-emerald-400" />
                              <strong className="text-slate-100 text-sm">{selectedProject.mfgEngineer || 'Marcus Vance'}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 block">CAPP, Tooling & DFM</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1">
                            <span className="text-slate-400 text-[10px] block uppercase font-mono">Quality Assurance Lead</span>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-amber-400" />
                              <strong className="text-slate-100 text-sm">{selectedProject.qualityEngineer || 'Dr. Elena Rostova'}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Quality & Metrology Inspection</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1">
                            <span className="text-slate-400 text-[10px] block uppercase font-mono">Procurement & SCM Lead</span>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-purple-400" />
                              <strong className="text-slate-100 text-sm">{selectedProject.procurementLead || 'Sarah Connor'}</strong>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Supplier & Component Sourcing</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-700/10 border border-slate-700/40 space-y-1">
                            <span className="text-slate-400 text-[10px] block uppercase font-mono">Customer & Program</span>
                            <div className="text-slate-100 font-bold text-sm">
                              {selectedProject.customer || 'Apex Automotive Systems'}
                            </div>
                            <span className="text-[10px] text-cyan-400 font-mono block">
                              {selectedProject.program || 'EV Fleet Program'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Timeline & Dates Summary */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 border-b pb-2 border-slate-700/30">
                      Project Schedule & Milestone Delivery Dates
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-700/10 border border-slate-700/30">
                        <span className="text-slate-400 text-[10px] uppercase block font-mono">Start Date</span>
                        <strong className="text-slate-200 font-mono text-sm">{selectedProject.startDate || '2026-01-10'}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-700/10 border border-slate-700/30">
                        <span className="text-slate-400 text-[10px] uppercase block font-mono">Target End Date</span>
                        <strong className="text-slate-200 font-mono text-sm">{selectedProject.endDate || '2026-07-15'}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-700/10 border border-slate-700/30">
                        <span className="text-slate-400 text-[10px] uppercase block font-mono">Total Duration</span>
                        <strong className="text-cyan-400 font-mono text-sm">{selectedProject.durationFormatted || '186 Days (~27 Weeks)'}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-200 border-b pb-2 border-slate-700/30">
                      Project Description & Mission Objective
                    </h3>
                    <p className="mt-3 text-xs text-slate-300 leading-relaxed font-mono bg-slate-700/10 p-4 rounded-xl border border-slate-700/30">
                      Mechanical Product Lifecycle Development program encompassing 16 stage-gated milestone reviews from initial requirements engineering, 3D parametric CAD modeling, EBOM/MBOM synthesis, DFMEA/PFMEA risk matrices, to shop-floor validation and production release.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 p-12 text-center text-slate-400 border border-dashed rounded-xl">
            Select a project from the sidebar to inspect detailed plans, timelines, and linked assets.
          </div>
        )}
      </div>
    )}

      {/* CREATE NEW PLM PROJECT WORKSPACE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleCreateProject}
            className={`rounded-2xl p-6 border max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 transition-colors text-xs ${
              isDark ? 'bg-[#111B2E] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30 sticky top-0 bg-inherit z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Create New PLM Project Workspace
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure program details, schedule, team members, and generate 16 stage-gated PLM milestones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700/20 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: PROJECT INFORMATION */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b pb-1 border-slate-700/30 flex items-center space-x-2">
                <span>01 — Project Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Auto-generated Project Code (Read Only) */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Code/Num</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={generateNextProjectCode(projects)}
                      className="plm-input w-full text-xs font-mono font-bold bg-slate-800/80 text-cyan-400 border-cyan-500/40 cursor-not-allowed pr-36"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      AUTO-GENERATED &bull; READ-ONLY
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Automatically assigned unique identifier for project lifecycle isolation.
                  </span>
                </div>

                {/* Project Name (Mandatory) */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Scooter Development"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="plm-input w-full text-xs"
                  />
                </div>

                {/* Customer */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Customer</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Automotive Systems"
                    value={newProject.customer}
                    onChange={(e) => setNewProject(prev => ({ ...prev, customer: e.target.value }))}
                    className="plm-input w-full text-xs"
                  />
                </div>

                {/* Program Name */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Program Name</label>
                  <input
                    type="text"
                    placeholder="e.g. EV Fleet Program"
                    value={newProject.program}
                    onChange={(e) => setNewProject(prev => ({ ...prev, program: e.target.value }))}
                    className="plm-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold block text-slate-300">Project Mission & Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe program goals, specifications, and deliverable targets..."
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="plm-input w-full text-xs"
                />
              </div>
            </div>

            {/* SECTION 2: PROJECT SCHEDULE */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b pb-1 border-slate-700/30">
                02 — Project Schedule & Timeline
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newProject.startDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project End Date *</label>
                  <input
                    type="date"
                    required
                    value={newProject.endDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              {/* Auto Duration Badge and Validation */}
              {(() => {
                const duration = calculateProjectDuration(newProject.startDate, newProject.endDate);
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    duration.isValid 
                      ? 'bg-slate-700/10 border-slate-700/40 text-slate-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Clock className={`w-4 h-4 ${duration.isValid ? 'text-cyan-400' : 'text-rose-400'}`} />
                      <span>Project Duration: <strong className="font-mono font-bold">{duration.text}</strong></span>
                    </div>
                    {!duration.isValid && (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>End date cannot be earlier than start date.</span>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* SECTION 3: PROJECT TEAM MEMBERS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1 border-slate-700/30">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  03 — Project Team Members (Minimum 2 Members Required)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  teamMembers.length >= 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {teamMembers.length} Members Configured
                </span>
              </div>

              {/* Key Role Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Manager *</label>
                  <select
                    value={newProject.manager}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setNewProject(prev => ({ ...prev, manager: selectedVal }));
                      const emp = MOCK_USERS.find(u => u.name === selectedVal);
                      if (emp && !teamMembers.some(m => m.employeeId === emp.employeeId)) {
                        setTeamMembers(prev => [...prev, {
                          employeeId: emp.employeeId,
                          name: emp.name,
                          role: emp.role,
                          department: emp.department,
                          avatar: emp.avatar
                        }]);
                      }
                    }}
                    className="plm-select w-full text-xs"
                  >
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} &mdash; {u.role} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Lead Design Engineer *</label>
                  <select
                    value={newProject.designEngineer}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setNewProject(prev => ({ ...prev, designEngineer: selectedVal }));
                      const emp = MOCK_USERS.find(u => u.name === selectedVal);
                      if (emp && !teamMembers.some(m => m.employeeId === emp.employeeId)) {
                        setTeamMembers(prev => [...prev, {
                          employeeId: emp.employeeId,
                          name: emp.name,
                          role: emp.role,
                          department: emp.department,
                          avatar: emp.avatar
                        }]);
                      }
                    }}
                    className="plm-select w-full text-xs"
                  >
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} &mdash; {u.role} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Team Member Search & Selection */}
              <div className="p-3.5 rounded-xl border border-slate-700/40 bg-slate-800/30 space-y-2.5">
                <label className="text-[11px] font-semibold text-slate-300 block">Search & Add Team Members from Employee Catalog</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type employee name, role, department or ID (e.g. Malarvannan, Vance, EMP-10088)..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="plm-input w-full pl-8 text-xs"
                    />
                  </div>

                  <select
                    value={selectedEmployeeIdToAdd}
                    onChange={(e) => setSelectedEmployeeIdToAdd(e.target.value)}
                    className="plm-select text-xs w-full sm:w-64 shrink-0"
                  >
                    <option value="">-- Choose Employee --</option>
                    {MOCK_USERS
                      .filter(u => {
                        if (!employeeSearchQuery) return true;
                        const q = employeeSearchQuery.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.role.toLowerCase().includes(q) ||
                          u.department.toLowerCase().includes(q) ||
                          u.employeeId.toLowerCase().includes(q)
                        );
                      })
                      .map(u => (
                        <option key={u.id} value={u.employeeId} disabled={teamMembers.some(m => m.employeeId === u.employeeId)}>
                          {u.name} ({u.employeeId}) &mdash; {u.role} {teamMembers.some(m => m.employeeId === u.employeeId) ? '(Added)' : ''}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedEmployeeIdToAdd}
                    onClick={() => {
                      if (selectedEmployeeIdToAdd) {
                        handleAddTeamMember(selectedEmployeeIdToAdd);
                      }
                    }}
                    className="btn-primary btn-sm flex items-center space-x-1 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Team Members List Display */}
                <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto pr-1">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.employeeId} 
                      className="p-2.5 rounded-lg border border-slate-700/40 bg-slate-700/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">{member.avatar || '👤'}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-100">{member.name}</strong>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">({member.employeeId})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {member.role} &bull; {member.department}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => handleRemoveTeamMember(member.employeeId)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: PROJECT FINANCIALS & EFFORT */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b pb-1 border-slate-700/30">
                04 — Project Financials & Effort
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Total Budget ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProject.budgetTotal}
                    onChange={(e) => setNewProject(prev => ({ ...prev, budgetTotal: Number(e.target.value) }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Target Engineering Hours *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProject.engHoursTotal}
                    onChange={(e) => setNewProject(prev => ({ ...prev, engHoursTotal: Number(e.target.value) }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: AUTO-GENERATED 16 PLM MILESTONES PREVIEW */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1 border-slate-700/30">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  05 — Auto-Generated 16 PLM Stage-Gated Milestones
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Sum of Milestone Weights = 100%
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Every newly created project receives its own isolated schedule with 16 independent milestones proportionally fitted inside the project start and end dates.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {STANDARD_16_PLM_MILESTONES.map((m) => (
                  <div key={m.taskNumber} className="p-2 rounded-lg bg-slate-700/10 border border-slate-700/30 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-cyan-400 font-bold">{m.taskNumber}</span>
                      <span className="text-slate-200 truncate">{m.taskName.replace(/^\d+\s*/, '')}</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold text-[10px]">{m.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/30 sticky bottom-0 bg-inherit z-10">
              <span className="text-[11px] text-slate-400">
                {teamMembers.length < 2 ? (
                  <strong className="text-rose-400">⚠️ Minimum 2 team members required</strong>
                ) : (
                  <strong className="text-emerald-400">✓ All requirements validated</strong>
                )}
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={teamMembers.length < 2 || !calculateProjectDuration(newProject.startDate, newProject.endDate).isValid}
                  className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* EDIT EXISTING PLM PROJECT WORKSPACE MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveEditProject}
            className={`rounded-2xl p-6 border max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 transition-colors text-xs ${
              isDark ? 'bg-[#111B2E] border-cyan-500/40 text-[#F1F5F9]' : 'bg-white border-cyan-300 text-[#172033]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30 sticky top-0 bg-inherit z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/40">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold">
                      Edit Project Workspace &mdash; {editingProject.code}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40">
                      UPDATE EXISTING ONLY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Modify project details, team assignments, timeline, and financials. Project code and milestone progression are preserved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700/20 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: PROJECT INFORMATION */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b pb-1 border-slate-700/30 flex items-center space-x-2">
                <span>01 — Project Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Project Code (Permanent & Read Only) */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Code (Permanent)</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={editingProject.code}
                      className="plm-input w-full text-xs font-mono font-bold bg-slate-800/80 text-cyan-400 border-cyan-500/40 cursor-not-allowed pr-32"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      LOCKED ID
                    </span>
                  </div>
                </div>

                {/* Project Name (Mandatory) */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Scooter Development"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="plm-input w-full text-xs"
                  />
                </div>

                {/* Customer */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Customer</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Automotive Systems"
                    value={editForm.customer}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customer: e.target.value }))}
                    className="plm-input w-full text-xs"
                  />
                </div>

                {/* Program Name */}
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Program Name</label>
                  <input
                    type="text"
                    placeholder="e.g. EV Fleet Program"
                    value={editForm.program}
                    onChange={(e) => setEditForm(prev => ({ ...prev, program: e.target.value }))}
                    className="plm-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold block text-slate-300">Project Mission & Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe program goals, specifications, and deliverable targets..."
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="plm-input w-full text-xs"
                />
              </div>
            </div>

            {/* SECTION 2: PROJECT SCHEDULE */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b pb-1 border-slate-700/30">
                02 — Project Schedule & Timeline
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Start Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.startDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project End Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.endDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              {/* Duration badge */}
              {(() => {
                const duration = calculateProjectDuration(editForm.startDate, editForm.endDate);
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    duration.isValid 
                      ? 'bg-slate-700/10 border-slate-700/40 text-slate-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Clock className={`w-4 h-4 ${duration.isValid ? 'text-cyan-400' : 'text-rose-400'}`} />
                      <span>Updated Duration: <strong className="font-mono font-bold">{duration.text}</strong></span>
                    </div>
                    {!duration.isValid && (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>End date cannot be earlier than start date.</span>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* SECTION 3: KEY ROLES & TEAM MEMBERS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1 border-slate-700/30">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  03 — Project Team Members (Minimum 2 Members Required)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  editTeamMembers.length >= 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {editTeamMembers.length} Members Configured
                </span>
              </div>

              {/* Role Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Project Manager *</label>
                  <select
                    value={editForm.manager}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setEditForm(prev => ({ ...prev, manager: selectedVal }));
                      const emp = MOCK_USERS.find(u => u.name === selectedVal);
                      if (emp && !editTeamMembers.some(m => m.employeeId === emp.employeeId)) {
                        setEditTeamMembers(prev => [...prev, {
                          employeeId: emp.employeeId,
                          name: emp.name,
                          role: emp.role,
                          department: emp.department,
                          avatar: emp.avatar
                        }]);
                      }
                    }}
                    className="plm-select w-full text-xs"
                  >
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} &mdash; {u.role} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Lead Design Engineer *</label>
                  <select
                    value={editForm.designEngineer}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setEditForm(prev => ({ ...prev, designEngineer: selectedVal }));
                      const emp = MOCK_USERS.find(u => u.name === selectedVal);
                      if (emp && !editTeamMembers.some(m => m.employeeId === emp.employeeId)) {
                        setEditTeamMembers(prev => [...prev, {
                          employeeId: emp.employeeId,
                          name: emp.name,
                          role: emp.role,
                          department: emp.department,
                          avatar: emp.avatar
                        }]);
                      }
                    }}
                    className="plm-select w-full text-xs"
                  >
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} &mdash; {u.role} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Team Member Search */}
              <div className="p-3.5 rounded-xl border border-slate-700/40 bg-slate-800/30 space-y-2.5">
                <label className="text-[11px] font-semibold text-slate-300 block">Search & Add Team Members from Employee Catalog</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type employee name, role, department or ID (e.g. Malarvannan, Vance, EMP-10088)..."
                      value={editEmployeeSearchQuery}
                      onChange={(e) => setEditEmployeeSearchQuery(e.target.value)}
                      className="plm-input w-full pl-8 text-xs"
                    />
                  </div>

                  <select
                    value={editSelectedEmployeeIdToAdd}
                    onChange={(e) => setEditSelectedEmployeeIdToAdd(e.target.value)}
                    className="plm-select text-xs w-full sm:w-64 shrink-0"
                  >
                    <option value="">-- Choose Employee --</option>
                    {MOCK_USERS
                      .filter(u => {
                        if (!editEmployeeSearchQuery) return true;
                        const q = editEmployeeSearchQuery.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.role.toLowerCase().includes(q) ||
                          u.department.toLowerCase().includes(q) ||
                          u.employeeId.toLowerCase().includes(q)
                        );
                      })
                      .map(u => (
                        <option key={u.id} value={u.employeeId} disabled={editTeamMembers.some(m => m.employeeId === u.employeeId)}>
                          {u.name} ({u.employeeId}) &mdash; {u.role} {editTeamMembers.some(m => m.employeeId === u.employeeId) ? '(Added)' : ''}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={!editSelectedEmployeeIdToAdd}
                    onClick={() => {
                      if (editSelectedEmployeeIdToAdd) {
                        handleEditAddTeamMember(editSelectedEmployeeIdToAdd);
                      }
                    }}
                    className="btn-primary btn-sm flex items-center space-x-1 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Team Members List */}
                <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto pr-1">
                  {editTeamMembers.map((member) => (
                    <div 
                      key={member.employeeId} 
                      className="p-2.5 rounded-lg border border-slate-700/40 bg-slate-700/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">{member.avatar || '👤'}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-100">{member.name}</strong>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">({member.employeeId})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {member.role} &bull; {member.department}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => handleEditRemoveTeamMember(member.employeeId)}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: PROJECT FINANCIALS & EFFORT */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b pb-1 border-slate-700/30">
                04 — Project Financials & Effort
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Total Budget ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.budgetTotal}
                    onChange={(e) => setEditForm(prev => ({ ...prev, budgetTotal: Number(e.target.value) }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-300">Target Engineering Hours *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.engHoursTotal}
                    onChange={(e) => setEditForm(prev => ({ ...prev, engHoursTotal: Number(e.target.value) }))}
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/30 sticky bottom-0 bg-inherit z-10">
              <span className="text-[11px] text-slate-400">
                {editTeamMembers.length < 2 ? (
                  <strong className="text-rose-400">⚠️ Minimum 2 team members required</strong>
                ) : (
                  <strong className="text-emerald-400">✓ Ready to update project</strong>
                )}
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editTeamMembers.length < 2 || !calculateProjectDuration(editForm.startDate, editForm.endDate).isValid}
                  className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Project Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* PERMANENT DELETE PROJECT CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-5 transition-colors ${
              isDark ? 'bg-[#0F172A] border-rose-500/40 text-[#F1F5F9]' : 'bg-white border-rose-300 text-[#172033]'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
          >
            {/* Modal Header */}
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase">
                    Explicit Confirmation Required
                  </span>
                </div>
                <h2 id="delete-project-title" className="text-lg font-bold text-rose-500 mt-1">
                  Delete this project permanently?
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  You are about to execute an irreversible system-wide deletion of this PLM Project Workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingProject && setProjectToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                disabled={isDeletingProject}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Project Summary Card */}
            <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
              isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Project Code:</span>
                <span className="font-bold text-cyan-400 text-sm">{projectToDelete.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Project Name:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[260px]">{projectToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Project Manager:</span>
                <span className="text-slate-300">{projectToDelete.manager}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Status & Milestones:</span>
                <span className="text-amber-400">{projectToDelete.status} &bull; {projectToDelete.tasks?.length || 16} Stage Gates</span>
              </div>
            </div>

            {/* System-Wide Cascade Warning */}
            <div className="rounded-xl p-3.5 bg-rose-500/10 border border-rose-500/25 space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Permanent Cascade Purge Scope</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                Confirming will immediately wipe this project and <strong>ALL associated project data</strong>:
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300 pt-1 font-mono">
                <span className="flex items-center space-x-1">&bull; 16 Milestone tasks</span>
                <span className="flex items-center space-x-1">&bull; Project Master record</span>
                <span className="flex items-center space-x-1">&bull; Product linkages</span>
                <span className="flex items-center space-x-1">&bull; Project documents</span>
                <span className="flex items-center space-x-1">&bull; Linked ECR/ECO records</span>
                <span className="flex items-center space-x-1">&bull; Team allocations</span>
              </div>
              <div className="text-[10px] text-rose-300 font-mono pt-1 border-t border-rose-500/20">
                🔒 Other projects and unrelated products will NOT be modified. Deletion will be permanently logged in the Audit Trail.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeletingProject}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteProject(projectToDelete)}
                disabled={isDeletingProject}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeletingProject ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Project...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;

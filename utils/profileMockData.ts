// Profile Mock Data Utilities
// Generates realistic professional development data for enhanced profile display

import type { User, Skill, Certification } from '../types/user';

/**
 * Calculate employment tenure in months
 */
export function calculateTenureMonths(dateJoined?: string): number {
  if (!dateJoined) return 0;
  
  const joinDate = new Date(dateJoined);
  const now = new Date();
  const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + 
                 (now.getMonth() - joinDate.getMonth());
  
  return Math.max(0, months);
}

/**
 * Format tenure as human-readable string
 */
export function formatTenure(months: number): string {
  if (months === 0) return 'New Hire';
  if (months < 1) return 'Less than a month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  
  return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
}

/**
 * Generate realistic attendance percentage based on tenure and category
 */
export function generateAttendancePercentage(
  tenureMonths: number, 
  category?: User['category']
): number {
  // Base attendance by category
  const baseAttendance = {
    intern: 94,
    employee: 95,
    manager: 96,
    hr: 97,
    admin: 96,
  };
  
  const base = baseAttendance[category || 'employee'];
  
  // Slight random variation (+/- 3%)
  const variation = Math.random() * 6 - 3;
  
  // Tenure bonus (longer tenure = slightly better attendance)
  const tenureBonus = Math.min(tenureMonths / 24, 2); // Max 2% bonus
  
  const result = Math.min(100, Math.max(85, base + variation + tenureBonus));
  
  return Math.round(result * 10) / 10; // Round to 1 decimal
}

/**
 * Generate skills based on user category and tenure
 */
export function generateSkills(
  category?: User['category'],
  tenureMonths: number = 0,
  designation?: string
): Skill[] {
  const commonSkills: Skill[] = [
    { id: 's1', name: 'Communication', category: 'soft', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.floor(tenureMonths / 12) },
    { id: 's2', name: 'Teamwork', category: 'soft', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.floor(tenureMonths / 12) },
    { id: 's3', name: 'Problem Solving', category: 'soft', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.floor(tenureMonths / 12) },
  ];

  const technicalSkills: Record<string, Skill[]> = {
    intern: [
      { id: 't1', name: 'React Native', category: 'technical', level: Math.min(4, 2 + Math.floor(tenureMonths / 6)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(2, tenureMonths / 12) },
      { id: 't2', name: 'TypeScript', category: 'technical', level: Math.min(3, 2 + Math.floor(tenureMonths / 8)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(1.5, tenureMonths / 12) },
      { id: 't3', name: 'JavaScript', category: 'technical', level: Math.min(4, 3 + Math.floor(tenureMonths / 6)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(2, tenureMonths / 12) },
      { id: 't4', name: 'Git Version Control', category: 'technical', level: Math.min(3, 2 + Math.floor(tenureMonths / 8)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(1, tenureMonths / 12) },
      { id: 't5', name: 'REST APIs', category: 'technical', level: Math.min(3, 2 + Math.floor(tenureMonths / 8)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(1, tenureMonths / 12) },
    ],
    employee: [
      { id: 't1', name: 'React Native', category: 'technical', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't2', name: 'TypeScript', category: 'technical', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(2.5, tenureMonths / 12) },
      { id: 't3', name: 'JavaScript', category: 'technical', level: 4, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't4', name: 'Node.js', category: 'technical', level: Math.min(4, 3 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(2, tenureMonths / 12) },
      { id: 't5', name: 'SQL/Database', category: 'technical', level: Math.min(4, 2 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(2, tenureMonths / 12) },
      { id: 't6', name: 'UI/UX Design', category: 'technical', level: 3, years_experience: Math.min(2, tenureMonths / 12) },
    ],
    manager: [
      { id: 't1', name: 'Project Management', category: 'domain', level: Math.min(5, 4 + Math.floor(tenureMonths / 24)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(5, tenureMonths / 12) },
      { id: 't2', name: 'Team Leadership', category: 'soft', level: Math.min(5, 4 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(4, tenureMonths / 12) },
      { id: 't3', name: 'Agile/Scrum', category: 'domain', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(4, tenureMonths / 12) },
      { id: 't4', name: 'Strategic Planning', category: 'domain', level: Math.min(5, 3 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't5', name: 'Stakeholder Management', category: 'soft', level: 4, years_experience: Math.min(3, tenureMonths / 12) },
    ],
    hr: [
      { id: 't1', name: 'Talent Acquisition', category: 'domain', level: Math.min(5, 4 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(4, tenureMonths / 12) },
      { id: 't2', name: 'Employee Relations', category: 'domain', level: Math.min(5, 4 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(4, tenureMonths / 12) },
      { id: 't3', name: 'Performance Management', category: 'domain', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't4', name: 'HR Compliance', category: 'domain', level: 4, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't5', name: 'Conflict Resolution', category: 'soft', level: Math.min(5, 4 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(3, tenureMonths / 12) },
    ],
    admin: [
      { id: 't1', name: 'System Administration', category: 'technical', level: Math.min(5, 4 + Math.floor(tenureMonths / 18)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(4, tenureMonths / 12) },
      { id: 't2', name: 'Data Management', category: 'technical', level: 4, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't3', name: 'Process Optimization', category: 'domain', level: Math.min(5, 3 + Math.floor(tenureMonths / 12)) as 1 | 2 | 3 | 4 | 5, years_experience: Math.min(3, tenureMonths / 12) },
      { id: 't4', name: 'Reporting & Analytics', category: 'technical', level: 4, years_experience: Math.min(3, tenureMonths / 12) },
    ],
  };

  const categorySkills = technicalSkills[category || 'employee'] || technicalSkills.employee;
  
  return [...categorySkills, ...commonSkills];
}

/**
 * Generate certifications based on category and tenure
 */
export function generateCertifications(
  category?: User['category'],
  tenureMonths: number = 0,
  dateJoined?: string
): Certification[] {
  const certs: Certification[] = [];
  const joinDate = dateJoined ? new Date(dateJoined) : new Date();
  
  // Everyone gets onboarding completion
  const onboardingDate = new Date(joinDate);
  onboardingDate.setDate(onboardingDate.getDate() + 7);
  
  certs.push({
    id: 'c1',
    title: 'Employee Onboarding Program',
    issued_by: 'Sarvagun Technologies',
    issue_date: onboardingDate.toISOString().split('T')[0],
    description: 'Completed comprehensive onboarding covering company policies, tools, and workflows',
  });

  // Category-specific certifications based on tenure
  if (category === 'intern' || category === 'employee') {
    if (tenureMonths >= 2) {
      const cert2Date = new Date(joinDate);
      cert2Date.setMonth(cert2Date.getMonth() + 2);
      certs.push({
        id: 'c2',
        title: 'React Native Fundamentals',
        issued_by: 'Sarvagun Technologies',
        issue_date: cert2Date.toISOString().split('T')[0],
        credential_id: `RN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: 'Advanced training in React Native mobile development',
      });
    }
    
    if (tenureMonths >= 4) {
      const cert3Date = new Date(joinDate);
      cert3Date.setMonth(cert3Date.getMonth() + 4);
      certs.push({
        id: 'c3',
        title: 'Agile Development Methodology',
        issued_by: 'Sarvagun Technologies',
        issue_date: cert3Date.toISOString().split('T')[0],
        credential_id: `AGILE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: 'Certified in Scrum and Agile project management practices',
      });
    }
    
    if (tenureMonths >= 6) {
      const cert4Date = new Date(joinDate);
      cert4Date.setMonth(cert4Date.getMonth() + 6);
      const expiryDate = new Date(cert4Date);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      certs.push({
        id: 'c4',
        title: 'Information Security Awareness',
        issued_by: 'Sarvagun Technologies',
        issue_date: cert4Date.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        credential_id: `SEC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: 'Annual security training and compliance certification',
      });
    }
  }
  
  if (category === 'manager') {
    const cert2Date = new Date(joinDate);
    cert2Date.setMonth(cert2Date.getMonth() + 1);
    certs.push({
      id: 'c2',
      title: 'Leadership Excellence Program',
      issued_by: 'Sarvagun Technologies',
      issue_date: cert2Date.toISOString().split('T')[0],
      credential_id: `LEAD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      description: 'Advanced leadership and people management training',
    });
    
    if (tenureMonths >= 3) {
      const cert3Date = new Date(joinDate);
      cert3Date.setMonth(cert3Date.getMonth() + 3);
      certs.push({
        id: 'c3',
        title: 'Project Management Professional',
        issued_by: 'Sarvagun Technologies',
        issue_date: cert3Date.toISOString().split('T')[0],
        credential_id: `PMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: 'Certified in advanced project planning and execution',
      });
    }
  }
  
  if (category === 'hr') {
    const cert2Date = new Date(joinDate);
    cert2Date.setMonth(cert2Date.getMonth() + 1);
    certs.push({
      id: 'c2',
      title: 'HR Management Essentials',
      issued_by: 'Sarvagun Technologies',
      issue_date: cert2Date.toISOString().split('T')[0],
      credential_id: `HRM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      description: 'Comprehensive HR policies and employee lifecycle management',
    });
    
    if (tenureMonths >= 3) {
      const cert3Date = new Date(joinDate);
      cert3Date.setMonth(cert3Date.getMonth() + 3);
      const expiryDate = new Date(cert3Date);
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      
      certs.push({
        id: 'c3',
        title: 'Employment Law & Compliance',
        issued_by: 'National HR Association',
        issue_date: cert3Date.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        credential_id: `LAW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: 'Certified in labor laws and workplace compliance',
      });
    }
  }

  return certs;
}

/**
 * Check if certification is expiring soon (within 30 days)
 */
export function isCertificationExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
}

/**
 * Check if certification is expired
 */
export function isCertificationExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  
  return expiry < now;
}

/**
 * Get skill level label
 */
export function getSkillLevelLabel(level: 1 | 2 | 3 | 4 | 5): string {
  const labels = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  };
  
  return labels[level];
}

/**
 * Get skill level color
 */
export function getSkillLevelColor(level: 1 | 2 | 3 | 4 | 5): string {
  const colors = {
    1: '#94a3b8', // slate-400
    2: '#60a5fa', // blue-400
    3: '#34d399', // emerald-400
    4: '#fbbf24', // amber-400
    5: '#f59e0b', // amber-500
  };
  
  return colors[level];
}

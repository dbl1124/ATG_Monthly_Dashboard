import { Project, DashboardStats, ChartDataPoint, TimelineDataPoint } from './types';
import { COLORS, SPACE_DISPLAY_NAMES } from './constants';

export const extractBrand = (projectName: string): string => {
  const nameUpper = projectName.toUpperCase();
  
  if (nameUpper.startsWith('GEARWRENCH') || nameUpper.startsWith('GW_') || nameUpper.startsWith('GW-')) return 'GEARWRENCH';
  if (nameUpper.startsWith('CRESCENT') || nameUpper.startsWith('CT_') || nameUpper.startsWith('CT-')) return 'Crescent';
  if (nameUpper.startsWith('WELLER')) return 'Weller';
  if (nameUpper.startsWith('CLECO')) return 'Cleco';
  if (nameUpper.startsWith('SATA')) return 'SATA';
  
  return 'Other';
};

export const calculateStats = (projects: Project[]): DashboardStats => {
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.completed).length;
  const activeProjects = totalProjects - completedProjects;
  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    completionRate
  };
};

export const getProjectsByCategory = (projects: Project[]): ChartDataPoint[] => {
  // Order: Photography (top/first) -> Uncategorized -> Email -> Graphics -> Animation (bottom/last)
  // For Recharts Bar Chart vertical layout, the bottom item in the array appears at the bottom of the chart.
  // We want Photography at top, Animation at bottom.
  const categories = [
    { key: 'Photography', color: COLORS.spacePhotography },
    { key: 'DECOE Uncategorized', color: COLORS.spaceUncategorized },
    { key: 'DECOE Email Marketing', color: COLORS.spaceEmail },
    { key: 'DECOE Digital Graphics', color: COLORS.spaceGraphics },
    { key: 'DECOE Animation', color: COLORS.spaceAnimation },
  ];

  return categories.map(cat => {
    const count = projects.filter(p => p.space === cat.key).length;
    // Map full space name to display name (e.g. DECOE Animation -> 3D/Animation)
    const displayName = SPACE_DISPLAY_NAMES[cat.key] || cat.key;
    return {
      name: displayName,
      value: count,
      fill: cat.color
    };
  }).reverse(); // Reverse for Recharts vertical layout logic
};

export const getStatusDistribution = (projects: Project[]): ChartDataPoint[] => {
  const statusCounts: Record<string, number> = {};
  projects.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  const statusMap = [
    { name: 'New', color: COLORS.statusNew },
    { name: 'Production', color: COLORS.statusProduction },
    { name: 'Completed', color: COLORS.statusCompleted },
    { name: 'In Review', color: COLORS.statusInReview },
    { name: 'V1 - Revisions', color: COLORS.statusRevisions },
  ];

  return statusMap
    .map(s => ({
      name: s.name,
      value: statusCounts[s.name] || 0,
      fill: s.color
    }))
    .filter(item => item.value > 0);
};

export const getTimelineData = (projects: Project[]): TimelineDataPoint[] => {
  // Mock logic to simulate "Weeks" from created dates
  // In a real app, you'd use moment/date-fns to get ISO weeks
  // We will just group by a simulated week number for the visual
  const data = [
    { name: '46', value: 2 },
    { name: '47', value: 16 },
    { name: '48', value: 1 },
    { name: '49', value: 7 },
    { name: '50', value: 8 },
  ];
  return data;
};

export const getBrandDistribution = (projects: Project[]): ChartDataPoint[] => {
  const brandCounts: Record<string, number> = {};
  projects.forEach(p => {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  });

  const brandConfig = [
    { name: 'Cleco', color: COLORS.brandCleco },
    { name: 'Crescent', color: COLORS.brandCrescent },
    { name: 'GEARWRENCH', color: COLORS.brandGearwrench },
    { name: 'Weller', color: COLORS.brandWeller },
    { name: 'Other', color: COLORS.brandOther },
  ];

  return brandConfig
    .map(b => ({
      name: b.name,
      value: brandCounts[b.name] || 0,
      fill: b.color
    }))
    .filter(b => b.value > 0);
};

export const getCategoryTimelineData = (projects: Project[]): any[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const spaces = [
    'DECOE Animation', 
    'DECOE Digital Graphics', 
    'DECOE Email Marketing', 
    'DECOE Uncategorized', 
    'Photography'
  ];

  // Create base data for 12 months with 0 counts
  const data = months.map(m => {
    const entry: any = { name: m };
    spaces.forEach(space => {
      entry[space] = 0;
      // Create a specific property to hold brand details for this space in this month
      // e.g. "DECOE Animation_brands": { "GEARWRENCH": 1, "Crescent": 0 }
      entry[`${space}_brands`] = {};
    });
    return entry;
  });

  projects.forEach(p => {
    if (!p.createdDate) return;
    
    let mIndex = -1;

    // The App uses MM-DD-YYYY format (from utils/wrikeApi.ts)
    const parts = p.createdDate.split('-');
    if (parts.length === 3) {
      const val = parseInt(parts[0], 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
         mIndex = val - 1; 
      }
    }

    if (mIndex === -1) {
        const d = new Date(p.createdDate);
        if (!isNaN(d.getTime())) {
            mIndex = d.getMonth();
        }
    }
    
    if (mIndex >= 0 && mIndex < 12) {
      const space = p.space;
      const brand = p.brand || 'Other'; // Ensure we have a brand key

      if (data[mIndex][space] !== undefined) {
        // Increment total count
        data[mIndex][space]++;
        
        // Increment brand specific count
        const brandKey = `${space}_brands`;
        if (!data[mIndex][brandKey][brand]) {
            data[mIndex][brandKey][brand] = 0;
        }
        data[mIndex][brandKey][brand]++;
      }
    }
  });

  return data;
};
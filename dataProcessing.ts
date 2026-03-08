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
  // Group projects by week of the year
  const weekCounts: Record<string, number> = {};
  
  projects.forEach(p => {
    if (!p.createdDate) return;
    
    // Parse MM-DD-YYYY
    const parts = p.createdDate.split('-');
    if (parts.length !== 3) return;
    
    const d = new Date(
        parseInt(parts[2], 10),     // Year
        parseInt(parts[0], 10) - 1,   // Month
        parseInt(parts[1], 10)      // Day
    );

    if (isNaN(d.getTime())) return;
    
    // Simple week calculation (ISO-ish)
    const startDate = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    
    // Use Year-W[XX] format for sorting and clarity
    const weekKey = `${d.getFullYear().toString().substring(2)}-W${weekNumber.toString().padStart(2, '0')}`;
    weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
  });

  // Sort keys chronologically
  const sortedKeys = Object.keys(weekCounts).sort();

  return sortedKeys.map(k => ({
    name: k,
    value: weekCounts[k]
  }));
};

// ----------------------------------------------------
// NEW MARKETING CHARTS
// ----------------------------------------------------

export const getCycleTimeData = (projects: Project[]): ChartDataPoint[] => {
  const categoryTimes: Record<string, { totalDays: number, count: number }> = {};

  projects.filter(p => p.completed && p.createdDate && p.approvedDate).forEach(p => {
    const cParts = p.createdDate.split('-');
    const aParts = p.approvedDate.split('-');
    
    if (cParts.length !== 3 || aParts.length !== 3) return;

    const created = new Date(parseInt(cParts[2], 10), parseInt(cParts[0], 10) - 1, parseInt(cParts[1], 10));
    const approved = new Date(parseInt(aParts[2], 10), parseInt(aParts[0], 10) - 1, parseInt(aParts[1], 10));
    
    if (isNaN(created.getTime()) || isNaN(approved.getTime())) return;

    let days = Math.floor((approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) days = 0; // Sanity check

    const cat = p.space;
    if (!categoryTimes[cat]) {
      categoryTimes[cat] = { totalDays: 0, count: 0 };
    }
    
    categoryTimes[cat].totalDays += days;
    categoryTimes[cat].count += 1;
  });

  return Object.keys(categoryTimes).map(cat => ({
    name: SPACE_DISPLAY_NAMES[cat] || cat,
    value: Math.round(categoryTimes[cat].totalDays / categoryTimes[cat].count) // Average Days
  })).sort((a, b) => b.value - a.value);
};

export const getOnTimeDeliveryData = (projects: Project[]): { onTime: number, late: number, total: number } => {
  let onTime = 0;
  let late = 0;

  projects.filter(p => p.completed && p.approvedDate && p.dueDate).forEach(p => {
    const aParts = p.approvedDate.split('-');
    const dParts = p.dueDate.split('-');
    
    if (aParts.length !== 3 || dParts.length !== 3) return;

    const approved = new Date(parseInt(aParts[2], 10), parseInt(aParts[0], 10) - 1, parseInt(aParts[1], 10));
    const due = new Date(parseInt(dParts[2], 10), parseInt(dParts[0], 10) - 1, parseInt(dParts[1], 10));
    
    if (isNaN(approved.getTime()) || isNaN(due.getTime())) return;

    if (approved.getTime() <= due.getTime()) {
      onTime++;
    } else {
      late++;
    }
  });

  return { onTime, late, total: onTime + late };
};

export const getBottlenecksData = (projects: Project[]): { chartData: ChartDataPoint[], projects: Project[] } => {
  const statusCounts: Record<string, number> = {};
  
  // Exclude New/Production/Completed ones to find what is stuck
  const bottleneckStatuses = ["In Review", "V1 - Revisions", "On Hold", "Deferred", "Pending Input"];
  
  const bottleneckProjects = projects.filter(p => !p.completed && bottleneckStatuses.some(s => p.status.includes(s)));
  
  bottleneckProjects.forEach(p => {
    statusCounts[p.brand] = (statusCounts[p.brand] || 0) + 1;
  });

  const chartData = Object.keys(statusCounts).map(brand => {
    let colorKey = `brand${brand}` as keyof typeof COLORS;
    if (brand === "GEARWRENCH") colorKey = "brandGearwrench" as any;
    
    return {
        name: brand,
        value: statusCounts[brand],
        fill: COLORS[colorKey] || COLORS.brandOther
    };
  }).sort((a, b) => b.value - a.value);

  return { chartData, projects: bottleneckProjects };
};

export const getCapacityGanttData = (projects: Project[]): any[] => {
  // We want to return a data structure suitable for a Recharts Range Bar Chart.
  // Each item should represent a Team/Space, or even individual projects.
  // Since Recharts handles stacked bars easily, we'll return a list of projects with their [startOffset, endOffset]
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ganttProjects: any[] = [];

  projects.filter(p => !p.completed && p.createdDate && p.dueDate).forEach(p => {
    const cParts = p.createdDate.split('-');
    const dParts = p.dueDate.split('-');
    
    if (cParts.length !== 3 || dParts.length !== 3) return;

    const start = new Date(parseInt(cParts[2], 10), parseInt(cParts[0], 10) - 1, parseInt(cParts[1], 10));
    const end = new Date(parseInt(dParts[2], 10), parseInt(dParts[0], 10) - 1, parseInt(dParts[1], 10));
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    // Calculate offset in days from today
    // Negative means in the past, positive means in the future
    const startOffset = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let endOffset = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // If start is after end due to data error, cap it or ignore
    if (startOffset > endOffset) endOffset = startOffset + 1;

    // We only want to visualize projects that are currently active or upcoming in the near future (-30 to +180 days for a 6 month view)
    if (endOffset < -30 || startOffset > 180) return;

    ganttProjects.push({
      id: p.id,
      name: p.name,
      space: SPACE_DISPLAY_NAMES[p.space] || p.space,
      brand: p.brand,
      status: p.status,
      // Recharts Range Bar expects an array [startValue, endValue] for the dataKey
      timeRange: [startOffset, endOffset],
      startOffset,
      endOffset
    });
  });

  // Sort by space, then start date so the cascade looks nice
  return ganttProjects.sort((a, b) => {
    if (a.space < b.space) return -1;
    if (a.space > b.space) return 1;
    return a.startOffset - b.startOffset;
  });
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


export interface Project {
  id: string;
  name: string;
  space: string;
  status: string;
  createdDate: string;
  dueDate: string;
  approvedDate: string;
  completed: boolean;
  brand: string;
  customBrand?: string;
  distributor?: string;
  requestor?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  completionRate: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  fill?: string;
  [key: string]: any;
}

export interface TimelineDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

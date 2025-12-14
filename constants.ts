
export const COLORS = {
  // KPI Cards
  kpiBlue: '#2196F3',
  kpiPurple: '#9C27B0',
  kpiGreen: '#4CAF50',
  kpiOrange: '#FF9800',

  // Charts
  spaceAnimation: '#6C5CE7',
  spaceGraphics: '#0984E3',
  spaceEmail: '#00B894',
  spaceUncategorized: '#FDCB6E',
  spacePhotography: '#E17055',

  // Status
  statusNew: '#FDCB6E',
  statusProduction: '#0984E3',
  statusCompleted: '#00B894',
  statusInReview: '#E74C3C', // Red-ish
  statusRevisions: '#A29BFE',

  // Brands
  brandGearwrench: '#ed8b00', // Updated to orange
  brandCrescent: '#da4d1f',    // Updated to rust/red-orange
  brandWeller: '#64B5F6',
  brandCleco: '#FF9800',
  brandSata: '#9B59B6',
  brandOther: '#95A5A6',
};

export const TARGET_SPACES = [
  "DECOE Animation",
  "DECOE Digital Graphics",
  "DECOE Email Marketing",
  "DECOE Uncategorized",
  "Photography"
];

export const SPACE_DISPLAY_NAMES: Record<string, string> = {
  "DECOE Animation": "3D/Animation",
  "DECOE Digital Graphics": "Digital Graphics",
  "DECOE Email Marketing": "Email Marketing",
  "DECOE Uncategorized": "Uncategorized",
  "Photography": "Photography"
};

// Use environment variable if available, otherwise fallback to the hardcoded token (dev only)
// In Vercel, you will set VITE_WRIKE_API_TOKEN in the Environment Variables settings.
// We use a helper to safely access import.meta.env which might not exist in all environments
const getApiToken = () => {
  try {
    // @ts-ignore
    return (import.meta as any).env?.VITE_WRIKE_API_TOKEN;
  } catch {
    return undefined;
  }
};

export const WRIKE_API_TOKEN = getApiToken() || "eyJ0dCI6InAiLCJhbGciOiJIUzI1NiIsInR2IjoiMiJ9.eyJkIjoie1wiYVwiOjY0NjkyNzgsXCJpXCI6OTU4NjE1NSxcImNcIjo0NzAyMjk0LFwidVwiOjE5OTk4MDE3LFwiclwiOlwiVVNcIixcInNcIjpbXCJXXCIsXCJGXCIsXCJJXCIsXCJVXCIsXCJLXCIsXCJDXCIsXCJEXCIsXCJNXCIsXCJBXCIsXCJMXCIsXCJQXCJdLFwielwiOltdLFwidFwiOjB9IiwiaWF0IjoxNzY1NDczMzM0fQ.ifirxQl17JnoTWv7L_6FjqfRilLa_JQ_TfZPBv0M0aY";
export const API_BASE_URL = "https://www.wrike.com/api/v4";

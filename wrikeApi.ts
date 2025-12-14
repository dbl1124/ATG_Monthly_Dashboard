import { Project } from './types';
import { extractBrand } from './dataProcessing';
import { TARGET_SPACES, WRIKE_API_TOKEN, API_BASE_URL } from './constants';

const HEADERS = {
  'Authorization': `Bearer ${WRIKE_API_TOKEN}`,
  'Content-Type': 'application/json'
};

// Cache for custom status names to minimize API calls
const statusCache = new Map<string, string>();

interface CustomFieldDef {
  title: string;
  type: string;
  options?: { id: string; value: string }[];
}

// Map<FieldID, Definition>
let customFieldDefs: Map<string, CustomFieldDef> | null = null;

interface WrikeFolder {
  id: string;
  title: string;
  [key: string]: any;
}

interface WrikeCustomField {
  id: string;
  value: string;
}

interface WrikeProjectResponse {
  id: string;
  title: string;
  status?: string;
  customStatusId?: string;
  createdDate: string;
  updatedDate: string;
  project?: {
    endDate?: string;
    status?: string;
    customStatusId?: string;
  };
  scope?: string;
  customFields?: WrikeCustomField[];
}

const fetchJson = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  const directUrl = url.toString();
  // CORS Proxy URL to bypass browser restrictions
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;

  try {
    // Try direct connection first
    let response = await fetch(directUrl, { headers: HEADERS });
    
    // If CORS or network error (type 'opaque' or similar often hides details, but we try proxy on catch or failure)
    if (!response.ok) {
       console.warn(`Direct fetch failed: ${response.statusText}. Retrying with proxy...`);
       throw new Error("Direct fetch failed");
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    // Fallback to CORS Proxy
    try {
      const response = await fetch(proxyUrl, { headers: HEADERS });
      if (!response.ok) throw new Error(`Proxy API Error: ${response.statusText}`);
      const json = await response.json();
      return json.data || [];
    } catch (proxyError) {
      console.error(`Failed to fetch ${endpoint} via proxy:`, proxyError);
      return [];
    }
  }
};

const getCustomStatusName = async (statusId: string): Promise<string> => {
  if (statusCache.has(statusId)) return statusCache.get(statusId)!;

  try {
    const data = await fetchJson(`/customstatuses/${statusId}`);
    if (data && data.length > 0) {
      const name = data[0].name;
      statusCache.set(statusId, name);
      return name;
    }
  } catch (e) {
    console.warn(`Could not resolve status ID ${statusId}`);
  }
  
  statusCache.set(statusId, statusId); // Fallback to ID if fetch fails
  return statusId;
};

const loadCustomFields = async () => {
  if (customFieldDefs) return;
  customFieldDefs = new Map();

  try {
    // Fetch all custom fields once to build the map
    const fields = await fetchJson('/customfields');
    fields.forEach((f: any) => {
      customFieldDefs?.set(f.id, {
        title: f.title,
        type: f.type,
        // Wrike API v4 typically returns dropdown options in settings.options
        options: f.settings?.options 
      });
    });
  } catch (e) {
    console.error("Failed to load custom fields definition", e);
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format MM-DD-YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  } catch {
    return '';
  }
};

const parseProject = async (wrikeProj: WrikeProjectResponse, spaceName: string, isArchived: boolean): Promise<Project> => {
  // Determine Status
  let status = 'Active';
  let statusId = wrikeProj.project?.customStatusId || wrikeProj.customStatusId;
  
  if (statusId) {
    status = await getCustomStatusName(statusId);
  } else if (wrikeProj.project?.status) {
    status = wrikeProj.project.status;
  } else if (wrikeProj.status) {
    status = wrikeProj.status;
  } else if (wrikeProj.scope) {
    status = wrikeProj.scope;
  }

  // Determine Completion
  const isCompleted = isArchived || ['Completed', 'Complete'].includes(status);

  // Dates
  const createdDate = formatDate(wrikeProj.createdDate);
  const dueDate = wrikeProj.project?.endDate ? formatDate(wrikeProj.project.endDate) : '';
  const approvedDate = isArchived ? formatDate(wrikeProj.updatedDate) : '';

  // Parse Custom Fields (Brand and Distributor)
  let customBrand = '';
  let distributor = '';

  // Ensure definitions are loaded
  if (!customFieldDefs) {
     await loadCustomFields();
  }

  if (wrikeProj.customFields) {
    for (const cf of wrikeProj.customFields) {
      const def = customFieldDefs?.get(cf.id);
      if (!def) continue;

      let val = cf.value;

      // If it's a dropdown, value is likely an ID. Find the matching text option.
      if (def.type === 'DropDown' && def.options) {
        const option = def.options.find(opt => opt.id === val);
        if (option) {
          val = option.value;
        }
      }

      if (def.title === 'Brand') customBrand = val;
      if (def.title === 'Distributor') distributor = val;
    }
  }

  return {
    id: wrikeProj.id,
    name: wrikeProj.title || 'Untitled',
    space: spaceName,
    status: status,
    createdDate: createdDate,
    dueDate: dueDate,
    approvedDate: approvedDate,
    completed: isCompleted,
    brand: extractBrand(wrikeProj.title || ''),
    customBrand,
    distributor
  };
};

const fetchProjectsFromFolder = async (folderId: string, startDate: Date, endDate: Date): Promise<WrikeProjectResponse[]> => {
  // IMPORTANT: Added descendants: 'true' to recursively find projects in subfolders
  const projects: WrikeProjectResponse[] = await fetchJson(`/folders/${folderId}/folders`, {
    project: 'true',
    descendants: 'true',
    fields: '["customFields","metadata"]'
  });
  
  console.log(`Fetched ${projects.length} raw projects (recursive) from folder ${folderId}`);

  const filtered = projects.filter(p => {
    if (!p.createdDate) return false;
    const created = new Date(p.createdDate);
    return created >= startDate && created <= endDate;
  });

  console.log(`Filtered down to ${filtered.length} projects within date range.`);
  return filtered;
};

const fetchArchiveProjects = async (spaceId: string, spaceName: string, startDate: Date, endDate: Date): Promise<WrikeProjectResponse[]> => {
  const currentYear = new Date().getFullYear().toString();
  
  // 1. Get subfolders of the space
  const subfolders: WrikeFolder[] = await fetchJson(`/folders/${spaceId}/folders`);
  
  let archiveRootId: string | null = null;

  // 2. Find specific archive root based on space name
  if (spaceName === "Photography") {
    const found = subfolders.find(f => f.title === 'Completed Projects');
    if (found) archiveRootId = found.id;
  } else {
    const found = subfolders.find(f => f.title === '00 - Archive');
    if (found) archiveRootId = found.id;
  }

  if (!archiveRootId) return [];

  // 3. Find the Year specific folder inside archive root
  const yearFolders: WrikeFolder[] = await fetchJson(`/folders/${archiveRootId}/folders`);
  let targetYearFolderId: string | null = null;

  if (spaceName === "Photography") {
     const found = yearFolders.find(f => f.title.includes(currentYear));
     if (found) targetYearFolderId = found.id;
  } else {
     const targetTitle = `${currentYear} Archive`;
     const found = yearFolders.find(f => f.title === targetTitle);
     if (found) targetYearFolderId = found.id;
  }

  if (!targetYearFolderId) return [];

  // 4. Fetch projects from that year folder
  return fetchProjectsFromFolder(targetYearFolderId, startDate, endDate);
};

export const fetchWrikeData = async (startDate: Date, endDate: Date): Promise<Project[]> => {
  console.log(`Fetching Wrike data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Initialize Custom Fields
  await loadCustomFields();

  // 1. Get all folders
  const allFolders: WrikeFolder[] = await fetchJson(`/folders`);
  
  // 2. Filter for target spaces
  const targetFolders = allFolders.filter(f => TARGET_SPACES.includes(f.title));
  
  const allProjects: Project[] = [];

  // 3. Process each space
  for (const folder of targetFolders) {
    console.log(`Processing Space: ${folder.title}`);
    
    // Fetch Active Projects
    const activeRaw = await fetchProjectsFromFolder(folder.id, startDate, endDate);
    for (const raw of activeRaw) {
      allProjects.push(await parseProject(raw, folder.title, false));
    }

    // Fetch Archived Projects
    const archivedRaw = await fetchArchiveProjects(folder.id, folder.title, startDate, endDate);
    for (const raw of archivedRaw) {
      allProjects.push(await parseProject(raw, folder.title, true));
    }
  }

  return allProjects;
};
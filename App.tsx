import React, { useState, useEffect } from 'react';
import { KPICards } from './KPICards';
import { ChartsSection } from './ChartsSection';
import { ProjectTable } from './ProjectTable';
import { CategoryTimeline } from './CategoryTimeline';
import { Project, DashboardStats, ChartDataPoint, TimelineDataPoint } from './types';
import { 
  calculateStats, 
  getProjectsByCategory, 
  getStatusDistribution, 
  getTimelineData, 
  getBrandDistribution,
  getCategoryTimelineData
} from './dataProcessing';
import { fetchWrikeData } from './wrikeApi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  // Displayed projects (filtered by date picker)
  const [projects, setProjects] = useState<Project[]>([]);
  // Master dataset (contains full year data)
  const [fullYearProjects, setFullYearProjects] = useState<Project[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // PDF State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Date Range State (Default: Last 30 Days)
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDateStr, setEndDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Stats State
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    completionRate: 0
  });

  // Chart Data State
  const [categoryData, setCategoryData] = useState<ChartDataPoint[]>([]);
  const [statusData, setStatusData] = useState<ChartDataPoint[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [brandData, setBrandData] = useState<ChartDataPoint[]>([]);
  const [categoryTimelineData, setCategoryTimelineData] = useState<any[]>([]);

  // 1. Fetch Full Year Data ONCE on Mount
  useEffect(() => {
    const loadFullYearData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Calculate Jan 1 to Dec 31 of current year
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        const data = await fetchWrikeData(startOfYear, endOfYear);
        setFullYearProjects(data);
      } catch (err) {
        console.error("Failed to load Wrike data", err);
        setError("Failed to fetch data from Wrike API. Please check console for details.");
      } finally {
        setLoading(false);
      }
    };

    loadFullYearData();
  }, []);

  // 2. Filter Data & Update Views
  useEffect(() => {
    // Define filter range from picker
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    // Create the filtered subset for the main dashboard view
    const filtered = fullYearProjects.filter(p => {
        if (!p.createdDate) return false;
        
        // Parse MM-DD-YYYY
        const parts = p.createdDate.split('-');
        if (parts.length !== 3) return false;
        
        const pDate = new Date(
            parseInt(parts[2], 10),     // Year
            parseInt(parts[0], 10) - 1, // Month (0-based)
            parseInt(parts[1], 10)      // Day
        );
        
        return pDate >= start && pDate <= end;
    });

    setProjects(filtered);
    
    // Update Dashboard Metrics based on FILTERED data
    setStats(calculateStats(filtered));
    setCategoryData(getProjectsByCategory(filtered));
    setStatusData(getStatusDistribution(filtered));
    setTimelineData(getTimelineData(filtered));
    setBrandData(getBrandDistribution(filtered));
    
    // Update Category Timeline based on FULL YEAR data
    // This ensures the chart always shows the full yearly context
    setCategoryTimelineData(getCategoryTimelineData(fullYearProjects));

  }, [startDateStr, endDateStr, fullYearProjects]);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    // Scroll to top to ensure header is captured correctly
    window.scrollTo(0, 0);
    
    const element = document.getElementById('dashboard-container');
    if (!element) {
        setIsGeneratingPDF(false);
        return;
    }

    try {
        // High scale for better resolution
        // Set x/y to 0 to ensure we capture from top-left even if scrolled
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 1400, // force desktop width capture
            x: 0,
            y: 0
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Create PDF with custom page size matching the dashboard content aspect ratio
        // Using points (pt). 1px approx 0.75pt.
        const pdfWidth = canvas.width * 0.75;
        const pdfHeight = canvas.height * 0.75;

        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [pdfWidth, pdfHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`wrike_dashboard_${startDateStr}_to_${endDateStr}.pdf`);
    } catch (err) {
        console.error("Error generating PDF:", err);
        alert("Failed to generate PDF. See console for details.");
    } finally {
        setIsGeneratingPDF(false);
    }
  };

  // Helper for subtitle display
  const getSubtitle = () => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${format(start)} - ${format(end)} • ${diffDays} Days • ${stats.totalProjects} Total Projects`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="text-blue-600 font-bold text-xl mb-2">Connecting to Wrike...</div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-red-500 font-bold text-lg max-w-md text-center">
          {error}
          <br/>
          <span className="text-sm font-normal text-gray-600 mt-2 block">
            Note: Cross-Origin Resource Sharing (CORS) might block browser requests to Wrike API. 
          </span>
        </div>
      </div>
    );
  }

  // Group Projects by Brand (Alphabetical)
  const uniqueBrands = Array.from(new Set(projects.map(p => p.brand))).sort();

  return (
    <div id="dashboard-container" className="min-h-screen bg-white p-8 max-w-[1400px] mx-auto relative">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Project Dashboard</h1>
          <p className="text-gray-500 text-sm font-medium">
            {getSubtitle()}
          </p>
        </div>
        
        {/* Controls - Ignored during PDF generation */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4" data-html2canvas-ignore="true">
            
            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Start Date</label>
                <input 
                type="date" 
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none p-1"
                />
            </div>
            <span className="text-gray-400 font-light text-xl">/</span>
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">End Date</label>
                <input 
                type="date" 
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none p-1"
                />
            </div>
            </div>

            {/* Download Button */}
            <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 px-4 rounded shadow flex items-center gap-2 transition-colors disabled:opacity-50 h-[60px]"
            >
                {isGeneratingPDF ? (
                    <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Generating...
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PDF
                    </>
                )}
            </button>
        </div>
      </header>
      
      {/* KPI Cards */}
      <KPICards stats={stats} />

      {/* Chart Row */}
      <ChartsSection 
        categoryData={categoryData}
        statusData={statusData}
        timelineData={timelineData}
        brandData={brandData}
      />

      {/* Category Timeline Chart (Yearly Context) */}
      <CategoryTimeline data={categoryTimelineData} />

      {/* Projects by Brand Tables */}
      <section>
        <h2 className="text-xl font-bold text-black mb-6">Projects by Brand</h2>
        
        {uniqueBrands.map(brand => {
          const brandProjects = projects.filter(p => p.brand === brand);
          if (brandProjects.length === 0) return null;

          return (
            <ProjectTable 
              key={brand} 
              groupTitle={brand} 
              projects={brandProjects} 
            />
          );
        })}
        
        {projects.length === 0 && (
          <div className="text-center py-10 text-gray-500 italic">
            No projects found in the selected date range.
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
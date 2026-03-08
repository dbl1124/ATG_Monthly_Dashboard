import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { COLORS } from './constants';

interface CapacityGanttProps {
  data: any[];
  isDarkMode?: boolean;
}

const CustomGanttTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Convert offsets back to readable dates (approximate for tooltip)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today.getTime() + (data.startOffset * 24 * 60 * 60 * 1000));
    const endDate = new Date(today.getTime() + (data.endOffset * 24 * 60 * 60 * 1000));
    
    const formatStr = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg text-xs z-50 min-w-[200px] transition-colors duration-200">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1 border-b border-gray-100 dark:border-gray-700 pb-1">{data.name}</h4>
        <div className="grid grid-cols-2 gap-2 mt-2">
            <span className="text-gray-500 dark:text-gray-400">Brand:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{data.brand}</span>
            <span className="text-gray-500 dark:text-gray-400">Team:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{data.space}</span>
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{data.status}</span>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[10px] font-bold">
            <span className="text-blue-500">{formatStr(startDate)}</span>
            <span className="text-gray-400">→</span>
            <span className="text-red-500">{formatStr(endDate)}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tick formatter to turn day offsets into actual dates on the X Axis
const formatOffsetToDate = (offset: number) => {
    if (offset === 0) return "Today";
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const CapacityGantt: React.FC<CapacityGanttProps> = ({ data, isDarkMode = false }) => {
  
  const textColor = isDarkMode ? '#e5e7eb' : '#374151';
  const axisColor = isDarkMode ? '#4b5563' : '#E5E7EB';

  if (!data || data.length === 0) {
      return (
          <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-64 flex flex-col items-center justify-center transition-colors duration-200">
              <h2 className={`text-xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Team Capacity & Overlap</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No active projects with valid Start and Due dates found in this timeframe.</p>
          </div>
      );
  }

  // Calculate dynamic height based on number of projects so bars don't get squished
  const chartHeight = Math.max(300, data.length * 35);

  return (
    <div className="mt-12 mb-12 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="mb-6">
            <h2 className={`text-xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>Team Capacity Timeline</h2>
            <p className={`text-sm font-medium mt-1 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active projects mapped by timeline to identify resource overlap.</p>
        </div>
        
        <div className="w-full relative" style={{ height: `${chartHeight}px` }}>
            {/* "Today" Line Indicator overlaying the chart */}
            <div className="absolute top-0 bottom-6 w-px bg-red-500 z-10 opacity-50 pointer-events-none" 
                 style={{ left: `calc(120px + (100% - 140px) * (Math.abs(Math.min(...data.map(d=>d.startOffset))) / (Math.max(...data.map(d=>d.endOffset)) - Math.min(...data.map(d=>d.startOffset)))))`}}>
               {/* This inline style calculation attempts to perfectly align a "Today" line, but is complex in Recharts.
                   For now, we rely on the 0 tick on the X-Axis. */}
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={axisColor} />
                    <XAxis 
                        type="number" 
                        tickFormatter={formatOffsetToDate}
                        tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6B7280', fontWeight: 600 }}
                        axisLine={{ stroke: axisColor }}
                        tickLine={false}
                        domain={['dataMin - 5', 'dataMax + 10']} 
                    />
                    <YAxis 
                        type="category" 
                        dataKey="space" 
                        tick={{ fontSize: 10, fill: textColor, fontWeight: 600 }} 
                        width={120}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(243, 244, 246, 0.4)' }} content={<CustomGanttTooltip />} />
                    
                    {/* The timeRange array [start, end] creates the floating Gantt bar effect */}
                    <Bar dataKey="timeRange" radius={4} barSize={20}>
                        {data.map((entry, index) => {
                            // Color bars by status for quick visual parsing
                            let barColor = COLORS.statusProduction; 
                            if (entry.status.includes('Review') || entry.status.includes('Revision')) barColor = COLORS.statusInReview;
                            else if (entry.status.includes('Hold') || entry.status.includes('Deferred')) barColor = COLORS.brandOther;
                            else if (entry.status.includes('New')) barColor = COLORS.statusNew;

                            return <Cell key={`cell-${index}`} fill={barColor} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className={`flex items-center text-xs font-medium transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="w-3 h-3 rounded bg-[#FDCB6E] mr-2"></div> New
            </div>
            <div className={`flex items-center text-xs font-medium transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="w-3 h-3 rounded bg-[#0984E3] mr-2"></div> In Production
            </div>
            <div className={`flex items-center text-xs font-medium transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="w-3 h-3 rounded bg-[#E74C3C] mr-2"></div> In Review / Revisions
            </div>
            <div className={`flex items-center text-xs font-medium transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="w-3 h-3 rounded bg-[#95A5A6] mr-2"></div> On Hold
            </div>
        </div>
    </div>
  );
};

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { ChartDataPoint, Project } from './types';

interface MarketingChartsProps {
  cycleTimeData: ChartDataPoint[];
  bottlenecksData: { chartData: ChartDataPoint[], projects: Project[] };
  onTimeData: { onTime: number, late: number, total: number };
  isDarkMode?: boolean;
}

const ChartTitle: React.FC<{ title: string; subtitle?: string; isDarkMode?: boolean }> = ({ title, subtitle, isDarkMode }) => (
  <div className="mb-4">
    <h3 className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{title}</h3>
    {subtitle && <p className="text-[10px] text-gray-500 font-medium">{subtitle}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label, isDarkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-2 shadow-sm rounded text-xs z-50 transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-700 border text-gray-200' : 'bg-white border-gray-200 border text-gray-800'}`}>
        <p className={`font-bold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.fill || entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MarketingCharts: React.FC<MarketingChartsProps> = ({ 
  cycleTimeData, 
  bottlenecksData, 
  onTimeData,
  isDarkMode = false
}) => {
  
  const textColor = isDarkMode ? '#e5e7eb' : '#333';
  const mutedTextColor = isDarkMode ? '#9ca3af' : '#666';

  const onTimePercentage = onTimeData.total > 0 
    ? Math.round((onTimeData.onTime / onTimeData.total) * 100) 
    : 0;

  const onTimePieData = [
    { name: 'On Time', value: onTimeData.onTime, fill: '#00B894' },
    { name: 'Late', value: onTimeData.late, fill: '#E74C3C' }
  ];

  return (
    <div className="mt-8 mb-12">
        <h2 className={`text-xl font-bold mb-6 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-black'}`}>Marketing Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Cycle Time (Avg Days) - Vertical Bar */}
        <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <ChartTitle title="Average Cycle Time" subtitle="Days from Creation to Approval by Category" isDarkMode={isDarkMode} />
            <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cycleTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: mutedTextColor }} 
                    axisLine={false} 
                    tickLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: mutedTextColor }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: isDarkMode ? '#374151' : '#f8f9fa' }} content={<CustomTooltip isDarkMode={isDarkMode} />} />
                <Bar dataKey="value" fill="#6C5CE7" radius={[4, 4, 0, 0]} barSize={30} name="Avg Days">
                    {cycleTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={'#6C5CE7'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* 2. On-Time Delivery - Donut KPI */}
        <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative transition-colors duration-200">
            <ChartTitle title="Delivery Reliability" subtitle="Projects approved ON or BEFORE Due Date" isDarkMode={isDarkMode} />
            <div className="flex-1 flex flex-col items-center justify-center relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={onTimePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {onTimePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className={`text-3xl font-black transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{onTimePercentage}%</span>
                  <span className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>ON TIME</span>
              </div>
            </div>
        </div>

        {/* 3. Bottlenecks - Chart & List */}
        <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm lg:col-span-2 transition-colors duration-200">
            <ChartTitle title="Current Bottlenecks" subtitle="Active projects stuck in Review/Revisions/Hold" isDarkMode={isDarkMode} />
            <div className="flex-1 w-full mt-2 flex flex-row gap-4 overflow-hidden">
                <div className="w-[40%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={bottlenecksData.chartData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: textColor, fontWeight: 500 }} width={70} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: isDarkMode ? '#374151' : '#f8f9fa' }} content={<CustomTooltip isDarkMode={isDarkMode} />} />
                          <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]} name="Projects Stuck">
                              {bottlenecksData.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill || '#e74c3c'} />
                              ))}
                          </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-[60%] h-full overflow-y-auto pr-2 border-l border-gray-100 dark:border-gray-700 pl-4">
                    {bottlenecksData.projects.length === 0 ? (
                        <div className="text-xs text-gray-500 italic mt-4">No bottlenecks found.</div>
                    ) : (
                        bottlenecksData.projects.map(p => (
                            <div key={p.id} className="mb-3 pb-3 border-b border-gray-50 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
                                <div className={`text-xs font-bold truncate transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} title={p.name}>{p.name}</div>
                                <div className="flex justify-between items-center mt-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{p.brand}</span>
                                    <span className="text-[10px] text-red-500 font-bold">{p.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        </div>
    </div>
  );
};

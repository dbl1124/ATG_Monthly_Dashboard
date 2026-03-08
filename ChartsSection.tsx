import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { ChartDataPoint, TimelineDataPoint } from './types';

interface ChartsSectionProps {
  categoryData: ChartDataPoint[];
  statusData: ChartDataPoint[];
  timelineData: TimelineDataPoint[];
  brandData: ChartDataPoint[];
  isDarkMode?: boolean;
}

const ChartTitle: React.FC<{ title: string, isDarkMode?: boolean }> = ({ title, isDarkMode }) => (
  <h3 className={`text-sm font-bold mb-4 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{title}</h3>
);

// Custom Label for Bar Chart
const renderCustomBarLabel = (props: any) => {
  const { x, y, width, height, value, fill } = props;
  return (
    <text x={x + width + 5} y={y + height / 2 + 4} fill={fill || "#333"} fontSize={10} fontWeight="bold">
      {value}
    </text>
  );
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ 
  categoryData, 
  statusData, 
  timelineData, 
  brandData,
  isDarkMode = false
}) => {
  
  const textColor = isDarkMode ? '#e5e7eb' : '#333';
  const mutedTextColor = isDarkMode ? '#9ca3af' : '#666';

  // Calculate total for brand percentages
  const totalBrand = brandData.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      
      {/* 1. Projects by Category (Horizontal Bar) */}
      <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <ChartTitle title="Projects by Category" isDarkMode={isDarkMode} />
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={categoryData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <Tooltip 
                cursor={{ fill: isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(243, 244, 246, 0.4)' }}
                contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#f3f4f6', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}
                itemStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                labelStyle={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: 'bold' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 9, fill: textColor, fontWeight: 500 }} 
                width={90}
                interval={0}
              />
              <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]} label={(props) => renderCustomBarLabel({...props, fill: textColor})}>
                {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Status Distribution (Donut) */}
      <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <ChartTitle title="Status Distribution" isDarkMode={isDarkMode} />
        <div className="flex-1 flex flex-col items-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Tooltip 
                contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#f3f4f6', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}
                itemStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                labelStyle={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: 'bold' }}
              />
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                stroke={isDarkMode ? "#1f2937" : "white"}
                strokeWidth={2}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center text-[10px]">
                <div className="w-2 h-2 mr-1 rounded-sm" style={{ backgroundColor: item.fill }}></div>
                <span className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Project Timeline (Line) */}
      <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <ChartTitle title="Project Timeline" isDarkMode={isDarkMode} />
        <div className="flex-1 relative">
           {/* Y-axis Label */}
           <div className={`absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            Projects Created
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid vertical={false} stroke={isDarkMode ? "#374151" : "#E0E0E0"} strokeDasharray="3 0" />
              <Tooltip 
                contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#f3f4f6', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}
                itemStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                labelStyle={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: 'bold' }}
              />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: mutedTextColor }} 
                label={{ value: 'Week Number', position: 'insideBottom', offset: -10, fontSize: 10, fill: mutedTextColor }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: mutedTextColor }} 
              />
              <Line 
                type="linear" 
                dataKey="value" 
                stroke="#0984E3" 
                strokeWidth={3} 
                dot={{ r: 4, fill: isDarkMode ? '#1e3a8a' : '#64B5F6', stroke: '#0984E3', strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Request by Brand (Donut) */}
      <div className="flex flex-col h-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <ChartTitle title="Request by Brand" isDarkMode={isDarkMode} />
        <div className="flex-1 flex flex-row items-center">
          <div className="w-1/2 h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#f3f4f6', color: isDarkMode ? '#f3f4f6' : '#1f2937' }}
                  itemStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                  labelStyle={{ color: isDarkMode ? '#f3f4f6' : '#1f2937', fontWeight: 'bold' }}
                />
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={0}
                  dataKey="value"
                  stroke={isDarkMode ? "#1f2937" : "white"}
                  strokeWidth={2}
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend on Right */}
          <div className="w-1/2 pl-2 flex flex-col justify-center gap-1.5">
             {brandData.map((item, idx) => {
               const percent = totalBrand > 0 ? (item.value / totalBrand) * 100 : 0;
               return (
                <div key={idx} className="flex items-center text-[10px]">
                  <div className="w-2 h-2 mr-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.fill }}></div>
                  <span className={`leading-tight transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {item.name} <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>- {Math.round(percent)}%</span>
                  </span>
                </div>
               );
             })}
          </div>
        </div>
      </div>

    </div>
  );
};
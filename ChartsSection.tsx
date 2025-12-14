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
}

const ChartTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-sm font-bold text-gray-800 mb-4">{title}</h3>
);

// Custom Label for Bar Chart
const renderCustomBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  return (
    <text x={x + width + 5} y={y + height / 2 + 4} fill="#333" fontSize={10} fontWeight="bold">
      {value}
    </text>
  );
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ 
  categoryData, 
  statusData, 
  timelineData, 
  brandData 
}) => {
  
  // Calculate total for brand percentages
  const totalBrand = brandData.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      
      {/* 1. Projects by Category (Horizontal Bar) */}
      <div className="flex flex-col h-64">
        <ChartTitle title="Projects by Category" />
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={categoryData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 9, fill: '#333', fontWeight: 500 }} 
                width={90}
                interval={0}
              />
              <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]} label={renderCustomBarLabel}>
                {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Status Distribution (Donut) */}
      <div className="flex flex-col h-64">
        <ChartTitle title="Status Distribution" />
        <div className="flex-1 flex flex-col items-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                stroke="white"
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
                <span className="text-gray-700">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Project Timeline (Line) */}
      <div className="flex flex-col h-64">
        <ChartTitle title="Project Timeline" />
        <div className="flex-1 relative">
           {/* Y-axis Label */}
           <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-gray-500 font-bold">
            Projects Created
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="3 0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#666' }} 
                label={{ value: 'Week Number', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#666' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#666' }} 
              />
              <Line 
                type="linear" 
                dataKey="value" 
                stroke="#0984E3" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#64B5F6', stroke: '#0984E3', strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Request by Brand (Donut) */}
      <div className="flex flex-col h-64">
        <ChartTitle title="Request by Brand" />
        <div className="flex-1 flex flex-row items-center">
          <div className="w-1/2 h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="white"
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
                  <span className="text-gray-700 leading-tight">
                    {item.name} <span className="text-gray-500 ml-0.5">- {Math.round(percent)}%</span>
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
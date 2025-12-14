import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from './constants';

interface CategoryTimelineProps {
  data: any[];
}

const BRAND_COLORS: Record<string, string> = {
  'GEARWRENCH': COLORS.brandGearwrench,
  'Crescent': COLORS.brandCrescent,
  'Weller': COLORS.brandWeller,
  'Cleco': COLORS.brandCleco,
  'SATA': COLORS.brandSata,
  'Other': COLORS.brandOther
};

// Defined outside to maintain component stability and prevent tooltip positioning bugs
const CustomTooltip = ({ active, payload, label, hoveredSeries }: any) => {
  if (active && payload && payload.length) {
    // If a series is hovered, find its specific data in the payload
    // Recharts payload name matches the Line name prop
    const targetPoint = hoveredSeries 
      ? payload.find((p: any) => p.name === hoveredSeries)
      : null;

    if (!targetPoint) return null;

    const spaceName = targetPoint.name;
    const spaceKey = targetPoint.dataKey;
    const totalCount = targetPoint.value;
    const color = targetPoint.stroke;
    
    // Access the brands map stored in the data point
    const brandMap = targetPoint.payload[`${spaceKey}_brands`] || {};
    
    const sortedBrands = Object.entries(brandMap)
      .sort(([, a], [, b]) => (b as number) - (a as number));

    return (
      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xl min-w-[160px]">
        {/* Header: Month and Category */}
        <div className="border-b border-gray-100 pb-2 mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
          <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
            {spaceName}
          </p>
        </div>

        {/* Total Count */}
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-600">Total Projects</span>
            <span className="text-sm font-bold text-gray-900">{totalCount}</span>
        </div>

        {/* Brand Breakdown */}
        {sortedBrands.length > 0 ? (
          <div className="space-y-1">
            {sortedBrands.map(([brand, count]) => {
                // Abbreviation Logic
                let displayName = brand;
                if (brand === 'GEARWRENCH') displayName = 'GW';
                if (brand === 'Crescent') displayName = 'CT';
                
                return (
                  <div key={brand} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                        <span 
                            className="w-1.5 h-1.5 rounded-[1px]" 
                            style={{ backgroundColor: BRAND_COLORS[brand] || '#999' }}
                        ></span>
                        <span className="text-gray-500">{displayName}</span>
                    </div>
                    <span className="font-medium text-gray-700">{(count as number)}</span>
                  </div>
                );
            })}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No brand data</div>
        )}
      </div>
    );
  }

  return null;
};

export const CategoryTimeline: React.FC<CategoryTimelineProps> = ({ data }) => {
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  // Helper to create props for Lines to reduce repetition
  const lineProps = (dataKey: string, name: string, color: string) => ({
    type: "monotone" as const,
    dataKey,
    name,
    stroke: color,
    strokeWidth: 3,
    dot: { r: 4 },
    activeDot: { r: 6 },
    onMouseEnter: () => setHoveredSeries(name),
    onMouseLeave: () => setHoveredSeries(null),
  });

  return (
    <div className="mb-12">
      <h3 className="text-xl font-bold text-black mb-6">Category Timeline (Yearly)</h3>
      <div className="h-80 w-full bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#666', fontSize: 12, fontWeight: 500 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#666', fontSize: 12 }} 
            />
            <Tooltip 
              content={<CustomTooltip hoveredSeries={hoveredSeries} />} 
              cursor={{ stroke: '#E0E0E0', strokeWidth: 1 }} 
              shared={false}
              isAnimationActive={false}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 500 }}
            />
            
            <Line {...lineProps("Photography", "Photography", COLORS.spacePhotography)} />
            <Line {...lineProps("DECOE Uncategorized", "Uncategorized", COLORS.spaceUncategorized)} />
            <Line {...lineProps("DECOE Email Marketing", "Email Marketing", COLORS.spaceEmail)} />
            <Line {...lineProps("DECOE Digital Graphics", "Digital Graphics", COLORS.spaceGraphics)} />
            <Line {...lineProps("DECOE Animation", "3D/Animation", COLORS.spaceAnimation)} />

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
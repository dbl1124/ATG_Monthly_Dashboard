import React, { useState, useEffect } from 'react';
import { DashboardStats } from './types';
import { COLORS } from './constants';

interface KPICardsProps {
  stats: DashboardStats;
}

const CountUp: React.FC<{ end: number, suffix?: string, duration?: number }> = ({ end, suffix = '', duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure exact final value
      }
    };
    
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

const Card: React.FC<{ label: string; value: number; suffix?: string; color: string }> = ({ label, value, suffix, color }) => (
  <div 
    className="flex flex-col items-center justify-center p-6 text-white h-32 w-full"
    style={{ backgroundColor: color }}
  >
    <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-90">{label}</div>
    <div className="text-5xl font-bold">
      <CountUp end={value} suffix={suffix} />
    </div>
  </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 w-full mb-8">
      <Card 
        label="TOTAL PROJECTS" 
        value={stats.totalProjects} 
        color={COLORS.kpiBlue} 
      />
      <Card 
        label="ACTIVE" 
        value={stats.activeProjects} 
        color={COLORS.kpiPurple} 
      />
      <Card 
        label="COMPLETED" 
        value={stats.completedProjects} 
        color={COLORS.kpiGreen} 
      />
      <Card 
        label="COMPLETION RATE" 
        value={Math.round(stats.completionRate)}
        suffix="%" 
        color={COLORS.kpiOrange} 
      />
    </div>
  );
};
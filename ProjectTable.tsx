import React from 'react';
import { Project } from './types';
import { COLORS, SPACE_DISPLAY_NAMES } from './constants';

interface ProjectTableProps {
  groupTitle: string;
  projects: Project[];
}

const CheckIcon = () => (
  <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const ProjectTable: React.FC<ProjectTableProps> = ({ groupTitle, projects }) => {
  // If groupTitle matches a space key, use display name, otherwise use as is (for Brands)
  const displayTitle = SPACE_DISPLAY_NAMES[groupTitle] || groupTitle;
  const isOther = groupTitle === 'Other';

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New': return COLORS.statusNew;
      case 'Production': return COLORS.statusProduction;
      case 'Completed': return COLORS.statusCompleted;
      case 'In Review': return COLORS.statusInReview;
      case 'V1 - Revisions': return COLORS.statusRevisions;
      default: return '#999';
    }
  };

  return (
    <div className="mb-8 transition-colors duration-200">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 transition-colors duration-200">
        {displayTitle} <span className="font-normal text-base text-gray-500 dark:text-gray-400">({projects.length} projects)</span>
      </h3>
      
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <table className="min-w-full">
          <thead>
            {/* Updated blue color to match #1976D2 as per exact layout specs */}
            <tr className="bg-[#1976D2] dark:bg-[#1565C0] text-white text-xs font-bold uppercase transition-colors duration-200">
              <th className="py-2 px-4 text-left w-1/4">Project</th>
              <th className="py-2 px-4 text-center w-24">Category</th>
              {isOther && <th className="py-2 px-4 text-left w-24">Brand</th>}
              {isOther && <th className="py-2 px-4 text-left w-24">Distributor</th>}
              <th className="py-2 px-4 text-left w-32">Status</th>
              <th className="py-2 px-4 text-left w-32">Created Date</th>
              <th className="py-2 px-4 text-left w-32">Due Date</th>
              <th className="py-2 px-4 text-left w-32">Approved Date</th>
              <th className="py-2 px-4 text-center w-16">Done</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 transition-colors duration-200">
            {projects.map((project, idx) => (
              <tr key={project.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm">
                <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium truncate max-w-xs transition-colors duration-200" title={project.name}>
                  {project.name}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium text-center transition-colors duration-200">
                  {SPACE_DISPLAY_NAMES[project.space] || project.space}
                </td>
                {isOther && (
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">
                    {project.customBrand || '-'}
                  </td>
                )}
                {isOther && (
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">
                    {project.distributor || '-'}
                  </td>
                )}
                <td className="py-3 px-4">
                  <span 
                    className="px-2 py-1 text-white text-xs font-bold rounded shadow-sm whitespace-nowrap"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap transition-colors duration-200">{project.createdDate}</td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap transition-colors duration-200">{project.dueDate}</td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap transition-colors duration-200">{project.approvedDate}</td>
                <td className="py-3 px-4 text-center">
                  {project.completed && <CheckIcon />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
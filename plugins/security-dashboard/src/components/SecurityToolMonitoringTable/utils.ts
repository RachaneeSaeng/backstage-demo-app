import { SecurityStatus, Repository, allowedStatuses } from './types';
import mockFinalRepositoryData from '../../mockData/mockFinalRepositoryData.json';

export const getToolStatus = (repository: Repository, toolCategory: string, toolName: string): SecurityStatus => {
  const step = repository.steps.find(s => s.toolCategory === toolCategory);
  const tool = step?.tools.find(t => t.name === toolName);

  if (!tool || tool.status === 'none') {
    return { status: 'none', text: 'n/a' };
  }

  return {
    status: tool.status,
    text: 'Latest scan report',
    link: '#'
  };
};

export const repositories: Repository[] = mockFinalRepositoryData.repositories.map((repo: any) => ({
  name: repo.name,
  steps: repo.steps.map((step: any) => ({
    toolCategory: step.toolCategory,
    tools: step.tools.map((tool: any) => ({
      name: tool.name,
      status: allowedStatuses.includes(tool.status)
        ? tool.status
        : "none",
    })),
  })),
}));

const adjustColorForDarkTheme = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    '#3498db': '#5dade2', // Blue
    '#e74c3c': '#ec7063', // Red
    '#f39c12': '#f7dc6f', // Orange
    '#2ecc71': '#58d68d', // Green
    '#9b59b6': '#af7ac5', // Purple
    '#1abc9c': '#52c3a1', // Teal
    '#34495e': '#566573', // Dark gray
  };

  return colorMap[color.toLowerCase()] || color;
};

export const createCategoryHeaderStyle = (backgroundColor: string, isDark: boolean = false) => ({
  backgroundColor: isDark && backgroundColor ? adjustColorForDarkTheme(backgroundColor) : backgroundColor,
  color: '#ffffff',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  padding: '8px',
});
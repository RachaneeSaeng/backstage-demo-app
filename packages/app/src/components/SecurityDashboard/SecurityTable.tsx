import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Link,
  makeStyles,
  Typography,
} from '@material-ui/core';
import toolCategoriesConfig from './config/toolCategories.json';
import mockFinalRepositoryData from './mockData/mockFinalRepositoryData.json';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(2),
    maxHeight: '70vh',
    overflow: 'auto',
  },
  table: {
    minWidth: 'auto',
    tableLayout: 'auto',
  },
  headerCell: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: theme.spacing(1),
  },
  repositoryCell: {
    backgroundColor: theme.palette.infoBackground,
    fontWeight: 'bold',
    minWidth: '200px',
    whiteSpace: 'nowrap',
    padding: theme.spacing(1),
  },
  tableCell: {
    whiteSpace: 'nowrap',
    padding: theme.spacing(1),
  },
  chip: {
    minWidth: 120,
    fontSize: '0.75rem',
  },
  criticalChip: {
    backgroundColor: '#E22134',
    color: 'white',
  },
  highChip: {
    backgroundColor: '#FF9800',
    color: 'white',
  },
  mediumChip: {
    backgroundColor: '#FFED51',
    color: '#000000',
  },
  lowChip: {
    backgroundColor: '#1DB954',
    color: 'white',
  },
  noneChip: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
  },
}));

interface SecurityStatus {
  status: 'critical-risk' | 'high-risk' | 'medium-risk' | 'low-risk' | 'none';
  text: string;
  link?: string;
}

interface Repository {
  name: string;
  steps: Array<{
    toolCategory: string;
    tools: Array<{
      name: string;
      status: 'critical-risk' | 'high-risk' | 'medium-risk' | 'low-risk' | 'none';
    }>;
  }>;
}

const getToolStatus = (repository: Repository, toolCategory: string, toolName: string): SecurityStatus => {
  const step = repository.steps.find(step => step.toolCategory === toolCategory);
  const tool = step?.tools.find(tool => tool.name === toolName);

  if (!tool || tool.status === 'none') {
    return { status: 'none', text: 'n/a' };
  }

  return {
    status: tool.status,
    text: 'Latest scan report',
    link: '#'
  };
};

const allowedStatuses = [
  "critical-risk",
  "high-risk",
  "medium-risk",
  "low-risk",
  "none",
] as const;

const repositories: Repository[] = mockFinalRepositoryData.repositories.map((repo: any) => ({
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

const StatusChip: React.FC<{ status: SecurityStatus }> = ({ status }) => {
  const classes = useStyles();

  const getChipClass = () => {
    switch (status.status) {
      case 'critical-risk':
        return classes.criticalChip;
      case 'high-risk':
        return classes.highChip;
      case 'medium-risk':
        return classes.mediumChip;     
      case 'low-risk':
        return classes.lowChip;
      default:
        return classes.noneChip;
    }
  };

  const chipContent = (
      <Link href={status.link} color="inherit" underline="none">
        Pending Tickets
      </Link>
      );

  return (
    <>
      <Chip
        label={chipContent}
        className={`${classes.chip} ${getChipClass()}`}
        size="small"
      /> <br />
      <Link href={status.link} color="inherit" style={{ fontSize: '0.7rem' }}>
          Pending Tickets
      </Link>
    </>
    
  );
};

export const SecurityTable: React.FC = () => {
  const classes = useStyles();
  const { toolCategories } = toolCategoriesConfig;

  const createCategoryHeaderStyle = (backgroundColor: string) => ({
    backgroundColor,
    color: '#ffffff',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: '8px',
  });

  return (
    <TableContainer component={Paper} className={classes.root}>
      <Table className={classes.table} aria-label="security dashboard table">
        <TableHead>
          <TableRow>
            <TableCell className={classes.headerCell} rowSpan={2}>
              Repository
            </TableCell>
            {toolCategories.map((category) => (
              <TableCell
                key={category.name}
                align="center"
                colSpan={category.tools.length}
                style={createCategoryHeaderStyle(category.backgroundColor)}
              >
                {category.name}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            {toolCategories.map((category) =>
              category.tools.map((tool) => (
                <TableCell
                  key={`${category.name}-${tool}`}
                  className={classes.headerCell}
                  align="center"
                >
                  {tool}
                </TableCell>
              ))
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {repositories.map((repo) => (
            <TableRow key={repo.name}>
              <TableCell className={classes.repositoryCell}>
                <div>
                  <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                    {repo.name}
                  </Typography>
                </div>
              </TableCell>
              {toolCategories.map((category) =>
                category.tools.map((tool) => (
                  <TableCell
                    key={`${repo.name}-${category.name}-${tool}`}
                    align="center"
                    className={classes.tableCell}
                  >
                    <StatusChip status={getToolStatus(repo, category.name, tool)} />
                  </TableCell>
                ))
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
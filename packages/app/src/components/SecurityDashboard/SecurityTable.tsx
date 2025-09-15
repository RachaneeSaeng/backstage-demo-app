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
    backgroundColor: theme.palette.grey[800],
    color: theme.palette.common.white,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: theme.spacing(1),
  },
  repositoryCell: {
    backgroundColor: theme.palette.grey[700],
    color: theme.palette.common.white,
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
    backgroundColor: '#d21414ff',
    color: 'white',
  },
  highChip: {
    backgroundColor: '#f89705ff',
    color: 'white',
  },
  mediumChip: {
    backgroundColor: '#eed00fff',
    color: 'white',
  },
  lowChip: {
    backgroundColor: '#04971dff',
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
  description: string;
  secretScanning: SecurityStatus;
  dependabotGitHub: SecurityStatus;
  dependabotOther: SecurityStatus;
  veracode: SecurityStatus;
  codeql: SecurityStatus;
  npmAudit: SecurityStatus;
  trivy: SecurityStatus;
  dependabotPR: SecurityStatus;
  veracodePR: SecurityStatus;
  codeqlPR: SecurityStatus;
  npmAuditPR: SecurityStatus;
  trivyPR: SecurityStatus;
}

const mockData: Repository[] = [
  {
    name: 'Repository - 1',
    description: '(example Backend repo)',
    secretScanning: { status: 'medium-risk', text: 'Latest scan report', link: '#' },
    dependabotGitHub: { status: 'critical-risk', text: 'Required but have not implemented' },
    dependabotOther: { status: 'medium-risk', text: 'Latest scan report' },
    veracode: { status: 'critical-risk', text: 'Required but have not implemented' },
    codeql: { status: 'medium-risk', text: 'Latest scan report' },
    npmAudit: { status: 'none', text: 'n/a' },
    trivy: { status: 'none', text: 'n/a' },
    dependabotPR: { status: 'low-risk', text: 'Latest scan report' },
    veracodePR: { status: 'medium-risk', text: 'Latest scan report' },
    codeqlPR: { status: 'medium-risk', text: 'Latest scan report' },
    npmAuditPR: { status: 'none', text: 'n/a' },
    trivyPR: { status: 'none', text: 'n/a' },
  },
  {
    name: 'Repository - 2',
    description: '(example Frontend repo)',
    secretScanning: { status: 'high-risk', text: 'Latest scan report' },
    dependabotGitHub: { status: 'medium-risk', text: 'Latest scan report' },
    dependabotOther: { status: 'high-risk', text: 'Latest scan report' },
    veracode: { status: 'high-risk', text: 'Latest scan report' },
    codeql: { status: 'none', text: 'n/a' },
    npmAudit: { status: 'high-risk', text: 'Latest scan report' },
    trivy: { status: 'none', text: 'n/a' },
    dependabotPR: { status: 'medium-risk', text: 'Latest scan report' },
    veracodePR: { status: 'low-risk', text: 'Latest scan report' },
    codeqlPR: { status: 'medium-risk', text: 'Latest scan report' },
    npmAuditPR: { status: 'high-risk', text: 'Latest scan report' },
    trivyPR: { status: 'none', text: 'n/a' },
  },
  {
    name: 'Repository - 3',
    description: '(example Infrastructure repo)',
    secretScanning: { status: 'high-risk', text: 'Latest scan report' },
    dependabotGitHub: { status: 'medium-risk', text: 'Latest scan report' },
    dependabotOther: { status: 'none', text: 'n/a' },
    veracode: { status: 'none', text: 'n/a' },
    codeql: { status: 'none', text: 'n/a' },
    npmAudit: { status: 'none', text: 'n/a' },
    trivy: { status: 'high-risk', text: 'Latest scan report' },
    dependabotPR: { status: 'none', text: 'n/a' },
    veracodePR: { status: 'none', text: 'n/a' },
    codeqlPR: { status: 'none', text: 'n/a' },
    npmAuditPR: { status: 'none', text: 'n/a' },
    trivyPR: { status: 'critical-risk', text: 'Required but have not implemented' },
  },
];

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
          {mockData.map((repo) => (
            <TableRow key={repo.name}>
              <TableCell className={classes.repositoryCell}>
                <div>
                  <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                    {repo.name}
                  </Typography>
                  <Typography variant="caption" style={{ color: '#ccc' }}>
                    {repo.description}
                  </Typography>
                </div>
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.secretScanning} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.dependabotGitHub} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.dependabotOther} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.veracode} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.codeql} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.npmAudit} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.trivy} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.dependabotPR} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.veracodePR} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.codeqlPR} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.npmAuditPR} />
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                <StatusChip status={repo.trivyPR} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
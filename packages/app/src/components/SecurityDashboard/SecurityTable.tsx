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
    backgroundColor: '#d32f2f',
    color: 'white',
  },
  warningChip: {
    backgroundColor: '#ff9800',
    color: 'white',
  },
  successChip: {
    backgroundColor: '#4caf50',
    color: 'white',
  },
  pendingChip: {
    backgroundColor: '#2196f3',
    color: 'white',
  },
  naChip: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
  },
}));

interface SecurityStatus {
  status: 'critical' | 'warning' | 'success' | 'pending' | 'na';
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
    secretScanning: { status: 'pending', text: 'Latest scan report', link: '#' },
    dependabotGitHub: { status: 'critical', text: 'Required but have not implemented' },
    dependabotOther: { status: 'pending', text: 'Latest scan report' },
    veracode: { status: 'critical', text: 'Required but have not implemented' },
    codeql: { status: 'pending', text: 'Latest scan report' },
    npmAudit: { status: 'na', text: 'n/a' },
    trivy: { status: 'na', text: 'n/a' },
    dependabotPR: { status: 'pending', text: 'Latest scan report' },
    veracodePR: { status: 'pending', text: 'Latest scan report' },
    codeqlPR: { status: 'pending', text: 'Latest scan report' },
    npmAuditPR: { status: 'na', text: 'n/a' },
    trivyPR: { status: 'na', text: 'n/a' },
  },
  {
    name: 'Repository - 2',
    description: '(example Frontend repo)',
    secretScanning: { status: 'warning', text: 'Latest scan report' },
    dependabotGitHub: { status: 'pending', text: 'Latest scan report' },
    dependabotOther: { status: 'warning', text: 'Latest scan report' },
    veracode: { status: 'warning', text: 'Latest scan report' },
    codeql: { status: 'na', text: 'n/a' },
    npmAudit: { status: 'warning', text: 'Latest scan report' },
    trivy: { status: 'na', text: 'n/a' },
    dependabotPR: { status: 'pending', text: 'Latest scan report' },
    veracodePR: { status: 'pending', text: 'Latest scan report' },
    codeqlPR: { status: 'pending', text: 'Latest scan report' },
    npmAuditPR: { status: 'warning', text: 'Latest scan report' },
    trivyPR: { status: 'na', text: 'n/a' },
  },
  {
    name: 'Repository - 3',
    description: '(example Infrastructure repo)',
    secretScanning: { status: 'warning', text: 'Latest scan report' },
    dependabotGitHub: { status: 'pending', text: 'Latest scan report' },
    dependabotOther: { status: 'na', text: 'n/a' },
    veracode: { status: 'na', text: 'n/a' },
    codeql: { status: 'na', text: 'n/a' },
    npmAudit: { status: 'na', text: 'n/a' },
    trivy: { status: 'warning', text: 'Latest scan report' },
    dependabotPR: { status: 'na', text: 'n/a' },
    veracodePR: { status: 'na', text: 'n/a' },
    codeqlPR: { status: 'na', text: 'n/a' },
    npmAuditPR: { status: 'na', text: 'n/a' },
    trivyPR: { status: 'critical', text: 'Required but have not implemented' },
  },
];

const StatusChip: React.FC<{ status: SecurityStatus }> = ({ status }) => {
  const classes = useStyles();

  const getChipClass = () => {
    switch (status.status) {
      case 'critical':
        return classes.criticalChip;
      case 'warning':
        return classes.warningChip;
      case 'success':
        return classes.successChip;
      case 'pending':
        return classes.pendingChip;
      case 'na':
        return classes.naChip;
      default:
        return classes.naChip;
    }
  };

  const chipContent = status.link ? (
    <Link href={status.link} color="inherit" underline="none">
      {status.text}
    </Link>
  ) : (
    status.text
  );

  return (
    <Chip
      label={chipContent}
      className={`${classes.chip} ${getChipClass()}`}
      size="small"
    />
  );
};

export const SecurityTable: React.FC = () => {
  const classes = useStyles();

  return (
    <TableContainer component={Paper} className={classes.root}>
      <Table className={classes.table} aria-label="security dashboard table">
        <TableHead>
          <TableRow>
            <TableCell className={classes.headerCell} rowSpan={2}>
              Repository
            </TableCell>
            <TableCell className={classes.headerCell} align="center" colSpan={5}>
              GitHub Security
            </TableCell>
            <TableCell className={classes.headerCell} align="center" colSpan={7}>
              Pull Request
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={classes.headerCell} align="center">
              Secret Scanning
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Dependabot
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Dependabot
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Veracode
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              CodeQL
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              npm audit
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Trivy
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Dependabot
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Veracode
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              CodeQL
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              npm audit
            </TableCell>
            <TableCell className={classes.headerCell} align="center">
              Trivy
            </TableCell>
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
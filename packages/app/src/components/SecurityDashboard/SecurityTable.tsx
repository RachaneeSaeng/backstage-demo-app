import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  makeStyles,
  Typography,
} from '@material-ui/core';
import toolCategoriesConfig from './config/toolCategories.json';
import { getToolStatus, repositories, createCategoryHeaderStyle } from './utils';
import { StatusChip } from './StatusChip';

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
    whiteSpace: 'nowrap',
    padding: theme.spacing(2),
  },
  tableCell: {
    whiteSpace: 'nowrap',
    padding: theme.spacing(2),
  },
}));

export const SecurityTable: React.FC = () => {
  const classes = useStyles();
  const { toolCategories } = toolCategoriesConfig;


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
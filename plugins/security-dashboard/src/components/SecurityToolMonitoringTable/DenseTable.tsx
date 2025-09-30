import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  makeStyles,
  Typography
} from '@material-ui/core';
import toolCategoriesConfig from '../../config/toolCategories.json';
import { getToolStatus, repositories } from './utils';
import { StatusChip } from './StatusChip';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2),
    maxHeight: '100%',
    flexGrow: 0,
    maxWidth: '100%',
    flexBasis: '100%',
  },
  table: {
    overflow: 'auto',
    tableLayout: 'auto',
  },
  categoryCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: '8px',
  },
  headerCell: {
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: theme.spacing(1),
  },
  repositoryCell: {
    whiteSpace: 'nowrap',
    padding: theme.spacing(2),
  },
  tableCell: {
    whiteSpace: 'nowrap',
    padding: theme.spacing(2),
  },
}));

export const DenseTable = () => {
  const classes = useStyles();
  const { toolCategories } = toolCategoriesConfig;

  return (
    <div className={classes.root}>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="security dashboard table">
          <TableHead>
            <TableRow>
              <TableCell className={classes.headerCell} rowSpan={2}>
                Repository
              </TableCell>
              {toolCategories.map((category) => (
                <TableCell
                  key={category.name}                  
                  colSpan={category.tools.length}
                  className={classes.categoryCell}
                  style={{ backgroundColor: category.backgroundColor }}
                  align="center"
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
                    <Typography variant="body2">
                      {repo.name}
                    </Typography>
                  </div>
                </TableCell>
                {toolCategories.map((category) =>
                  category.tools.map((tool) => (
                    <TableCell
                      key={`${repo.name}-${category.name}-${tool}`}
                      className={classes.tableCell}
                      align="center"
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
    </div>
  );
};
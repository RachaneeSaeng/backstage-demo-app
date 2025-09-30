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
  useTheme,
} from '@material-ui/core';
import toolCategoriesConfig from '../../config/toolCategories.json';
import { getToolStatus, repositories, createCategoryHeaderStyle } from './utils';
import { StatusChip } from './StatusChip';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2),
    maxHeight: '70vh',
    flexGrow: 0,
    maxWidth: '100%',
    flexBasis: '100%',
  },
  table: {
    overflowX: 'auto',
    tableLayout: 'auto',
  },
  headerCell: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: theme.spacing(1),
  },
  repositoryCell: {
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
    color: theme.palette.text.primary,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    padding: theme.spacing(2),
  },
  tableCell: {
    whiteSpace: 'nowrap',
    padding: theme.spacing(2),
    color: theme.palette.text.primary,
  },
}));

// type DenseTableProps = {
//   users: User[];
// };

export const DenseTable = () => {
  const classes = useStyles();
  const { toolCategories } = toolCategoriesConfig;
  const theme = useTheme();

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
                  align="center"
                  colSpan={category.tools.length}
                  style={createCategoryHeaderStyle(category.backgroundColor, theme.palette.type === 'dark')}
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
    </div>
  );
};
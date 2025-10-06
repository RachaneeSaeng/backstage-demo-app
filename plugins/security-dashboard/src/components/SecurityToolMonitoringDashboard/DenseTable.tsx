import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableColumn,
  Link,
} from '@backstage/core-components';
import toolCategoriesConfig from './config/toolCategories.json';
import { getToolStatus } from './utils';
import { StatusChip } from './StatusChip';
import { Repository } from '../../types';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2),
    maxHeight: '100%',
    flexGrow: 0,
    maxWidth: '100%',
    flexBasis: '100%',
  }
}));

interface DenseTableProps {
  repositoriesData: Repository[];
}

export const DenseTable = ({ repositoriesData }: DenseTableProps) => {
  const classes = useStyles();
  const { toolCategories } = toolCategoriesConfig;

  const buildColumnsForCategory = (category: any) => {
    return category.tools.map((toolName: string) => {
      const fieldName = category.shortName
        ? `${category.shortName} - ${toolName}`
        : toolName;

      return {
        title: fieldName,
        field: fieldName,
        width: '220px',
        headerStyle: { textTransform: 'none', whiteSpace: 'nowrap', textAlign: 'center', backgroundColor: category.backgroundColor, color: '#ffffff' },
        cellStyle: { whiteSpace: 'nowrap', textAlign: 'center' },
        render: (rowData: any) => (
          <StatusChip status={rowData[`${fieldName}-obj`]} />
        ),
      };
    });
  };

  const buildToolColumns = () => {
    const columns: TableColumn<any>[] = [
      {
        title: 'Repository',
        field: 'repositoryName',
        highlight: true,
        width: '250px',
        headerStyle: { textTransform: 'none' },
        cellStyle: { fontWeight: 'bold' },
        render: (rowData: any) => (
          <Link
            underline="hover"
            target="_blank"
            rel="noopener"
            to={rowData.repositoryUrl}
          >
            {rowData.repositoryName}
          </Link>
        ),
      },
    ];

    toolCategories.forEach((category: any) => {
      columns.push(...buildColumnsForCategory(category));
    });

    return columns;
  };

  const buildData = () => {
    return repositoriesData.map((repo: Repository) => {
      const rowData: any = {
        repositoryName: repo.name,
        repositoryUrl: repo.url,
      };

      toolCategories.forEach((category: any) => {
        category.tools.forEach((toolName: string) => {
          const repoTool = repo.steps
            .find(s => s.toolCategory === category.name)
            ?.tools.find(t => t.name === toolName);

          if (repoTool) {
            const fieldName = category.shortName
              ? `${category.shortName} - ${toolName}`
              : toolName;

            const toolStatus = getToolStatus(repoTool);
            rowData[fieldName] = toolStatus.text;
            rowData[`${fieldName}-obj`] = toolStatus;
          }
        });
      });
      return rowData;
    });
  };

  return (
    <div className={classes.root}>
      <Table
        title="Tools Adoption by Repository"
        style={{ overflow: 'auto', tableLayout: 'auto' }}
        options={{
          search: true,
          paging: true,
          pageSize: 10,
          pageSizeOptions: [5, 10, 15, 20],
          fixedColumns: { left: 1 },
        }}
        columns={buildToolColumns()}
        data={buildData()}
      />
    </div>
  );
};

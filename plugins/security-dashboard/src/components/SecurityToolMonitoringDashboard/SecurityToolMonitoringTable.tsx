import { Progress } from '@backstage/core-components';
import {Box } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import { DenseTable } from './DenseTable';
import { useRepositorySecurityTools } from '../../hooks';

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(3),
  }
}));

export const SecurityToolMonitoringTable = () => {
  const classes = useStyles();
  const { repositorySecurityTools, loading, error } = useRepositorySecurityTools();

  // Loading state
  if (loading) {
    return (
      <Box className={classes.container}>
        <Progress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box className={classes.container}>
        <Alert severity="error">
          Failed to load respository data: {error.message}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!repositorySecurityTools || repositorySecurityTools.length === 0) {
    return (
      <Box className={classes.container}>
        <Alert severity="info">
          No security tools found!
        </Alert>
      </Box>
    );
  }

  return <DenseTable repositoriesData={repositorySecurityTools ?? []}/>;
};

import React from 'react';
import { Chip, Link, makeStyles } from '@material-ui/core';
import { SecurityStatus } from './types';

const useStyles = makeStyles((theme) => ({
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

export const StatusChip: React.FC<{ status: SecurityStatus }> = ({ status }) => {
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
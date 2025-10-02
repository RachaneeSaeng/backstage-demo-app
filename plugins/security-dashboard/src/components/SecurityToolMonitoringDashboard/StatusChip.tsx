import React from 'react';
import { Chip, Link, makeStyles } from '@material-ui/core';
import { SecurityStatus } from './types';

const useStyles = makeStyles((theme) => ({
  chip: {
    minWidth: 120,
    fontSize: '0.75rem',
  },
  criticalChip: {
    backgroundColor: theme.palette.type === 'dark' ? '#FF4757' : '#E22134',
    color: 'white',
  },
  highChip: {
    backgroundColor: theme.palette.type === 'dark' ? '#FFA726' : '#FF9800',
    color: 'white',
  },
  mediumChip: {
    backgroundColor: theme.palette.type === 'dark' ? '#FFF176' : '#FFED51',
    color: 'black',
  },
  lowChip: {
    backgroundColor: theme.palette.type === 'dark' ? '#66BB6A' : '#1DB954',
    color: 'white',
  },
  noneChip: {
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
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
      <Link href={status.link} color="inherit" underline="hover" target='_blank' rel='noopener'>
        {status.text}
      </Link>
      );

  return (
    <>
      <Chip
        label={chipContent}
        className={`${classes.chip} ${getChipClass()}`}
        size="small"
      />
    </>

  );
};
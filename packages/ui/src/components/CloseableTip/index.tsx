import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { StorageConfig } from '@/config/storage';

type TProps = {
  className?: string;
  tip: any;
  persistKey: string;
};

/**
 * A dismissable hint. Deliberately neutral rather than MUI's blue "info"
 * severity, so it inherits whatever palette the host application configured
 * instead of introducing a colour that is not part of it.
 */
export default function CloseableTip(props: TProps) {
  const persistKey = StorageConfig.closeableTipNs + props.persistKey;
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return !localStorage.getItem(persistKey);
    } catch (_e) {
      return true;
    }
  });
  const onClose = () => {
    try {
      localStorage.setItem(persistKey, '!');
    } catch (_e) {
      // storage unavailable: the tip just comes back next time
    }
    setIsOpen(false);
  };
  if (!isOpen) {
    return null;
  }
  return (
    <Alert
      icon={<InfoIcon fontSize="inherit" />}
      className={props.className}
      onClose={onClose}
      sx={{
        color: 'text.secondary',
        backgroundColor: 'action.hover',
        border: 1,
        borderColor: 'divider',
        '& .MuiAlert-icon': { color: 'text.secondary' },
        '& a': { color: 'primary.main' },
        '& b': { color: 'text.primary' },
      }}
    >
      {props.tip}
    </Alert>
  );
}

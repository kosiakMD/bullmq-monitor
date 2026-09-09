import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';

/**
 * A read-only preformatted block for job payloads and stack traces.
 * Colours come from the theme so it stays readable in both schemes and follows
 * whatever palette the host application configured.
 */
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.25),
    color: theme.palette.text.primary,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: '0.8125rem',
    lineHeight: 1.55,
    maxHeight: '260px',
    overflow: 'auto',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

type TProps = {
  className?: string;
};
const SimpleJsonView: React.FC<React.PropsWithChildren<TProps>> = (props) => {
  const cls = useStyles();
  return (
    <pre className={clsx([cls.root, props.className])}>{props.children}</pre>
  );
};
export default SimpleJsonView;

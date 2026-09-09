import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ServerUiConfig } from '@/config/ui';

type TProps = {
  className?: string;
  color?: string;
};

const DEFAULT_TITLE = 'BullMQ Monitor';

/**
 * Wordmark for the dashboard.
 *
 * The host application can replace it with its own image through the `ui.logo`
 * option; otherwise the title is rendered as text so it stays legible at any
 * size and inherits the current theme.
 */
const Logo = ({ className, color = 'inherit' }: TProps) => {
  const { logo, title } = ServerUiConfig;

  if (logo?.path) {
    return (
      <Box
        className={className}
        component="img"
        src={logo.path}
        alt={logo.alt || title || DEFAULT_TITLE}
        sx={{
          display: 'block',
          width: logo.width ?? 'auto',
          height: logo.height ?? 32,
          maxHeight: 40,
          objectFit: 'contain',
        }}
      />
    );
  }

  const [first, ...rest] = (title || DEFAULT_TITLE).split(' ');
  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 0.75,
        color,
        userSelect: 'none',
      }}
    >
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: '1.15rem',
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}
      >
        {first}
      </Typography>
      {rest.length > 0 && (
        <Typography
          component="span"
          sx={{
            fontWeight: 300,
            fontSize: '1.15rem',
            letterSpacing: '0.18em',
            lineHeight: 1,
            opacity: 0.85,
          }}
        >
          {rest.join(' ').toUpperCase()}
        </Typography>
      )}
    </Box>
  );
};

export default Logo;

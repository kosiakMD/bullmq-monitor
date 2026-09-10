import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ServerUiConfig } from '@/config/ui';
import { useThemeStore } from '@/stores/theme';

type TProps = {
  className?: string;
  color?: string;
};

const DEFAULT_TITLE = 'BullMQ Monitor';

const Wordmark = ({ className, color, title }: TProps & { title: string }) => {
  const [first, ...rest] = title.split(' ');
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

/**
 * Wordmark for the dashboard.
 *
 * The host application can replace it with its own image through `ui.logo`.
 * If that image fails to load, the title is rendered as text instead: a
 * mistyped path or a misconfigured static route should not leave a broken
 * image in the top bar.
 */
const Logo = ({ className, color = 'inherit' }: TProps) => {
  const { logo, title } = ServerUiConfig;
  const mode = useThemeStore((state) => state.theme);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const label = title || DEFAULT_TITLE;

  /**
   * An image can finish failing before React attaches its onError handler, in
   * which case the event never fires. A decoded image always reports a natural
   * width, so a zero one after loading means the request failed.
   */
  const checkLoaded = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (node?.complete && node.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    const node = imgRef.current;
    if (node?.complete && node.naturalWidth === 0) {
      setFailed(true);
    }
  }, [logo?.path, logo?.darkPath, mode]);

  if (logo?.path && !failed) {
    // a single-colour wordmark drawn for one scheme vanishes in the other
    const src = mode === 'dark' && logo.darkPath ? logo.darkPath : logo.path;
    return (
      <Box
        className={className}
        component="img"
        src={src}
        alt={logo.alt || label}
        ref={checkLoaded}
        onError={() => setFailed(true)}
        onLoad={(e) => {
          if ((e.currentTarget as HTMLImageElement).naturalWidth === 0) {
            setFailed(true);
          }
        }}
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

  return <Wordmark className={className} color={color} title={label} />;
};

export default Logo;

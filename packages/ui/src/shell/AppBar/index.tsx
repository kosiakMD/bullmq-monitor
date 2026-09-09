import React, { useCallback, memo } from 'react';
import BaseAppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import Toolbar from '@mui/material/Toolbar';
import makeStyles from '@mui/styles/makeStyles';
import type { Theme } from '@mui/material/styles';
import { useDrawerState } from '@/stores/drawer';
import SettingsIcon from '@mui/icons-material/Settings';
import ShareIcon from '@mui/icons-material/Share';
import { useSettingsModalStore } from '@/stores/settings-modal';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { useRedisInfoModalStore } from '@/stores/redis-info-modal';
import RedisLogo from '@/components/RedisLogo';
import Logo from '@/components/Logo';
import { useShareActiveWorkspace } from '@/hooks/use-share';
import MetricsScreenIcon from '@mui/icons-material/Timeline';
import JobsScreenIcon from '@mui/icons-material/ViewList';
import { useActiveScreenStore } from '@/stores/active-screen';
import { LinksConfig } from '@/config/links';
import { EnvConfig } from '@/config/env';
import { useQueryClient } from 'react-query';
import { QueryKeysConfig } from '@/config/query-keys';
import { useNetwork } from '@/hooks/use-network';
import Button from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ServerUiConfig } from '@/config/ui';

const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    // a surface-coloured bar follows whatever palette the host configured,
    // instead of flooding the top of the page with the brand colour
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    backgroundImage: 'none',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  menuButton: {
    marginRight: theme.spacing(0.5),
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
}));

export default memo(function AppBar() {
  const queryClient = useQueryClient();
  const {
    queries: { getRedisInfo },
  } = useNetwork();

  const onRedisHover = useCallback(() => {
    const oldData = queryClient.getQueryData(QueryKeysConfig.redisInfo);
    if (!oldData) {
      queryClient.prefetchQuery(QueryKeysConfig.redisInfo, getRedisInfo);
    }
  }, []);
  const classes = useStyles();
  const toggleDrawer = useDrawerState((state) => state.toggle);
  const openSettings = useSettingsModalStore((state) => state.open);
  const openRedisInfo = useRedisInfoModalStore((state) => state.open);
  const shareWorkspace = useShareActiveWorkspace();
  const { screen, toggleScreen } = useActiveScreenStore();

  return (
    <BaseAppBar
      position="fixed"
      elevation={0}
      color="inherit"
      className={classes.appBar}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer}
          className={classes.menuButton}
          size="large"
        >
          <MenuIcon />
        </IconButton>
        <Logo />
        <Box className={classes.right} marginLeft="auto">
          {ServerUiConfig.links?.map(({ text, url }) => (
            <Button
              key={`${text}-${url}`}
              href={url}
              component="a"
              color="inherit"
              size="small"
              endIcon={<OpenInNewIcon fontSize="small" />}
            >
              {text}
            </Button>
          ))}
          {EnvConfig.demo && (
            <Tooltip title="Github repository">
              <IconButton
                href={LinksConfig.githubRepo}
                target="_blank"
                component="a"
                color="inherit"
                size="large"
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Redis info">
            <IconButton
              onMouseEnter={onRedisHover}
              onClick={openRedisInfo}
              aria-label="redis info"
              size="large"
            >
              <RedisLogo width="24" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share active workspace">
            <IconButton
              onClick={shareWorkspace}
              color="inherit"
              aria-label="share active workspace"
              size="large"
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={screen === 'jobs' ? 'Metrics' : 'Jobs'}>
            <IconButton color="inherit" onClick={toggleScreen} size="large">
              {screen === 'jobs' ? <MetricsScreenIcon /> : <JobsScreenIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton
              onClick={openSettings}
              color="inherit"
              aria-label="settings"
              size="large"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </BaseAppBar>
  );
});

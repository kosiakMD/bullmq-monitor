import { activeQueueLabelAtom } from '@/atoms/workspaces';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { ServerUiConfig } from '@/config/ui';

const BASE_TITLE = ServerUiConfig.title || 'BullMQ Monitor';

/** keeps the configured title visible while showing the active queue */
export const useDynamicPageTitle = () => {
  const queue = useAtomValue(activeQueueLabelAtom);
  useEffect(() => {
    document.title = queue ? `${queue} · ${BASE_TITLE}` : BASE_TITLE;
  }, [queue]);
};

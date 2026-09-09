import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import copyToClipboard from 'copy-to-clipboard';
import SimpleJsonView from '../SimpleJsonView';
import { useToast } from '@/hooks/use-toast';

type TProps = {
  header: string;
  textClassName?: string;
  defaultExpanded?: boolean;
};

/** children are always rendered text, so this is what lands on the clipboard */
const asText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(asText).join('');
  return '';
};

const AccordionJsonView: React.FC<React.PropsWithChildren<TProps>> = (
  props
) => {
  const { children, header, textClassName, defaultExpanded = true } = props;
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);
  const text = asText(children);

  const onCopy = React.useCallback(
    (e: React.MouseEvent) => {
      // the button lives in the summary row, which would otherwise toggle
      e.stopPropagation();
      if (!text) return;
      copyToClipboard(text);
      setCopied(true);
      toast(`${header} copied`, { variant: 'success', autoHideDuration: 1500 });
      setTimeout(() => setCopied(false), 1500);
    },
    [header, text, toast]
  );

  return (
    <div>
      <Accordion defaultExpanded={defaultExpanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              pr: 1,
            }}
          >
            <Typography>{header}</Typography>
            {!!text && (
              <Tooltip title={`Copy ${header.toLowerCase()}`}>
                <IconButton
                  size="small"
                  onClick={onCopy}
                  onFocus={(e) => e.stopPropagation()}
                  aria-label={`Copy ${header}`}
                  sx={{
                    color: copied ? 'success.main' : 'text.secondary',
                    '&:hover': { color: copied ? 'success.main' : 'primary.main' },
                  }}
                >
                  {copied ? (
                    <CheckIcon fontSize="small" />
                  ) : (
                    <CopyIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <SimpleJsonView className={textClassName}>{children}</SimpleJsonView>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default AccordionJsonView;

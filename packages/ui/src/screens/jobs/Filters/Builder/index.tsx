import React, { memo, useCallback, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import { useAtom, useAtomValue } from 'jotai';
import { activeQueueLabelAtom, dataSearchAtom } from '@/atoms/workspaces';
import { FilterFields } from '@/config/ui';
import {
  OPERATORS,
  OPERATOR_LABELS,
  VALUELESS,
  compileConditions,
  fieldsForQueue,
  optionLabel,
  optionValue,
} from '@/services/filter-builder';
import type {
  TCondition,
  TFieldType,
  TFilterField,
  TJoin,
  TOperator,
} from '@/services/filter-builder';

type TProps = {
  className?: string;
};

const newCondition = (field: TFilterField): TCondition => {
  const type = (field.type ?? 'string') as TFieldType;
  return {
    path: field.path,
    type,
    operator: OPERATORS[type][0],
    dateFormat: field.dateFormat,
    value: '',
    values: [],
  };
};

/** the input a given type and operator needs, if any */
const valueInputType = (type: TFieldType): string => {
  switch (type) {
    case 'number':
      return 'number';
    case 'date':
      return 'datetime-local';
    default:
      return 'text';
  }
};

/**
 * Builds a payload filter from described fields, so a search is picked rather
 * than typed. Everything it produces goes into the same jsonata box, which stays
 * editable for anything the builder cannot express.
 */
const FilterBuilder = ({ className }: TProps) => {
  const [dataSearch, setDataSearch] = useAtom(dataSearchAtom);
  const queueName = useAtomValue(activeQueueLabelAtom) ?? undefined;
  const [open, setOpen] = useState(false);
  const [join, setJoin] = useState<TJoin>('and');
  const [conditions, setConditions] = useState<TCondition[]>([]);

  const fields = useMemo(
    () => fieldsForQueue(FilterFields, queueName),
    [queueName]
  );
  const fieldByPath = useMemo(() => {
    const map = new Map<string, TFilterField>();
    for (const field of fields) map.set(field.path, field);
    return map;
  }, [fields]);

  const preview = useMemo(
    () => compileConditions(conditions, join),
    [conditions, join]
  );

  const onOpen = useCallback(() => {
    setConditions((current) =>
      current.length ? current : [newCondition(fields[0])]
    );
    setOpen(true);
  }, [fields]);

  const update = useCallback((index: number, patch: Partial<TCondition>) => {
    setConditions((current) =>
      current.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }, []);

  const onFieldChange = useCallback(
    (index: number, path: string) => {
      const field = fieldByPath.get(path);
      if (field) {
        setConditions((current) =>
          current.map((c, i) => (i === index ? newCondition(field) : c))
        );
      }
    },
    [fieldByPath]
  );

  const apply = useCallback(() => {
    // resolve relative windows now, so "last 7 days" means the moment you applied it
    setDataSearch(compileConditions(conditions, join));
    setOpen(false);
  }, [conditions, join, setDataSearch]);

  if (!fields.length) return null;

  return (
    <>
      <Tooltip title="Build a filter from your job fields">
        <Button
          className={className}
          onClick={onOpen}
          startIcon={<TuneIcon />}
          size="small"
          color={dataSearch ? 'primary' : 'inherit'}
        >
          Build filter
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Build a filter</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {conditions.length > 1 && (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={join}
                onChange={(_e, next: TJoin | null) => next && setJoin(next)}
              >
                <ToggleButton value="and">match all</ToggleButton>
                <ToggleButton value="or">match any</ToggleButton>
              </ToggleButtonGroup>
            )}

            {conditions.map((condition, index) => {
              const field = fieldByPath.get(condition.path);
              const type = condition.type;
              const needsValue = !VALUELESS.includes(condition.operator);
              const isRange = condition.operator === 'between';
              const isOneOf = condition.operator === 'isOneOf';
              const isRelative =
                condition.operator === 'lastHours' ||
                condition.operator === 'lastDays';
              return (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                >
                  <TextField
                    select
                    size="small"
                    label="Field"
                    sx={{ minWidth: 190 }}
                    value={condition.path}
                    onChange={(e) => onFieldChange(index, e.target.value)}
                    helperText={field?.hint}
                  >
                    {fields.map((f) => (
                      <MenuItem key={f.path} value={f.path}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="Condition"
                    sx={{ minWidth: 160 }}
                    value={condition.operator}
                    onChange={(e) =>
                      update(index, {
                        operator: e.target.value as TOperator,
                        value: '',
                        value2: '',
                        values: [],
                      })
                    }
                  >
                    {OPERATORS[type].map((op) => (
                      <MenuItem key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </MenuItem>
                    ))}
                  </TextField>

                  {needsValue && isOneOf && (
                    <TextField
                      select
                      size="small"
                      label="Values"
                      sx={{ minWidth: 200 }}
                      SelectProps={{ multiple: true }}
                      value={condition.values ?? []}
                      onChange={(e) =>
                        update(index, {
                          values: e.target.value as unknown as string[],
                        })
                      }
                    >
                      {(field?.options ?? []).map((option) => (
                        <MenuItem key={optionValue(option)} value={optionValue(option)}>
                          {optionLabel(option)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                  {needsValue && !isOneOf && type === 'enum' && (
                    <TextField
                      select
                      size="small"
                      label="Value"
                      sx={{ minWidth: 180 }}
                      value={condition.value ?? ''}
                      onChange={(e) => update(index, { value: e.target.value })}
                    >
                      {(field?.options ?? []).map((option) => (
                        <MenuItem key={optionValue(option)} value={optionValue(option)}>
                          {optionLabel(option)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                  {needsValue && !isOneOf && type !== 'enum' && (
                    <TextField
                      size="small"
                      label={isRelative ? 'How many' : 'Value'}
                      type={isRelative ? 'number' : valueInputType(type)}
                      sx={{ minWidth: 180 }}
                      InputLabelProps={
                        type === 'date' && !isRelative ? { shrink: true } : undefined
                      }
                      value={condition.value ?? ''}
                      onChange={(e) => update(index, { value: e.target.value })}
                    />
                  )}

                  {isRange && (
                    <TextField
                      size="small"
                      label="and"
                      type={valueInputType(type)}
                      sx={{ minWidth: 180 }}
                      InputLabelProps={type === 'date' ? { shrink: true } : undefined}
                      value={condition.value2 ?? ''}
                      onChange={(e) => update(index, { value2: e.target.value })}
                    />
                  )}

                  <Tooltip title="Remove">
                    <span>
                      <IconButton
                        size="small"
                        disabled={conditions.length === 1}
                        onClick={() =>
                          setConditions((current) =>
                            current.filter((_c, i) => i !== index)
                          )
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              );
            })}

            <Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setConditions((current) => [...current, newCondition(fields[0])])
                }
              >
                Add condition
              </Button>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Search expression
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.5,
                  p: 1,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  backgroundColor: 'action.hover',
                  fontSize: '0.78rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: preview ? 'text.primary' : 'text.secondary',
                }}
              >
                {preview || 'nothing to apply yet'}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConditions([])}>
            Reset
          </Button>
          <Button color="inherit" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={apply} disabled={!preview}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default memo(FilterBuilder);

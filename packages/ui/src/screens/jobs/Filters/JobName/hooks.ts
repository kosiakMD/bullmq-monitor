import { jobNameAtom, clearJobNameAtom } from '@/atoms/workspaces';
import { useDebouncedAtomInput } from '../use-debounced-atom';

export const useJobNameFilterState = () =>
  useDebouncedAtomInput(jobNameAtom, clearJobNameAtom);

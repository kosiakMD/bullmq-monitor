import { dataSearchAtom, clearDataSearchAtom } from '@/atoms/workspaces';
import { useDebouncedAtomInput } from '../use-debounced-atom';

export const useDataSearchState = () => {
  const { value, onChange, onClear } = useDebouncedAtomInput(
    dataSearchAtom,
    clearDataSearchAtom
  );
  return { search: value, onChange, onClear };
};

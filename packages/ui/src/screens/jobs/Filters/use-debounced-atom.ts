import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import debounce from 'lodash/debounce';
import { useAtom, useSetAtom } from 'jotai';
import type { PrimitiveAtom, WritableAtom } from 'jotai';

const SEARCH_INPUT_DEBOUNCE = 250;

type TValueAtom = PrimitiveAtom<string> | WritableAtom<string, [string], void>;
type TClearAtom = WritableAtom<null, [], void>;

/**
 * Keeps a text input responsive while writing the debounced value into an atom.
 *
 * The debounced callback is created once and reads the latest setter through a
 * ref. Recreating it on every render (the setter identity is not stable) would
 * drop the pending timer whenever an unrelated poll re-rendered the tree, and
 * the filter would silently never be applied.
 */
export const useDebouncedAtomInput = (
  valueAtom: TValueAtom,
  clearAtom: TClearAtom,
  debounceMs = SEARCH_INPUT_DEBOUNCE
) => {
  const [atomValue, changeAtomValue] = useAtom(valueAtom as any) as [
    string,
    (v: string) => void,
  ];
  const clearAtomValue = useSetAtom(clearAtom);

  const [value, setValue] = useState(atomValue);
  const isDebouncingRef = useRef(false);

  const setterRef = useRef(changeAtomValue);
  setterRef.current = changeAtomValue;

  const debounced = useMemo(
    () =>
      debounce((next: string) => {
        isDebouncingRef.current = false;
        setterRef.current(next);
      }, debounceMs),
    [debounceMs]
  );
  useEffect(() => () => debounced.cancel(), [debounced]);

  // pick up external changes (shared link, workspace switch) unless the user is typing
  useEffect(() => {
    if (!isDebouncingRef.current) {
      setValue(atomValue);
    }
  }, [atomValue]);

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    ({ target: { value: next } }) => {
      isDebouncingRef.current = true;
      setValue(next);
      debounced(next);
    },
    [debounced]
  );

  const onClear = useCallback(() => {
    debounced.cancel();
    isDebouncingRef.current = false;
    clearAtomValue();
    setValue('');
  }, [clearAtomValue, debounced]);

  return { value, onChange, onClear };
};

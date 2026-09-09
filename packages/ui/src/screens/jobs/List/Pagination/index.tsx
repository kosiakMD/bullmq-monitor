import React, { memo } from 'react';
import TablePagination from '@mui/material/TablePagination';
import { usePaginationStore } from '@/stores/pagination';
import { useCount, UNKNOWN_COUNT } from './hooks';
import { PaginationConfig } from '@/config/pagination';
import makeStyles from '@mui/styles/makeStyles';
import { useAtom } from 'jotai';
import { activePageAtom } from '@/atoms/workspaces';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'sticky',
    bottom: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 2,
    borderTop: `1px solid ${
      theme.palette.mode === 'dark' ? '#515151' : '#e0e0e0'
    }`,
    borderBottomRightRadius: '4px',
    borderBottomLeftRadius: '4px',
  },
}));

type TProps = {
  /** number of rows currently rendered, used when the real total is unknown */
  loadedRows: number;
};

const Pagination = ({ loadedRows }: TProps) => {
  const cls = useStyles();
  const [page, changePage] = useAtom(activePageAtom);
  const { perPage, changePerPage } = usePaginationStore();
  const count = useCount();
  const isUnknown = count === UNKNOWN_COUNT;
  return (
    <TablePagination
      className={cls.root}
      rowsPerPageOptions={PaginationConfig.perPageOptions}
      component="div"
      count={count}
      rowsPerPage={perPage}
      page={page}
      labelRowsPerPage="Per page"
      // filtered results have no known total, so report what is actually loaded
      labelDisplayedRows={({ from, count: total }) => {
        if (!loadedRows) {
          return isUnknown ? 'no matches' : `0 of ${Math.max(total, 0)}`;
        }
        const start = Math.max(from, 1);
        const to = start + loadedRows - 1;
        if (!isUnknown) {
          return `${start}–${to} of ${total}`;
        }
        // a full page means there may be more behind it
        const more = loadedRows === perPage ? 'more than ' : '';
        return `${start}–${to} of ${more}${to}`;
      }}
      // with an unknown total, "next" is only meaningful while a full page loads
      nextIconButtonProps={{
        disabled: isUnknown ? loadedRows < perPage : undefined,
      }}
      onPageChange={(_e, p) => changePage(p)}
      onRowsPerPageChange={(e) => changePerPage(Number(e.target.value))}
    />
  );
};
export default memo(Pagination);

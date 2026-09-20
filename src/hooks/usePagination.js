import { useEffect, useMemo, useState } from 'react';

export const TABLE_PAGE_SIZE = 25;

export function usePagination(items, { pageSize = TABLE_PAGE_SIZE, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  return { page, setPage, pageItems, total, totalPages, pageSize };
}

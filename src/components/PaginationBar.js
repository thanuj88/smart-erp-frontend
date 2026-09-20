import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const PaginationBar = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  label,
}) => {
  const { t } = useTranslation();
  if (!total) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((item) => {
    if (totalPages <= 7) return true;
    return item === 1 || item === totalPages || Math.abs(item - page) <= 1;
  });

  return (
    <div className="table-pagination">
      <p className="text-muted small mb-0">
        {t('showingRange', { from, to, total, label: label || t('rows') })}
      </p>
      {totalPages > 1 && (
        <nav aria-label={t('showingRange', { from, to, total, label: label || t('rows') })}>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                {t('previous')}
              </button>
            </li>
            {pages.map((item, idx) => {
              const prev = pages[idx - 1];
              const showEllipsis = prev && item - prev > 1;
              return (
                <React.Fragment key={item}>
                  {showEllipsis && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}
                  <li className={`page-item ${page === item ? 'active' : ''}`}>
                    <button type="button" className="page-link" onClick={() => onPageChange(item)}>
                      {item}
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                {t('next')}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

PaginationBar.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export default PaginationBar;

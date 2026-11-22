import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { activityLogService } from '../services';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 50;

const ACTIONS = [
  ['ITEM_CREATED', 'activityItemCreated'],
  ['ITEM_UPDATED', 'activityItemUpdated'],
  ['ITEM_DELETED', 'activityItemDeleted'],
  ['ORDER_CREATED', 'activityOrderCreated'],
  ['RETURN_CREATED', 'activityReturnCreated'],
  ['USER_CREATED', 'activityUserCreated'],
  ['USER_UPDATED', 'activityUserUpdated'],
  ['USER_DELETED', 'activityUserDeleted'],
];

const ActivityLog = () => {
  const { t } = useTranslation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [action, setAction] = useState('');
  const [email, setEmail] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cursors = useRef([null]);

  const label = (code) => {
    const match = ACTIONS.find(([value]) => value === code);
    return match ? t(match[1]) : code;
  };

  const loadPage = useCallback(async (range, pageNumber) => {
    setLoading(true);
    setError('');
    setPage(pageNumber);
    try {
      const data = await activityLogService.list({
        from: range.from || undefined,
        to: range.to || undefined,
        action: range.action || undefined,
        email: range.email || undefined,
        cursor: cursors.current[pageNumber - 1] || undefined,
        limit: PAGE_SIZE,
      });
      const rows = data.items || [];
      setItems(rows);
      setHasNext(Boolean(data.nextCursor));
      if (data.nextCursor) cursors.current[pageNumber] = data.nextCursor;
    } catch (err) {
      setError(err.response?.data?.error || t('activityLoadFailed'));
      setItems([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const handle = setTimeout(() => setEmailQuery(email.trim()), 300);
    return () => clearTimeout(handle);
  }, [email]);

  const filters = useMemo(
    () => ({ from, to, action, email: emailQuery }),
    [from, to, action, emailQuery]
  );
  const filtersActive = Boolean(from || to || action || email);

  useEffect(() => {
    cursors.current = [null];
    loadPage(filters, 1);
  }, [filters, loadPage]);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber === page) return;
    if (pageNumber > page && !hasNext) return;
    loadPage(filters, pageNumber);
  };

  const clearFilters = () => {
    setFrom('');
    setTo('');
    setAction('');
    setEmail('');
  };

  return (
    <div className="container-fluid matte-page admin-page report-page table-page">
      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-1">{t('activityLog')}</h1>
          <p className="text-muted small mb-0">{t('activityLogSubtitle')}</p>
        </div>
      </div>

      <div className="row g-2 align-items-stretch mb-3">
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="activity-from">{t('from')}</label>
          <input id="activity-from" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="activity-to">{t('to')}</label>
          <input id="activity-to" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="activity-action">{t('activityAction')}</label>
          <select id="activity-action" className="form-select" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">{t('activityAllActions')}</option>
            {ACTIONS.map(([value, key]) => (
              <option key={value} value={value}>{t(key)}</option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="activity-email">{t('activityUserEmail')}</label>
          <input
            id="activity-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="col-auto d-flex flex-column">
          <span className="form-label small mb-1 invisible" aria-hidden="true">{t('clear')}</span>
          <div className="d-flex align-items-center flex-grow-1">
            <button type="button" className="btn btn-outline-secondary" onClick={clearFilters} disabled={!filtersActive}>
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {loading ? (
        <p className="text-muted">{t('activityLoading')}</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>{t('time')}</th>
                <th>{t('activityUser')}</th>
                <th>{t('activityAction')}</th>
                <th>{t('activityTarget')}</th>
                <th>{t('activityDetail')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-muted">{t('activityEmpty')}</td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</td>
                    <td>{row.user_email || row.user_id || '—'}</td>
                    <td>{label(row.action)}</td>
                    <td>
                      {row.target_label || row.target_id || '—'}
                      {row.target_id && row.target_label && row.target_id !== row.target_label ? (
                        <div className="small text-muted">{row.target_id}</div>
                      ) : null}
                    </td>
                    <td>{row.detail || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && items.length > 0 ? (
        <div className="table-pagination">
          <p className="text-muted small mb-0">
            {t('activityShowing', {
              from: (page - 1) * PAGE_SIZE + 1,
              to: (page - 1) * PAGE_SIZE + items.length,
            })}
          </p>
          {(page > 1 || hasNext) && (
            <nav aria-label={t('activityLog')}>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button type="button" className="page-link" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                    {t('previous')}
                  </button>
                </li>
                <li className="page-item active">
                  <span className="page-link">{page}</span>
                </li>
                <li className={`page-item ${!hasNext ? 'disabled' : ''}`}>
                  <button type="button" className="page-link" onClick={() => goToPage(page + 1)} disabled={!hasNext}>
                    {t('next')}
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ActivityLog;

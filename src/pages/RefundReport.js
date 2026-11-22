import React, { useEffect, useMemo, useState } from 'react';
import { saleService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import DateRangePicker from '../components/DateRangePicker';
import { formatOrderId } from '../utils/orderId';
import { useTranslation } from 'react-i18next';

const TYPE_LABEL = {
  cash: 'Cash refund',
  defect: 'Defect',
  warranty: 'Warranty claim',
};

const localDay = (value) => {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const RefundReport = () => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTeller, setFilterTeller] = useState('');
  const [filterOrder, setFilterOrder] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterApprover, setFilterApprover] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await saleService.getRefundReport({});
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || t('refundReportFailed'));
          setReport(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const rows = useMemo(
    () =>
      (report?.tellers || []).flatMap((teller) =>
        (teller.returns || []).map((row) => ({ ...row, tellerName: teller.tellerName }))
      ),
    [report]
  );

  const tellerOptions = useMemo(() => {
    const names = [...new Set(rows.map((row) => row.tellerName).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const approverOptions = useMemo(() => {
    const names = [...new Set(rows.map((row) => row.approverName).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterTeller && row.tellerName !== filterTeller) return false;
      if (filterApprover && (row.approverName || '') !== filterApprover) return false;
      if (filterType && (row.returnType || 'cash') !== filterType) return false;

      if (filterOrder) {
        const needle = filterOrder.replace(/[#\s]/g, '').toLowerCase();
        const hay = `${row.orderNumber || ''} ${row.returnNumber || ''}`
          .replace(/[#\s]/g, '')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }

      if (filterReason) {
        const needle = filterReason.trim().toLowerCase();
        if (needle && !String(row.reason || '').toLowerCase().includes(needle)) return false;
      }

      if (filterStartDate || filterEndDate) {
        const day = localDay(row.createdAt);
        if (filterStartDate && day < filterStartDate) return false;
        if (filterEndDate && day > filterEndDate) return false;
      }

      return true;
    });
  }, [rows, filterTeller, filterOrder, filterType, filterReason, filterApprover, filterStartDate, filterEndDate]);

  const filteredCash = useMemo(
    () => filteredRows.reduce((sum, row) => sum + (Number(row.refundCash) || 0), 0),
    [filteredRows]
  );

  const hasActiveFilters = Boolean(
    filterTeller || filterOrder || filterType || filterReason || filterApprover || filterStartDate || filterEndDate
  );

  const handleClearFilters = () => {
    setFilterTeller('');
    setFilterOrder('');
    setFilterType('');
    setFilterReason('');
    setFilterApprover('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <div className="container-fluid matte-page admin-page report-page table-page">
      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-1">{t('refundsReport')}</h1>
          <p className="text-muted small mb-0">{t('refundsReportSubtitle')}</p>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-lg-3">
          <div className="metric-card metric-orange">
            <div className="metric-info">
              <small>{t('refundCount')}</small>
              <h3>{filteredRows.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="metric-card metric-dark">
            <div className="metric-info">
              <small>{t('cashRefunded')}</small>
              <h3>{formatMoney(filteredCash)}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{t('loadingRefundsReport')}</p>
      ) : (
        <div className="card table-panel">
          <div className="card-body p-0">
            <div className="d-flex align-items-baseline gap-2 px-3 pt-3 pb-2">
              <h5 className="card-title mb-0">{t('refundsReport')}</h5>
              <span className="text-muted small">{filteredRows.length}</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover admin-table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">{t('date')}</th>
                    <th className="border-0 fw-semibold">{t('teller')}</th>
                    <th className="border-0 fw-semibold">{t('order')}</th>
                    <th className="border-0 fw-semibold">{t('Cash refund')}</th>
                    <th className="border-0 fw-semibold">{t('reason')}</th>
                    <th className="border-0 fw-semibold">{t('approvedBy')}</th>
                  </tr>
                  <tr className="report-filter-row">
                    <th>
                      <DateRangePicker
                        startDate={filterStartDate}
                        endDate={filterEndDate}
                        placeholder={t('dates')}
                        onChange={({ startDate, endDate }) => {
                          setFilterStartDate(startDate);
                          setFilterEndDate(endDate);
                        }}
                      />
                    </th>
                    <th>
                      <select
                        id="refundFilterTeller"
                        className="form-select form-select-sm"
                        value={filterTeller}
                        onChange={(e) => setFilterTeller(e.target.value)}
                        aria-label={t('teller')}
                      >
                        <option value="">{t('allTellers')}</option>
                        {tellerOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th>
                      <div className="report-teller-filter">
                        <input
                          id="refundFilterOrder"
                          type="text"
                          className="form-control form-control-sm"
                          placeholder={t('orderId')}
                          value={filterOrder}
                          onChange={(e) => setFilterOrder(e.target.value)}
                          aria-label={t('orderId')}
                        />
                        <select
                          id="refundFilterType"
                          className="form-select form-select-sm"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          aria-label={t('flag')}
                        >
                          <option value="">{t('All')}</option>
                          <option value="cash">{t('Cash refund')}</option>
                          <option value="defect">{t('Defect')}</option>
                          <option value="warranty">{t('Warranty claim')}</option>
                        </select>
                      </div>
                    </th>
                    <th />
                    <th>
                      <input
                        id="refundFilterReason"
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={t('reason')}
                        value={filterReason}
                        onChange={(e) => setFilterReason(e.target.value)}
                        aria-label={t('reason')}
                      />
                    </th>
                    <th>
                      <div className="report-teller-filter">
                        <select
                          id="refundFilterApprover"
                          className="form-select form-select-sm"
                          value={filterApprover}
                          onChange={(e) => setFilterApprover(e.target.value)}
                          aria-label={t('approvedBy')}
                        >
                          <option value="">{t('allApprovers')}</option>
                          {approverOptions.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleClearFilters}
                          disabled={!hasActiveFilters}
                        >
                          {t('clear')}
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-5">
                        {hasActiveFilters ? t('tryAdjustFilters') : t('noRefunds')}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={`${row.returnNumber}-${row.createdAt}`}>
                        <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</td>
                        <td>{row.tellerName || '—'}</td>
                        <td>
                          {formatOrderId(row.orderNumber)}
                          <div className="small text-muted">
                            {t(TYPE_LABEL[row.returnType] || row.returnType)}
                            {row.warrantyMonths ? ` · ${row.warrantyMonths} mo` : ''}
                          </div>
                        </td>
                        <td>{formatMoney(row.refundCash)}</td>
                        <td>{row.reason || '—'}</td>
                        <td>{row.approverName || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundReport;

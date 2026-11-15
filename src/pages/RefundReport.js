import React, { useEffect, useState } from 'react';
import { saleService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { formatOrderId } from '../utils/orderId';
import { useTranslation } from 'react-i18next';

const TYPE_LABEL = {
  cash: 'Cash refund',
  defect: 'Defect',
  warranty: 'Warranty',
};

const RefundReport = () => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (range) => {
    setLoading(true);
    setError('');
    try {
      const data = await saleService.getRefundReport(range);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.error || t('refundReportFailed'));
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({});
  }, []);

  const applyRange = (event) => {
    event.preventDefault();
    load({ from: from || undefined, to: to || undefined });
  };

  const rows = (report?.tellers || []).flatMap((teller) =>
    (teller.returns || []).map((row) => ({ ...row, tellerName: teller.tellerName }))
  );

  return (
    <div className="container-fluid matte-page admin-page report-page table-page">
      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-1">{t('refundsReport')}</h1>
          <p className="text-muted small mb-0">{t('refundsReportSubtitle')}</p>
        </div>
      </div>

      <form className="row g-2 align-items-end mb-3" onSubmit={applyRange}>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="refund-from">{t('from')}</label>
          <input id="refund-from" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="refund-to">{t('to')}</label>
          <input id="refund-to" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">{t('apply')}</button>
        </div>
      </form>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-lg-3">
          <div className="metric-card metric-orange">
            <div className="metric-info">
              <small>{t('refundCount')}</small>
              <h3>{report?.totals?.count ?? 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="metric-card metric-dark">
            <div className="metric-info">
              <small>{t('cashRefunded')}</small>
              <h3>{formatMoney(report?.totals?.refundCash || 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{t('loadingRefundsReport')}</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('teller')}</th>
                <th>{t('order')}</th>
                <th>{t('Cash refund')}</th>
                <th>{t('reason')}</th>
                <th>{t('approvedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-muted">{t('noRefunds')}</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.returnNumber}-${row.createdAt}`}>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</td>
                    <td>{row.tellerName || '—'}</td>
                    <td>
                      {formatOrderId(row.orderNumber)}
                      <div className="small text-muted">
                        {TYPE_LABEL[row.returnType] || row.returnType}
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
      )}
    </div>
  );
};

export default RefundReport;

import React, { useEffect, useState } from 'react';
import { saleService } from '../services';
import { useCurrency } from '../contexts/TenantSettingsContext';
import { formatOrderId } from '../utils/orderId';
import { useTranslation } from 'react-i18next';

const DiscountReport = () => {
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
      const data = await saleService.getDiscounts(range);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.error || t('discountReportFailed'));
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

  return (
    <div className="container-fluid matte-page admin-page report-page table-page">
      <div className="row mb-3">
        <div className="col-12">
          <h1 className="h3 mb-1">{t('discountsReport')}</h1>
          <p className="text-muted small mb-0">{t('discountsReportSubtitle')}</p>
        </div>
      </div>

      <form className="row g-2 align-items-end mb-3" onSubmit={applyRange}>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="discount-from">{t('from')}</label>
          <input id="discount-from" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1" htmlFor="discount-to">{t('to')}</label>
          <input id="discount-to" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
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
              <small>{t('discountedBills')}</small>
              <h3>{report?.totals?.count ?? 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="metric-card metric-dark">
            <div className="metric-info">
              <small>{t('discountGiven')}</small>
              <h3>{formatMoney(report?.totals?.discountAmount || 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{t('loadingDiscountsReport')}</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('order')}</th>
                <th>{t('teller')}</th>
                <th>{t('discount')}</th>
                <th>%</th>
                <th>{t('reason')}</th>
                <th>{t('approvedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {(report?.orders || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted">{t('noDiscounts')}</td>
                </tr>
              ) : (
                report.orders.map((row) => (
                  <tr key={row.orderNumber || row.saleDate}>
                    <td>{row.saleDate ? new Date(row.saleDate).toLocaleString() : ''}</td>
                    <td>{formatOrderId(row.orderNumber)}</td>
                    <td>{row.tellerName || '—'}</td>
                    <td>{formatMoney(row.discountAmount)}</td>
                    <td>{Number(row.effectivePercent || 0).toFixed(2)}</td>
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

export default DiscountReport;

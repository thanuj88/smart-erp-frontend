import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OverduePlansCard = ({ plans, formatMoney }) => {
  const { t } = useTranslation();

  return (
    <div className="card shadow-sm rounded-4 dashboard-widget-card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-baseline justify-content-between gap-2 mb-2">
          <h5 className="card-title mb-0">{t('widgetOverduePlans')}</h5>
          <Link to="/installment-payments" className="text-decoration-none small text-primary">
            {t('viewArrow')}
          </Link>
        </div>
        {plans.length === 0 ? (
          <div className="text-muted small py-4 text-center">{t('overdueEmpty')}</div>
        ) : (
          <div className="overdue-plan-list">
            {plans.map((plan) => (
              <div key={plan.planId} className="overdue-plan-row">
                <div className="min-w-0">
                  <div className="overdue-plan-name" title={plan.customer_name}>
                    {plan.customer_name || t('customer')}
                  </div>
                  <div className="text-muted small">
                    {t('overdueCountLate', { count: plan.count, days: plan.daysOverdue })}
                  </div>
                </div>
                <div className="overdue-plan-amount">
                  <strong>{formatMoney(plan.remaining)}</strong>
                  <span className="badge bg-danger">{t('overdue')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

OverduePlansCard.propTypes = {
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      planId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      customer_name: PropTypes.string,
      remaining: PropTypes.number,
      daysOverdue: PropTypes.number,
      count: PropTypes.number,
    })
  ).isRequired,
  formatMoney: PropTypes.func.isRequired,
};

export default OverduePlansCard;

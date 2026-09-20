import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const StockListCard = ({
  title,
  items,
  emptyText,
  linkTo = '/inventory',
  linkLabel,
  badgeClass = 'bg-secondary',
  renderBadge,
}) => {
  const { t } = useTranslation();

  return (
    <div className="card shadow-sm rounded-4 dashboard-widget-card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-baseline justify-content-between gap-2 mb-2">
          <h5 className="card-title mb-0">
            {title}
            {items.length > 0 && <span className="text-muted small ms-2">{items.length}</span>}
          </h5>
          <Link to={linkTo} className="text-decoration-none small text-primary">
            {linkLabel || t('manageArrow')}
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="text-muted small py-3">{emptyText}</div>
        ) : (
          <div className="stock-widget-list">
            {items.map((item) => (
              <div key={item.id} className="stock-widget-row">
                <div className="min-w-0">
                  <div className="stock-widget-name" title={item.name}>{item.name}</div>
                  {item.sub ? <div className="text-muted small">{item.sub}</div> : null}
                </div>
                {renderBadge ? (
                  renderBadge(item)
                ) : (
                  <span className={`badge ${badgeClass}`}>{item.badge}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

StockListCard.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      sub: PropTypes.string,
      badge: PropTypes.node,
    })
  ).isRequired,
  emptyText: PropTypes.string,
  linkTo: PropTypes.string,
  linkLabel: PropTypes.string,
  badgeClass: PropTypes.string,
  renderBadge: PropTypes.func,
};

export default StockListCard;

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_WIDGETS } from '../config/dashboardWidgets';

const DashboardEditor = ({ widgets, onToggle, onClose, saving, isAdmin }) => {
  const { t } = useTranslation();
  const groups = DASHBOARD_WIDGETS.filter((widget) => isAdmin || !widget.adminOnly).reduce((acc, widget) => {
    if (!acc[widget.groupKey]) acc[widget.groupKey] = [];
    acc[widget.groupKey].push(widget);
    return acc;
  }, {});

  return (
    <div className="dashboard-editor">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <div>
          <strong>{t('editDashboard')}</strong>
          <p className="text-muted small mb-0">{t('editDashboardHelp')}</p>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          {t('done')}
        </button>
      </div>
      <div className="dashboard-editor-grid">
        {Object.entries(groups).map(([groupKey, items]) => (
          <div key={groupKey} className="dashboard-editor-group">
            <div className="dashboard-editor-group-title">{t(groupKey)}</div>
            {items.map((widget) => (
              <label key={widget.id} className="dashboard-editor-item">
                <input
                  type="checkbox"
                  checked={widgets[widget.id] !== false}
                  disabled={saving}
                  onChange={() => onToggle(widget.id)}
                />
                <span>{t(widget.labelKey)}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

DashboardEditor.propTypes = {
  widgets: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  isAdmin: PropTypes.bool,
};

export default DashboardEditor;

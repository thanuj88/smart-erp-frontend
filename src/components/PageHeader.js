import React from 'react';
import PropTypes from 'prop-types';

const PageHeader = ({ title, subtitle, actions }) => (
  <div className="row page-header">
    <div className="col-12">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="page-header-text min-w-0">
          <h1 className="admin-page-title">{title}</h1>
          {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
        </div>
        {actions && (
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  </div>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
};

export default PageHeader;

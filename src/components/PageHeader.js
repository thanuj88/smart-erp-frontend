import React from 'react';
import PropTypes from 'prop-types';

const PageHeader = ({ title, subtitle, actions }) => (
  <div className="row mb-4">
    <div className="col-12">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <h1 className="h3 mb-1 admin-page-title">{title}</h1>
          {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
        </div>
        {actions && (
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
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

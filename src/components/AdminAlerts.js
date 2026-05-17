import React from 'react';
import PropTypes from 'prop-types';

const AdminAlerts = ({ success, error, onClearSuccess, onClearError }) => (
  <>
    {success && (
      <div className="alert alert-success alert-dismissible fade show" role="alert">
        <i className="bi bi-check-circle-fill me-2"></i>
        {success}
        <button type="button" className="btn-close" onClick={onClearSuccess} aria-label="Close"></button>
      </div>
    )}
    {error && (
      <div className="alert alert-danger alert-dismissible fade show" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
        <button type="button" className="btn-close" onClick={onClearError} aria-label="Close"></button>
      </div>
    )}
  </>
);

AdminAlerts.propTypes = {
  success: PropTypes.string,
  error: PropTypes.string,
  onClearSuccess: PropTypes.func,
  onClearError: PropTypes.func,
};

export default AdminAlerts;

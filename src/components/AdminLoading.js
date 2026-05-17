import React from 'react';
import PropTypes from 'prop-types';

const AdminLoading = ({ message = 'Loading...' }) => (
  <div className="admin-page d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
    <div className="text-center">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Loading</span>
      </div>
      <p className="text-muted mb-0">{message}</p>
    </div>
  </div>
);

AdminLoading.propTypes = {
  message: PropTypes.string,
};

export default AdminLoading;

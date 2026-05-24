import React, { useState, useEffect } from 'react';
import { userService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'TELLER',
    email: '',
    fullName: '',
    pin: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddModal = () => {
    setFormData({
      username: '',
      password: '',
      role: 'TELLER',
      email: '',
      fullName: '',
      pin: '',
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await userService.create(formData);
      setSuccess('User created successfully');
      setShowModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.delete(id);
        setSuccess('User deleted successfully');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" aria-hidden="true">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page users-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
            <div className="d-flex align-items-center mb-3 mb-lg-0">
              <div>
                <h1 className="h3 mb-1">User Management</h1>
                <p className="text-muted small mb-0">Create and manage staff accounts and roles.</p>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3">
              <button type="button" onClick={openAddModal} className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i>
                Add New User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No users found</h5>
              <p className="text-muted">Add your first user to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">Username</th>
                    <th className="border-0 fw-semibold">Role</th>
                    <th className="border-0 fw-semibold">Created At</th>
                    <th className="border-0 fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isOwnAccount =
                      currentUser && String(user.id) === String(currentUser.id);

                    return (
                    <tr key={user.id}>
                      <td className="fw-semibold">
                        {user.username}
                        {isOwnAccount && (
                          <span className="badge bg-light text-muted border ms-2">You</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            ['admin', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role)
                              ? 'bg-primary'
                              : 'bg-success'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            type="button"
                            onClick={() => handleDelete(user.id)}
                            className="btn btn-outline-danger btn-sm"
                            title={isOwnAccount ? 'You cannot delete your own account' : 'Delete user'}
                            disabled={isOwnAccount}
                            aria-disabled={isOwnAccount}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Add New User
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-semibold">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="fullName" className="form-label fw-semibold">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className="form-control"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                    />
                    <div className="form-text">Minimum 8 characters</div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="pin" className="form-label fw-semibold">
                      POS PIN (optional)
                    </label>
                    <input
                      id="pin"
                      name="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      className="form-control"
                      value={formData.pin}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-0">
                    <label htmlFor="role" className="form-label fw-semibold">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="TELLER">Teller / Cashier</option>
                      <option value="MANAGER">Manager</option>
                      <option value="INVENTORY">Inventory</option>
                      <option value="ACCOUNTANT">Accountant</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;


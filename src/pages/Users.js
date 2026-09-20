import React, { useState, useEffect } from 'react';
import { userService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import PaginationBar from '../components/PaginationBar';
import { usePagination } from '../hooks/usePagination';
import { useTranslation } from 'react-i18next';

const Users = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
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

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    pageSize,
  } = usePagination(users);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddModal = () => {
    setFormData({
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
    const ok = await confirm({
      title: t('deleteUser'),
      message: t('deleteUserConfirm'),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await userService.delete(id);
      setSuccess('User deleted successfully');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" aria-hidden="true">
            <span className="visually-hidden">{t('loading')}</span>
          </div>
          <p className="text-muted mt-2">{t('loadingUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid matte-page admin-page users-page table-page">
      {/* Header */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
            <div className="d-flex align-items-center mb-3 mb-lg-0">
              <div>
                <h1 className="h3 mb-1">{t('userManagement')}</h1>
                <p className="text-muted small mb-0">{t('usersSubtitle')}</p>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3">
              <button type="button" onClick={openAddModal} className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i>
                {t('addNewUser')}
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
      <div className="card table-panel">
        <div className="card-body p-0">
          {users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">{t('noUsersFound')}</h5>
              <p className="text-muted">{t('addFirstUser')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover admin-table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">{t('email')}</th>
                    <th className="border-0 fw-semibold">{t('name')}</th>
                    <th className="border-0 fw-semibold">{t('role')}</th>
                    <th className="border-0 fw-semibold">{t('createdAt')}</th>
                    <th className="border-0 fw-semibold">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((user) => {
                    const isOwnAccount =
                      currentUser && String(user.id) === String(currentUser.id);

                    return (
                    <tr key={user.id}>
                      <td className="fw-semibold">
                        {user.email || '-'}
                        {isOwnAccount && (
                          <span className="badge bg-light text-muted border ms-2">{t('you')}</span>
                        )}
                      </td>
                      <td className="text-muted">{user.full_name || user.fullName || '-'}</td>
                      <td>
                        <span
                          className={`badge ${
                            ['admin', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role)
                              ? 'bg-primary'
                              : 'bg-success'
                          }`}
                        >
                          {user.role === 'TELLER'
                            ? t('tellerCashier')
                            : user.role === 'MANAGER'
                              ? t('manager')
                              : user.role === 'INVENTORY'
                                ? t('inventory')
                                : user.role === 'ACCOUNTANT'
                                  ? t('accountant')
                                  : t('admin')}
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
                            title={isOwnAccount ? t('cannotDeleteOwn') : t('deleteUser')}
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
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            label={t('users')}
          />
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block users-add-modal-backdrop" tabIndex={-1}>
          <div className="modal-dialog users-add-modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  {t('addNewUser')}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger py-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label htmlFor="email" className="form-label fw-semibold">
                        {t('email')}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-control form-control-sm"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="staff@store.com"
                        required
                        autoFocus
                      />
                      <div className="form-text">
                        {t('emailUniqueHelp')}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="fullName" className="form-label fw-semibold">
                        {t('fullName')}
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="password" className="form-label fw-semibold">
                        {t('password')}
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        className="form-control form-control-sm"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={8}
                      />
                      <div className="form-text">{t('minCharacters')}</div>
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="pin" className="form-label fw-semibold">
                        {t('posPin')} <span className="text-muted fw-normal">({t('optional')})</span>
                      </label>
                      <input
                        id="pin"
                        name="pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        className="form-control form-control-sm"
                        value={formData.pin}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="role" className="form-label fw-semibold">
                        {t('role')}
                      </label>
                      <select
                        id="role"
                        name="role"
                        className="form-select form-select-sm"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="TELLER">{t('tellerCashier')}</option>
                        <option value="MANAGER">{t('manager')}</option>
                        <option value="INVENTORY">{t('inventory')}</option>
                        <option value="ACCOUNTANT">{t('accountant')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer justify-content-end">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {t('createUser')}
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


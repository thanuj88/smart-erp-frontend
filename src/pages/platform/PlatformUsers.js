import React, { useEffect, useMemo, useState } from 'react';
import { platformService } from '../../services';
import { needsTenantUsernamePrefix, usernamePrefixFromSlug } from '../../utils/staffUsername';

const STAFF_ROLES = ['TENANT_ADMIN', 'MANAGER', 'TELLER', 'INVENTORY', 'ACCOUNTANT'];
const PLATFORM_ROLES = ['SUPER_ADMIN', ...STAFF_ROLES];

const emptyForm = () => ({
  tenantId: '',
  username: '',
  email: '',
  password: '',
  role: 'MANAGER',
  fullName: '',
  pin: '',
});

const PlatformUsers = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [u, t] = await Promise.all([platformService.listUsers(), platformService.listTenants()]);
    setUsers(u);
    setTenants(t);
  };

  useEffect(() => {
    load().catch(() => setError('Load failed'));
  }, []);

  const selectedTenant = useMemo(
    () => tenants.find((t) => String(t.id) === String(form.tenantId)),
    [tenants, form.tenantId]
  );

  const usernamePrefix = useMemo(() => {
    if (!needsTenantUsernamePrefix(form.role) || !selectedTenant) return '';
    return usernamePrefixFromSlug(selectedTenant.slug);
  }, [form.role, selectedTenant]);

  const openCreate = () => {
    setForm(emptyForm());
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm());
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.role !== 'SUPER_ADMIN' && !form.tenantId) {
        setError('Select a tenant for store users.');
        return;
      }
      await platformService.createUser({
        ...form,
        tenantId: form.role === 'SUPER_ADMIN' ? null : String(form.tenantId),
        pin: form.role === 'TELLER' ? form.pin : undefined,
      });
      closeModal();
      await load();
      setMessage('User created.');
    } catch (err) {
      setError(err.response?.data?.error || 'Create failed');
    }
  };

  const changeRole = async (id, role) => {
    setError('');
    try {
      await platformService.updateUser(id, { role });
      await load();
      setMessage('User role updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="page-content">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="h3 mb-0">Platform Users</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>
          Add user
        </button>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      {error && !showModal && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Username</th>
                <th>Tenant</th>
                <th>Role</th>
                <th>Active</th>
                <th>Change role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="fw-semibold">{u.username}</td>
                  <td>{u.tenant_name || 'Platform'}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? 'Yes' : 'No'}</td>
                  <td>
                    {u.role !== 'SUPER_ADMIN' ? (
                      <select
                        className="form-select form-select-sm"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        {STAFF_ROLES.concat(['TENANT_ADMIN']).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create user</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <form onSubmit={submit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tenant</label>
                      <select
                        className="form-select"
                        value={form.tenantId}
                        onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                        required={form.role !== 'SUPER_ADMIN'}
                        disabled={form.role === 'SUPER_ADMIN'}
                      >
                        <option value="">
                          {form.role === 'SUPER_ADMIN' ? 'Platform (none)' : 'Select tenant *'}
                        </option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Role</label>
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            role: e.target.value,
                            tenantId: e.target.value === 'SUPER_ADMIN' ? '' : form.tenantId,
                          })
                        }
                      >
                        {PLATFORM_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Username</label>
                      {usernamePrefix ? (
                        <>
                          <div className="input-group">
                            <span className="input-group-text text-muted">{usernamePrefix}</span>
                            <input
                              className="form-control"
                              placeholder="e.g. john"
                              value={form.username}
                              onChange={(e) => setForm({ ...form, username: e.target.value })}
                              required
                              autoFocus
                            />
                          </div>
                          <div className="form-text">Saved as {usernamePrefix}your-name for this store.</div>
                        </>
                      ) : (
                        <input
                          className="form-control"
                          placeholder="Username *"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          required
                          autoFocus
                        />
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Password</label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full name</label>
                      <input
                        className="form-control"
                        placeholder="Optional"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        className="form-control"
                        type="email"
                        placeholder="Optional"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    {form.role === 'TELLER' && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">POS PIN</label>
                        <input
                          className="form-control"
                          type="password"
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="Optional"
                          value={form.pin}
                          onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create user
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

export default PlatformUsers;

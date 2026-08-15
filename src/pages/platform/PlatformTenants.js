import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const emptyForm = () => ({
  name: '',
  slug: '',
  planCode: 'trial',
  adminUsername: '',
  adminEmail: '',
  adminPassword: '',
  adminFullName: '',
});

const PlatformTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    const [t, p] = await Promise.all([platformService.listTenants(), platformService.listPlans()]);
    setTenants(t);
    setPlans(p);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.error || 'Load failed'));
  }, []);

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
      await platformService.createTenant(form);
      closeModal();
      await load();
      setMessage('Tenant created.');
    } catch (err) {
      setError(err.response?.data?.error || 'Create failed');
    }
  };

  const changePlan = async (tenantId, planCode) => {
    try {
      await platformService.assignTenantPlan(tenantId, planCode);
      await load();
      setMessage('Plan updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="h3 mb-0">Tenants</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>
          Create tenant
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
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Assign plan</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="fw-semibold">{t.name}</td>
                  <td><code>{t.slug}</code></td>
                  <td><span className="badge bg-secondary">{t.status}</span></td>
                  <td>{t.plan_code || '—'}</td>
                  <td>{t.user_count}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      defaultValue={t.plan_code || 'trial'}
                      onChange={(e) => changePlan(t.id, e.target.value)}
                    >
                      {plans.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
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
                <h5 className="modal-title">Create tenant</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <form onSubmit={submit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="tenantName" className="form-label fw-semibold">Business name</label>
                      <input
                        id="tenantName"
                        className="form-control"
                        placeholder="Store name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="tenantSlug" className="form-label fw-semibold">Slug</label>
                      <input
                        id="tenantSlug"
                        className="form-control"
                        placeholder="Optional — auto-generated from name"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="planCode" className="form-label fw-semibold">Plan</label>
                      <select
                        id="planCode"
                        className="form-select"
                        value={form.planCode}
                        onChange={(e) => setForm({ ...form, planCode: e.target.value })}
                      >
                        {plans.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="adminUsername" className="form-label fw-semibold">Admin username</label>
                      <input
                        id="adminUsername"
                        className="form-control"
                        placeholder="Tenant admin login"
                        value={form.adminUsername}
                        onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="adminPassword" className="form-label fw-semibold">Admin password</label>
                      <input
                        id="adminPassword"
                        className="form-control"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={form.adminPassword}
                        onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="adminEmail" className="form-label fw-semibold">Admin email</label>
                      <input
                        id="adminEmail"
                        className="form-control"
                        type="email"
                        placeholder="Optional"
                        value={form.adminEmail}
                        onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="adminFullName" className="form-label fw-semibold">Admin full name</label>
                      <input
                        id="adminFullName"
                        className="form-control"
                        placeholder="Optional"
                        value={form.adminFullName}
                        onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create tenant
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

export default PlatformTenants;

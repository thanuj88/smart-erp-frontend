import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  priceMonthly: '',
  maxTellers: '',
  maxManagers: '',
  maxAccountants: '',
});

const parseLimit = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const formatLimit = (value) => (value === null || value === undefined ? '∞' : value);

const PlatformPlans = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingCode, setEditingCode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => platformService.listPlans().then(setPlans);

  useEffect(() => {
    load().catch(() => setError('Failed to load plans'));
  }, []);

  const openCreate = () => {
    setEditingCode(null);
    setForm(emptyForm());
    setError('');
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingCode(plan.code);
    setForm({
      code: plan.code,
      name: plan.name || '',
      description: plan.description || '',
      priceMonthly: plan.price_monthly ?? '',
      maxTellers: plan.max_tellers ?? '',
      maxManagers: plan.max_managers ?? '',
      maxAccountants: plan.max_accountants ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setForm(emptyForm());
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const buildPayload = () => ({
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    priceMonthly: parseFloat(form.priceMonthly) || 0,
    maxTellers: parseLimit(form.maxTellers),
    maxManagers: parseLimit(form.maxManagers),
    maxAccountants: parseLimit(form.maxAccountants),
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = buildPayload();
      if (!payload.code || !payload.name) {
        setError('Code and name are required.');
        return;
      }
      if (editingCode) {
        await platformService.updatePlan(editingCode, payload);
        setMessage('Plan updated.');
      } else {
        await platformService.createPlan(payload);
        setMessage('Plan created.');
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  return (
    <div className="page-content">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="h3 mb-0">SaaS Plans</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>
          Add plan
        </button>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Price/mo</th>
                <th>Tellers</th>
                <th>Managers</th>
                <th>Accountants</th>
                <th>Description</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.code}>
                  <td><code>{p.code}</code></td>
                  <td className="fw-semibold">{p.name}</td>
                  <td>${p.price_monthly ?? 0}</td>
                  <td>{formatLimit(p.max_tellers)}</td>
                  <td>{formatLimit(p.max_managers)}</td>
                  <td>{formatLimit(p.max_accountants)}</td>
                  <td className="text-muted">{p.description || '—'}</td>
                  <td className="text-end">
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openEdit(p)}>
                      Edit
                    </button>
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
                <h5 className="modal-title">{editingCode ? 'Edit plan' : 'Create plan'}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <form onSubmit={submit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="planCode" className="form-label fw-semibold">Code</label>
                      <input
                        id="planCode"
                        name="code"
                        className="form-control"
                        value={form.code}
                        onChange={handleChange}
                        required
                        disabled={!!editingCode}
                        placeholder="e.g. starter"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="planName" className="form-label fw-semibold">Name</label>
                      <input
                        id="planName"
                        name="name"
                        className="form-control"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Starter"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="priceMonthly" className="form-label fw-semibold">Price / month ($)</label>
                      <input
                        id="priceMonthly"
                        name="priceMonthly"
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={form.priceMonthly}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="maxTellers" className="form-label fw-semibold">Max tellers</label>
                      <input
                        id="maxTellers"
                        name="maxTellers"
                        type="number"
                        min="0"
                        className="form-control"
                        value={form.maxTellers}
                        onChange={handleChange}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="maxManagers" className="form-label fw-semibold">Max managers</label>
                      <input
                        id="maxManagers"
                        name="maxManagers"
                        type="number"
                        min="0"
                        className="form-control"
                        value={form.maxManagers}
                        onChange={handleChange}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="maxAccountants" className="form-label fw-semibold">Max accountants</label>
                      <input
                        id="maxAccountants"
                        name="maxAccountants"
                        type="number"
                        min="0"
                        className="form-control"
                        value={form.maxAccountants}
                        onChange={handleChange}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="description" className="form-label fw-semibold">Description</label>
                      <input
                        id="description"
                        name="description"
                        className="form-control"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Short plan description"
                      />
                    </div>
                    <div className="col-12">
                      <p className="form-text mb-0">
                        Leave role limits empty for unlimited. Store admins cannot add users beyond these counts for their subscription plan.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCode ? 'Save changes' : 'Create plan'}
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

export default PlatformPlans;

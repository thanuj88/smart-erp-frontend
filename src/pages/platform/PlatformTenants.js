import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const PlatformTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    planCode: 'trial',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
  });

  const load = async () => {
    const [t, p] = await Promise.all([platformService.listTenants(), platformService.listPlans()]);
    setTenants(t);
    setPlans(p);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => setMessage(e.response?.data?.error || 'Load failed'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await platformService.createTenant(form);
      setShowForm(false);
      setForm({ name: '', slug: '', planCode: 'trial', adminUsername: '', adminEmail: '', adminPassword: '', adminFullName: '' });
      await load();
      setMessage('Tenant created.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Create failed');
    }
  };

  const changePlan = async (tenantId, planCode) => {
    try {
      await platformService.assignTenantPlan(tenantId, planCode);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Update failed');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Tenants</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create tenant'}
        </button>
      </div>
      {message && <div className="alert alert-info">{message}</div>}

      {showForm && (
        <form className="card card-body mb-4" onSubmit={submit}>
          <div className="row g-2">
            <div className="col-md-6"><input className="form-control" placeholder="Business name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="col-md-4">
              <select className="form-select" value={form.planCode} onChange={(e) => setForm({ ...form, planCode: e.target.value })}>
                {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-md-4"><input className="form-control" placeholder="Admin username *" value={form.adminUsername} onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} required /></div>
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Admin password *" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Admin email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Admin full name" value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn btn-primary mt-3">Create</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
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
                <td>{t.name}</td>
                <td>{t.slug}</td>
                <td><span className="badge bg-secondary">{t.status}</span></td>
                <td>{t.plan_code || '—'}</td>
                <td>{t.user_count}</td>
                <td>
                  <select className="form-select form-select-sm" defaultValue={t.plan_code || 'trial'} onChange={(e) => changePlan(t.id, e.target.value)}>
                    {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformTenants;

import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const PlatformPlans = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '', priceMonthly: 0, maxUsers: '' });
  const [message, setMessage] = useState('');

  const load = () => platformService.listPlans().then(setPlans);

  useEffect(() => {
    load().catch(() => setMessage('Failed to load plans'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await platformService.createPlan({
        ...form,
        priceMonthly: parseFloat(form.priceMonthly) || 0,
        maxUsers: form.maxUsers ? parseInt(form.maxUsers, 10) : null,
      });
      setForm({ code: '', name: '', description: '', priceMonthly: 0, maxUsers: '' });
      await load();
      setMessage('Plan created.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Create failed');
    }
  };

  return (
    <div className="page-content">
      <h1>SaaS Plans</h1>
      {message && <div className="alert alert-info">{message}</div>}

      <form className="card card-body mb-4" onSubmit={submit}>
        <h5>Create plan</h5>
        <div className="row g-2">
          <div className="col-md-3"><input className="form-control" placeholder="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="col-md-2"><input className="form-control" type="number" placeholder="Price/mo" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Max users" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} /></div>
          <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">Add</button></div>
          <div className="col-12"><input className="form-control" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </form>

      <table className="table">
        <thead><tr><th>Code</th><th>Name</th><th>Price/mo</th><th>Max users</th><th>Description</th></tr></thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.code}>
              <td><code>{p.code}</code></td>
              <td>{p.name}</td>
              <td>${p.price_monthly}</td>
              <td>{p.max_users ?? '∞'}</td>
              <td>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlatformPlans;

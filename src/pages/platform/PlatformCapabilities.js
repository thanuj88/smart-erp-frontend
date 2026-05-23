import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const PlatformCapabilities = () => {
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', category: 'custom' });
  const [message, setMessage] = useState('');

  const load = () => platformService.listPermissions().then(setPermissions);

  useEffect(() => {
    load().catch(() => setMessage('Load failed'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await platformService.createPermission(form);
      setForm({ code: '', name: '', category: 'custom' });
      await load();
      setMessage('Capability created. Assign it to roles on the Roles page.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Create failed');
    }
  };

  const grouped = permissions.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="page-content">
      <h1>Capabilities</h1>
      <p className="text-muted">Capability codes gate API routes and UI features. Assign them to roles.</p>
      {message && <div className="alert alert-info">{message}</div>}

      <form className="card card-body mb-4" onSubmit={submit}>
        <h5>Create capability</h5>
        <div className="row g-2">
          <div className="col-md-4"><input className="form-control" placeholder="code e.g. sales:export *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Display name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">Add</button></div>
        </div>
      </form>

      {Object.entries(grouped).map(([cat, perms]) => (
        <div key={cat} className="card mb-3">
          <div className="card-header text-capitalize">{cat}</div>
          <ul className="list-group list-group-flush">
            {perms.map((p) => (
              <li key={p.code} className="list-group-item d-flex justify-content-between">
                <span><code>{p.code}</code> — {p.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PlatformCapabilities;

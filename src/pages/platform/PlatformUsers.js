import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const STAFF_ROLES = ['TENANT_ADMIN', 'MANAGER', 'TELLER', 'INVENTORY', 'ACCOUNTANT'];

const PlatformUsers = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ tenantId: '', username: '', email: '', password: '', role: 'MANAGER', fullName: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const [u, t] = await Promise.all([platformService.listUsers(), platformService.listTenants()]);
    setUsers(u);
    setTenants(t);
  };

  useEffect(() => {
    load().catch(() => setMessage('Load failed'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await platformService.createUser({
        ...form,
        tenantId: form.tenantId ? parseInt(form.tenantId, 10) : null,
      });
      setForm({ tenantId: '', username: '', email: '', password: '', role: 'MANAGER', fullName: '' });
      await load();
      setMessage('User created.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Create failed');
    }
  };

  const changeRole = async (id, role) => {
    try {
      await platformService.updateUser(id, { role });
      await load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="page-content">
      <h1>Platform Users</h1>
      {message && <div className="alert alert-info">{message}</div>}

      <form className="card card-body mb-4" onSubmit={submit}>
        <h5>Create user</h5>
        <div className="row g-2">
          <div className="col-md-3">
            <select className="form-select" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} required>
              <option value="">Select tenant *</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="col-md-2"><input className="form-control" placeholder="Username *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="col-md-2"><input className="form-control" type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <div className="col-md-2">
            <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">Add</button></div>
        </div>
      </form>

      <table className="table table-striped">
        <thead><tr><th>Username</th><th>Tenant</th><th>Role</th><th>Active</th><th>Change role</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.tenant_name || 'Platform'}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? 'Yes' : 'No'}</td>
              <td>
                {u.role !== 'SUPER_ADMIN' ? (
                  <select className="form-select form-select-sm" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    {STAFF_ROLES.concat(['TENANT_ADMIN']).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlatformUsers;

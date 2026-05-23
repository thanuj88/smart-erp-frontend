import React, { useEffect, useState } from 'react';
import { platformService } from '../services';

const PlatformRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newRole, setNewRole] = useState({ code: '', name: '', description: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [rolesData, permsData] = await Promise.all([
          platformService.listRoles(),
          platformService.listPermissions(),
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
      } catch (err) {
        setMessage(err.response?.data?.error || 'Failed to load platform data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectRole = async (code) => {
    setMessage('');
    const detail = await platformService.getRole(code);
    setSelectedRole(detail);
    setSelectedPerms(detail.permissions || []);
  };

  const togglePerm = (code) => {
    if (selectedRole?.system) return;
    setSelectedPerms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const save = async () => {
    if (!selectedRole || selectedRole.system) return;
    setSaving(true);
    setMessage('');
    try {
      await platformService.updateRolePermissions(selectedRole.code, selectedPerms);
      setMessage('Saved. Users with this role must sign in again for changes to apply.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (e) => {
    e.preventDefault();
    try {
      await platformService.createRole(newRole);
      setNewRole({ code: '', name: '', description: '' });
      const rolesData = await platformService.listRoles();
      setRoles(rolesData);
      setMessage('Role created.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Create failed');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <div className="page-content">
      <h1>Roles</h1>
      <p className="text-muted">Assign capabilities to each role. Changes apply after users sign in again.</p>
      {message && <div className="alert alert-info">{message}</div>}

      <form className="card card-body mb-4" onSubmit={createRole}>
        <h5>Create role</h5>
        <div className="row g-2">
          <div className="col-md-3"><input className="form-control" placeholder="Code e.g. SUPERVISOR" value={newRole.code} onChange={(e) => setNewRole({ ...newRole, code: e.target.value })} required /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Description" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} /></div>
          <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">Add role</button></div>
        </div>
      </form>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">Roles</div>
            <ul className="list-group list-group-flush">
              {roles.map((r) => (
                <button
                  key={r.code}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    selectedRole?.code === r.code ? 'active' : ''
                  }`}
                  onClick={() => selectRole(r.code)}
                >
                  {r.name || r.code}
                  {r.system && <span className="badge bg-secondary ms-2">system</span>}
                </button>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-8">
          {selectedRole ? (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>{selectedRole.name || selectedRole.code}</span>
                {!selectedRole.system && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    onClick={save}
                  >
                    {saving ? 'Saving…' : 'Save capabilities'}
                  </button>
                )}
              </div>
              <div className="card-body">
                {selectedRole.system && (
                  <p className="text-muted">System role — capabilities cannot be edited.</p>
                )}
                <div className="row">
                  {permissions.map((p) => (
                    <div key={p.code} className="col-md-6 mb-2">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedPerms.includes(p.code)}
                          disabled={selectedRole.system}
                          onChange={() => togglePerm(p.code)}
                        />
                        <span className="form-check-label">
                          <strong>{p.code}</strong>
                          <br />
                          <small className="text-muted">{p.name}</small>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted">Select a role to edit capabilities.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformRoles;

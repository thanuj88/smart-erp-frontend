import React, { useEffect, useState } from 'react';
import { platformService } from '../services';

const emptyRoleForm = () => ({ code: '', name: '', description: '' });

const PlatformRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState(emptyRoleForm());

  const loadRoles = async () => {
    const rolesData = await platformService.listRoles();
    setRoles(rolesData);
    return rolesData;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [, permsData] = await Promise.all([
          loadRoles(),
          platformService.listPermissions(),
        ]);
        setPermissions(permsData);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load platform data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openCreate = () => {
    setNewRole(emptyRoleForm());
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewRole(emptyRoleForm());
    setError('');
  };

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
    setError('');
    try {
      await platformService.updateRolePermissions(selectedRole.code, selectedPerms);
      setMessage('Saved. Users with this role must sign in again for changes to apply.');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const created = await platformService.createRole({
        code: newRole.code.trim(),
        name: newRole.name.trim(),
        description: newRole.description.trim() || undefined,
      });
      closeModal();
      await loadRoles();
      setMessage('Role created.');
      await selectRole(created.code || newRole.code.trim().toUpperCase().replace(/\s+/g, '_'));
    } catch (err) {
      setError(err.response?.data?.error || 'Create failed');
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
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
        <div>
          <h1 className="h3 mb-1">Roles</h1>
          <p className="text-muted mb-0">
            Assign capabilities to each role. Changes apply after users sign in again.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-circle me-2"></i>
          Add role
        </button>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show mt-3" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      {error && !showModal && (
        <div className="alert alert-danger alert-dismissible fade show mt-3" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
        </div>
      )}

      <div className="row g-4 mt-2">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header fw-semibold">Roles</div>
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
                <span className="fw-semibold">{selectedRole.name || selectedRole.code}</span>
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
                {selectedRole.description && (
                  <p className="text-muted small">{selectedRole.description}</p>
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

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create role</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <form onSubmit={createRole}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="mb-3">
                    <label htmlFor="roleCode" className="form-label fw-semibold">
                      Code
                    </label>
                    <input
                      id="roleCode"
                      className="form-control"
                      placeholder="e.g. SUPERVISOR"
                      value={newRole.code}
                      onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                      required
                      autoFocus
                    />
                    <div className="form-text">Stored uppercase with underscores (e.g. FLOOR_MANAGER).</div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="roleName" className="form-label fw-semibold">
                      Name
                    </label>
                    <input
                      id="roleName"
                      className="form-control"
                      placeholder="Display name"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-0">
                    <label htmlFor="roleDescription" className="form-label fw-semibold">
                      Description
                    </label>
                    <input
                      id="roleDescription"
                      className="form-control"
                      placeholder="Optional"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create role
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

export default PlatformRoles;

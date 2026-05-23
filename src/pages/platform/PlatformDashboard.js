import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformService } from '../../services';

const PlatformDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformService.getReports().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <h1>Platform Dashboard</h1>
      <p className="text-muted">Overview of tenants, subscriptions, and users.</p>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="fs-2 fw-bold">{data.tenants}</div>
            <div className="text-muted">Tenants</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="fs-2 fw-bold">{data.activeTenants}</div>
            <div className="text-muted">Active</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="fs-2 fw-bold">{data.trialing}</div>
            <div className="text-muted">Trialing</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="fs-2 fw-bold">{data.users}</div>
            <div className="text-muted">Users</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Tenants by plan</div>
            <ul className="list-group list-group-flush">
              {(data.byPlan || []).map((p) => (
                <li key={p.plan_code} className="list-group-item d-flex justify-content-between">
                  <span>{p.plan_code}</span>
                  <span className="badge bg-primary">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between">
              <span>Recent tenants</span>
              <Link to="/platform/tenants">View all</Link>
            </div>
            <ul className="list-group list-group-flush">
              {(data.recentTenants || []).map((t) => (
                <li key={t.id} className="list-group-item">
                  <strong>{t.name}</strong>
                  <span className="text-muted ms-2">({t.slug})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;

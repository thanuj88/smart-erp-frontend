import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';

const PlatformReports = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    platformService.getReports().then(setData);
  }, []);

  if (!data) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <h1>Platform Reports</h1>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Subscriptions by plan</div>
            <table className="table mb-0">
              <tbody>
                {(data.byPlan || []).map((r) => (
                  <tr key={r.plan_code}><td>{r.plan_code}</td><td>{r.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Users by role</div>
            <table className="table mb-0">
              <tbody>
                {(data.byRole || []).map((r) => (
                  <tr key={r.role}><td>{r.role}</td><td>{r.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformReports;

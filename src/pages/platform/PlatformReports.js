import React, { useEffect, useState } from 'react';
import { platformService } from '../../services';
import PaginationBar from '../../components/PaginationBar';
import { usePagination } from '../../hooks/usePagination';

const PlatformReports = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    platformService.getReports().then(setData);
  }, []);

  const byPlan = data?.byPlan || [];
  const byRole = data?.byRole || [];
  const planPaging = usePagination(byPlan);
  const rolePaging = usePagination(byRole);

  if (!data) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-content table-page">
      <h1>Platform Reports</h1>
      <div className="row g-4 flex-grow-1 min-h-0">
        <div className="col-md-6 d-flex">
          <div className="card table-panel w-100">
            <div className="card-header">Subscriptions by plan</div>
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <tbody>
                  {planPaging.pageItems.map((r) => (
                    <tr key={r.plan_code}><td>{r.plan_code}</td><td>{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={planPaging.page}
              totalPages={planPaging.totalPages}
              total={planPaging.total}
              pageSize={planPaging.pageSize}
              onPageChange={planPaging.setPage}
              label="plans"
            />
          </div>
        </div>
        <div className="col-md-6 d-flex">
          <div className="card table-panel w-100">
            <div className="card-header">Users by role</div>
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <tbody>
                  {rolePaging.pageItems.map((r) => (
                    <tr key={r.role}><td>{r.role}</td><td>{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={rolePaging.page}
              totalPages={rolePaging.totalPages}
              total={rolePaging.total}
              pageSize={rolePaging.pageSize}
              onPageChange={rolePaging.setPage}
              label="roles"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformReports;

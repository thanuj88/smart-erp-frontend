import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService, itemService, promotionService } from '../services';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';
import { useConfirm } from '../contexts/ConfirmContext';
import { addDays, localToday, promotionStatus } from '../utils/promotions';

const EMPTY_FORM = {
  name: '',
  percent: '',
  start_date: localToday(),
  end_date: addDays(localToday(), 30),
  applies_to: 'all',
  category_ids: [],
  item_ids: [],
  active: true,
};

const STATUS_CLASS = {
  active: 'bg-success',
  scheduled: 'bg-info',
  expired: 'bg-secondary',
  inactive: 'bg-warning text-dark',
};

const STATUS_LABEL = {
  active: 'promoStatusActive',
  scheduled: 'promoStatusScheduled',
  expired: 'promoStatusExpired',
  inactive: 'promoStatusInactive',
};

function Promotions() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [itemSearch, setItemSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);
      const [promoData, categoryData, itemData] = await Promise.all([
        promotionService.getAll(),
        categoryService.getAll(),
        itemService.getAll(),
      ]);
      setPromotions(promoData || []);
      setCategories(categoryData || []);
      setItems(itemData || []);
    } catch (err) {
      setError(t('Failed to load promotions'));
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoryName = (id) => categories.find((c) => String(c.id) === String(id))?.name || id;

  const scopeLabel = (promo) => {
    if (promo.applies_to === 'categories') {
      const names = (promo.category_ids || []).map(categoryName);
      return names.length ? names.join(', ') : t('Selected categories');
    }
    if (promo.applies_to === 'items') {
      const count = (promo.item_ids || []).length;
      return t('Selected items count', { count });
    }
    return t('All categories');
  };

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (item.name || '').toLowerCase().includes(q));
  }, [items, itemSearch]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setItemSearch('');
    setFormData({ ...EMPTY_FORM, start_date: localToday(), end_date: addDays(localToday(), 30) });
  };

  const handleAddNew = () => {
    setEditing(null);
    setItemSearch('');
    setFormData({ ...EMPTY_FORM, start_date: localToday(), end_date: addDays(localToday(), 30) });
    setShowModal(true);
  };

  const handleEdit = (promo) => {
    setEditing(promo);
    setItemSearch('');
    setFormData({
      name: promo.name || '',
      percent: promo.percent ?? '',
      start_date: promo.start_date || localToday(),
      end_date: promo.end_date || addDays(localToday(), 30),
      applies_to: promo.applies_to || 'all',
      category_ids: (promo.category_ids || []).map(String),
      item_ids: (promo.item_ids || []).map(String),
      active: promo.active !== false,
    });
    setShowModal(true);
  };

  const toggleId = (field, id) => {
    const key = String(id);
    setFormData((prev) => {
      const current = prev[field] || [];
      const next = current.includes(key) ? current.filter((value) => value !== key) : [...current, key];
      return { ...prev, [field]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.applies_to === 'categories' && formData.category_ids.length === 0) {
      setError(t('Select at least one category'));
      return;
    }
    if (formData.applies_to === 'items' && formData.item_ids.length === 0) {
      setError(t('Select at least one item'));
      return;
    }
    if (formData.end_date < formData.start_date) {
      setError(t('End date must be on or after the start date'));
      return;
    }

    const payload = {
      name: formData.name.trim(),
      percent: Number(formData.percent),
      start_date: formData.start_date,
      end_date: formData.end_date,
      applies_to: formData.applies_to,
      category_ids: formData.applies_to === 'categories' ? formData.category_ids : [],
      item_ids: formData.applies_to === 'items' ? formData.item_ids : [],
      active: formData.active,
    };

    try {
      if (editing) {
        await promotionService.update(editing.id, payload);
        setSuccess(t('Promotion updated successfully'));
      } else {
        await promotionService.create(payload);
        setSuccess(t('Promotion created successfully'));
      }
      await loadPage();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to save promotion'));
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('Delete promotion'),
      message: t('Are you sure you want to delete this promotion?'),
      confirmLabel: t('Delete'),
      cancelLabel: t('Cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await promotionService.delete(id);
      setSuccess(t('Promotion deleted successfully'));
      await loadPage();
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to delete promotion'));
    }
  };

  if (loading) {
    return <AdminLoading message={t('Loading promotions...')} />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page">
      <PageHeader
        title={t('Promotions')}
        subtitle={t('Create percentage promotions for categories or items.')}
        actions={
          <button type="button" onClick={handleAddNew} className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            {t('Add Promotion')}
          </button>
        }
      />

      <AdminAlerts
        success={success}
        error={error}
        onClearSuccess={() => setSuccess('')}
        onClearError={() => setError('')}
      />

      <div className="card">
        <div className="card-body p-0">
          {promotions.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-megaphone display-6 text-muted d-block mb-3"></i>
              <h5 className="text-muted">{t('No promotions found')}</h5>
              <p className="text-muted mb-0">{t('Add your first promotion to get started!')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover admin-table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">{t('Promotion')}</th>
                    <th className="border-0 fw-semibold">{t('Discount')}</th>
                    <th className="border-0 fw-semibold">{t('Applies to')}</th>
                    <th className="border-0 fw-semibold">{t('Valid period')}</th>
                    <th className="border-0 fw-semibold">{t('Status')}</th>
                    <th className="border-0 fw-semibold">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => {
                    const status = promotionStatus(promo);
                    return (
                      <tr key={promo.id}>
                        <td className="fw-semibold">{promo.name}</td>
                        <td>{Number(promo.percent || 0)}%</td>
                        <td className="text-muted">{scopeLabel(promo)}</td>
                        <td className="text-muted">
                          {promo.start_date} → {promo.end_date}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_CLASS[status] || 'bg-secondary'}`}>
                            {t(STATUS_LABEL[status] || status)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              type="button"
                              onClick={() => handleEdit(promo)}
                              className="btn btn-outline-primary btn-sm"
                              title={t('Edit')}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(promo.id)}
                              className="btn btn-outline-danger btn-sm"
                              title={t('Delete')}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-megaphone me-2"></i>
                  {editing ? t('Edit Promotion') : t('Add New Promotion')}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label htmlFor="promo-name" className="form-label fw-semibold">
                        {t('Promotion name')} *
                      </label>
                      <input
                        id="promo-name"
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('e.g., Summer sale')}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="promo-percent" className="form-label fw-semibold">
                        {t('Discount')} % *
                      </label>
                      <input
                        id="promo-percent"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        className="form-control"
                        value={formData.percent}
                        onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
                        placeholder="10"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="promo-start" className="form-label fw-semibold">
                        {t('Start Date')} *
                      </label>
                      <input
                        id="promo-start"
                        type="date"
                        className="form-control"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="promo-end" className="form-label fw-semibold">
                        {t('End Date')} *
                      </label>
                      <input
                        id="promo-end"
                        type="date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <div className="fw-semibold mb-2">{t('Applies to')}</div>
                      <div className="d-flex flex-wrap gap-3">
                        {[
                          ['all', t('All categories')],
                          ['categories', t('Selected categories')],
                          ['items', t('Selected items')],
                        ].map(([value, label]) => (
                          <label key={value} className="form-check">
                            <input
                              type="radio"
                              className="form-check-input"
                              name="applies_to"
                              checked={formData.applies_to === value}
                              onChange={() => setFormData({ ...formData, applies_to: value })}
                            />
                            <span className="form-check-label">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.applies_to === 'categories' && (
                      <div className="col-12">
                        <div className="border rounded p-2 promotion-picker">
                          {categories.length === 0 ? (
                            <p className="text-muted small mb-0">{t('No categories found')}</p>
                          ) : (
                            categories.map((category) => (
                              <label key={category.id} className="form-check py-1">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={formData.category_ids.includes(String(category.id))}
                                  onChange={() => toggleId('category_ids', category.id)}
                                />
                                <span className="form-check-label">{category.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {formData.applies_to === 'items' && (
                      <div className="col-12">
                        <input
                          type="search"
                          className="form-control form-control-sm mb-2"
                          placeholder={t('Search items...')}
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                        />
                        <div className="border rounded p-2 promotion-picker">
                          {filteredItems.length === 0 ? (
                            <p className="text-muted small mb-0">{t('No items found')}</p>
                          ) : (
                            filteredItems.map((item) => (
                              <label key={item.id} className="form-check py-1">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={formData.item_ids.includes(String(item.id))}
                                  onChange={() => toggleId('item_ids', item.id)}
                                />
                                <span className="form-check-label">
                                  {item.name}
                                  {item.category ? (
                                    <span className="text-muted small"> · {item.category}</span>
                                  ) : null}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <span className="form-check-label">{t('Active')}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    {t('Cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {editing ? t('Update Promotion') : t('Create Promotion')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Promotions;

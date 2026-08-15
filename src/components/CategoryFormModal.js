import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '../services';
import CategoryIcon from './CategoryIcon';
import {
  DEFAULT_CATEGORY_ICON,
  filterCategoryIcons,
  isBsIconName,
} from '../config/categoryIcons';
import '../pages/Categories.css';

const CategoryFormModal = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: DEFAULT_CATEGORY_ICON,
  });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData({ name: '', description: '', icon: DEFAULT_CATEGORY_ICON });
    setShowIconPicker(false);
    setIconSearch('');
    setError('');
    setSaving(false);
  }, [open]);

  const filteredIcons = useMemo(() => filterCategoryIcons(iconSearch), [iconSearch]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const selectIcon = (icon) => {
    setFormData((prev) => ({ ...prev, icon }));
    setShowIconPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    const name = formData.name.trim();
    if (!name) {
      setError(t('Category name is required'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name,
        description: formData.description?.trim() || '',
        icon: isBsIconName(formData.icon) ? formData.icon : DEFAULT_CATEGORY_ICON,
      };
      const result = await categoryService.create(payload);
      const created = result.category || result;
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to save category'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal show d-block nested-category-modal"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nestedCategoryModalTitle"
      onClick={handleClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="nestedCategoryModalTitle">
              <i className="bi bi-tags me-2"></i>
              {t('Add New Category')}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={saving}
              aria-label={t('Close')}
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2 mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-semibold">{t('Icon')}</label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="btn btn-outline-secondary w-100 py-3 d-flex flex-column align-items-center category-icon-preview-btn"
                >
                  <CategoryIcon name={formData.icon} size={32} className="category-icon-preview" />
                  <span className="small text-muted">{t('Change Icon')}</span>
                </button>
                {showIconPicker && (
                  <div className="category-icon-picker border rounded p-3 mt-2">
                    <input
                      type="search"
                      className="form-control form-control-sm mb-2"
                      placeholder={t('Search icons...')}
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      aria-label={t('Search icons')}
                    />
                    <div className="category-icon-picker-grid">
                      {filteredIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => selectIcon(icon)}
                          className={`btn btn-sm category-icon-picker-btn ${
                            formData.icon === icon ? 'btn-primary' : 'btn-light'
                          }`}
                          title={icon}
                        >
                          <CategoryIcon name={icon} size={20} />
                        </button>
                      ))}
                    </div>
                    {filteredIcons.length === 0 && (
                      <p className="text-muted small text-center mb-0 mt-2">
                        {t('No icons match your search')}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="nested-cat-name" className="form-label fw-semibold">
                  {t('Category Name')} *
                </label>
                <input
                  id="nested-cat-name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('e.g., Electronics, Clothing, Food')}
                  required
                />
              </div>
              <div className="mb-0">
                <label htmlFor="nested-cat-desc" className="form-label fw-semibold">
                  {t('Description')}
                </label>
                <textarea
                  id="nested-cat-desc"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder={t('Optional description for this category')}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={saving}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <i className="bi bi-check-circle me-2"></i>
                {saving ? t('Saving...') : t('Create Category')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormModal;

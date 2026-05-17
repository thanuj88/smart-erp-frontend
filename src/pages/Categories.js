import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '../services';
import PageHeader from '../components/PageHeader';
import AdminAlerts from '../components/AdminAlerts';
import AdminLoading from '../components/AdminLoading';

// Font Awesome icon library - popular modern icons
const ICON_LIBRARY = [
  '📱', '💻', '🖥️', '⌚', '📷', '📹', '🎮', '🎧', '🎹', '🎸',
  '🎨', '✏️', '📚', '📖', '📝', '📌', '📍', '🔍', '🔎', '🔐',
  '🔑', '🔨', '🔧', '🔩', '⚙️', '⚡', '🔥', '💡', '🕯️', '💊',
  '💉', '🩺', '🏥', '🏪', '🏬', '🛒', '🛍️', '👕', '👔', '👗',
  '👠', '👟', '👞', '🎩', '👑', '💍', '💎', '🍔', '🍕', '🍗',
  '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🍱', '🍜', '🍝', '🍛',
  '🍚', '🍙', '🍣', '🍰', '🎂', '🧁', '🍪', '🍩', '🍺', '🍻',
  '☕', '🍵', '🥤', '🧃', '🍷', '🥂', '⚽', '🏀', '🏈', '⚾',
  '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥊', '🥋',
  '🎯', '🥅', '⛳', '🏹', '🎣', '🤿', '🥾', '⛷️', '🏂', '🏄',
  '🚴', '🏊', '🏋️', '🤸', '⛹️', '🤾', '🏌️', '🧘', '💐', '🌸',
  '🌺', '🌻', '🌷', '🌹', '🏵️', '🌲', '🌳', '🌴', '🌱', '🍀'
];

function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      setError(t('Failed to load categories'));
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        setSuccess(t('Category updated successfully'));
      } else {
        await categoryService.create(formData);
        setSuccess(t('Category created successfully'));
      }

      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to save category'));
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('Are you sure you want to delete this category?'))) {
      return;
    }

    try {
      await categoryService.delete(id);
      setSuccess(t('Category deleted successfully'));
      await fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete category'));
      console.error('Error deleting category:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📦'
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '📦'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowIconPicker(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '📦'
    });
  };

  const selectIcon = (icon) => {
    setFormData({ ...formData, icon });
    setShowIconPicker(false);
  };

  if (loading) {
    return <AdminLoading message={t('Loading categories...')} />;
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page">
      <PageHeader
        title={t('Category Management')}
        subtitle={t('Manage categories in one place.')}
        actions={
          <button type="button" onClick={handleAddNew} className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            {t('Add Category')}
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
          {categories.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tags text-muted fs-1 mb-3 d-block"></i>
              <h5 className="text-muted">{t('No categories found')}</h5>
              <p className="text-muted mb-0">{t('Add your first category to get started!')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover admin-table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold" style={{ width: 72 }}>{t('Icon')}</th>
                    <th className="border-0 fw-semibold">{t('Category')}</th>
                    <th className="border-0 fw-semibold">{t('Description')}</th>
                    <th className="border-0 fw-semibold">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="text-center fs-5">{category.icon || '📦'}</td>
                      <td className="fw-semibold">{category.name}</td>
                      <td className="text-muted">{category.description || '—'}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="btn btn-outline-primary btn-sm"
                            title={t('Edit')}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            className="btn btn-outline-danger btn-sm"
                            title={t('Delete')}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-tags me-2"></i>
                  {editingCategory ? t('Edit Category') : t('Add New Category')}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t('Icon')}</label>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="btn btn-outline-secondary w-100 py-3 d-flex flex-column align-items-center"
                    >
                      <span className="fs-2">{formData.icon}</span>
                      <span className="small text-muted">{t('Change Icon')}</span>
                    </button>
                    {showIconPicker && (
                      <div className="border rounded p-3 mt-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                        <div className="d-flex flex-wrap gap-1">
                          {ICON_LIBRARY.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => selectIcon(icon)}
                              className={`btn btn-sm ${formData.icon === icon ? 'btn-primary' : 'btn-light'}`}
                              style={{ width: 40, height: 40, fontSize: '1.1rem' }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="cat-name" className="form-label fw-semibold">{t('Category Name')} *</label>
                    <input
                      id="cat-name"
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('e.g., Electronics, Clothing, Food')}
                      required
                    />
                  </div>
                  <div className="mb-0">
                    <label htmlFor="cat-desc" className="form-label fw-semibold">{t('Description')}</label>
                    <textarea
                      id="cat-desc"
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder={t('Optional description for this category')}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    {t('Cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {editingCategory ? t('Update Category') : t('Create Category')}
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


export default Categories;

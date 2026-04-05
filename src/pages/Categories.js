import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '../services';

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Loading categories...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Category Management')}</h1>
        </div>
        <button
          onClick={handleAddNew}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t('Add Category')}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <p className="text-sm text-green-700">{success}</p>
          <button
            onClick={() => setSuccess('')}
            className="text-green-400 hover:text-green-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('No categories found')}
          </h3>
          <p className="text-gray-600">
            {t('Add your first category to get started!')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="card group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-6 text-center flex-1">
                <div className="text-6xl mb-4">
                  {category.icon || '📦'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                )}
              </div>
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(category)}
                  className="btn btn-ghost btn-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('Edit')}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCategory ? t('Edit Category') : t('Add New Category')}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                {/* Icon Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Icon')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <span className="text-3xl mb-1">{formData.icon}</span>
                    <span className="text-xs text-gray-500">{t('Change Icon')}</span>
                  </button>

                  {/* Icon Picker */}
                  {showIconPicker && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-10 gap-2">
                        {ICON_LIBRARY.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => selectIcon(icon)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:bg-white hover:shadow-md ${
                              formData.icon === icon
                                ? 'bg-primary-100 border-2 border-primary-500'
                                : 'border border-gray-200'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Category Name')} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder={t('e.g., Electronics, Clothing, Food')}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Description')}
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder={t('Optional description for this category')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCategory ? t('Update Category') : t('Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;

import React, { useState, useEffect } from 'react';
import { itemService, categoryService } from '../services';
import ProductThumbnail from '../components/ProductThumbnail';
import ProductImageField from '../components/ProductImageField';
import CategoryFormModal from '../components/CategoryFormModal';
import '../components/ProductThumbnail.css';
import { resolveProductImageUrl } from '../utils/productImage';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    category: '',
    categoryId: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      const data = await itemService.getAll();
      setItems(data);
    } catch (error) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const visibleItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      String(item.barcode || '').toLowerCase().includes(query) ||
      String(item.category || '').toLowerCase().includes(query);

    const matchesCategory =
      categoryFilter === 'all' ||
      String(item.category_id || item.category || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'categoryId') {
      const selectedCategory = categories.find((cat) => String(cat.id) === String(value));
      setFormData({
        ...formData,
        categoryId: value,
        category: selectedCategory ? selectedCategory.name : '',
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCategoryCreated = async (created) => {
    const updated = await categoryService.getAll();
    setCategories(updated);
    setFormData((prev) => ({
      ...prev,
      categoryId: String(created.id),
      category: created.name,
    }));
    setShowCategoryModal(false);
  };

  const resetImageState = () => {
    setImagePreview(null);
    setRemoveImage(false);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      buyingPrice: '',
      sellingPrice: '',
      quantity: '',
      category: '',
      categoryId: '',
      image: null,
    });
    resetImageState();
    setShowCategoryModal(false);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      buyingPrice: item.buying_price || '',
      sellingPrice: item.selling_price || '',
      quantity: item.quantity,
      category: item.category,
      categoryId: item.category_id || '',
      image: null,
    });
    setImagePreview(resolveProductImageUrl(item.image_path) || null);
    setRemoveImage(false);
    setShowCategoryModal(false);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleImageSelect = (imageData, imageError) => {
    if (imageError) {
      setError(imageError);
      return;
    }
    setFormData((prev) => ({ ...prev, image: imageData }));
    setImagePreview(imageData);
    setRemoveImage(false);
    setError('');
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    setRemoveImage(true);
  };

  const buildPayload = () => {
    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      buyingPrice: formData.buyingPrice === '' ? 0 : Number(formData.buyingPrice),
      sellingPrice: Number(formData.sellingPrice),
      quantity: parseInt(formData.quantity, 10),
      category: formData.category || '',
      categoryId: formData.categoryId || null,
    };
    if (formData.image) {
      payload.image = formData.image;
    } else if (removeImage) {
      payload.removeImage = true;
    }
    return payload;
  };

  const formatSaveError = (err) => {
    const data = err.response?.data;
    if (!data) return 'Failed to save item';
    const detail = data.details?.map((d) => d.msg).join(', ');
    return detail ? `${data.error}: ${detail}` : data.error || 'Failed to save item';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = buildPayload();
      if (editingItem) {
        await itemService.update(editingItem.id, payload);
        setSuccess('Item updated successfully');
      } else {
        await itemService.create(payload);
        setSuccess('Item added successfully');
      }
      setShowModal(false);
      loadItems();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatSaveError(err));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemService.delete(id);
        setSuccess('Item deleted successfully');
        loadItems();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete item');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" aria-hidden="true">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 matte-page admin-page inventory-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between">
            <div className="d-flex align-items-center mb-3 mb-lg-0">
              <div>
                <h1 className="h3 mb-1">Inventory Management</h1>
                <p className="text-muted small mb-0">Manage products, stock levels and pricing in one place.</p>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3">
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ minWidth: 150 }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search by name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ minWidth: 250 }}
                />
              </div>
              <button onClick={openAddModal} className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i>Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="card">
        <div className="card-body p-0">
          {visibleItems.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-box-seam text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No items found</h5>
              <p className="text-muted">Try adjusting your search or add your first product.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">Product</th>
                    <th className="border-0 fw-semibold">Category</th>
                    <th className="border-0 fw-semibold">Barcode</th>
                    <th className="border-0 fw-semibold">Selling Price</th>
                    <th className="border-0 fw-semibold">Stock</th>
                    <th className="border-0 fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="product-thumbnail-wrap" style={{ width: 40, height: 40 }}>
                            <ProductThumbnail item={item} categories={categories} size={40} />
                          </span>
                          <div>
                            <div className="fw-semibold">{item.name}</div>
                            <small className="text-muted">{item.description || 'No description'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{item.category_name || item.category || '—'}</td>
                      <td className="text-muted">{item.barcode || '—'}</td>
                      <td className="fw-semibold">
                        ${(item.selling_price ?? item.price)?.toFixed(2) || '0.00'}
                      </td>
                      <td>
                        {(() => {
                          const quantity = item.quantity;
                          if (quantity < 10) return <span className="badge bg-danger">{quantity}</span>;
                          if (quantity < 50) return <span className="badge bg-warning text-dark">{quantity}</span>;
                          return <span className="badge bg-success">{quantity}</span>;
                        })()}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            onClick={() => openEditModal(item)}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn btn-outline-danger btn-sm"
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg inventory-product-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-box-seam me-2"></i>
                  {editingItem ? 'Edit Product' : 'Add New Product'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold inventory-field-label">
                        Category
                        <button
                          type="button"
                          className="btn btn-link inventory-add-category-btn"
                          onClick={() => setShowCategoryModal(true)}
                          title="Add category"
                          aria-label="Add category"
                        >
                          <i className="bi bi-plus-circle"></i>
                        </button>
                      </label>
                      <select
                        name="categoryId"
                        className="form-select"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                      >
                        <option value="">Select a category...</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>

                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <input
                        type="text"
                        name="description"
                        className="form-control"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Optional product description"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Buying Price *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          name="buyingPrice"
                          className="form-control"
                          value={formData.buyingPrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Selling Price *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          name="sellingPrice"
                          className="form-control"
                          value={formData.sellingPrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Stock Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        className="form-control"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>

                    <div className="col-12">
                      <ProductImageField
                        imagePreview={imagePreview}
                        categoryId={formData.categoryId}
                        categories={categories}
                        onSelect={handleImageSelect}
                        onRemove={handleImageRemove}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>
                    {editingItem ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <CategoryFormModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={handleCategoryCreated}
      />
    </div>
  );
};

export default Inventory;

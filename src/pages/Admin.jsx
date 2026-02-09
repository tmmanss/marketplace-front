import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  addCustomProduct,
  applyAdminOverridesToProducts,
  getAdminState,
  removeCustomProduct,
  setHiddenProduct,
  setStatusOverride,
  setVerifiedBrand,
} from '../services/admin.service';
import { getCategories, getProducts, unwrapList } from '../services/marketplace.service';
import '../styles/Home.css';
import '../styles/CategoriesPage.css';
import '../styles/Admin.css';

const emptyForm = {
  title: '',
  description: '',
  price: '',
  brand: '',
  categoryId: '',
  status: 'active',
  isAvailable: true,
  imageUrl: '',
  stock: '10',
};

const Admin = () => {
  const { user, role } = useAuth();
  const [adminState, setAdminState] = useState(getAdminState());
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const effectiveRole = role || user?.role;
  const isAdmin = String(effectiveRole || '').toLowerCase().includes('admin') || user?.isAdmin;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          getCategories().catch(() => ({ data: [] })),
          getProducts().catch(() => ({ data: [] })),
        ]);
        const loadedCategories = unwrapList(catRes);
        const rawProducts = unwrapList(prodRes);

        const normalized = rawProducts.map((item) => ({
          id: item._id || item.id,
          title: item.title || item.name || 'Untitled product',
          description: item.description || '',
          brand: item.brand || 'Brand',
          status: item.status || 'active',
          isAvailable: item.isAvailable ?? true,
          categoryId: item.category_id || item.category?._id || item.category,
          categoryName: item.category?.name || 'Category',
          minPrice: typeof item.price === 'number' ? item.price : null,
          totalStock: item.isAvailable ? 1 : 0,
          imageUrl: item.image_url || item.imageUrl || '',
        }));

        setCategories(loadedCategories);
        setProducts(applyAdminOverridesToProducts(normalized));
        setAdminState(getAdminState());
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refreshAdminState = (next) => {
    setAdminState(next);
    setProducts(applyAdminOverridesToProducts(products.filter((item) => !item.isCustom)));
  };

  const handleToggleHidden = (id, hidden) => {
    const next = setHiddenProduct(id, hidden);
    refreshAdminState(next);
  };

  const handleStatusChange = (id, value) => {
    const next = setStatusOverride(id, value);
    refreshAdminState(next);
  };

  const handleCustomRemove = (id) => {
    const next = removeCustomProduct(id);
    refreshAdminState(next);
  };

  const handleVerifyBrand = (brand, value) => {
    const next = setVerifiedBrand(brand, value);
    refreshAdminState(next);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreate = (event) => {
    event.preventDefault();
    setStatus('');

    if (!form.title.trim() || !form.categoryId) {
      setStatus('Title and category are required.');
      return;
    }

    const category = categories.find((item) => item._id === form.categoryId);
    const custom = {
      id: `admin-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      brand: form.brand.trim() || 'Admin',
      status: form.status,
      isAvailable: form.isAvailable,
      categoryId: form.categoryId,
      categoryName: category?.name || 'Category',
      minPrice: form.price ? Number(form.price) : null,
      totalStock: form.stock ? Number(form.stock) : form.isAvailable ? 1 : 0,
      imageUrl: form.imageUrl.trim(),
      currency: 'KZT',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const next = addCustomProduct(custom);
    refreshAdminState(next);
    setForm(emptyForm);
    setStatus('Custom product added to marketplace.');
  };

  const visibleProducts = useMemo(() => {
    return products.map((item) => ({
      ...item,
      isHidden: adminState.hiddenProductIds.includes(item.id),
      statusOverride: adminState.statusOverrides[item.id] || '',
    }));
  }, [products, adminState]);

  const brands = useMemo(() => {
    const set = new Set();
    visibleProducts.forEach((item) => {
      if (item.brand) set.add(item.brand);
    });
    return Array.from(set).sort();
  }, [visibleProducts]);

  if (!isAdmin) {
    return (
      <div className="marketplace-root admin-page">
        <header className="category-header">
          <div>
            <p className="hero-kicker">Admin</p>
            <h1>Access restricted</h1>
            <p className="hero-lede">You need admin privileges to manage the marketplace.</p>
          </div>
          <div className="category-actions">
            <Link className="ghost-button" to="/">
              Back to home
            </Link>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="marketplace-root admin-page">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Admin</p>
          <h1>Marketplace control room</h1>
          <p className="hero-lede">
            Add, review, and moderate marketplace activity in real time.
          </p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
        </div>
      </header>

      <section className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Add product</h2>
              <p>Create a featured listing visible to all users.</p>
            </div>
          </div>
          <form className="admin-form" onSubmit={handleCreate}>
            <label>
              Title *
              <input name="title" value={form.title} onChange={handleFormChange} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleFormChange}
              />
            </label>
            <div className="admin-row">
              <label>
                Price
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={handleFormChange}
                />
              </label>
              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleFormChange}
                />
              </label>
            </div>
            <div className="admin-row">
              <label>
                Brand
                <input name="brand" value={form.brand} onChange={handleFormChange} />
              </label>
              <label>
                Category *
                <select name="categoryId" value={form.categoryId} onChange={handleFormChange}>
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="admin-row">
              <label>
                Status
                <select name="status" value={form.status} onChange={handleFormChange}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="banned">Banned</option>
                </select>
              </label>
              <label>
                Image URL
                <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} />
              </label>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                name="isAvailable"
                checked={form.isAvailable}
                onChange={handleFormChange}
              />
              Available for sale
            </label>
            {status && <div className="status-pill">{status}</div>}
            <button className="primary-button" type="submit">
              Publish product
            </button>
          </form>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Brand verification</h2>
              <p>Approve trusted sellers and highlight verified brands.</p>
            </div>
          </div>
          <div className="admin-list">
            {brands.length === 0 && <div className="empty-state">No brands yet.</div>}
            {brands.map((brand) => {
              const verified = !!adminState.verifiedBrands[brand];
              return (
                <div key={brand} className="admin-row-item">
                  <div>
                    <strong>{brand}</strong>
                    <span>{verified ? 'Verified seller' : 'Needs review'}</span>
                  </div>
                  <button
                    className={verified ? 'secondary-button' : 'primary-button'}
                    type="button"
                    onClick={() => handleVerifyBrand(brand, !verified)}
                  >
                    {verified ? 'Unverify' : 'Verify'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section highlight-section">
        <div className="section-header">
          <h2>Products moderation</h2>
          <span className="muted-count">{visibleProducts.length} items</span>
        </div>
        {loading && <div className="empty-state">Loading products...</div>}
        {!loading && visibleProducts.length === 0 && (
          <div className="empty-state">No products to manage.</div>
        )}
        <div className="admin-products">
          {visibleProducts.map((item) => (
            <div key={item.id} className="admin-product-card">
              <div>
                <strong>{item.title}</strong>
                <p className="product-meta">
                  {item.brand} · {item.categoryName} · {item.isCustom ? 'Custom' : 'API'}
                </p>
                <span className="admin-status">
                  Status: {item.statusOverride || item.status || 'active'}
                </span>
              </div>
              <div className="admin-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => handleToggleHidden(item.id, !item.isHidden)}
                >
                  {item.isHidden ? 'Unhide' : 'Hide'}
                </button>
                <select
                  className="admin-select"
                  value={item.statusOverride || ''}
                  onChange={(event) => handleStatusChange(item.id, event.target.value)}
                >
                  <option value="">No override</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="banned">Banned</option>
                </select>
                {item.isCustom && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => handleCustomRemove(item.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Admin;

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProduct, getCategories, getProducts } from '../services/marketplace.service';
import '../styles/Home.css';
import '../styles/SellerPage.css';

const SellerPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [createdIds, setCreatedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    brand: '',
    category_id: '',
    status: 'active',
    isAvailable: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const effectiveRole = role || user?.role;
    const isSeller = String(effectiveRole || '').toLowerCase() === 'seller';
    if (!isSeller) {
      navigate('/');
    }
  }, [role, user, navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.category_id) {
      setError('Title and category are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        description: form.description,
        brand: form.brand,
        status: form.status,
        category_id: form.category_id,
        isAvailable: form.isAvailable,
        price: form.price ? Number(form.price) : undefined,
        seller_id: user?._id || user?.id || user?.userId,
      };
      const response = await createProduct(payload);
      const created = response?.data;
      if (created?._id) {
        setCreatedIds((prev) => new Set([...prev, created._id]));
      }
      setSuccess('Product created');
      setForm({
        title: '',
        description: '',
        price: '',
        brand: '',
        category_id: '',
        status: 'active',
        isAvailable: true,
      });
      const prodRes = await getProducts();
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const sellerProducts = useMemo(() => {
    const sellerId = user?._id || user?.id || user?.userId;
    if (!sellerId && !createdIds.size) return products;

    const extractSellerId = (item) => {
      return (
        item?.seller_id?._id ||
        item?.seller_id ||
        item?.sellerId ||
        item?.seller?.id ||
        item?.user_id ||
        item?.userId ||
        item?.owner_id
      );
    };

    return products.filter((item) => {
      const id = item?._id || item?.id;
      if (id && createdIds.has(id)) return true;
      if (!sellerId) return false;
      const productSeller = extractSellerId(item);
      return productSeller === sellerId;
    });
  }, [products, user, createdIds]);

  return (
    <div className="marketplace-root seller-page">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Seller Studio</p>
          <h1>Create product listings</h1>
          <p className="hero-lede">Manage your catalog and publish new products.</p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
        </div>
      </header>

      <div className="seller-grid">
        <form className="seller-form" onSubmit={handleSubmit}>
          <h3>New product</h3>
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={handleChange} />
          </label>
          <div className="seller-row">
            <label>
              Price
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} />
            </label>
            <label>
              Brand
              <input name="brand" value={form.brand} onChange={handleChange} />
            </label>
          </div>
          <div className="seller-row">
            <label>
              Category
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">Select category</option>
                {categories.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="banned">Banned</option>
              </select>
            </label>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              name="isAvailable"
              checked={form.isAvailable}
              onChange={handleChange}
            />
            Available for sale
          </label>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Create product'}
          </button>
        </form>

        <div className="seller-list">
          <div className="section-header">
            <h2>Your products</h2>
            <span className="muted-count">{sellerProducts.length} items</span>
          </div>
          {loading && <div className="empty-state">Loading products...</div>}
          {!loading && sellerProducts.length === 0 && (
            <div className="empty-state">You have no products yet.</div>
          )}
          {sellerProducts.map((item) => (
            <div key={item._id} className="seller-card">
              <div>
                <strong>{item.title || item.name}</strong>
                <p className="product-meta">{item.brand || 'Brand'} · {item.status}</p>
              </div>
              <span className="price">${Number(item.price || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerPage;

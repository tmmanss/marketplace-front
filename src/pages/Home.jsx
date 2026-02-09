import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCategories,
  getProductImages,
  getProductVariants,
  getProducts,
  unwrapList,
} from '../services/marketplace.service';
import { addToCart, getCartCount } from '../services/cart.service';
import { applyAdminOverridesToProducts } from '../services/admin.service';
import '../styles/Home.css';

const Home = () => {
  const { user, role, logout, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState(null);

  const productSectionRef = useRef(null);
  const isLoggedIn = isAuthenticated || !!user;
  const effectiveRole = role || user?.role;
  const isSeller = String(effectiveRole || '').toLowerCase() === 'seller';
  const isAdmin = String(effectiveRole || '').toLowerCase().includes('admin') || user?.isAdmin;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [categoryRes, productRes] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        const loadedCategories = unwrapList(categoryRes);
        const loadedProducts = unwrapList(productRes);
        const categoryMap = new Map(
          loadedCategories.map((category) => [category._id, category.name])
        );

        const enrichedProducts = await Promise.all(
          loadedProducts.map(async (product) => {
            const productId = product._id;
            const hasDirectPrice = typeof product.price === 'number';
            const [variantRes, imageRes] = await Promise.all([
              hasDirectPrice
                ? Promise.resolve({ data: [] })
                : getProductVariants(productId).catch(() => ({ data: [] })),
              getProductImages(productId).catch(() => ({ data: [] })),
            ]);

            const variants = unwrapList(variantRes);
            const images = unwrapList(imageRes);

            const minPrice = hasDirectPrice
              ? product.price
              : variants.length
                ? Math.min(...variants.map((variant) => variant.price ?? 0))
                : null;
            const totalStock = variants.length
              ? variants.reduce((sum, variant) => sum + (variant.stock_quantity ?? 0), 0)
              : product.isAvailable
                ? 1
                : 0;
            const primaryImage = resolveImageUrl(images[0], product);

            const rawCategoryId = product.category_id || product.category?._id || product.category;
            const categoryName =
              product.category?.name || categoryMap.get(rawCategoryId) || 'Category';

            return {
              id: productId,
              title: product.title || product.name || 'Untitled product',
              description: product.description,
              brand: product.brand,
              status: product.status,
              isAvailable: product.isAvailable,
              categoryId: rawCategoryId,
              categoryName,
              minPrice,
              totalStock,
              imageUrl: primaryImage,
            };
          })
        );

        setCategories(loadedCategories);
        setProducts(applyAdminOverridesToProducts(enrichedProducts));
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load marketplace data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setCartCount(getCartCount(user));
  }, [user]);

  const filteredProducts = useMemo(() => {
    let items = [...products];

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      items = items.filter((product) => {
        return (
          product.title?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.categoryName?.toLowerCase().includes(query)
        );
      });
    }

    if (inStockOnly) {
      items = items.filter((product) => product.totalStock > 0);
    }

    if (sort === 'price_asc') {
      items.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    }

    if (sort === 'price_desc') {
      items.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
    }

    if (sort === 'name') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return items;
  }, [products, search, inStockOnly, sort]);

  const handleScrollTo = (ref) => {
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddToCart = (item) => {
    addToCart(
      {
        id: item.id,
        title: item.title,
        price: item.minPrice,
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
      },
      user
    );
    setCartCount(getCartCount(user));
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 900);
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'No price';
    return `$${Number(value).toFixed(2)}`;
  };

  const resolveImageUrl = (image, product) => {
    return (
      image?.image_url ||
      image?.imageUrl ||
      image?.url ||
      image?.link ||
      image?.path ||
      product?.image_url ||
      product?.imageUrl ||
      product?.image ||
      ''
    );
  };

  const heroDeal = {
    id: 'hero-deal-smart-home',
    title: 'Smart Home Starter Pack',
    minPrice: 249,
    imageUrl: '',
    categoryName: 'Smart Home',
  };

  return (
    <div className="marketplace-root">
      <div className="marketplace-glow" aria-hidden="true" />

      <header className="marketplace-header">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div className="brand-text">
            <span className="brand-title">Marketzone</span>
            <span className="brand-subtitle">Everything you need, fast.</span>
          </div>
        </div>

        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search products, brands, categories"
            aria-label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="search-button"
            type="button"
            onClick={() => handleScrollTo(productSectionRef)}
          >
            Search
          </button>
        </div>

        <div className="auth-cta">
          <Link className="ghost-button" to="/categories">
            Categories
          </Link>
          {isSeller && (
            <Link className="ghost-button" to="/seller">
              Seller Studio
            </Link>
          )}
          {isAdmin && (
            <Link className="ghost-button" to="/admin">
              Admin
            </Link>
          )}
          <Link className="cart-pill" to="/cart">
            Cart
            <span className={`cart-count ${addedId ? 'bump' : ''}`}>{cartCount}</span>
          </Link>
          {isLoggedIn ? (
            <>
              <Link className="ghost-button" to="/profile">
                Profile
              </Link>
              <button className="ghost-button" onClick={logout} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-button" to="/login">
                Sign in
              </Link>
              <Link className="primary-button" to="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">Marketplace launch week</p>
          <h1>Shop bold. Save big. Discover your next favorite.</h1>
          <p className="hero-lede">
            Curated brands, premium delivery, and exclusive drops. Everything in one cart, built
            for speed and style.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => handleScrollTo(productSectionRef)}
            >
              Start shopping
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => handleScrollTo(productSectionRef)}
            >
              View deals
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <strong>2M+</strong>
              <span>Products</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>Delivery options</span>
            </div>
            <div>
              <strong>4.8</strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <div className="deal-badge">Hot Deal</div>
          <h3>Smart Home Starter Pack</h3>
          <p>Bundle of 5 devices with voice control and one-tap setup.</p>
          <div className="price-row">
            <span className="price">$249</span>
            <span className="strike">$329</span>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => handleAddToCart(heroDeal)}
          >
            Add to cart
          </button>
          <div className="promo-grid">
            <div>
              <span>Free returns</span>
              <small>30 days</small>
            </div>
            <div>
              <span>Secure pay</span>
              <small>All cards</small>
            </div>
            <div>
              <span>Fast ship</span>
              <small>Same day</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section highlight-section" ref={productSectionRef}>
        <div className="section-header">
          <h2>Top picks for you</h2>
          <Link className="ghost-button" to="/categories">
            Browse categories
          </Link>
        </div>
        <div className="filter-bar">
          <div className="filter-group">
            <label>Sort</label>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
            />
            In stock only
          </label>
        </div>
        <div className="product-grid">
          {loading && <div className="empty-state">Loading products...</div>}
          {error && <div className="empty-state error">{error}</div>}
          {!loading &&
            !error &&
            filteredProducts.map((item) => (
              <Link key={item.id} className="product-card" to={`/product/${item.id}`}>
                <div className="product-tag">
                  {item.isAvailable === false ? 'Out of stock' : item.status || 'active'}
                </div>
                <div className="product-thumb">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : null}
                </div>
                <h3>{item.title}</h3>
                <p className="product-meta">
                  {item.brand || 'Brand'} - {item.categoryName}
                </p>
                <div className="product-footer">
                  <span className="price">{formatPrice(item.minPrice)}</span>
                  <button
                    className={`text-button ${addedId === item.id ? 'added' : ''}`}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleAddToCart(item);
                    }}
                  >
                    {addedId === item.id ? 'Added' : 'Add'}
                  </button>
                </div>
              </Link>
            ))}
          {!loading && !error && !filteredProducts.length && (
            <div className="empty-state">No products match your filters.</div>
          )}
        </div>
      </section>

      <section className="section banner-section">
        <div className="banner-card">
          <div>
            <h2>Prime-like speed, built for students and teams</h2>
            <p>Fast checkout, unified tracking, and smart recommendations.</p>
          </div>
          <Link className="primary-button" to="/register">
            Join premium
          </Link>
        </div>
      </section>

      <footer className="marketplace-footer">
        <div>
          <span className="brand-title">Marketzone</span>
          <p>Support 24/7 - Secure payments - Trusted sellers</p>
        </div>
        <div className="footer-links">
          <Link className="footer-link" to="/about">
            <span>About</span>
            <p>Marketplace for verified sellers and fast student-friendly delivery.</p>
          </Link>
          <Link className="footer-link" to="/help">
            <span>Help</span>
            <p>Order tracking, returns, and live chat support with real agents.</p>
          </Link>
          <Link className="footer-link" to="/careers">
            <span>Careers</span>
            <p>We are hiring: design, growth, logistics, and seller success.</p>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;

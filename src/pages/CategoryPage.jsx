import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCategories,
  getProductImages,
  getProductVariants,
  getProducts,
  unwrapList,
} from '../services/marketplace.service';
import { applyAdminOverridesToProducts } from '../services/admin.service';
import { addToCart } from '../services/cart.service';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';
import '../styles/CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedId, setAddedId] = useState(null);

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
            const currency =
              variants.find((variant) => variant.currency)?.currency ||
              product.currency ||
              'KZT';
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
              currency,
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
  }, [id]);

  const activeCategory = useMemo(
    () => categories.find((category) => category._id === id),
    [categories, id]
  );

  const filteredProducts = useMemo(() => {
    let items = products.filter((product) => product.categoryId === id);

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
  }, [products, id, inStockOnly, sort]);

  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'No price';
    return `$${Number(value).toFixed(2)}`;
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
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 900);
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

  return (
    <div className="marketplace-root category-page">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Category</p>
          <h1>{activeCategory?.name || 'Category'}</h1>
          <p className="hero-lede">
            {activeCategory?.description || 'Browse the latest products in this category.'}
          </p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
          <Link className="primary-button" to="/register">
            Join premium
          </Link>
        </div>
      </header>

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

      <section className="section highlight-section">
        <div className="section-header">
          <h2>Products</h2>
          <span className="muted-count">{filteredProducts.length} items</span>
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
                <p className="product-meta">{item.brand || 'Brand'}</p>
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
            <div className="empty-state">No products in this category yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;

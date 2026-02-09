import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addToCart } from '../services/cart.service';
import {
  getCategories,
  getProductById,
  getProductImages,
  getProductVariants,
  unwrapItem,
  unwrapList,
} from '../services/marketplace.service';
import {
  getCustomProductById,
  getStatusOverride,
  isProductHidden,
} from '../services/admin.service';
import { getRatings, getUserRating, setRating } from '../services/ratings.service';
import '../styles/Home.css';
import '../styles/ProductPage.css';

const ProductPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        if (isProductHidden(id)) {
          setError('This product was removed by admin.');
          setLoading(false);
          return;
        }

        const custom = getCustomProductById(id);
        const categoryRes = await getCategories().catch(() => ({ data: [] }));
        const loadedCategories = unwrapList(categoryRes);

        if (custom) {
          const customProduct = {
            _id: custom.id,
            title: custom.title,
            description: custom.description,
            brand: custom.brand,
            status: custom.status,
            isAvailable: custom.isAvailable,
            category_id: custom.categoryId,
            price: custom.minPrice ?? null,
            image_url: custom.imageUrl || '',
          };
          setProduct(customProduct);
          setVariants([]);
          setImages(
            custom.imageUrl
              ? [{ _id: `${custom.id}-image`, image_url: custom.imageUrl }]
              : []
          );
          setCategories(loadedCategories);
          setActiveImage(custom.imageUrl || '');
          setRatings(getRatings(id));
          setUserRating(getUserRating(id, user));
          return;
        }

        const [productRes, variantRes, imageRes] = await Promise.all([
          getProductById(id),
          getProductVariants(id).catch(() => ({ data: [] })),
          getProductImages(id).catch(() => ({ data: [] })),
        ]);

        const item = unwrapItem(productRes);
        const overrideStatus = getStatusOverride(item?._id || id);
        const loadedVariants = unwrapList(variantRes);
        const loadedImages = unwrapList(imageRes);

        setProduct(overrideStatus ? { ...item, status: overrideStatus } : item);
        setVariants(loadedVariants);
        setImages(loadedImages);
        setCategories(loadedCategories);
        setActiveImage(resolveImageUrl(loadedImages[0], item));
        setRatings(getRatings(id));
        setUserRating(getUserRating(id, user));
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user]);

  const price = useMemo(() => {
    if (typeof product?.price === 'number') return product.price;
    if (!variants.length) return null;
    return Math.min(...variants.map((variant) => variant.price ?? 0));
  }, [product, variants]);

  const stock = useMemo(() => {
    if (variants.length) {
      return variants.reduce((sum, variant) => sum + (variant.stock_quantity ?? 0), 0);
    }
    return product?.isAvailable ? 1 : 0;
  }, [variants, product]);

  const categoryName = useMemo(() => {
    const rawCategoryId = product?.category_id || product?.category?._id || product?.category;
    const map = new Map(categories.map((item) => [item._id, item.name]));
    return product?.category?.name || map.get(rawCategoryId) || 'Category';
  }, [categories, product]);

  const ratingStats = useMemo(() => {
    if (!ratings.length) {
      return { average: 0, count: 0 };
    }
    const sum = ratings.reduce((acc, item) => acc + (item.rating || 0), 0);
    return { average: sum / ratings.length, count: ratings.length };
  }, [ratings]);

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

  const handleAdd = () => {
    if (!product) return;
    addToCart({
      id: product._id,
      title: product.title || product.name || 'Untitled product',
      price,
      imageUrl: activeImage,
      categoryName,
    }, user);
  };

  const handleRate = (value) => {
    if (!user) return;
    const updated = setRating(id, user, value);
    setRatings(updated);
    setUserRating(value);
  };

  const renderStarIcon = (className) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.86 5.79 6.39.93-4.62 4.5 1.09 6.36L12 17.77 6.28 20.08l1.09-6.36-4.62-4.5 6.39-.93L12 2.5z" />
    </svg>
  );

  if (loading) {
    return (
      <div className="marketplace-root">
        <div className="empty-state">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-root">
        <div className="empty-state error">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="marketplace-root">
        <div className="empty-state">Product not found.</div>
      </div>
    );
  }

  return (
    <div className="marketplace-root product-page">
      <header className="product-header">
        <div>
          <p className="hero-kicker">Product</p>
          <h1>{product.title || product.name}</h1>
          <p className="hero-lede">{product.description || 'No description yet.'}</p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
          <Link className="ghost-button" to="/categories">
            Categories
          </Link>
        </div>
      </header>

      <div className="product-grid-layout">
        <div className="product-gallery">
          <div className="product-hero-image">
            {activeImage ? <img src={activeImage} alt={product.title || product.name} /> : null}
          </div>
          <div className="product-thumbs">
            {images.map((img) => (
              <button
                key={img._id}
                className={`thumb ${activeImage === img.image_url ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveImage(img.image_url)}
              >
                <img src={img.image_url} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-details">
          <div className="detail-card">
            <div className="detail-row">
              <span className="detail-label">Brand</span>
              <strong>{product.brand || 'Unknown'}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category</span>
              <strong>{categoryName}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <strong>{product.status || 'active'}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-label">Availability</span>
              <strong>{stock > 0 ? 'In stock' : 'Out of stock'}</strong>
            </div>
            <div className="detail-row price-row">
              <span className="detail-label">Price</span>
              <strong className="price">{formatPrice(price)}</strong>
            </div>
            <button className="primary-button" type="button" onClick={handleAdd}>
              Add to cart
            </button>
          </div>

          <div className="detail-card">
            <h3>Ratings</h3>
            <div className="rating-summary">
              <div className="rating-pill">
                <span className="rating-score">{ratingStats.average.toFixed(1)}</span>
                <div className="rating-stars" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <span
                      key={value}
                      className={`mini-star ${ratingStats.average >= value ? 'active' : ''}`}
                    >
                      {renderStarIcon('mini-star-icon')}
                    </span>
                  ))}
                </div>
              </div>
              <span className="rating-count">{ratingStats.count} ratings</span>
            </div>
            {user ? (
              <div className="rating-actions">
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      className={`star ${userRating >= value ? 'active' : ''}`}
                      type="button"
                      onClick={() => handleRate(value)}
                    >
                      {renderStarIcon('star-icon')}
                    </button>
                  ))}
                </div>
                <span className="rating-note">
                  {userRating ? `Your rating: ${userRating}` : 'Tap to rate'}
                </span>
              </div>
            ) : (
              <p className="muted">
                Please <Link to="/login">sign in</Link> to rate this product.
              </p>
            )}
          </div>

          <div className="detail-card">
            <h3>About this item</h3>
            <ul>
              <li>Seller: {product.seller_id?.shop_name || 'Store'}</li>
              <li>Fast delivery options available</li>
              <li>Secure payments and easy returns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;

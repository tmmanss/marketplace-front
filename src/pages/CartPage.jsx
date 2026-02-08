import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearCart, getCartItems, removeFromCart } from '../services/cart.service';
import '../styles/Home.css';
import '../styles/CartPage.css';

const CartPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getCartItems(user));
  }, [user]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [items]);

  const handleRemove = (item) => {
    const updated = removeFromCart(item.id, item.addedAt, user);
    setItems(updated);
  };

  const handleClear = () => {
    setItems(clearCart(user));
  };

  return (
    <div className="marketplace-root cart-page">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Your cart</p>
          <h1>Shopping Cart</h1>
          <p className="hero-lede">Review your items before checkout.</p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
          <button className="primary-button" type="button" onClick={handleClear}>
            Clear cart
          </button>
        </div>
      </header>

      <section className="section">
        {items.length === 0 ? (
          <div className="empty-state">Your cart is empty.</div>
        ) : (
          <div className="cart-grid">
            <div className="cart-list">
              {items.map((item) => (
                <div key={`${item.id}-${item.addedAt}`} className="cart-item">
                  <div className="cart-thumb">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : null}
                  </div>
                  <div className="cart-info">
                    <h3>{item.title}</h3>
                    <p className="product-meta">{item.categoryName || 'Category'}</p>
                  </div>
                  <div className="cart-price">${Number(item.price || 0).toFixed(2)}</div>
                  <button className="text-button" type="button" onClick={() => handleRemove(item)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <h3>Summary</h3>
              <div className="summary-row">
                <span>Items</span>
                <strong>{items.length}</strong>
              </div>
              <div className="summary-row">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
              <Link className="primary-button" to="/checkout">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CartPage;

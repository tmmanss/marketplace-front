import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearCart, getCartItems } from '../services/cart.service';
import '../styles/Home.css';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('card');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setItems(getCartItems(user));
  }, [user]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [items]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name || !email || !address) {
      setError('Fill in all required fields');
      return;
    }
    if (!items.length) {
      setError('Your cart is empty');
      return;
    }
    setError('');
    clearCart(user);
    setSuccess(true);
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="marketplace-root checkout-page">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Checkout</p>
          <h1>Complete your order</h1>
          <p className="hero-lede">Secure checkout in a few steps.</p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/cart">
            Back to cart
          </Link>
        </div>
      </header>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h3>Shipping details</h3>
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Address
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>

          <h3>Payment</h3>
          <div className="payment-row">
            <label>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={payment === 'card'}
                onChange={() => setPayment('card')}
              />
              Card
            </label>
            <label>
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={payment === 'cash'}
                onChange={() => setPayment('cash')}
              />
              Cash on delivery
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Order placed successfully!</div>}

          <button className="primary-button" type="submit">
            Place order
          </button>
        </form>

        <div className="checkout-summary">
          <h3>Order summary</h3>
          {items.map((item) => (
            <div key={`${item.id}-${item.addedAt}`} className="summary-row">
              <span>{item.title}</span>
              <strong>${Number(item.price || 0).toFixed(2)}</strong>
            </div>
          ))}
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

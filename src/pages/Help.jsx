import { Link } from 'react-router-dom';
import '../styles/Home.css';
import '../styles/CategoriesPage.css';

const Help = () => {
  return (
    <div className="marketplace-root">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Help</p>
          <h1>Support that answers fast</h1>
          <p className="hero-lede">
            We keep orders transparent with live chat, quick returns,
            and a dedicated student support line.
          </p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
        </div>
      </header>

      <section className="section">
        <div className="category-grid">
          <div className="category-card">
            <div className="category-title">Track orders</div>
            <p>See delivery status, ETA, and courier updates in real time.</p>
          </div>
          <div className="category-card">
            <div className="category-title">Returns & refunds</div>
            <p>30-day returns on most items with instant refund options.</p>
          </div>
          <div className="category-card">
            <div className="category-title">Live chat</div>
            <p>Chat with a real agent in minutes, not hours.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;

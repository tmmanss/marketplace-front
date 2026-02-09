import { Link } from 'react-router-dom';
import '../styles/Home.css';
import '../styles/CategoriesPage.css';

const Careers = () => {
  return (
    <div className="marketplace-root">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Careers</p>
          <h1>Build the future of marketplace logistics</h1>
          <p className="hero-lede">
            We are looking for builders across product, design, and operations.
            Join a team that ships fast and cares about real users.
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
            <div className="category-title">Product & Design</div>
            <p>UX designer, brand designer, product manager.</p>
          </div>
          <div className="category-card">
            <div className="category-title">Engineering</div>
            <p>Frontend, backend, data, and QA automation.</p>
          </div>
          <div className="category-card">
            <div className="category-title">Operations</div>
            <p>Logistics, seller success, and campus partnerships.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;

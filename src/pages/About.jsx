import { Link } from 'react-router-dom';
import '../styles/Home.css';
import '../styles/CategoriesPage.css';

const About = () => {
  return (
    <div className="marketplace-root">
      <header className="category-header">
        <div>
          <p className="hero-kicker">About</p>
          <h1>Built for fast, reliable campus commerce</h1>
          <p className="hero-lede">
            Marketzone connects verified sellers with buyers who want speed, trust,
            and a clean checkout experience.
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
            <div className="category-title">Verified sellers</div>
            <p>Every seller passes a review so buyers can shop with confidence.</p>
          </div>
          <div className="category-card">
            <div className="category-title">Speed first</div>
            <p>Fast delivery options, clear tracking, and smart order updates.</p>
          </div>
          <div className="category-card">
            <div className="category-title">Student friendly</div>
            <p>Affordable bundles and seasonal deals for everyday essentials.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

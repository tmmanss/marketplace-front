import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/marketplace.service';
import '../styles/Home.css';
import '../styles/CategoriesPage.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getCategories();
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) {
      return categories;
    }
    const query = search.trim().toLowerCase();
    return categories.filter((item) => {
      return (
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    });
  }, [categories, search]);

  return (
    <div className="marketplace-root category-list-page">
      <header className="category-header">
        <div>
          <p className="hero-kicker">Browse</p>
          <h1>All Categories</h1>
          <p className="hero-lede">Choose a category to explore products.</p>
        </div>
        <div className="category-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
        </div>
      </header>

      <div className="search-wrap category-search">
        <input
          className="search-input"
          placeholder="Search categories"
          aria-label="Search categories"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="search-button" type="button">
          Search
        </button>
      </div>

      <section className="section">
        <div className="category-grid">
          {loading && <div className="empty-state">Loading categories...</div>}
          {error && <div className="empty-state error">{error}</div>}
          {!loading &&
            !error &&
            filteredCategories.map((item) => (
              <div key={item._id} className="category-card">
                <div className="category-title">{item.name}</div>
                <p>{item.description || 'Curated selection of top sellers.'}</p>
                <Link className="text-button" to={`/category/${item._id}`}>
                  Explore
                </Link>
              </div>
            ))}
          {!loading && !error && !filteredCategories.length && (
            <div className="empty-state">No categories available yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;

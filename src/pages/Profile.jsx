import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadProfile, saveProfile } from '../services/profile.service';
import '../styles/Home.css';
import '../styles/Profile.css';

const emptyProfile = {
  fullName: '',
  phone: '',
  city: '',
  address: '',
  companyName: '',
  taxId: '',
  about: '',
  avatarUrl: '',
  createdAt: null,
  updatedAt: null,
};

const Profile = () => {
  const { user, role, isAuthenticated } = useAuth();
  const [form, setForm] = useState(emptyProfile);
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);

  const isLoggedIn = isAuthenticated || !!user;
  const effectiveRole = role || user?.role;
  const isSeller = String(effectiveRole || '').toLowerCase() === 'seller';

  useEffect(() => {
    if (!isLoggedIn) return;
    const existing = loadProfile(user);
    if (existing) {
      setForm({ ...emptyProfile, ...existing });
    } else {
      setForm((prev) => ({
        ...prev,
        fullName: user?.name || '',
      }));
    }
  }, [isLoggedIn, user]);

  const completion = useMemo(() => {
    const required = [form.fullName, form.phone, form.city, form.address];
    if (isSeller) {
      required.push(form.companyName, form.taxId);
    }
    const filled = required.filter((item) => String(item || '').trim().length > 0).length;
    const total = required.length || 1;
    return Math.round((filled / total) * 100);
  }, [form, isSeller]);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!form.fullName.trim()) missing.push('Full name');
    if (!form.phone.trim()) missing.push('Phone');
    if (!form.city.trim()) missing.push('City');
    if (!form.address.trim()) missing.push('Address');
    if (isSeller) {
      if (!form.companyName.trim()) missing.push('Store name');
      if (!form.taxId.trim()) missing.push('Tax ID');
    }
    return missing;
  }, [form, isSeller]);

  const handleChange = (field) => (event) => {
    setDirty(true);
    setStatus('');
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = () => {
    const trimmedPhone = form.phone.replace(/\s+/g, '');
    if (trimmedPhone && trimmedPhone.length < 7) {
      setStatus('Phone number looks too short.');
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      ...form,
      phone: trimmedPhone,
      createdAt: form.createdAt || now,
      updatedAt: now,
    };

    const ok = saveProfile(user, payload);
    if (ok) {
      setForm(payload);
      setDirty(false);
      setStatus(
        missingFields.length
          ? `Saved as draft. Missing: ${missingFields.join(', ')}`
          : 'Saved. Your profile is ready for checkout & personalization.'
      );
    } else {
      setStatus('Please sign in to save your profile.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="marketplace-root profile-page">
        <header className="profile-header">
          <div>
            <p className="hero-kicker">Profile</p>
            <h1>Save your details for faster checkout</h1>
            <p className="hero-lede">Sign in to create and keep your personal profile.</p>
          </div>
          <div className="profile-actions">
            <Link className="ghost-button" to="/">
              Back to home
            </Link>
            <Link className="primary-button" to="/login">
              Sign in
            </Link>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="marketplace-root profile-page">
      <header className="profile-header">
        <div>
          <p className="hero-kicker">Profile</p>
          <h1>Your personal control room</h1>
          <p className="hero-lede">
            Keep delivery info and business details in one place. Used for orders,
            recommendations, and seller readiness.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="ghost-button" to="/">
            Back to home
          </Link>
          <button className="primary-button" type="button" onClick={handleSave}>
            Save profile
          </button>
        </div>
      </header>

      <section className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <h2>Personal details</h2>
              <p>Used for order receipts and delivery updates.</p>
            </div>
            <span className="profile-badge">{completion}% complete</span>
          </div>
          <div className="profile-form">
            <label>
              Full name *
              <input value={form.fullName} onChange={handleChange('fullName')} />
            </label>
            <label>
              Email
              <input value={user?.email || ''} readOnly />
            </label>
            <label>
              Phone *
              <input value={form.phone} onChange={handleChange('phone')} />
            </label>
            <label>
              City *
              <input value={form.city} onChange={handleChange('city')} />
            </label>
            <label className="full">
              Address *
              <input value={form.address} onChange={handleChange('address')} />
            </label>
            <label className="full">
              About you
              <textarea rows="3" value={form.about} onChange={handleChange('about')} />
            </label>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <h2>Identity & brand</h2>
              <p>Personalize how you appear across the marketplace.</p>
            </div>
          </div>
          <div className="profile-form">
            <label className="full">
              Avatar URL
              <input value={form.avatarUrl} onChange={handleChange('avatarUrl')} />
            </label>
            <label>
              Store name {isSeller ? '*' : ''}
              <input value={form.companyName} onChange={handleChange('companyName')} />
            </label>
            <label>
              Tax ID {isSeller ? '*' : ''}
              <input value={form.taxId} onChange={handleChange('taxId')} />
            </label>
          </div>
        </div>

        <div className="profile-card profile-summary">
          <div className="profile-card-header">
            <div>
              <h2>Profile status</h2>
              <p>We use this to enable checkout and seller tools.</p>
            </div>
          </div>
          <div className="status-list">
            <div>
              <strong>{missingFields.length ? 'Action needed' : 'Ready'}</strong>
              <span>
                {missingFields.length
                  ? `Missing: ${missingFields.join(', ')}`
                  : 'All required fields are complete.'}
              </span>
            </div>
            <div>
              <strong>Last updated</strong>
              <span>{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'Not yet'}</span>
            </div>
            <div>
              <strong>Role</strong>
              <span>{isSeller ? 'Seller' : 'Customer'}</span>
            </div>
          </div>
          {status && <div className="profile-status">{status}</div>}
          <button
            className="secondary-button"
            type="button"
            onClick={handleSave}
            disabled={!dirty}
          >
            Save changes
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi, userApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, toast, saveCardInfo } = useApp();

  // Check if redirected from checkout
  const fromCheckout = location.state?.from === 'checkout';

  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    // Shipping
    street: '', city: '', province: '', country: '', zip: '', phone: '',
    // Credit card
    cardNumber: '', cardName: '', expiry: '', cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // For register: 1 = basic info, 2 = address + card

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);
      await login(data.token, data.user);
      toast('Welcome back!', 'success');
      navigate(fromCheckout ? '/checkout' : '/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (step === 1) {
      // Validate basic fields
      if (!form.email || !form.password) { setError('Email and password are required'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      setError('');
      setStep(2);
      return;
    }

    // Step 2: Submit registration
    setError(''); setLoading(true);
    try {
      // Register user
      await authApi.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });

      // Auto-login
      const loginData = await authApi.login(form.email, form.password);
      await login(loginData.token, loginData.user);

      // Save address if provided
      if (form.street || form.city) {
        try {
          await userApi.updateProfile(loginData.user.id, {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            address: {
              street: form.street, city: form.city, province: form.province,
              country: form.country, zip: form.zip, phone: form.phone,
            },
          }, loginData.token);
        } catch {}
      }

      // Save credit card info locally
      if (form.cardNumber) {
        saveCardInfo({
          cardNumber: form.cardNumber,
          cardName: form.cardName,
          expiry: form.expiry,
          cvv: form.cvv,
        });
      }

      toast('Account created! Welcome!', 'success');
      navigate(fromCheckout ? '/checkout' : '/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (tab === 'login') handleLogin();
    else handleRegister();
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <div className="auth-card fade-up">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Icon d={ICONS.book} size={36} color="var(--rust)" />
          <h2 className="serif" style={{ marginTop: 12, fontSize: 24 }}>BookNest</h2>
          {fromCheckout && (
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
              Sign in or create an account to complete your order
            </p>
          )}
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setStep(1); }}>Sign In</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setStep(1); }}>Create Account</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {/* LOGIN */}
        {tab === 'login' && (
          <>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input className="input" type="password" value={form.password}
                onChange={(e) => set('password', e.target.value)} placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          </>
        )}

        {/* REGISTER STEP 1: Basic Info */}
        {tab === 'register' && step === 1 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group"><label>First Name</label>
                <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="John" />
              </div>
              <div className="input-group"><label>Last Name</label>
                <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Doe" />
              </div>
            </div>
            <div className="input-group"><label>Email *</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="input-group"><label>Password *</label>
              <input className="input" type="password" value={form.password}
                onChange={(e) => set('password', e.target.value)} placeholder="Min. 6 characters" />
            </div>
          </>
        )}

        {/* REGISTER STEP 2: Address + Card */}
        {tab === 'register' && step === 2 && (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Add your shipping and billing info (you can skip and add later)
            </p>

            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--brown)' }}>Shipping Address</h4>
            <div className="input-group"><label>Street</label>
              <input className="input" value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="123 Main St" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group"><label>City</label><input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div className="input-group"><label>Province</label><input className="input" value={form.province} onChange={(e) => set('province', e.target.value)} /></div>
              <div className="input-group"><label>Country</label><input className="input" value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
              <div className="input-group"><label>Postal Code</label><input className="input" value={form.zip} onChange={(e) => set('zip', e.target.value)} /></div>
            </div>
            <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>

            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 20, color: 'var(--brown)' }}>Credit Card</h4>
            <div className="input-group"><label>Card Number</label>
              <input className="input" value={form.cardNumber}
                onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,16); set('cardNumber', v.replace(/(\d{4})(?=\d)/g,'$1 ')); }}
                placeholder="1234 5678 9012 3456" />
            </div>
            <div className="input-group"><label>Name on Card</label>
              <input className="input" value={form.cardName} onChange={(e) => set('cardName', e.target.value)} placeholder="John Doe" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group"><label>Expiry</label>
                <input className="input" value={form.expiry}
                  onChange={(e) => { let v = e.target.value.replace(/\D/g,'').slice(0,4); if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2); set('expiry',v); }}
                  placeholder="MM/YY" />
              </div>
              <div className="input-group"><label>CVV</label>
                <input className="input" type="password" value={form.cvv}
                  onChange={(e) => set('cvv', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" />
              </div>
            </div>
          </>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {tab === 'register' && step === 2 && (
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
          )}
          <button className="btn btn-primary btn-full" style={{ padding: '12px' }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...'
              : tab === 'login' ? 'Sign In'
              : step === 1 ? 'Next →'
              : 'Create Account'}
          </button>
        </div>

        {tab === 'register' && step === 2 && (
          <button className="btn btn-outline btn-full" style={{ marginTop: 8 }}
            onClick={() => { set('street',''); set('city',''); set('cardNumber',''); handleRegister(); }}>
            Skip & Create Account
          </button>
        )}
      </div>
    </div>
  );
}

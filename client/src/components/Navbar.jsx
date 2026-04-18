import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export default function Navbar() {
  const { user, cartCount, logout } = useApp();
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => navigate('/')}>
          <Icon d={ICONS.book} size={24} color="#B85C38" />
          Book<span>Nest</span>
        </div>

        <div className="nav-actions">
          <NavLink to="/" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} end>
            <Icon d={ICONS.home} size={16} /> Browse
          </NavLink>

          {/* Cart always visible — works for guests too */}
          <NavLink to="/cart" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} style={{ position: 'relative' }}>
            <Icon d={ICONS.cart} size={16} /> Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </NavLink>

          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
                <Icon d={ICONS.user} size={16} /> {user.firstName || 'Profile'}
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
                  <Icon d={ICONS.shield} size={16} /> Admin
                </NavLink>
              )}
              <button className="nav-btn" onClick={logout}>
                <Icon d={ICONS.logout} size={16} />
              </button>
            </>
          ) : (
            <NavLink to="/login" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
              <Icon d={ICONS.user} size={16} /> Sign In
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

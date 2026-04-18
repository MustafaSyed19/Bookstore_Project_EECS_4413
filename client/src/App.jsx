import { Routes, Route } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import BookDetailPage from './pages/BookDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { toastMsg, clearToast } = useApp();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/login" element={<AuthPage />} />
        {/* Cart works for guests AND logged-in users */}
        <Route path="/cart" element={<CartPage />} />
        {/* Checkout handles its own login prompt if not authenticated */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      </Routes>
      {toastMsg && <Toast message={toastMsg.msg} type={toastMsg.type} onClose={clearToast} />}
    </>
  );
}

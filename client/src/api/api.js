const API_BASE = 'http://localhost:3000/api';

function authHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function api(path, opts = {}, token = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

// ── Auth ──
export const authApi = {
  login: (email, password) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (form) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify(form) }),
};

// ── Products ──
export const productApi = {
  getAll: () => api('/products'),
  getById: (id) => api(`/products/${id}`),
  search: (keyword) => api(`/products/search?keyword=${encodeURIComponent(keyword)}`),
  filter: (params) => {
    const qs = new URLSearchParams(params).toString();
    return api(`/products/filter?${qs}`);
  },
  sortByPrice: (order = 'ASC') => api(`/products/sort/price?order=${order}`),
  sortByName: (order = 'ASC') => api(`/products/sort/name?order=${order}`),
};

// ── Cart ──
export const cartApi = {
  get: (token) => api('/cart', {}, token),
  add: (bookId, quantity, token) =>
    api('/cart/add', { method: 'POST', body: JSON.stringify({ bookId, quantity }) }, token),
  update: (bookId, quantity, token) =>
    api('/cart/update', { method: 'POST', body: JSON.stringify({ bookId, quantity }) }, token),
  remove: (bookId, token) =>
    api('/cart/delete', { method: 'POST', body: JSON.stringify({ bookId }) }, token),
  clear: (token) =>
    api('/cart/clear', { method: 'POST' }, token),
};

// ── Orders ──
export const orderApi = {
  create: (orderData, token) =>
    api('/orders', { method: 'POST', body: JSON.stringify(orderData) }, token),
  myOrders: (token) => {
    console.log('token being sent:', token); // ← add this
    return api('/orders/my-orders', { method: 'GET' }, token);
  },
  // myOrders: (token) =>
  //   api('/orders/my-orders', { method: 'GET'}, token),
  getById: (id, token) =>
    api(`/orders/${id}`, { method: 'GET' }, token),
};

// ── Users ──
export const userApi = {
  getProfile: (id, token) => api(`/users/${id}`, {}, token),
  updateProfile: (id, body, token) =>
    api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
};

// ── Admin ──
export const adminApi = {
  getUsers: (token) => api('/admin/users', {}, token),
  getAllOrders: (token) => api('/admin/users/all', {}, token),

  updateUser: (id, body, token) =>
    api(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
};

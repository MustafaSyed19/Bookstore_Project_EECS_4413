import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { adminApi, productApi, userApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';

export default function AdminPage() {
  const { token, toast, inventoryLog, addInventoryLogEntry } = useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const orders = await adminApi.getAllOrders(token);
        const normalized = orders.map(o => ({
          ...o,
          date: o.createdAt,
          total: o.totalAmount,
        }));
        setAllOrders(normalized);
      } catch (e) { toast(e.message, 'error'); }
    })();
  }, [token]);

  return (
    <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>
      <h1 className="serif fade-up" style={{ fontSize:28, marginBottom:24 }}>Admin Dashboard</h1>
      <div className="profile-tabs fade-up" style={{ marginBottom:0 }}>
        <button className={`profile-tab${activeTab==='users'?' active':''}`} onClick={()=>setActiveTab('users')}>Users</button>
        <button className={`profile-tab${activeTab==='inventory'?' active':''}`} onClick={()=>setActiveTab('inventory')}>Inventory</button>
        <button className={`profile-tab${activeTab==='inv-history'?' active':''}`} onClick={()=>setActiveTab('inv-history')}>Inventory History</button>
        <button className={`profile-tab${activeTab==='sales'?' active':''}`} onClick={()=>setActiveTab('sales')}>Sales</button>
      </div>
      {activeTab === 'users' && <UsersTab token={token} toast={toast} allOrders={allOrders} />}
      {activeTab === 'inventory' && <InventoryTab token={token} toast={toast} addLog={addInventoryLogEntry} />}
      {activeTab === 'inv-history' && <InventoryHistoryTab log={inventoryLog} />}
      {activeTab === 'sales' && <SalesTab orderHistory={allOrders} />}
    </div>
  );
}

/* ═══════ USERS TAB — edit name, email, role, address, card ═══════ */
function UsersTab({ token, toast, allOrders }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);

  const load = async () => {
    try { setUsers(await adminApi.getUsers(token)); } catch (e) { toast(e.message,'error'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [token]);

  const startEdit = async (u) => {
    setEditId(u.id);
    let addr = {};
    try {
      const profile = await userApi.getProfile(u.id, token);
      if (profile.addresses?.length > 0) {
        const a = profile.addresses[0];
        addr = { street:a.street||'', city:a.city||'', province:a.province||'', country:a.country||'', zip:a.zip||'', phone:a.phone||'' };
      }
    } catch {}
    setEditForm({
      firstName: u.firstName||'', lastName: u.lastName||'', email: u.email||'', role: u.role||'customer',
      ...addr, street: addr.street||'', city: addr.city||'', province: addr.province||'',
      country: addr.country||'', zip: addr.zip||'', phone: addr.phone||'',
    });
  };

  const saveEdit = async (id) => {
    try {
      await adminApi.updateUser(id, {
        firstName: editForm.firstName, lastName: editForm.lastName,
        email: editForm.email, role: editForm.role,
        address: {
          street: editForm.street, city: editForm.city, province: editForm.province,
          country: editForm.country, zip: editForm.zip, phone: editForm.phone,
        },
      }, token);
      toast('User updated!','success'); setEditId(null); await load();
    } catch (e) { toast(e.message,'error'); }
  };

  if (loading) return <div className="spinner"/>;

  return (
    <div className="fade-up">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'20px 0'}}>
        <span className="product-count">{users.length} user{users.length!==1?'s':''}</span>
      </div>
      <div style={{overflowX:'auto'}}>
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => editId===u.id ? (
              <tr key={u.id}>
                <td colSpan={5} style={{padding:20}}>
                  <h4 style={{marginBottom:12,fontSize:14,fontWeight:600}}>Edit User #{u.id}</h4>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                    <div className="input-group" style={{margin:0}}><label>First Name</label><input className="input" value={editForm.firstName} onChange={e=>setEditForm(f=>({...f,firstName:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>Last Name</label><input className="input" value={editForm.lastName} onChange={e=>setEditForm(f=>({...f,lastName:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>Email</label><input className="input" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/></div>
                  </div>
                  <div className="input-group" style={{margin:'0 0 12px',maxWidth:200}}><label>Role</label>
                    <select className="input" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                      <option value="customer">Customer</option><option value="admin">Admin</option>
                    </select>
                  </div>
                  <h4 style={{marginBottom:8,fontSize:13,fontWeight:600,color:'var(--brown)'}}>Shipping Address</h4>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                    <div className="input-group" style={{margin:0}}><label>Street</label><input className="input" value={editForm.street} onChange={e=>setEditForm(f=>({...f,street:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>City</label><input className="input" value={editForm.city} onChange={e=>setEditForm(f=>({...f,city:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>Province</label><input className="input" value={editForm.province} onChange={e=>setEditForm(f=>({...f,province:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>Country</label><input className="input" value={editForm.country} onChange={e=>setEditForm(f=>({...f,country:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>Postal Code</label><input className="input" value={editForm.zip} onChange={e=>setEditForm(f=>({...f,zip:e.target.value}))}/></div>
                    <div className="input-group" style={{margin:0}}><label>Phone</label><input className="input" value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/></div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-primary btn-sm" onClick={()=>saveEdit(u.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>setEditId(null)}>Cancel</button>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.id}</td>
                  <td>{[u.firstName,u.lastName].filter(Boolean).join(' ')||'—'}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td><div style={{display:'flex',gap:6}}>
                    <button className="btn btn-outline btn-sm" onClick={()=>startEdit(u)}><Icon d={ICONS.edit} size={14}/> Edit</button>
                    <button className="btn btn-sm btn-secondary" onClick={()=>setExpandedUser(expandedUser===u.id?null:u.id)}>{expandedUser===u.id?'Hide':'Orders'}</button>
                  </div></td>
                </tr>
                {expandedUser===u.id && (
                  <tr key={`${u.id}-o`}><td colSpan={5} style={{background:'var(--warm)',padding:16}}>
                    {allOrders.filter(o=>o.userId===u.id).length===0
                      ? <span style={{color:'var(--muted)',fontSize:13}}>No orders for this user.</span>
                      : allOrders.filter(o=>o.userId===u.id).map((order,i)=>(
                        <div key={i} style={{background:'var(--white)',borderRadius:8,padding:14,marginBottom:8}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
                            <span style={{fontWeight:600}}>{order.id}</span>
                            <span style={{color:'var(--muted)'}}>{new Date(order.date).toLocaleDateString()}</span>
                            <span style={{fontWeight:700,color:'var(--rust)'}}>${Number(order.total).toFixed(2)}</span>
                          </div>
                          {order.items.map((item,j)=>(<div key={j} style={{fontSize:12,color:'var(--brown)'}}>{item.title} ×{item.quantity} — ${(Number(item.priceAtPurchase)*item.quantity).toFixed(2)}</div>))}
                        </div>
                      ))}
                  </td></tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════ INVENTORY TAB — edit/add with audit logging ═══════ */
function InventoryTab({ token, toast, addLog }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    title:'',isbn:'',price:'',category:'',publisher:'',brand:'',language:'English',pages:'',quantity:'',description:'',imageUrl:'',
  });

  const load = async () => {
    try { setProducts(await productApi.getAll()); } catch (e) { toast(e.message,'error'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditId(p.id);
    setEditForm({ title:p.title||'', price:p.price||'', quantity:p.quantity||0, category:p.category||'', brand:p.brand||'', publisher:p.publisher||'' });
  };
  
const saveEdit = async (id) => {
  const oldProduct = products.find(p => p.id === id);
  const newQty = parseInt(editForm.quantity);
  const newPrice = parseFloat(editForm.price);

  try {
    await adminApi.updateBook(id, {
      title: editForm.title,
      category: editForm.category,
      brand: editForm.brand,
      price: newPrice,
      quantity: newQty,
    }, token);

    if (oldProduct) {
      const changes = [];
      if (oldProduct.quantity !== newQty) changes.push(`Quantity: ${oldProduct.quantity} → ${newQty}`);
      if (Number(oldProduct.price) !== newPrice) changes.push(`Price: $${Number(oldProduct.price).toFixed(2)} → $${newPrice.toFixed(2)}`);
      if (oldProduct.title !== editForm.title) changes.push(`Title: "${oldProduct.title}" → "${editForm.title}"`);
      if (oldProduct.category !== editForm.category) changes.push(`Category: "${oldProduct.category||'—'}" → "${editForm.category||'—'}"`);
      if (oldProduct.brand !== editForm.brand) changes.push(`Brand: "${oldProduct.brand||'—'}" → "${editForm.brand||'—'}"`);
      if (changes.length > 0) addLog({ type:'update', productId:id, productTitle:editForm.title, changes });
    }

    setProducts(prev => prev.map(p => p.id===id ? {...p,...editForm,price:newPrice,quantity:newQty} : p));
    toast('Product updated!', 'success');
    setEditId(null);
  } catch (e) { toast(e.message, 'error'); }
};

  const handleAdd = async () => {
    try {
      const result = await adminApi.createBook({
        isbn:        addForm.isbn        || null,
        price:       parseFloat(addForm.price)  || 0,
        title:       addForm.title,
        language:    addForm.language    || 'English',
        pages:       parseInt(addForm.pages)    || 0,
        description: addForm.description || null,
        category:    addForm.category    || null,
        publisher:   addForm.publisher   || null,
        brand:       addForm.brand       || null,
        quantity:    parseInt(addForm.quantity) || 0,
        imageUrl:    addForm.imageUrl    || null,
      }, token);

      const np = {
        id:       result.id,
        ...addForm,
        price:    parseFloat(addForm.price)  || 0,
        pages:    parseInt(addForm.pages)    || 0,
        quantity: parseInt(addForm.quantity) || 0,
      };
      setProducts(prev => [np, ...prev]);
      addLog({ type:'add', productId:result.id, productTitle:np.title, changes:[`New product added with qty ${np.quantity}, price $${np.price.toFixed(2)}`] });
      setShowAdd(false);
      setAddForm({title:'',isbn:'',price:'',category:'',publisher:'',brand:'',language:'English',pages:'',quantity:'',description:'',imageUrl:''});
      toast('Product added!','success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (loading) return <div className="spinner"/>;

  return (
    <div className="fade-up">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'20px 0'}}>
        <span className="product-count">{products.length} product{products.length!==1?'s':''}</span>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(!showAdd)}><Icon d={ICONS.plus} size={14}/> Add New Item</button>
      </div>

      {showAdd && (
        <div className="profile-section fade-up" style={{marginBottom:20}}>
          <h3 className="section-title">Add New Product</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="input-group"><label>Title *</label><input className="input" value={addForm.title} onChange={e=>setAddForm(f=>({...f,title:e.target.value}))}/></div>
            <div className="input-group"><label>ISBN</label><input className="input" value={addForm.isbn} onChange={e=>setAddForm(f=>({...f,isbn:e.target.value}))}/></div>
            <div className="input-group"><label>Price *</label><input className="input" type="number" step="0.01" value={addForm.price} onChange={e=>setAddForm(f=>({...f,price:e.target.value}))}/></div>
            <div className="input-group"><label>Quantity *</label><input className="input" type="number" value={addForm.quantity} onChange={e=>setAddForm(f=>({...f,quantity:e.target.value}))}/></div>
            <div className="input-group"><label>Category</label><input className="input" value={addForm.category} onChange={e=>setAddForm(f=>({...f,category:e.target.value}))}/></div>
            <div className="input-group"><label>Brand</label><input className="input" value={addForm.brand} onChange={e=>setAddForm(f=>({...f,brand:e.target.value}))}/></div>
            <div className="input-group"><label>Publisher</label><input className="input" value={addForm.publisher} onChange={e=>setAddForm(f=>({...f,publisher:e.target.value}))}/></div>
            <div className="input-group"><label>Language</label><input className="input" value={addForm.language} onChange={e=>setAddForm(f=>({...f,language:e.target.value}))}/></div>
            <div className="input-group"><label>Pages</label><input className="input" type="number" value={addForm.pages} onChange={e=>setAddForm(f=>({...f,pages:e.target.value}))}/></div>
            <div className="input-group"><label>Image URL</label><input className="input" value={addForm.imageUrl} onChange={e=>setAddForm(f=>({...f,imageUrl:e.target.value}))}/></div>
          </div>
          <div className="input-group"><label>Description</label><textarea className="input" rows={3} value={addForm.description} onChange={e=>setAddForm(f=>({...f,description:e.target.value}))} style={{resize:'vertical'}}/></div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={!addForm.title||!addForm.price}>Add Product</button>
            <button className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{overflowX:'auto'}}>
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Brand</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p => editId===p.id ? (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><input className="input" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}/></td>
                <td><input className="input" style={{width:100}} value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}/></td>
                <td><input className="input" style={{width:100}} value={editForm.brand} onChange={e=>setEditForm(f=>({...f,brand:e.target.value}))}/></td>
                <td><input className="input" type="number" step="0.01" style={{width:80}} value={editForm.price} onChange={e=>setEditForm(f=>({...f,price:e.target.value}))}/></td>
                <td><input className="input" type="number" style={{width:70}} value={editForm.quantity} onChange={e=>setEditForm(f=>({...f,quantity:e.target.value}))}/></td>
                <td><div style={{display:'flex',gap:6}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>saveEdit(p.id)}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setEditId(null)}>Cancel</button>
                </div></td>
              </tr>
            ) : (
              <tr key={p.id}>
                <td style={{fontWeight:600}}>{p.id}</td>
                <td>{p.title}</td>
                <td>{p.category||'—'}</td>
                <td>{p.brand||'—'}</td>
                <td style={{fontWeight:600}}>${Number(p.price).toFixed(2)}</td>
                <td><span className={`card-stock ${p.quantity>0?'in-stock':'out-stock'}`}>{p.quantity}</span></td>
                <td><button className="btn btn-outline btn-sm" onClick={()=>startEdit(p)}><Icon d={ICONS.edit} size={14}/> Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════ INVENTORY HISTORY TAB ═══════ */
function InventoryHistoryTab({ log }) {
  if (log.length === 0) {
    return (
      <div className="fade-up" style={{marginTop:20}}>
        <div className="empty"><div className="empty-icon">📋</div><h3>No inventory changes yet</h3><p>Changes made in the Inventory tab will be logged here as an audit trail.</p></div>
      </div>
    );
  }
  return (
    <div className="fade-up" style={{marginTop:20}}>
      <div style={{overflowX:'auto'}}>
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Action</th><th>Product</th><th>Changes</th></tr></thead>
          <tbody>
            {log.map((entry, i) => (
              <tr key={i}>
                <td style={{whiteSpace:'nowrap',fontSize:13}}>{new Date(entry.date).toLocaleString()}</td>
                <td><span className={`role-badge ${entry.type==='add'?'role-customer':'role-admin'}`}>{entry.type==='add'?'Added':'Updated'}</span></td>
                <td style={{fontWeight:600}}>{entry.productTitle} <span style={{color:'var(--muted)',fontWeight:400}}>#{entry.productId}</span></td>
                <td style={{fontSize:13}}>{entry.changes.map((c,j) => <div key={j}>{c}</div>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════ SALES TAB — filter by customer, product, date ═══════ */
function SalesTab({ orderHistory }) {
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const customers = [...new Set(orderHistory.map(o=>o.userName).filter(Boolean))];
  const allProducts = [...new Set(orderHistory.flatMap(o=>o.items.map(i=>i.title)))].sort();

  let filtered = [...orderHistory];
  if (filterCustomer) filtered = filtered.filter(o => o.userName === filterCustomer);
  if (filterProduct) filtered = filtered.filter(o => o.items.some(i => i.title === filterProduct));
  if (filterDateFrom) filtered = filtered.filter(o => new Date(o.date) >= new Date(filterDateFrom));
  if (filterDateTo) filtered = filtered.filter(o => new Date(o.date) <= new Date(filterDateTo+'T23:59:59'));

  const totalRevenue = filtered.reduce((s,o) => s+Number(o.total),0);
  const totalItems = filtered.reduce((s,o) => s+o.items.reduce((s2,i)=>s2+i.quantity,0),0);

  return (
    <div className="fade-up">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,margin:'20px 0'}}>
        <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value">${totalRevenue.toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Orders</div><div className="stat-value">{filtered.length}</div></div>
        <div className="stat-card"><div className="stat-label">Items Sold</div><div className="stat-value">{totalItems}</div></div>
      </div>
      <div className="toolbar" style={{marginBottom:20}}>
        <div className="toolbar-group" style={{flexWrap:'wrap',gap:10}}>
          <Icon d={ICONS.filter} size={16} color="var(--muted)"/>
          <select value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterProduct} onChange={e=>setFilterProduct(e.target.value)}>
            <option value="">All Products</option>
            {allProducts.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" className="input" style={{width:150,padding:'6px 10px',fontSize:13}} value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)} title="From date"/>
          <input type="date" className="input" style={{width:150,padding:'6px 10px',fontSize:13}} value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)} title="To date"/>
          {(filterCustomer||filterProduct||filterDateFrom||filterDateTo) && (
            <button className="btn btn-sm btn-secondary" onClick={()=>{setFilterCustomer('');setFilterProduct('');setFilterDateFrom('');setFilterDateTo('');}}>Clear</button>
          )}
        </div>
      </div>
      {filtered.length===0 ? (
        <div className="empty"><div className="empty-icon">📊</div><h3>No sales found</h3><p>Adjust filters or place orders to see sales here.</p></div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((order,idx)=>(
                <>
                  <tr key={idx} style={{cursor:'pointer'}} onClick={()=>setExpandedOrder(expandedOrder===idx?null:idx)}>
                    <td style={{fontWeight:600}}>{order.id}</td>
                    <td>{new Date(order.date).toLocaleDateString()}</td>
                    <td>{order.userName||'—'}</td>
                    <td>{order.items.reduce((s,i)=>s+i.quantity,0)} items</td>
                    <td style={{fontWeight:700}}>${Number(order.total).toFixed(2)}</td>
                    <td><span className="card-stock in-stock">{order.status}</span></td>
                    <td><Icon d={ICONS.chevDown} size={14} color="var(--muted)" style={{transform:expandedOrder===idx?'rotate(180deg)':'none',transition:'0.2s'}}/></td>
                  </tr>
                  {expandedOrder===idx && (
                    <tr key={`${idx}-d`}><td colSpan={7} style={{background:'var(--warm)',padding:20}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                        <div>
                          <h4 style={{fontSize:13,fontWeight:600,color:'var(--brown)',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Order Items</h4>
                          {order.items.map((item,i)=>(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--sand)',fontSize:14}}>
                              <div><span style={{fontWeight:600}}>{item.title}</span><span style={{color:'var(--muted)',marginLeft:8}}>×{item.quantity}</span> <span style={{color:'var(--muted)',fontSize:12}}>@ ${Number(item.priceAtPurchase).toFixed(2)}</span></div>
                              <span style={{fontWeight:600}}>${(Number(item.priceAtPurchase)*item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,fontWeight:700,fontSize:15}}>
                            <span>Total</span><span style={{color:'var(--rust)'}}>${Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <h4 style={{fontSize:13,fontWeight:600,color:'var(--brown)',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Shipping</h4>
                          {order.shipping ? (
                            <div style={{lineHeight:1.7,fontSize:14}}>
                              <div>{order.shipping.street}</div>
                              <div>{order.shipping.city}, {order.shipping.province}</div>
                              <div>{order.shipping.country} {order.shipping.zip}</div>
                              {order.shipping.phone && <div>Phone: {order.shipping.phone}</div>}
                            </div>
                          ) : <span style={{color:'var(--muted)'}}>—</span>}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
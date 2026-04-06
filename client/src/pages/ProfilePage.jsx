import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { userApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';

export default function ProfilePage() {
  const { user, token, toast, orderHistory, savedCard, saveCardInfo } = useApp();

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const [form, setForm] = useState({});
  const [cardForm, setCardForm] = useState({ cardNumber:'', cardName:'', expiry:'', cvv:'' });
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    (async () => {
      try {
        const data = await userApi.getProfile(user.id, token);
        setProfile(data.user);
        setAddresses(data.addresses || []);
        setForm({
          firstName: data.user.firstName||'', lastName: data.user.lastName||'', email: data.user.email||'',
          street: data.addresses?.[0]?.street||'', city: data.addresses?.[0]?.city||'',
          province: data.addresses?.[0]?.province||'', country: data.addresses?.[0]?.country||'',
          zip: data.addresses?.[0]?.zip||'', phone: data.addresses?.[0]?.phone||'',
        });
        if (savedCard) setCardForm(savedCard);
      } catch (err) { toast(err.message, 'error'); }
      setLoading(false);
    })();
  }, [user.id, token, toast, savedCard]);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const save = async () => {
    try {
      const body = {
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        address: { street: form.street, city: form.city, province: form.province, country: form.country, zip: form.zip, phone: form.phone },
      };
      const data = await userApi.updateProfile(user.id, body, token);
      setProfile(data.user); setAddresses(data.addresses||[]); setEditing(false);
      toast('Profile updated!', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };

  const saveCard = () => {
    saveCardInfo(cardForm);
    setEditingCard(false);
    toast('Card info updated!', 'success');
  };

  if (loading) return <div className="container" style={{ paddingTop: 40 }}><div className="spinner" /></div>;

  const addr = addresses[0];

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760, margin: '0 auto' }}>
      <h1 className="serif fade-up" style={{ fontSize: 28, marginBottom: 24 }}>My Account</h1>

      <div className="profile-tabs fade-up">
        <button className={`profile-tab${activeTab==='info'?' active':''}`} onClick={()=>setActiveTab('info')}>Personal Info</button>
        <button className={`profile-tab${activeTab==='history'?' active':''}`} onClick={()=>setActiveTab('history')}>Purchase History</button>
      </div>

      {/* ═══ INFO TAB ═══ */}
      {activeTab === 'info' && (
        <>
          {/* Personal Info */}
          <div className="profile-section fade-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 className="section-title" style={{ margin:0 }}>Personal Info</h3>
              {!editing && <button className="btn btn-outline btn-sm" onClick={()=>setEditing(true)}><Icon d={ICONS.edit} size={14}/> Edit</button>}
            </div>
            {editing ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label>First Name</label><input className="input" value={form.firstName} onChange={e=>set('firstName',e.target.value)}/></div>
                  <div className="input-group"><label>Last Name</label><input className="input" value={form.lastName} onChange={e=>set('lastName',e.target.value)}/></div>
                </div>
                <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-primary" onClick={save}>Save Changes</button>
                  <button className="btn btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[['First Name',profile?.firstName],['Last Name',profile?.lastName],['Email',profile?.email],['Role',profile?.role]].map(([l,v])=>(
                  <div key={l}><div style={{ fontSize:12, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{l}</div><div style={{ fontSize:15, fontWeight:500 }}>{v||'—'}</div></div>
                ))}
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="profile-section fade-up" style={{ animationDelay:'0.05s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 className="section-title" style={{ margin:0 }}>Shipping Address</h3>
              {!editing && <button className="btn btn-outline btn-sm" onClick={()=>setEditing(true)}><Icon d={ICONS.edit} size={14}/> Edit</button>}
            </div>
            {editing ? (
              <>
                <div className="input-group"><label>Street</label><input className="input" value={form.street} onChange={e=>set('street',e.target.value)}/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label>City</label><input className="input" value={form.city} onChange={e=>set('city',e.target.value)}/></div>
                  <div className="input-group"><label>Province</label><input className="input" value={form.province} onChange={e=>set('province',e.target.value)}/></div>
                  <div className="input-group"><label>Country</label><input className="input" value={form.country} onChange={e=>set('country',e.target.value)}/></div>
                  <div className="input-group"><label>Postal Code</label><input className="input" value={form.zip} onChange={e=>set('zip',e.target.value)}/></div>
                </div>
                <div className="input-group"><label>Phone</label><input className="input" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
              </>
            ) : addr ? (
              <div style={{ lineHeight:1.7, fontSize:15 }}>
                {[addr.street,[addr.city,addr.province].filter(Boolean).join(', '),[addr.country,addr.zip].filter(Boolean).join(' '),addr.phone].filter(Boolean).map((line,i)=><div key={i}>{line}</div>)}
                {!addr.street && !addr.city && <span style={{ color:'var(--muted)' }}>No address on file</span>}
              </div>
            ) : <span style={{ color:'var(--muted)', fontSize:14 }}>No address on file. Click Edit to add one.</span>}
          </div>

          {/* Credit Card */}
          <div className="profile-section fade-up" style={{ animationDelay:'0.1s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 className="section-title" style={{ margin:0 }}>Payment Method</h3>
              {!editingCard && <button className="btn btn-outline btn-sm" onClick={()=>setEditingCard(true)}><Icon d={ICONS.edit} size={14}/> Edit</button>}
            </div>
            {editingCard ? (
              <>
                <div className="input-group"><label>Card Number</label>
                  <input className="input" value={cardForm.cardNumber}
                    onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,16); setCardForm(f=>({...f,cardNumber:v.replace(/(\d{4})(?=\d)/g,'$1 ')}));}}
                    placeholder="1234 5678 9012 3456"/>
                </div>
                <div className="input-group"><label>Name on Card</label>
                  <input className="input" value={cardForm.cardName} onChange={e=>setCardForm(f=>({...f,cardName:e.target.value}))} placeholder="John Doe"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label>Expiry</label>
                    <input className="input" value={cardForm.expiry}
                      onChange={e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4); if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2); setCardForm(f=>({...f,expiry:v}));}}
                      placeholder="MM/YY"/>
                  </div>
                  <div className="input-group"><label>CVV</label>
                    <input className="input" type="password" value={cardForm.cvv}
                      onChange={e=>setCardForm(f=>({...f,cvv:e.target.value.replace(/\D/g,'').slice(0,4)}))} placeholder="•••"/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-primary" onClick={saveCard}>Save Card</button>
                  <button className="btn btn-secondary" onClick={()=>setEditingCard(false)}>Cancel</button>
                </div>
              </>
            ) : savedCard && savedCard.cardNumber ? (
              <div style={{ fontSize:15 }}>
                <div>•••• •••• •••• {savedCard.cardNumber.replace(/\s/g,'').slice(-4)}</div>
                <div style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>{savedCard.cardName} — Exp: {savedCard.expiry}</div>
              </div>
            ) : <span style={{ color:'var(--muted)', fontSize:14 }}>No card on file. Click Edit to add one.</span>}
          </div>
        </>
      )}

      {/* ═══ PURCHASE HISTORY TAB ═══ */}
      {activeTab === 'history' && (
        <div className="fade-up">
          {orderHistory.length === 0 ? (
            <div className="empty"><div className="empty-icon">📦</div><h3>No orders yet</h3><p>Your purchase history will appear here after your first order.</p></div>
          ) : orderHistory.filter(o => !user || o.userId === user.id || user.role === 'admin').map((order, idx) => (
            <div key={idx} className="profile-section" style={{ animationDelay:`${idx*0.05}s` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{order.id}</div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>{new Date(order.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
                </div>
                <span className="card-stock in-stock">{order.status}</span>
              </div>
              {order.items.map((item,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:14 }}>
                  <span>{item.title} <span style={{ color:'var(--muted)' }}>×{item.quantity}</span></span>
                  <span style={{ fontWeight:600 }}>${(Number(item.price)*item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, paddingTop:12, borderTop:'1px solid var(--sand)', fontWeight:700 }}>
                <span>Total</span><span style={{ color:'var(--rust)' }}>${Number(order.total).toFixed(2)}</span>
              </div>
              {order.shipping && (
                <div style={{ marginTop:12, fontSize:13, color:'var(--muted)' }}>
                  Shipped to: {[order.shipping.street, order.shipping.city, order.shipping.province].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

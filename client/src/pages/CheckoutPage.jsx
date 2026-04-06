import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cartApi, userApi, orderApi, productApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    user, token, toast, simulatePayment, addOrder, refreshCart, savedCard, saveCardInfo,
    guestCart, getGuestCartTotal, clearGuestCart,
  } = useApp();

  // If not logged in, prompt login
  if (!token) {
    return (
      <div className="container" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <div className="auth-card fade-up" style={{ maxWidth: '100%' }}>
          <Icon d={ICONS.cart} size={40} color="var(--rust)" />
          <h2 className="serif" style={{ marginTop: 16, marginBottom: 8 }}>Sign in to Checkout</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Please log in or create a new account to complete your purchase. Your cart items will be saved.
          </p>
          <button className="btn btn-primary btn-full" style={{ marginBottom: 10 }}
            onClick={() => navigate('/login', { state: { from: 'checkout' } })}>
            Sign In
          </button>
          <button className="btn btn-outline btn-full"
            onClick={() => navigate('/login', { state: { from: 'checkout' } })}>
            Create New Account
          </button>
          <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }}
            onClick={() => navigate('/cart')}>
            <Icon d={ICONS.back} size={14} /> Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return <CheckoutForm />;
}

function CheckoutForm() {
  const navigate = useNavigate();
  const {
    user, token, toast, simulatePayment, addOrder, refreshCart,
    savedCard, saveCardInfo, addInventoryLogEntry,
  } = useApp();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // form | success | failed
  const [orderResult, setOrderResult] = useState(null);

  // Address state
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [savedAddress, setSavedAddress] = useState(null);
  const [shipping, setShipping] = useState({ street:'', city:'', province:'', country:'', zip:'', phone:'' });

  // Card state
  const [useSavedCard, setUseSavedCard] = useState(true);
  const [card, setCard] = useState({ cardNumber:'', cardName:'', expiry:'', cvv:'' });

  const [errors, setErrors] = useState({});
  const [inventoryError, setInventoryError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const cartData = await cartApi.get(token);
        setCart(cartData);
        if (cartData.items.length === 0) { navigate('/cart'); return; }

        // Load saved profile
        const profile = await userApi.getProfile(user.id, token);
        if (profile.addresses?.length > 0) {
          const addr = profile.addresses[0];
          setSavedAddress(addr);
          setShipping({
            street: addr.street||'', city: addr.city||'', province: addr.province||'',
            country: addr.country||'', zip: addr.zip||'', phone: addr.phone||'',
          });
        } else {
          setUseSavedAddress(false);
        }

        // Load saved card
        if (savedCard) {
          setCard(savedCard);
        } else {
          setUseSavedCard(false);
        }
      } catch (err) { toast(err.message, 'error'); }
      setLoading(false);
    })();
  }, [token, user.id, toast, navigate, savedCard]);

  const setShipField = (k,v) => setShipping(p => ({...p,[k]:v}));
  const setCardField = (k,v) => setCard(p => ({...p,[k]:v}));

  const validate = () => {
    const errs = {};
    const s = useSavedAddress && savedAddress ? savedAddress : shipping;
    if (!s.street?.trim()) errs.street = 'Required';
    if (!s.city?.trim()) errs.city = 'Required';
    if (!s.province?.trim()) errs.province = 'Required';
    if (!s.country?.trim()) errs.country = 'Required';
    if (!s.zip?.trim()) errs.zip = 'Required';

    const c = useSavedCard && savedCard ? savedCard : card;
    if (!c.cardNumber?.trim() || c.cardNumber.replace(/\s/g,'').length < 13) errs.cardNumber = 'Enter valid card number';
    if (!c.cardName?.trim()) errs.cardName = 'Required';
    if (!c.expiry?.trim() || !/^\d{2}\/\d{2}$/.test(c.expiry)) errs.expiry = 'MM/YY format';
    if (!c.cvv?.trim() || c.cvv.length < 3) errs.cvv = 'Invalid CVV';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setInventoryError('');
    if (!validate()) return;
    setSubmitting(true);

    // ── Inventory validation ──
    for (const item of cart.items) {
      try {
        const product = await productApi.getById(item.bookId);
        if (product.quantity < item.quantity) {
          setInventoryError(`"${item.title}" only has ${product.quantity} in stock, but you requested ${item.quantity}. Please update your cart.`);
          setSubmitting(false);
          return;
        }
      } catch {}
    }

    // ── Payment simulation (deny every 3rd) ──
    const paymentResult = simulatePayment();
    if (!paymentResult.approved) {
      setStep('failed');
      setSubmitting(false);
      return;
    }

    // ── Payment approved ──
    try {
      const orderData = {
        customerId: user.id,
        items: cart.items.map(item => ({
          bookId: item.bookId, quantity: item.quantity, priceAtPurchase: item.price,
        })),
      };
      try { await orderApi.create(orderData, token); } catch {}

      const activeShipping = useSavedAddress && savedAddress
        ? { street: savedAddress.street, city: savedAddress.city, province: savedAddress.province, country: savedAddress.country, zip: savedAddress.zip, phone: savedAddress.phone }
        : shipping;

      const order = {
        id: 'ORD-' + Date.now(),
        date: new Date().toISOString(),
        userId: user.id,
        userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        items: cart.items.map(item => ({
          bookId: item.bookId, title: item.title, quantity: item.quantity,
          price: item.price, imageUrl: item.imageUrl,
        })),
        total: cart.total,
        shipping: activeShipping,
        status: 'Confirmed',
      };

      addOrder(order);
      setOrderResult(order);

      // Log inventory reduction for each item
      for (const item of cart.items) {
        addInventoryLogEntry({
          type: 'update',
          productId: item.bookId,
          productTitle: item.title,
          changes: [`Quantity reduced by ${item.quantity} (checkout order ${order.id})`],
        });
      }

      // Save card if entering new one
      if (!useSavedCard || !savedCard) {
        saveCardInfo(card);
      }

      // Clear cart
      try { await cartApi.clear(token); refreshCart(); } catch {}

      setStep('success');
    } catch (err) { toast(err.message, 'error'); }
    setSubmitting(false);
  };

  if (loading) return <div className="container" style={{ paddingTop: 40 }}><div className="spinner" /></div>;

  // ── SUCCESS ──
  if (step === 'success' && orderResult) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700, margin: '0 auto' }}>
        <div className="checkout-result fade-up">
          <div className="result-icon success-icon">✓</div>
          <h2 className="serif" style={{ marginBottom: 8 }}>Order Confirmed!</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Order #{orderResult.id}</p>

          <div className="profile-section">
            <h3 className="section-title">Order Summary</h3>
            {orderResult.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--sand)' }}>
                <div><span style={{ fontWeight: 600 }}>{item.title}</span> <span style={{ color: 'var(--muted)' }}>×{item.quantity}</span></div>
                <span style={{ fontWeight: 600 }}>${(Number(item.price)*item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, fontWeight: 700, fontSize: 18 }}>
              <span>Total</span><span style={{ color: 'var(--rust)' }}>${Number(orderResult.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="profile-section" style={{ marginTop: 16 }}>
            <h3 className="section-title">Shipping To</h3>
            <div style={{ lineHeight: 1.7 }}>
              <div>{orderResult.shipping.street}</div>
              <div>{orderResult.shipping.city}, {orderResult.shipping.province}</div>
              <div>{orderResult.shipping.country} {orderResult.shipping.zip}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>View Purchase History</button>
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED ──
  if (step === 'failed') {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700, margin: '0 auto' }}>
        <div className="checkout-result fade-up">
          <div className="result-icon failed-icon">✕</div>
          <h2 className="serif" style={{ marginBottom: 8 }}>Credit Card Authorization Failed.</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Your payment could not be processed. Please try again or use a different card.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setStep('form'); setErrors({}); }}>Try Again</button>
            <button className="btn btn-secondary" onClick={() => navigate('/cart')}>Back to Cart</button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ──
  const itemCount = cart.items.reduce((s,i) => s + i.quantity, 0);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <button className="btn btn-secondary" onClick={() => navigate('/cart')} style={{ marginBottom: 24 }}>
        <Icon d={ICONS.back} size={16} /> Back to Cart
      </button>
      <h1 className="serif fade-up" style={{ fontSize: 28, marginBottom: 28 }}>Checkout</h1>

      {inventoryError && (
        <div className="error-msg fade-in" style={{ marginBottom: 20 }}>{inventoryError}</div>
      )}

      <div className="checkout-grid">
        <div>
          {/* ── SHIPPING ── */}
          <div className="profile-section fade-up">
            <h3 className="section-title">Shipping Information</h3>
            {savedAddress && savedAddress.street && (
              <div style={{ marginBottom: 20 }}>
                <label className="radio-label">
                  <input type="radio" checked={useSavedAddress} onChange={() => {
                    setUseSavedAddress(true);
                    setShipping({ street:savedAddress.street||'', city:savedAddress.city||'', province:savedAddress.province||'', country:savedAddress.country||'', zip:savedAddress.zip||'', phone:savedAddress.phone||'' });
                  }} />
                  <div>
                    <span>Use saved address</span>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {savedAddress.street}, {savedAddress.city}, {savedAddress.province}
                    </div>
                  </div>
                </label>
                <label className="radio-label" style={{ marginTop: 12 }}>
                  <input type="radio" checked={!useSavedAddress} onChange={() => {
                    setUseSavedAddress(false);
                    setShipping({ street:'', city:'', province:'', country:'', zip:'', phone:'' });
                  }} />
                  <span>Enter a different address</span>
                </label>
              </div>
            )}
            {(!useSavedAddress || !savedAddress || !savedAddress.street) && (
              <>
                <div className="input-group"><label>Street *</label>
                  <input className={`input${errors.street?' input-error':''}`} value={shipping.street} onChange={e=>setShipField('street',e.target.value)} placeholder="123 Main St"/>
                  {errors.street && <span className="field-error">{errors.street}</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label>City *</label><input className={`input${errors.city?' input-error':''}`} value={shipping.city} onChange={e=>setShipField('city',e.target.value)}/>{errors.city && <span className="field-error">{errors.city}</span>}</div>
                  <div className="input-group"><label>Province *</label><input className={`input${errors.province?' input-error':''}`} value={shipping.province} onChange={e=>setShipField('province',e.target.value)}/>{errors.province && <span className="field-error">{errors.province}</span>}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label>Country *</label><input className={`input${errors.country?' input-error':''}`} value={shipping.country} onChange={e=>setShipField('country',e.target.value)}/>{errors.country && <span className="field-error">{errors.country}</span>}</div>
                  <div className="input-group"><label>Postal Code *</label><input className={`input${errors.zip?' input-error':''}`} value={shipping.zip} onChange={e=>setShipField('zip',e.target.value)}/>{errors.zip && <span className="field-error">{errors.zip}</span>}</div>
                </div>
                <div className="input-group"><label>Phone</label><input className="input" value={shipping.phone} onChange={e=>setShipField('phone',e.target.value)}/></div>
              </>
            )}
          </div>

          {/* ── PAYMENT ── */}
          <div className="profile-section fade-up" style={{ animationDelay:'0.1s' }}>
            <h3 className="section-title">Payment Information</h3>
            {savedCard && savedCard.cardNumber && (
              <div style={{ marginBottom: 20 }}>
                <label className="radio-label">
                  <input type="radio" checked={useSavedCard} onChange={() => { setUseSavedCard(true); setCard(savedCard); }} />
                  <div>
                    <span>Use saved card</span>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      •••• •••• •••• {savedCard.cardNumber.replace(/\s/g,'').slice(-4)} — {savedCard.cardName}
                    </div>
                  </div>
                </label>
                <label className="radio-label" style={{ marginTop: 12 }}>
                  <input type="radio" checked={!useSavedCard} onChange={() => {
                    setUseSavedCard(false);
                    setCard({ cardNumber:'', cardName:'', expiry:'', cvv:'' });
                  }} />
                  <span>Enter a different card</span>
                </label>
              </div>
            )}
            {(!useSavedCard || !savedCard || !savedCard.cardNumber) && (
              <>
                <div className="input-group"><label>Card Number *</label>
                  <input className={`input${errors.cardNumber?' input-error':''}`} value={card.cardNumber}
                    onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,16); setCardField('cardNumber', v.replace(/(\d{4})(?=\d)/g,'$1 '));}}
                    placeholder="1234 5678 9012 3456"/>
                  {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                </div>
                <div className="input-group"><label>Name on Card *</label>
                  <input className={`input${errors.cardName?' input-error':''}`} value={card.cardName} onChange={e=>setCardField('cardName',e.target.value)} placeholder="John Doe"/>
                  {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label>Expiry *</label>
                    <input className={`input${errors.expiry?' input-error':''}`} value={card.expiry}
                      onChange={e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4); if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2); setCardField('expiry',v);}}
                      placeholder="MM/YY"/>
                    {errors.expiry && <span className="field-error">{errors.expiry}</span>}
                  </div>
                  <div className="input-group"><label>CVV *</label>
                    <input className={`input${errors.cvv?' input-error':''}`} type="password" value={card.cvv}
                      onChange={e=>setCardField('cvv',e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••"/>
                    {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                  </div>
                </div>
              </>
            )}
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>🔒 Simulated payment — no real charges.</p>
          </div>
        </div>

        {/* ── ORDER REVIEW ── */}
        <div className="cart-summary fade-up" style={{ animationDelay:'0.15s' }}>
          <h3 className="serif" style={{ marginBottom: 20 }}>Order Review</h3>
          {cart.items.map(item => (
            <div key={item.id} style={{ display:'flex', gap:12, marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--sand)' }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} style={{ width:50, height:65, objectFit:'cover', borderRadius:4, background:'var(--warm)', flexShrink:0 }}
                  onError={e=>{e.target.style.display='none';}} />
              ) : (
                <div style={{ width:50, height:65, borderRadius:4, background:'var(--warm)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontFamily:'Libre Baskerville,serif', fontSize:18, flexShrink:0 }}>
                  {item.title?.[0]||'B'}
                </div>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, lineHeight:1.3 }}>{item.title}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>Qty: {item.quantity}</div>
              </div>
              <div style={{ fontWeight:600, fontSize:14, whiteSpace:'nowrap' }}>${(Number(item.price)*item.quantity).toFixed(2)}</div>
            </div>
          ))}
          <div className="summary-row"><span style={{color:'var(--muted)'}}>Subtotal ({itemCount} items)</span><span style={{fontWeight:600}}>${Number(cart.total).toFixed(2)}</span></div>
          <div className="summary-row"><span style={{color:'var(--muted)'}}>Shipping</span><span style={{color:'var(--success)',fontWeight:500}}>Free</span></div>
          <hr style={{ border:'none', borderTop:'1px solid var(--sand)', margin:'16px 0' }} />
          <div className="summary-row" style={{ marginBottom:24 }}><span style={{fontWeight:700,fontSize:18}}>Total</span><span style={{fontWeight:700,fontSize:22,color:'var(--rust)'}}>${Number(cart.total).toFixed(2)}</span></div>
          <button className="btn btn-primary btn-full" style={{ padding:'14px 22px', fontSize:15 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

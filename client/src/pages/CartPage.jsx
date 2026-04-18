import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cartApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    token, toast, refreshCart, updateServerCartQty,
    guestCart, getGuestCartTotal, updateGuestCartQty, removeFromGuestCart, clearGuestCart,
  } = useApp();

  const [serverCart, setServerCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const isGuest = !token;

  const loadServerCart = useCallback(async () => {
    if (isGuest) { setLoading(false); return; }
    try { setServerCart(await cartApi.get(token)); }
    catch (err) { toast(err.message, 'error'); }
    setLoading(false);
  }, [token, isGuest, toast]);

  useEffect(() => { loadServerCart(); }, [loadServerCart]);

  const items = isGuest ? guestCart.map(i => ({ ...i, id: i.bookId })) : serverCart.items;
  const total = isGuest ? getGuestCartTotal() : serverCart.total;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const updateQty = async (bookId, quantity) => {
    if (isGuest) { updateGuestCartQty(bookId, quantity); return; }
    // Stock-checked server update
    const ok = await updateServerCartQty(bookId, quantity, token);
    if (ok) { await loadServerCart(); refreshCart(); }
  };

  const removeItem = async (bookId) => {
    if (isGuest) { removeFromGuestCart(bookId); return; }
    try { await cartApi.remove(bookId, token); toast('Item removed','success'); await loadServerCart(); refreshCart(); }
    catch (err) { toast(err.message, 'error'); }
  };

  const clearCart = async () => {
    if (isGuest) { clearGuestCart(); return; }
    try { await cartApi.clear(token); toast('Cart cleared','success'); await loadServerCart(); refreshCart(); }
    catch (err) { toast(err.message, 'error'); }
  };

  if (loading) return <div className="container" style={{paddingTop:40}}><div className="spinner"/></div>;

  return (
    <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <h1 className="serif fade-up" style={{ fontSize:28, margin:0 }}>Shopping Cart</h1>
        <button className="btn btn-secondary fade-up" onClick={()=>navigate('/')}><Icon d={ICONS.back} size={16}/> Continue Shopping</button>
      </div>

      {isGuest && items.length > 0 && (
        <div className="info-banner fade-in" style={{marginBottom:20}}>
          You're browsing as a guest.
          <button className="btn btn-sm btn-primary" style={{marginLeft:12}} onClick={()=>navigate('/login')}>Sign in</button>
          to save your cart and checkout faster.
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty fade-in">
          <div className="empty-icon">🛒</div><h3>Your cart is empty</h3><p>Start adding some books!</p>
          <button className="btn btn-primary" onClick={()=>navigate('/')}>Browse Books</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map(item => (
              <div key={item.bookId||item.id} className="cart-item">
                {item.imageUrl ? <img className="cart-item-img" src={item.imageUrl} alt={item.title}
                  onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/> : null}
                <div className="cart-item-img-placeholder" style={item.imageUrl?{display:'none'}:{}}>{item.title?.[0]||'B'}</div>
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-price">${Number(item.price).toFixed(2)} each</div>
                  {item.inventory !== undefined && item.quantity >= item.inventory && (
                    <div style={{fontSize:12,color:'var(--rust)',marginTop:2}}>Max stock: {item.inventory}</div>
                  )}
                  <div style={{display:'flex',alignItems:'center',gap:12,marginTop:12}}>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={()=>updateQty(item.bookId,Math.max(1,item.quantity-1))}><Icon d={ICONS.minus} size={14}/></button>
                      <div className="qty-val">{item.quantity}</div>
                      <button className="qty-btn" onClick={()=>updateQty(item.bookId,item.quantity+1)}><Icon d={ICONS.plus} size={14}/></button>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={()=>removeItem(item.bookId)}><Icon d={ICONS.trash} size={14}/> Remove</button>
                  </div>
                </div>
                <div style={{fontWeight:700,fontSize:17,whiteSpace:'nowrap'}}>${(Number(item.price)*item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="cart-summary fade-up">
            <h3 className="serif" style={{marginBottom:20}}>Order Summary</h3>
            <div className="summary-row"><span style={{color:'var(--muted)'}}>Subtotal ({itemCount} items)</span><span style={{fontWeight:600}}>${Number(total).toFixed(2)}</span></div>
            <div className="summary-row"><span style={{color:'var(--muted)'}}>Shipping</span><span style={{color:'var(--success)',fontWeight:500}}>Free</span></div>
            <hr style={{border:'none',borderTop:'1px solid var(--sand)',margin:'16px 0'}}/>
            <div className="summary-row" style={{marginBottom:24}}><span style={{fontWeight:700,fontSize:18}}>Total</span><span style={{fontWeight:700,fontSize:22,color:'var(--rust)'}}>${Number(total).toFixed(2)}</span></div>
            <button className="btn btn-primary btn-full" style={{padding:'14px 22px',fontSize:15}} onClick={()=>navigate('/checkout')}>Proceed to Checkout</button>
            <button className="btn btn-outline btn-full" style={{marginTop:10}} onClick={clearCart}>Clear Cart</button>
            <button className="btn btn-secondary btn-full" style={{marginTop:10}} onClick={()=>navigate('/')}><Icon d={ICONS.back} size={14}/> Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, toast, refreshCart, addToGuestCart, addToServerCart } = useApp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      try { setProduct(await productApi.getById(id)); }
      catch (err) { toast(err.message, 'error'); }
      setLoading(false);
    })();
  }, [id, toast]);

  const addToCart = async () => {
    if (!product) return;
    if (qty > product.quantity) {
      toast(`Only ${product.quantity} available in stock`, 'error'); return;
    }
    if (!token) { addToGuestCart(product, qty); return; }
    const ok = await addToServerCart(parseInt(id), qty, token);
    if (ok) refreshCart();
  };

  if (loading) return <div className="container" style={{paddingTop:40}}><div className="spinner"/></div>;
  if (!product) return <div className="container" style={{paddingTop:40}}><div className="empty"><h3>Book not found</h3><button className="btn btn-secondary" onClick={()=>navigate('/')}>Go Back</button></div></div>;

  const p = product;
  return (
    <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>
      <button className="btn btn-secondary" onClick={()=>navigate('/')} style={{marginBottom:24}}>
        <Icon d={ICONS.back} size={16}/> Back to Browse
      </button>
      <div className="detail-grid fade-up">
        <div>
          {p.imageUrl ? <img className="detail-img" src={p.imageUrl} alt={p.title}
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/> : null}
          <div className="detail-img-placeholder" style={p.imageUrl?{display:'none'}:{}}>{p.title?.[0]||'B'}</div>
        </div>
        <div className="slide-in">
          {p.category && <div className="card-category" style={{marginBottom:12}}>{p.category}</div>}
          <h1 className="serif" style={{fontSize:30,lineHeight:1.3,marginBottom:4}}>{p.title}</h1>
          {p.publisher && <p style={{color:'var(--muted)',fontSize:15,marginBottom:8}}>by {p.publisher}</p>}
          <div className="detail-meta">
            {p.isbn && <span>ISBN: {p.isbn}</span>}
            {p.language && <span>Language: {p.language}</span>}
            {p.pages>0 && <span>{p.pages} pages</span>}
            {p.brand && <span>Brand: {p.brand}</span>}
          </div>
          <div className="detail-price">${Number(p.price).toFixed(2)}</div>
          <div style={{marginBottom:20}}>
            <span className={`card-stock ${p.quantity>0?'in-stock':'out-stock'}`} style={{display:'inline-block'}}>
              {p.quantity>0?`${p.quantity} remaining in stock`:'Sold Out'}
            </span>
          </div>
          {p.description && <p className="detail-desc">{p.description}</p>}
          {p.quantity>0 && (
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div className="qty-control">
                <button className="qty-btn" onClick={()=>setQty(Math.max(1,qty-1))}><Icon d={ICONS.minus} size={14}/></button>
                <div className="qty-val">{qty}</div>
                <button className="qty-btn" onClick={()=>setQty(Math.min(p.quantity,qty+1))}><Icon d={ICONS.plus} size={14}/></button>
              </div>
              <button className="btn btn-primary" onClick={addToCart}>Add to Cart</button>
            </div>
          )}
          {qty>=p.quantity && p.quantity>0 && <p style={{fontSize:12,color:'var(--rust)',marginTop:8}}>Maximum stock reached</p>}
        </div>
      </div>
    </div>
  );
}

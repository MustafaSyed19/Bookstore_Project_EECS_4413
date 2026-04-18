import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function BookCard({ book, delay = 0 }) {
  const navigate = useNavigate();
  const { token, addToGuestCart, addToServerCart, refreshCart } = useApp();

  const addToCart = async (e) => {
    e.stopPropagation();
    if (!token) {
      addToGuestCart(book, 1);
      return;
    }
    // Logged-in: stock-checked add
    const ok = await addToServerCart(book.id, 1, token);
    if (ok) refreshCart();
  };

  return (
    <div className="card fade-up" style={{ animationDelay: `${delay}s` }}
      onClick={() => navigate(`/book/${book.id}`)}>
      {book.imageUrl ? (
        <img className="card-img" src={book.imageUrl} alt={book.title}
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
      ) : null}
      <div className="card-img-placeholder" style={book.imageUrl?{display:'none'}:{}}>
        {book.title?.[0]||'B'}
      </div>
      <div className="card-body">
        {book.category && <div className="card-category">{book.category}</div>}
        <div className="card-title">{book.title}</div>
        {book.publisher && <div className="card-publisher">{book.publisher}</div>}
        <div className="card-footer">
          <span className="card-price">${Number(book.price).toFixed(2)}</span>
          <span className={`card-stock ${book.quantity>0?'in-stock':'out-stock'}`}>
            {book.quantity > 0 ? `${book.quantity} left` : 'Sold Out'}
          </span>
        </div>
        {book.quantity > 0 && (
          <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={addToCart}>Add to Cart</button>
        )}
      </div>
    </div>
  );
}

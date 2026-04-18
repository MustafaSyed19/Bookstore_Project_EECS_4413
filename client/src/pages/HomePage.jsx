import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/api';
import { Icon, ICONS } from '../components/Icons';
import BookCard from '../components/BookCard';

export default function HomePage() {
  const { toast } = useApp();
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [publisher, setPublisher] = useState('');
  const [viewMode, setViewMode] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (search.trim()) {
        data = await productApi.search(search);
      } else if (sort === 'price-asc') {
        data = await productApi.sortByPrice('ASC');
      } else if (sort === 'price-desc') {
        data = await productApi.sortByPrice('DESC');
      } else if (sort === 'name-asc') {
        data = await productApi.sortByName('ASC');
      } else if (sort === 'name-desc') {
        data = await productApi.sortByName('DESC');
      } else {
        data = await productApi.getAll();
      }
      setAllProducts(data);
      setProducts(data);
    } catch (err) { toast(err.message, 'error'); }
    setLoading(false);
  }, [search, sort, toast]);

  useEffect(() => { load(); }, [load]);

  // Apply local filters
  useEffect(() => {
    let filtered = [...allProducts];
    if (category) filtered = filtered.filter(p => p.category === category);
    if (brand) filtered = filtered.filter(p => p.brand === brand);
    if (publisher) filtered = filtered.filter(p => p.publisher === publisher);
    setProducts(filtered);
  }, [category, brand, publisher, allProducts]);

  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  const publishers = [...new Set(allProducts.map(p => p.publisher).filter(Boolean))].sort();

  const clearFilters = () => {
    setSearch(''); setCategory(''); setBrand(''); setPublisher(''); setSort(''); setViewMode('all');
  };

  return (
    <div>
      <div className="hero">
        <div className="hero-content container">
          <h1 className="fade-up">Discover Your Next Read</h1>
          <p className="fade-up" style={{ animationDelay: '0.1s' }}>Curated books for every reader</p>
          <div className="search-wrap fade-up" style={{ animationDelay: '0.2s' }}>
            <Icon d={ICONS.search} size={18} />
            <input className="search-input" placeholder="Search by title, genre, keyword, type..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSort(''); }}
              onKeyDown={e => e.key === 'Enter' && load()} />
          </div>
        </div>
      </div>

      <div className="container">
        {/* Browse tabs */}
        <div className="browse-tabs fade-up" style={{ animationDelay: '0.15s' }}>
          <button className={`browse-tab${viewMode==='all'?' active':''}`}
            onClick={() => { setViewMode('all'); setCategory(''); setBrand(''); setPublisher(''); }}>All Books</button>
          <button className={`browse-tab${viewMode==='category'?' active':''}`}
            onClick={() => { setViewMode('category'); setBrand(''); setPublisher(''); }}>By Category</button>
          <button className={`browse-tab${viewMode==='brand'?' active':''}`}
            onClick={() => { setViewMode('brand'); setCategory(''); setPublisher(''); }}>By Brand</button>
          <button className={`browse-tab${viewMode==='publisher'?' active':''}`}
            onClick={() => { setViewMode('publisher'); setCategory(''); setBrand(''); }}>By Publisher</button>
        </div>

        {/* Filter toolbar */}
        <div className="toolbar fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="toolbar-group" style={{ flexWrap:'wrap', gap:8 }}>
            <Icon d={ICONS.filter} size={16} color="var(--muted)" />
            {(viewMode === 'all' || viewMode === 'category') && (
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {(viewMode === 'all' || viewMode === 'brand') && (
              <select value={brand} onChange={e => setBrand(e.target.value)}>
                <option value="">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {(viewMode === 'all' || viewMode === 'publisher') && (
              <select value={publisher} onChange={e => setPublisher(e.target.value)}>
                <option value="">All Publishers</option>
                {publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>
          <span className="product-count">{products.length} book{products.length!==1?'s':''}</span>
          <div className="toolbar-group">
            <Icon d={ICONS.sort} size={16} color="var(--muted)" />
            <select value={sort} onChange={e => { setSort(e.target.value); setSearch(''); }}>
              <option value="">Default Order</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Title: A → Z</option>
              <option value="name-desc">Title: Z → A</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {(category || brand || publisher || search) && (
          <div className="active-filters fade-in">
            {search && <span className="filter-chip" onClick={() => setSearch('')}>Search: "{search}" ×</span>}
            {category && <span className="filter-chip" onClick={() => setCategory('')}>Category: {category} ×</span>}
            {brand && <span className="filter-chip" onClick={() => setBrand('')}>Brand: {brand} ×</span>}
            {publisher && <span className="filter-chip" onClick={() => setPublisher('')}>Publisher: {publisher} ×</span>}
            <button className="btn btn-sm btn-secondary" onClick={clearFilters}>Clear All</button>
          </div>
        )}

        {/* Grid */}
        {loading ? <div className="spinner" /> : products.length === 0 ? (
          <div className="empty fade-in">
            <div className="empty-icon">📚</div>
            <h3>No books found</h3><p>Try adjusting your search or filters</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <div className="grid">
            {products.map((p, i) => <BookCard key={p.id} book={p} delay={i * 0.04} />)}
          </div>
        )}
      </div>
      <div style={{ height: 60 }} />
    </div>
  );
}

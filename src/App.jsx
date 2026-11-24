import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronDown, ChevronRight,
  CircleHelp, CreditCard, Disc3, Headphones, Heart, Laptop, LockKeyhole, Menu,
  Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Smartphone,
  Sparkles, Star, Trash2, Truck, Watch, X,
} from 'lucide-react';
import { categories, formatPrice, initialProducts } from './data';
import {
  createOrder, deleteProduct, getCart, loadOrders, loadProducts, saveCart, saveProduct, updateOrder,
} from './store';

const categoryIcons = {
  Todo: Sparkles, Celulares: Smartphone, Computadores: Laptop,
  Audio: Headphones, Wearables: Watch, Accesorios: Disc3,
};
const statuses = ['Recibido', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];

function ProductImage({ product, className = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`product-image ${className}`}>
      {!failed ? <img src={product.image} alt={product.name} loading="lazy" onError={() => setFailed(true)} /> : (
        <div className="image-fallback"><PackageCheck size={38} /><span>NOVA TECH</span></div>
      )}
    </div>
  );
}

function App() {
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(getCart);
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [sortBy, setSortBy] = useState('featured');
  const [query, setQuery] = useState('');
  const [screen, setScreen] = useState('store');
  const [drawer, setDrawer] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(null);
  const [checkoutDone, setCheckoutDone] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([loadProducts(), loadOrders()])
      .then(([loadedProducts, loadedOrders]) => {
        if (!active) return;
        if (loadedProducts?.length) setProducts(loadedProducts);
        setOrders(loadedOrders || []);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { saveCart(cart); }, [cart]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    const result = products.filter((product) => (
      (activeCategory === 'Todo' || product.category === activeCategory)
      && (!normalized || `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('es').includes(normalized))
    ));
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'featured') result.sort((a, b) => Number(b.featured) - Number(a.featured));
    return result;
  }, [products, activeCategory, sortBy, query]);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const featuredProduct = products.find((product) => product.featured) || products[0];

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, product.stock || 99) } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setToast(`${product.name} añadido a tu bolsa`);
  }
  function changeQuantity(id, amount) {
    setCart((current) => current.map((item) => item.id === id
      ? { ...item, quantity: Math.min(item.quantity + amount, item.stock || 99) } : item)
      .filter((item) => item.quantity > 0));
  }

  async function submitProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      id: editing?.id || `nova-${Date.now()}`,
      name: form.get('name').trim(), category: form.get('category'),
      price: Number(form.get('price')), oldPrice: Number(form.get('oldPrice')) || null,
      stock: Number(form.get('stock')), image: form.get('image').trim(),
      description: form.get('description').trim(), featured: form.get('featured') === 'on',
      badge: form.get('badge').trim(), rating: editing?.rating || 4.8, reviews: editing?.reviews || 0,
    };
    if (!product.name || !product.image || product.price <= 0) return;
    try {
      setProducts(await saveProduct(product));
      setEditing(null);
      setToast(editing ? 'Producto actualizado en Supabase' : 'Producto creado en Supabase');
    } catch (error) {
      setToast(error.message || 'No se pudo guardar el producto');
    }
  }
  async function removeProduct(product) {
    if (!window.confirm(`¿Eliminar ${product.name}?`)) return;
    try {
      setProducts(await deleteProduct(product.id));
      setToast('Producto eliminado de Supabase');
    } catch (error) {
      setToast(error.message || 'No se pudo eliminar el producto');
    }
  }
  async function changeOrderStatus(id, status) {
    try {
      setOrders(await updateOrder(id, status));
      setToast('Estado actualizado en Supabase');
    } catch (error) {
      setToast(error.message || 'No se pudo actualizar el pedido');
    }
  }
  async function submitCheckout(event) {
    event.preventDefault();
    if (!cart.length || !Number.isFinite(cartTotal) || cartTotal <= 0) {
      setDrawer('cart');
      return;
    }
    const form = new FormData(event.currentTarget);
    const id = `NV-${Date.now().toString().slice(-7)}`;
    const order = {
      id,
      customer: {
        name: form.get('name').trim(), email: form.get('email').trim(),
        phone: form.get('phone').trim(), address: form.get('address').trim(),
      },
      items: cart.map(({ id: productId, name, quantity, price, image }) => ({ id: productId, name, quantity, price, image })),
      total: cartTotal, status: 'Recibido', createdAt: new Date().toISOString(),
    };
    try {
      const updated = await createOrder(order);
      setOrders(updated);
      setCart([]);
      setCheckoutDone(id);
      setDrawer('cart');
    } catch (error) {
      setToast(error.message || 'No se pudo crear el pedido');
    }
  }

  return (
    <div className="app-shell">
      <div className="utility-bar">
        <div className="container utility-inner">
          <span><span className="live-dot" /> Envíos gratis desde $99</span>
          <span className="utility-center">TECNOLOGÍA QUE TE MUEVE <span>·</span> HECHA PARA IR MÁS ALLÁ</span>
          <button onClick={() => setScreen(screen === 'admin' ? 'store' : 'admin')}>
            {screen === 'admin' ? '← Volver a la tienda' : 'Acceso administrador'} <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <button className="menu-toggle icon-button" aria-label="Abrir menú" onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
          <button className="brand" onClick={() => { setScreen('store'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="NOVA TECH inicio">
            <span className="brand-mark">N<span>·</span></span><span className="brand-name">NOVA<span>TECH</span></span>
          </button>
          <nav className={mobileMenu ? 'main-nav nav-open' : 'main-nav'} aria-label="Navegación principal">
            <button className={screen === 'store' ? 'nav-active' : ''} onClick={() => { setScreen('store'); setMobileMenu(false); }}>Tienda</button>
            <button onClick={() => { setScreen('store'); setActiveCategory('Celulares'); setMobileMenu(false); }}>Celulares</button>
            <button onClick={() => { setScreen('store'); setActiveCategory('Computadores'); setMobileMenu(false); }}>Computación</button>
            <button onClick={() => { setScreen('store'); setActiveCategory('Audio'); setMobileMenu(false); }}>Audio</button>
            <button className="nav-deals" onClick={() => { setScreen('store'); setSortBy('price-low'); setMobileMenu(false); }}>Ofertas <span>HOT</span></button>
          </nav>
          <div className="header-actions">
            <label className="search-field">
              <Search size={17} />
              <input aria-label="Buscar productos" placeholder="Buscar productos..." value={query} onChange={(event) => { setQuery(event.target.value); setScreen('store'); }} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button bag-button" aria-label={`Bolsa de compras, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`} onClick={() => setDrawer('cart')}>
              <ShoppingBag size={21} /><span>Bolsa</span>{cartCount > 0 && <b>{cartCount}</b>}
            </button>
          </div>
        </div>
      </header>

      <div className="promo-strip"><span>◇</span> SEMANA NOVA <i>—</i> Hasta 20% OFF en tecnología seleccionada <button onClick={() => { setSortBy('price-low'); setActiveCategory('Todo'); }}>Descubre las ofertas <ArrowRight size={13} /></button></div>

      {screen === 'admin' ? (
        <AdminPanel
          products={products} orders={orders} loading={loading} editing={editing}
          setEditing={setEditing} onSubmit={submitProduct} onDelete={removeProduct} onStatus={changeOrderStatus}
        />
      ) : (
        <>
          <main>
            <section className="hero container">
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-line" /> SELECCIÓN NOVA / 2025</div>
                <h1>Tu próximo<br />gran <em>salto.</em></h1>
                <p>Tecnología de otro nivel. Diseño que se siente. Experiencias que se quedan.</p>
                <div className="hero-actions">
                  <button className="button button-primary" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>Explorar colección <ArrowRight size={17} /></button>
                  <span className="hero-note"><span className="note-line" /> Selección curada, sin ruido.</span>
                </div>
                <div className="hero-index"><strong>01</strong><span /> 03 <span className="index-caption">LA NUEVA GENERACIÓN</span></div>
              </div>
              <div className="hero-visual">
                <div className="hero-grid" />
                <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                <div className="hero-image-wrap">
                  {featuredProduct && <img src={featuredProduct.image} alt={featuredProduct.name} onError={(event) => { event.currentTarget.style.opacity = '0'; }} />}
                  <div className="hero-image-shine" />
                </div>
                <div className="hero-product-card">
                  <span className="mini-label">DESTACADO / 01</span>
                  <strong>{featuredProduct?.name || 'NOVA TECH'}</strong>
                  <span>{formatPrice(featuredProduct?.price)} <i>USD</i></span>
                  <button aria-label="Ver producto destacado" onClick={() => { setActiveCategory('Todo'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}><ArrowUpRightIcon /></button>
                </div>
                <div className="hero-side-label">INNOVACIÓN / 2025</div>
                <div className="hero-serial">NT—001<span>DESDE 2018</span></div>
              </div>
              <div className="hero-counter"><b>01</b><span>/</span>03</div>
            </section>

            <section className="trust-row container" aria-label="Beneficios">
              <div><Truck /><span><b>Envío sin costo</b><small>En compras desde $99</small></span></div>
              <div><ShieldCheck /><span><b>Compra protegida</b><small>Tu seguridad primero</small></span></div>
              <div><BadgeCheck /><span><b>100% original</b><small>Garantía de autenticidad</small></span></div>
              <div><Headphones /><span><b>Estamos contigo</b><small>Soporte experto 24/7</small></span></div>
            </section>

            <section className="catalog-section" id="catalogo">
              <div className="container">
                <div className="section-heading">
                  <div><div className="eyebrow"><span className="eyebrow-line" /> CURADO PARA TI</div><h2>Explora <em>lo nuevo.</em></h2></div>
                  <p>Lo mejor de la tecnología, elegido para<br className="desktop-break" /> acompañar tu siguiente paso.</p>
                </div>
                <div className="catalog-tools">
                  <div className="category-list" role="group" aria-label="Filtrar por categoría">
                    {categories.map((category) => {
                      const Icon = categoryIcons[category];
                      return <button key={category} className={activeCategory === category ? 'category-chip selected' : 'category-chip'} onClick={() => setActiveCategory(category)}><Icon size={16} />{category}</button>;
                    })}
                  </div>
                  <label className="sort-control"><ArrowDownUp size={15} /><span>Ordenar:</span><select aria-label="Ordenar productos" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="featured">Destacados</option><option value="price-low">Precio: menor a mayor</option><option value="price-high">Precio: mayor a menor</option><option value="rating">Mejor valorados</option></select><ChevronDown size={14} /></label>
                </div>

                {loading ? <div className="catalog-state"><span className="loader" /> Cargando selección...</div>
                  : loadError ? <div className="catalog-state"><CircleHelp /> No pudimos cargar el catálogo. Inténtalo de nuevo.</div>
                    : visibleProducts.length ? (
                      <div className="product-grid">
                        {visibleProducts.map((product, index) => (
                          <article className="product-card" key={product.id} style={{ '--delay': `${index * 55}ms` }}>
                            <div className="product-card-media">
                              <ProductImage product={product} />
                              {product.badge && <span className={product.badge.includes('−') ? 'product-badge badge-sale' : 'product-badge'}>{product.badge}</span>}
                              <button className="favorite-button" aria-label={`Guardar ${product.name}`} onClick={() => setToast('Añadido a tus favoritos')}><Heart size={17} /></button>
                              <button className="quick-add" onClick={() => addToCart(product)} disabled={product.stock < 1}>{product.stock < 1 ? 'Agotado' : <><Plus size={16} /> Añadir a la bolsa</>}</button>
                            </div>
                            <div className="product-card-info">
                              <div className="product-meta"><span>{product.category}</span><span className="rating"><Star size={13} fill="currentColor" /> {Number(product.rating || 4.8).toFixed(1)} <i>({product.reviews || 0})</i></span></div>
                              <h3>{product.name}</h3>
                              <p>{product.description}</p>
                              <div className="product-price"><strong>{formatPrice(product.price)}</strong>{product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}<span>USD</span></div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : <div className="empty-search"><Search size={24} /><h3>No encontramos ese producto</h3><p>Prueba otra búsqueda o explora todas las categorías.</p><button className="text-button" onClick={() => { setQuery(''); setActiveCategory('Todo'); }}>Ver toda la colección <ArrowRight size={15} /></button></div>}
                <div className="catalog-foot"><span>MOSTRANDO <b>{visibleProducts.length.toString().padStart(2, '0')}</b> PRODUCTOS</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Volver arriba <ArrowLeft size={14} /></button></div>
              </div>
            </section>

            <section className="newsletter">
              <div className="container newsletter-inner">
                <div><span className="newsletter-kicker"><span className="live-dot" /> NOVA DISPATCH / 01</span><h2>Las buenas noticias<br />también <em>se actualizan.</em></h2><p>Novedades, lanzamientos y ofertas que sí valen la pena. Sin spam, palabra.</p></div>
                <form onSubmit={(event) => { event.preventDefault(); setToast('¡Listo! Te avisaremos de las novedades.'); event.currentTarget.reset(); }}><label htmlFor="newsletter-email">Tu correo electrónico</label><div className="email-field"><input id="newsletter-email" type="email" placeholder="hola@correo.com" required /><button type="submit" aria-label="Suscribirme"><ArrowRight /></button></div><small>Al suscribirte aceptas nuestra política de privacidad.</small></form>
                <span className="newsletter-orbit" aria-hidden="true">N</span>
              </div>
            </section>
          </main>
          <Footer />
        </>
      )}

      {drawer === 'cart' && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDrawer(''); setCheckoutDone(''); } }}>
        <aside className="cart-drawer" aria-label="Bolsa de compras">
          <div className="drawer-heading"><div><span className="eyebrow">TU SELECCIÓN</span><h2>{checkoutDone ? '¡Pedido listo!' : 'Tu bolsa'} <span>({cartCount})</span></h2></div><button className="icon-button" aria-label="Cerrar bolsa" onClick={() => { setDrawer(''); setCheckoutDone(''); }}><X /></button></div>
          {checkoutDone ? <div className="order-success" role="status" aria-live="polite"><span className="success-icon"><Check /></span><span className="eyebrow">COMPRA CONFIRMADA</span><h3>Ya estás un paso<br />más cerca.</h3><p>Guardamos tu pedido <strong>{checkoutDone}</strong>. Te enviaremos novedades al correo que registraste.</p><button className="button button-primary" onClick={() => { setDrawer(''); setCheckoutDone(''); }}>Seguir explorando <ArrowRight size={16} /></button></div>
            : cart.length ? <>
              <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><ProductImage product={item} /><div className="cart-item-detail"><span>{item.category}</span><b>{item.name}</b><strong>{formatPrice(item.price)}</strong><div className="quantity"><button aria-label="Quitar una unidad" onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Agregar una unidad" onClick={() => changeQuantity(item.id, 1)} disabled={item.quantity >= (item.stock || 99)}><Plus size={13} /></button></div></div><button className="remove-item" aria-label={`Eliminar ${item.name}`} onClick={() => changeQuantity(item.id, -item.quantity)}><Trash2 size={16} /></button></div>)}</div>
              <div className="cart-summary"><div className="shipping-note"><Truck size={16} /><span>¡Envío gratis aplicado!</span><Check size={14} /></div><div className="summary-row"><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div><div className="summary-row"><span>Envío</span><strong className="free-label">GRATIS</strong></div><div className="summary-row summary-total"><span>Total</span><strong>{formatPrice(cartTotal)} <small>USD</small></strong></div><button className="button button-primary checkout-trigger" onClick={() => { setCheckoutDone(''); setDrawer('checkout'); }}>Continuar al pago <ArrowRight size={17} /></button><div className="secure-note"><LockKeyhole size={13} /> Pago seguro · Tus datos están protegidos</div><div className="payment-icons"><CreditCard /><span>VISA</span><span>Mastercard</span><span>PayPal</span></div></div>
            </> : <div className="cart-empty"><span className="empty-bag"><ShoppingBag /></span><h3>Tu próxima gran idea<br />empieza aquí.</h3><p>Tu bolsa aún no tiene productos. ¿Exploramos?</p><button className="button button-primary" onClick={() => setDrawer('')}>Descubrir productos <ArrowRight size={16} /></button></div>}
        </aside>
      </div>}

      {drawer === 'checkout' && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawer('cart'); }}>
        <aside className="checkout-drawer">
          <div className="drawer-heading"><div><button className="back-link" onClick={() => setDrawer('cart')}><ArrowLeft size={14} /> Volver a la bolsa</button><h2>Finaliza tu compra.</h2></div><button className="icon-button" aria-label="Cerrar pago" onClick={() => setDrawer('')}><X /></button></div>
          <div className="checkout-total"><span>Total del pedido</span><strong>{formatPrice(cartTotal)} <small>USD</small></strong></div>
          <form className="checkout-form" onSubmit={submitCheckout}>
            <div className="form-section-title"><span>01</span><b>¿A dónde lo enviamos?</b></div>
            <label>Nombre completo<input name="name" autoComplete="name" placeholder="Tu nombre y apellido" required /></label>
            <div className="form-columns"><label>Correo electrónico<input name="email" type="email" autoComplete="email" placeholder="hola@correo.com" required /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" placeholder="+57 300 000 0000" required /></label></div>
            <label>Dirección de entrega<input name="address" autoComplete="street-address" placeholder="Calle, número, ciudad" required /></label>
            <div className="checkout-delivery"><Truck size={17} /><span><b>Envío express gratis</b><small>Recíbelo en 2 a 4 días hábiles</small></span><Check size={15} /></div>
            <button className="button button-primary checkout-trigger" type="submit" disabled={!cart.length}>Confirmar pedido <ArrowRight size={16} /></button>
            <div className="secure-note"><LockKeyhole size={13} /> Tus datos se almacenan de forma segura</div>
          </form>
        </aside>
      </div>}
      {toast && <div className="toast-message" role="status"><span><Check size={15} /></span>{toast}</div>}
    </div>
  );
}

function ArrowUpRightIcon() { return <ArrowRight size={16} />; }

function AdminPanel({ products, orders, loading, editing, setEditing, onSubmit, onDelete, onStatus }) {
  const [tab, setTab] = useState('products');
  const [previewUrl, setPreviewUrl] = useState(editing?.image || '');
  const setEdit = (product) => { setEditing(product); setPreviewUrl(product?.image || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <main className="admin-page">
      <div className="container">
        <div className="admin-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> NOVA / CONTROL</div><h1>Panel de <em>control.</em></h1><p>Gestiona tu catálogo y mantén cada pedido en movimiento.</p></div><span className="admin-status"><span className="live-dot" /> SISTEMA ACTIVO</span></div>
        <div className="admin-metrics"><div><span>PRODUCTOS ACTIVOS</span><strong>{products.length.toString().padStart(2, '0')}</strong><small>En tu catálogo</small></div><div><span>PEDIDOS TOTALES</span><strong>{orders.length.toString().padStart(2, '0')}</strong><small>Desde este dispositivo</small></div><div><span>STOCK BAJO</span><strong>{products.filter((item) => item.stock < 5).length.toString().padStart(2, '0')}</strong><small>Menos de 5 unidades</small></div></div>
        <div className="admin-tabs"><button className={tab === 'products' ? 'admin-tab-active' : ''} onClick={() => setTab('products')}><PackageCheck size={16} /> Productos <span>{products.length}</span></button><button className={tab === 'orders' ? 'admin-tab-active' : ''} onClick={() => setTab('orders')}><ShoppingBag size={16} /> Pedidos <span>{orders.length}</span></button></div>
        {tab === 'products' ? <div className="admin-products-layout">
          <section className="admin-form-panel">
            <div className="admin-panel-title"><div><span className="eyebrow">{editing ? 'EDITAR SELECCIÓN' : 'AMPLÍA TU SELECCIÓN'}</span><h2>{editing ? 'Editar producto' : 'Nuevo producto'}</h2></div>{editing && <button className="text-button" onClick={() => setEdit(null)}>Cancelar</button>}</div>
            <form className="product-form" onSubmit={onSubmit}>
              <label>Nombre del producto<input name="name" defaultValue={editing?.name || ''} placeholder="Ej. Sony WH-1000XM5" required /></label>
              <div className="form-columns"><label>Categoría<select name="category" defaultValue={editing?.category || 'Celulares'}>{categories.filter((category) => category !== 'Todo').map((category) => <option key={category}>{category}</option>)}</select></label><label>Precio (USD)<input name="price" type="number" min="1" step="1" defaultValue={editing?.price || ''} placeholder="299" required /></label></div>
              <div className="form-columns"><label>Precio anterior<input name="oldPrice" type="number" min="0" step="1" defaultValue={editing?.oldPrice || ''} placeholder="Opcional" /></label><label>Unidades en stock<input name="stock" type="number" min="0" step="1" defaultValue={editing?.stock ?? 10} required /></label></div>
              <label>URL de imagen<input name="image" type="url" defaultValue={editing?.image || ''} placeholder="https://servidor.com/imagen.jpg" onChange={(event) => setPreviewUrl(event.target.value)} required /></label>
              <div className="image-preview-label">VISTA PREVIA <span>Imagen del producto</span></div>
              <div className="admin-image-preview">{previewUrl ? <img src={previewUrl} alt="Vista previa del producto" onError={(event) => { event.currentTarget.style.display = 'none'; }} onLoad={(event) => { event.currentTarget.style.display = 'block'; }} /> : <><PackageCheck size={24} /><span>La imagen aparecerá aquí</span></>}</div>
              <label>Descripción<textarea name="description" rows="2" defaultValue={editing?.description || ''} placeholder="Una frase breve sobre el producto..." /></label>
              <label>Etiqueta de producto<input name="badge" defaultValue={editing?.badge || ''} placeholder="NUEVO, −10%, MÁS VENDIDO" /></label>
              <label className="checkbox-label"><input type="checkbox" name="featured" defaultChecked={editing?.featured || false} /><span>Destacar en la portada</span></label>
              <button className="button button-primary admin-save" type="submit">{editing ? 'Guardar cambios' : 'Crear producto'} <ArrowRight size={16} /></button>
            </form>
          </section>
          <section className="admin-list-panel"><div className="admin-panel-title"><div><span className="eyebrow">CATÁLOGO EN VIVO</span><h2>Productos <span>{products.length}</span></h2></div></div>
            {loading ? <div className="admin-empty">Cargando catálogo...</div> : products.length ? <div className="admin-product-list">{products.map((product) => <div className="admin-product-row" key={product.id}><ProductImage product={product} /><div className="admin-product-info"><strong>{product.name}</strong><span>{product.category} · {formatPrice(product.price)}</span><small>{product.stock} unidades en stock{product.featured ? ' · Destacado' : ''}</small></div><button className="admin-edit-button" onClick={() => setEdit(product)} aria-label={`Editar ${product.name}`}>Editar</button><button className="admin-delete-button" onClick={() => onDelete(product)} aria-label={`Eliminar ${product.name}`}><Trash2 size={16} /></button></div>)}</div> : <div className="admin-empty"><PackageCheck /><p>Aún no hay productos. Añade el primero.</p></div>}
          </section>
        </div> : <section className="orders-panel"><div className="admin-panel-title"><div><span className="eyebrow">SEGUIMIENTO / EN VIVO</span><h2>Pedidos recientes <span>{orders.length}</span></h2></div></div>
          {orders.length ? <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>FECHA</th><th>ARTÍCULOS</th><th>TOTAL</th><th>ESTADO</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.customer?.name}<small>{order.customer?.email}</small></td><td>{new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} productos</td><td><strong>{formatPrice(order.total)}</strong></td><td><select className={`order-status status-${order.status.toLowerCase().replaceAll(' ', '-')}`} aria-label={`Estado del pedido ${order.id}`} value={order.status} onChange={(event) => onStatus(order.id, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="orders-empty"><ShoppingBag size={25} /><h3>Tu siguiente venta está por llegar.</h3><p>Aquí verás cada pedido en cuanto se confirme.</p></div>}
        </section>}
        <p className="admin-footnote"><LockKeyhole size={13} /> Los cambios se sincronizan con Supabase cuando está configurado.</p>
      </div>
    </main>
  );
}

function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-main"><div className="footer-brand"><div className="brand"><span className="brand-mark">N<span>·</span></span><span className="brand-name">NOVA<span>TECH</span></span></div><p>Tecnología con propósito.<br />Para personas que no se detienen.</p></div>
      <div className="footer-column"><span>EXPLORA</span><a href="#catalogo">Tienda</a><a href="#catalogo">Novedades</a><a href="#catalogo">Ofertas</a></div>
      <div className="footer-column"><span>TE ACOMPAÑAMOS</span><a href="mailto:hola@novatech.store">Centro de ayuda</a><a href="mailto:hola@novatech.store">Envíos y devoluciones</a><a href="mailto:hola@novatech.store">Contáctanos</a></div>
      <div className="footer-contact"><span className="live-dot" /> PERSONAS REALES, AYUDA REAL.<strong>hola@novatech.store</strong><small>Lun–Vie, 9:00–18:00</small></div>
    </div>
    <div className="footer-bottom"><span>© 2025 NOVA TECH. HECHO PARA IR MÁS ALLÁ.</span><span>PRIVACIDAD&nbsp;&nbsp;&nbsp; TÉRMINOS&nbsp;&nbsp;&nbsp; COLOMBIA · USD</span><span>NT—001</span></div>
  </div></footer>;
}

export default App;

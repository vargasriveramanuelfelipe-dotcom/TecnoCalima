export const initialProducts = [
  { id: 'nova-01', name: 'iPhone 15 Pro Max', category: 'Celulares', price: 1199, oldPrice: 1299, rating: 4.9, reviews: 128, stock: 12, featured: true, badge: 'MÁS VENDIDO', image: '/images/iphone-15-pro-max.jpg', description: 'Potencia Pro, cámara de 48 MP y diseño de titanio.' },
  { id: 'nova-02', name: 'MacBook Pro 14” M3', category: 'Computadores', price: 1899, oldPrice: null, rating: 4.8, reviews: 86, stock: 8, featured: true, badge: 'NUEVO', image: '/images/macbook-pro-m3.jpg', description: 'Rendimiento extraordinario para ideas extraordinarias.' },
  { id: 'nova-03', name: 'AirPods Max', category: 'Audio', price: 549, oldPrice: 599, rating: 4.7, reviews: 74, stock: 16, featured: true, badge: '−8%', image: '/images/airpods-max.jpg', description: 'Audio de alta fidelidad con cancelación activa de ruido.' },
  { id: 'nova-04', name: 'Samsung Galaxy S24 Ultra', category: 'Celulares', price: 1099, oldPrice: null, rating: 4.8, reviews: 93, stock: 10, featured: false, badge: '', image: '/images/galaxy-s24-ultra.jpg', description: 'Galaxy AI y una cámara que ve lo que otros no.' },
  { id: 'nova-05', name: 'Sony WH-1000XM5', category: 'Audio', price: 349, oldPrice: 399, rating: 4.9, reviews: 211, stock: 22, featured: false, badge: '−13%', image: '/images/sony-headphones.jpg', description: 'Silencio inmersivo y sonido premium en cualquier lugar.' },
  { id: 'nova-06', name: 'Apple Watch Series 9', category: 'Wearables', price: 429, oldPrice: null, rating: 4.6, reviews: 65, stock: 14, featured: false, badge: '', image: '/images/apple-watch-series-9.jpg', description: 'Tu salud, tus entrenamientos y tu día en una sola mirada.' },
  { id: 'nova-07', name: 'Logitech MX Master 3S', category: 'Accesorios', price: 109, oldPrice: 129, rating: 4.8, reviews: 119, stock: 31, featured: false, badge: '−15%', image: '/images/logitech-mx-master-3s.jpg', description: 'Precisión y comodidad para crear durante horas.' },
  { id: 'nova-08', name: 'iPad Air 11” M2', category: 'Computadores', price: 699, oldPrice: null, rating: 4.7, reviews: 48, stock: 9, featured: false, badge: '', image: '/images/ipad-air-m2.jpg', description: 'Creatividad sin límites, ahora con chip M2.' },
];

export const categories = ['Todo', 'Celulares', 'Computadores', 'Audio', 'Wearables', 'Accesorios'];

export const formatPrice = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(Number(value) || 0);

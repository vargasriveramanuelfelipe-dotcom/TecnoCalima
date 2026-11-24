import { createClient } from '@supabase/supabase-js';
import { initialProducts } from './data';

const STORAGE = {
  products: 'nova-tech-products',
  orders: 'nova-tech-orders',
  cart: 'nova-tech-cart',
};
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function readLocal(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {
    console.warn('No se pudo guardar en el almacenamiento local.', error);
  }
}

export const getCart = () => readLocal(STORAGE.cart, []);
export const saveCart = (cart) => writeLocal(STORAGE.cart, cart);
export const getOrders = () => readLocal(STORAGE.orders, []);

function replaceBrokenSeedImages(products) {
  const seedImages = new Map(initialProducts.map((product) => [product.id, product.image]));
  return products.map((product) => (
    seedImages.has(product.id) && product.image?.startsWith('https://cdn.dummyjson.com/')
      ? { ...product, image: seedImages.get(product.id) }
      : product
  ));
}

export async function loadProducts() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) {
        const seedRecords = initialProducts.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          old_price: product.oldPrice || null,
          rating: product.rating || 4.8,
          reviews: product.reviews || 0,
          stock: product.stock,
          featured: product.featured,
          badge: product.badge || '',
          image_url: product.image,
          description: product.description || '',
        }));
        const { error: seedError } = await supabase.from('products').upsert(seedRecords);
        if (!seedError) {
          writeLocal(STORAGE.products, initialProducts);
          return initialProducts;
        }
        throw seedError;
      }
      if (data?.length) {
        const products = replaceBrokenSeedImages(data.map((item) => ({
          id: item.id, name: item.name, category: item.category, price: Number(item.price),
          oldPrice: item.old_price ? Number(item.old_price) : null, rating: Number(item.rating || 4.8),
          reviews: Number(item.reviews || 0), stock: Number(item.stock || 0),
          featured: Boolean(item.featured), badge: item.badge || '', image: item.image_url,
          description: item.description || '',
        })));
        writeLocal(STORAGE.products, products);
        return products;
      }
    } catch (error) { console.warn('Supabase no disponible; usando catálogo local.', error.message); }
  }
  const products = replaceBrokenSeedImages(readLocal(STORAGE.products, initialProducts));
  writeLocal(STORAGE.products, products);
  return products;
}

export async function saveProduct(product) {
  const products = readLocal(STORAGE.products, initialProducts);
  const existingIndex = products.findIndex((item) => item.id === product.id);
  if (existingIndex < 0) products.unshift(product);
  else products[existingIndex] = product;
  writeLocal(STORAGE.products, products);
  if (supabase) {
    const record = {
      id: product.id, name: product.name, category: product.category, price: product.price,
      old_price: product.oldPrice || null, rating: product.rating || 4.8, reviews: product.reviews || 0,
      stock: product.stock, featured: product.featured, badge: product.badge || '',
      image_url: product.image, description: product.description || '',
    };
    const { error } = await supabase.from('products').upsert(record);
    if (error) throw new Error(`Supabase rechazó el producto: ${error.message}`);
  }
  return products;
}

export async function deleteProduct(id) {
  const products = readLocal(STORAGE.products, initialProducts).filter((item) => item.id !== id);
  writeLocal(STORAGE.products, products);
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`Supabase rechazó la eliminación: ${error.message}`);
  }
  return products;
}

export async function createOrder(order) {
  const orders = [order, ...getOrders()];
  writeLocal(STORAGE.orders, orders);
  if (supabase) {
    const { error } = await supabase.from('orders').insert({
      id: order.id, customer_name: order.customer.name, customer_email: order.customer.email,
      phone: order.customer.phone, address: order.customer.address, items: order.items,
      total: order.total, status: order.status, created_at: order.createdAt,
    });
    if (error) throw new Error(`Supabase rechazó el pedido: ${error.message}`);
  }
  return orders;
}

export async function loadOrders() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const orders = data.map((item) => ({
        id: item.id, customer: { name: item.customer_name, email: item.customer_email, phone: item.phone, address: item.address },
        items: item.items || [], total: Number(item.total), status: item.status,
        createdAt: item.created_at,
        }));
        writeLocal(STORAGE.orders, orders);
        return orders;
      }
    } catch (error) { console.warn('No se pudieron cargar pedidos de Supabase.', error.message); }
  }
  return getOrders();
}

export async function updateOrder(id, status) {
  const orders = getOrders().map((order) => order.id === id ? { ...order, status } : order);
  writeLocal(STORAGE.orders, orders);
  if (supabase) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw new Error(`Supabase rechazó el cambio de estado: ${error.message}`);
  }
  return orders;
}

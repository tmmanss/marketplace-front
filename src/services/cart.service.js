const CART_KEY = 'marketplace_cart';

const resolveUserKey = (userOrKey) => {
  if (!userOrKey) return 'guest';
  if (typeof userOrKey === 'string') return userOrKey;
  return userOrKey._id || userOrKey.id || userOrKey.email || 'guest';
};

const readCart = (userOrKey) => {
  const key = `${CART_KEY}_${resolveUserKey(userOrKey)}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const writeCart = (items, userOrKey) => {
  const key = `${CART_KEY}_${resolveUserKey(userOrKey)}`;
  localStorage.setItem(key, JSON.stringify(items));
};

export const getCartItems = (userOrKey) => readCart(userOrKey);

export const getCartCount = (userOrKey) => readCart(userOrKey).length;

export const addToCart = (item, userOrKey) => {
  const items = readCart(userOrKey);
  items.push({ ...item, addedAt: Date.now() });
  writeCart(items, userOrKey);
  return items;
};

export const removeFromCart = (id, addedAt, userOrKey) => {
  const items = readCart(userOrKey).filter(
    (item) => !(item.id === id && (addedAt ? item.addedAt === addedAt : true))
  );
  writeCart(items, userOrKey);
  return items;
};

export const clearCart = (userOrKey) => {
  writeCart([], userOrKey);
  return [];
};

const RATINGS_KEY = 'marketplace_ratings';

const resolveUserKey = (user) => {
  if (!user) return null;
  return user._id || user.id || user.email || null;
};

const readAll = () => {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const writeAll = (data) => {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(data));
};

export const getRatings = (productId) => {
  const data = readAll();
  return Array.isArray(data[productId]) ? data[productId] : [];
};

export const getUserRating = (productId, user) => {
  const userKey = resolveUserKey(user);
  if (!userKey) return null;
  const ratings = getRatings(productId);
  const existing = ratings.find((item) => item.userKey === userKey);
  return existing ? existing.rating : null;
};

export const setRating = (productId, user, rating) => {
  const userKey = resolveUserKey(user);
  if (!userKey) return getRatings(productId);

  const data = readAll();
  const list = Array.isArray(data[productId]) ? data[productId] : [];
  const idx = list.findIndex((item) => item.userKey === userKey);
  const entry = { userKey, rating, updatedAt: Date.now() };

  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }

  data[productId] = list;
  writeAll(data);
  return list;
};

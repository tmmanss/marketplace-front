const ADMIN_KEY = 'marketplace_admin_state';

const defaultState = {
  hiddenProductIds: [],
  statusOverrides: {},
  customProducts: [],
  verifiedBrands: {},
};

const readState = () => {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return { ...defaultState };
  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      hiddenProductIds: Array.isArray(parsed.hiddenProductIds) ? parsed.hiddenProductIds : [],
      customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
      statusOverrides: parsed.statusOverrides || {},
      verifiedBrands: parsed.verifiedBrands || {},
    };
  } catch (error) {
    console.error('Failed to parse admin state', error);
    return { ...defaultState };
  }
};

const writeState = (state) => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(state));
  return state;
};

export const getAdminState = () => readState();

export const setHiddenProduct = (id, hidden) => {
  const state = readState();
  const next = new Set(state.hiddenProductIds);
  if (hidden) next.add(id);
  else next.delete(id);
  return writeState({ ...state, hiddenProductIds: Array.from(next) });
};

export const setStatusOverride = (id, status) => {
  const state = readState();
  const next = { ...state.statusOverrides };
  if (!status) {
    delete next[id];
  } else {
    next[id] = status;
  }
  return writeState({ ...state, statusOverrides: next });
};

export const addCustomProduct = (product) => {
  const state = readState();
  const nextProducts = [product, ...state.customProducts];
  return writeState({ ...state, customProducts: nextProducts });
};

export const removeCustomProduct = (id) => {
  const state = readState();
  const nextProducts = state.customProducts.filter((item) => item.id !== id);
  return writeState({ ...state, customProducts: nextProducts });
};

export const setVerifiedBrand = (brand, verified) => {
  const state = readState();
  const next = { ...state.verifiedBrands };
  if (!brand) return state;
  if (verified) next[brand] = true;
  else delete next[brand];
  return writeState({ ...state, verifiedBrands: next });
};

export const isProductHidden = (id) => {
  const state = readState();
  return state.hiddenProductIds.includes(id);
};

export const getStatusOverride = (id) => {
  const state = readState();
  return state.statusOverrides[id];
};

export const getCustomProductById = (id) => {
  const state = readState();
  return state.customProducts.find((item) => item.id === id) || null;
};

export const applyAdminOverridesToProducts = (products = []) => {
  const state = readState();
  const hidden = new Set(state.hiddenProductIds);
  const overrides = state.statusOverrides || {};
  const filtered = products
    .filter((item) => !hidden.has(item.id || item._id))
    .map((item) => {
      const id = item.id || item._id;
      const overrideStatus = overrides[id];
      return overrideStatus ? { ...item, status: overrideStatus } : item;
    });

  return [...(state.customProducts || []), ...filtered];
};

import api from './api';

export const getProducts = (params = {}) => api.get('/products', { params });

export const getProductById = (id) => api.get(`/products/${id}`);

export const getCategories = () => api.get('/categories');

export const getProductVariants = (productId) =>
  api.get('/variants', { params: { product_id: productId } });

export const getProductImages = (productId) =>
  api.get('/images', { params: { product_id: productId } });

export const createProduct = (data) => api.post('/products', data);

export const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

export const unwrapItem = (response) => {
  const data = response?.data;
  if (data?.value !== undefined) {
    if (Array.isArray(data.value)) return data.value[0] || null;
    return data.value;
  }
  return data || null;
};

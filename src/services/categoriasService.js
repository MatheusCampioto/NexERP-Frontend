import api from './api';

export const listarCategorias = async () => {
  const response = await api.get('/Categorias');
  return response.data;
};

export const criarCategoria = async (dados) => {
  const response = await api.post('/Categorias', dados);
  return response.data;
};

export const atualizarCategoria = async (id, dados) => {
  const response = await api.put(`/Categorias/${id}`, dados);
  return response.data;
};

export const desativarCategoria = async (id) => {
  const response = await api.delete(`/Categorias/${id}`);
  return response.data;
};
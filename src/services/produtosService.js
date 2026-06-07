import api from './api';

export const listarProdutos = async () => {
  const response = await api.get('/Produtos');
  return response.data;
};

export const buscarProduto = async (id) => {
  const response = await api.get(`/Produtos/${id}`);
  return response.data;
};

export const criarProduto = async (dados) => {
  const response = await api.post('/Produtos', dados);
  return response.data;
};

export const atualizarProduto = async (id, dados) => {
  const response = await api.put(`/Produtos/${id}`, dados);
  return response.data;
};

export const desativarProduto = async (id) => {
  const response = await api.delete(`/Produtos/${id}`);
  return response.data;
};
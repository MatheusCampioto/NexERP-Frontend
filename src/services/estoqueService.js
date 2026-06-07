import api from './api';

export const listarMovimentacoes = async (produtoId) => {
  const response = await api.get(`/Estoque/${produtoId}`);
  return response.data;
};

export const movimentarEstoque = async (dados) => {
  const response = await api.post('/Estoque', dados);
  return response.data;
};
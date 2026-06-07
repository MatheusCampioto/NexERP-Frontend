import api from './api';

export const listarPessoas = async () => {
  const response = await api.get('/Pessoas');
  return response.data;
};

export const buscarPessoa = async (id) => {
  const response = await api.get(`/Pessoas/${id}`);
  return response.data;
};

export const criarPessoa = async (dados) => {
  const response = await api.post('/Pessoas', dados);
  return response.data;
};

export const atualizarPessoa = async (id, dados) => {
  const response = await api.put(`/Pessoas/${id}`, dados);
  return response.data;
};

export const desativarPessoa = async (id) => {
  const response = await api.delete(`/Pessoas/${id}`);
  return response.data;
};
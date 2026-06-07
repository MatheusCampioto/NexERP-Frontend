import api from './api';

export const listarContasBancarias = async () => {
  const response = await api.get('/ContasBancarias');
  return response.data;
};

export const criarContaBancaria = async (dados) => {
  const response = await api.post('/ContasBancarias', dados);
  return response.data;
};

export const atualizarContaBancaria = async (id, dados) => {
  const response = await api.put(`/ContasBancarias/${id}`, dados);
  return response.data;
};

export const desativarContaBancaria = async (id) => {
  const response = await api.delete(`/ContasBancarias/${id}`);
  return response.data;
};
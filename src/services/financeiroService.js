import api from './api';

export const listarLancamentos = async () => {
  const response = await api.get('/Financeiro');
  return response.data;
};

export const listarContasAPagar = async () => {
  const response = await api.get('/Financeiro/pagar');
  return response.data;
};

export const listarContasAReceber = async () => {
  const response = await api.get('/Financeiro/receber');
  return response.data;
};

export const criarLancamento = async (dados) => {
  const response = await api.post('/Financeiro', dados);
  return response.data;
};

export const baixarLancamento = async (id) => {
  const response = await api.patch(`/Financeiro/${id}/baixar`);
  return response.data;
};

export const cancelarLancamento = async (id) => {
  const response = await api.patch(`/Financeiro/${id}/cancelar`);
  return response.data;
};
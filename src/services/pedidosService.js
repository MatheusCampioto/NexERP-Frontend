import api from './api';

export const listarPedidos = async () => {
  const response = await api.get('/Pedidos');
  return response.data;
};

export const buscarPedido = async (id) => {
  const response = await api.get(`/Pedidos/${id}`);
  return response.data;
};

export const criarPedido = async (dados) => {
  const response = await api.post('/Pedidos', dados);
  return response.data;
};

export const confirmarPedido = async (id) => {
  const response = await api.patch(`/Pedidos/${id}/confirmar`);
  return response.data;
};

export const cancelarPedido = async (id) => {
  const response = await api.patch(`/Pedidos/${id}/cancelar`);
  return response.data;
};
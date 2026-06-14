import api from './api';

export const listarOrdensServico = async () => {
  const response = await api.get('/OrdensServico');
  return response.data;
};

export const buscarOrdemServico = async (id) => {
  const response = await api.get(`/OrdensServico/${id}`);
  return response.data;
};

export const criarOrdemServico = async (dados) => {
  const response = await api.post('/OrdensServico', dados);
  return response.data;
};

export const atualizarStatus = async (id, status) => {
  const response = await api.patch(`/OrdensServico/${id}/status`, { status });
  return response.data;
};

export const finalizarOrdem = async (id, valorFinal, observacao) => {
  const response = await api.patch(`/OrdensServico/${id}/finalizar`, { valorFinal, observacao });
  return response.data;
};

export const cancelarOrdem = async (id) => {
  const response = await api.patch(`/OrdensServico/${id}/cancelar`);
  return response.data;
};
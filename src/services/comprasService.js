import api from './api';

export const listarSolicitacoes = async () => {
  const response = await api.get('/SolicitacoesCompra');
  return response.data;
};

export const criarSolicitacao = async (dados) => {
  const response = await api.post('/SolicitacoesCompra', dados);
  return response.data;
};

export const aprovarSolicitacao = async (id) => {
  const response = await api.patch(`/SolicitacoesCompra/${id}/aprovar`);
  return response.data;
};

export const reprovarSolicitacao = async (id, motivo) => {
  const response = await api.patch(`/SolicitacoesCompra/${id}/reprovar`, { motivo });
  return response.data;
};

export const cancelarSolicitacao = async (id) => {
  const response = await api.patch(`/SolicitacoesCompra/${id}/cancelar`);
  return response.data;
};

export const listarOrdensCompra = async () => {
  const response = await api.get('/OrdensCompra');
  return response.data;
};

export const criarOrdemCompra = async (dados) => {
  const response = await api.post('/OrdensCompra', dados);
  return response.data;
};

export const atualizarStatusOrdem = async (id, status) => {
  const response = await api.patch(`/OrdensCompra/${id}/status`, { status });
  return response.data;
};

export const cancelarOrdemCompra = async (id) => {
  const response = await api.patch(`/OrdensCompra/${id}/cancelar`);
  return response.data;
};

export const listarNotasFiscais = async () => {
  const response = await api.get('/NotasFiscaisEntrada');
  return response.data;
};

export const criarNotaFiscal = async (dados) => {
  const response = await api.post('/NotasFiscaisEntrada', dados);
  return response.data;
};

export const darEntradaEstoque = async (id) => {
  const response = await api.patch(`/NotasFiscaisEntrada/${id}/entrada-estoque`);
  return response.data;
};

export const listarCondicoesPagamento = async () => {
  const response = await api.get('/CondicoesPagamento');
  return response.data;
};

export const criarCondicaoPagamento = async (dados) => {
  const response = await api.post('/CondicoesPagamento', dados);
  return response.data;
};

export const desativarCondicaoPagamento = async (id) => {
  const response = await api.delete(`/CondicoesPagamento/${id}`);
  return response.data;
};
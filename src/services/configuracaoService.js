import api from './api';

export const obterConfiguracao = async () => {
  const response = await api.get('/ConfiguracaoSistema');
  return response.data;
};

export const salvarConfiguracao = async (dados) => {
  const response = await api.post('/ConfiguracaoSistema', dados);
  return response.data;
};
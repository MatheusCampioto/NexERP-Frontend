import api from './api';

export const listarUsuarios = async () => {
  const response = await api.get('/Usuarios');
  return response.data;
};

export const buscarUsuario = async (id) => {
  const response = await api.get(`/Usuarios/${id}`);
  return response.data;
};

export const atualizarUsuario = async (id, dados) => {
  const response = await api.put(`/Usuarios/${id}`, dados);
  return response.data;
};

export const alterarSenha = async (id, dados) => {
  const response = await api.patch(`/Usuarios/${id}/senha`, dados);
  return response.data;
};

export const desativarUsuario = async (id) => {
  const response = await api.delete(`/Usuarios/${id}`);
  return response.data;
};
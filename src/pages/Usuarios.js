import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Tag, Space, Divider, Row, Col } from 'antd';
import { EditOutlined, LockOutlined, UserAddOutlined } from '@ant-design/icons';
import { listarUsuarios, atualizarUsuario, alterarSenha, desativarUsuario } from '../services/usuariosService';

const { Option } = Select;

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [formEditar] = Form.useForm();
  const [formSenha] = Form.useForm();
  const [formNovo] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch {
      message.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirEditar = (usuario) => {
    setUsuarioSelecionado(usuario);
    formEditar.setFieldsValue(usuario);
    setModalEditar(true);
  };

  const abrirSenha = (usuario) => {
    setUsuarioSelecionado(usuario);
    formSenha.resetFields();
    setModalSenha(true);
  };

  const salvarEdicao = async (values) => {
    try {
      await atualizarUsuario(usuarioSelecionado.id, values);
      message.success('Usuário atualizado com sucesso!');
      setModalEditar(false);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao atualizar usuário.');
    }
  };

  const salvarSenha = async (values) => {
    if (values.novaSenha !== values.confirmarSenha) {
      message.error('As senhas não coincidem.');
      return;
    }
    try {
      await alterarSenha(usuarioSelecionado.id, {
        senhaAtual: values.senhaAtual,
        novaSenha: values.novaSenha
      });
      message.success('Senha alterada com sucesso!');
      setModalSenha(false);
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao alterar senha.');
    }
  };

  const salvarNovo = async (values) => {
    try {
      const response = await fetch('http://localhost:5132/api/Auth/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });
      if (!response.ok) throw new Error();
      message.success('Usuário criado com sucesso!');
      setModalNovo(false);
      formNovo.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar usuário.');
    }
  };

  const desativar = async (id) => {
    try {
      await desativarUsuario(id);
      message.success('Usuário desativado.');
      carregar();
    } catch {
      message.error('Erro ao desativar usuário.');
    }
  };

  const colunas = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Perfil', dataIndex: 'perfil', key: 'perfil',
      render: (p) => <Tag color={p === 'Admin' ? 'red' : p === 'Gerente' ? 'orange' : 'blue'}>{p}</Tag>
    },
    { title: 'Status', dataIndex: 'ativo', key: 'ativo',
      render: (a) => <Tag color={a ? 'green' : 'red'}>{a ? 'Ativo' : 'Inativo'}</Tag>
    },
    { title: 'Último Acesso', dataIndex: 'ultimoAcesso', key: 'ultimoAcesso',
      render: (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => abrirEditar(record)} />
          <Button icon={<LockOutlined />} onClick={() => abrirSenha(record)} />
          
       {record.ativo && (
        <Button danger size="small" onClick={() => desativar(record.id)}>Desativar</Button>
      )}
    </Space>
  )
}
  ];

  const permissoes = [
    { key: 'acessoPessoas', label: 'Pessoas' },
    { key: 'acessoProdutos', label: 'Produtos' },
    { key: 'acessoEstoque', label: 'Estoque' },
    { key: 'acessoPedidos', label: 'Pedidos' },
    { key: 'acessoFinanceiro', label: 'Financeiro' },
    { key: 'acessoRelatorios', label: 'Relatórios' },
    { key: 'acessoUsuarios', label: 'Usuários' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Usuários</h2>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setModalNovo(true)}>
          Novo Usuário
        </Button>
      </div>

      <Table dataSource={usuarios} columns={colunas} rowKey="id" loading={loading} />

      {/* Modal Editar */}
      <Modal
        title="Editar Usuário"
        open={modalEditar}
        onCancel={() => setModalEditar(false)}
        onOk={() => formEditar.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={formEditar} layout="vertical" onFinish={salvarEdicao}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="perfil" label="Perfil" rules={[{ required: true }]}>
                <Select>
                  <Option value="Admin">Admin</Option>
                  <Option value="Gerente">Gerente</Option>
                  <Option value="Operador">Operador</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="ativo" label="Ativo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Divider>Permissões de Acesso</Divider>
          <Row gutter={[16, 8]}>
            {permissoes.map(p => (
              <Col span={12} key={p.key}>
                <Form.Item name={p.key} label={p.label} valuePropName="checked" style={{ marginBottom: 8 }}>
                  <Switch />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>

      {/* Modal Senha */}
      <Modal
        title="Alterar Senha"
        open={modalSenha}
        onCancel={() => setModalSenha(false)}
        onOk={() => formSenha.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={formSenha} layout="vertical" onFinish={salvarSenha}>
          <Form.Item name="senhaAtual" label="Senha Atual" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="novaSenha" label="Nova Senha" rules={[
            { required: true },
            { min: 6, message: 'Mínimo 6 caracteres' }
          ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmarSenha" label="Confirmar Nova Senha" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Novo Usuário */}
      <Modal
        title="Novo Usuário"
        open={modalNovo}
        onCancel={() => { setModalNovo(false); formNovo.resetFields(); }}
        onOk={() => formNovo.submit()}
        okText="Criar"
        cancelText="Cancelar"
      >
        <Form form={formNovo} layout="vertical" onFinish={salvarNovo}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="senha" label="Senha" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="perfil" label="Perfil" initialValue="Operador">
            <Select>
              <Option value="Admin">Admin</Option>
              <Option value="Gerente">Gerente</Option>
              <Option value="Operador">Operador</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Usuarios;
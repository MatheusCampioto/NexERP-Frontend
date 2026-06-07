import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { listarPessoas, criarPessoa, atualizarPessoa, desativarPessoa } from '../services/pessoasService';

const { Option } = Select;

const Pessoas = () => {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [pessoaEditando, setPessoaEditando] = useState(null);
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await listarPessoas();
      setPessoas(data);
    } catch {
      message.error('Erro ao carregar pessoas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirModal = (pessoa = null) => {
    setPessoaEditando(pessoa);
    form.setFieldsValue(pessoa || {
      nome: '', tipo: 'Cliente', cpfCnpj: '',
      email: '', telefone: '', endereco: '',
      cidade: '', estado: '', cep: ''
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPessoaEditando(null);
    form.resetFields();
  };

  const salvar = async (values) => {
    try {
      if (pessoaEditando) {
        await atualizarPessoa(pessoaEditando.id, values);
        message.success('Pessoa atualizada com sucesso!');
      } else {
        await criarPessoa(values);
        message.success('Pessoa criada com sucesso!');
      }
      fecharModal();
      carregar();
    } catch {
      message.error('Erro ao salvar pessoa.');
    }
  };

  const desativar = async (id) => {
    try {
      await desativarPessoa(id);
      message.success('Pessoa desativada com sucesso!');
      carregar();
    } catch {
      message.error('Erro ao desativar pessoa.');
    }
  };

  const colunas = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    { title: 'CPF/CNPJ', dataIndex: 'cpF_CNPJ', key: 'cpF_CNPJ' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Telefone', dataIndex: 'telefone', key: 'telefone' },
    { title: 'Cidade', dataIndex: 'cidade', key: 'cidade' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          <Popconfirm title="Desativar pessoa?" onConfirm={() => desativar(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Pessoas</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Nova Pessoa
        </Button>
      </div>

      <Table
        dataSource={pessoas}
        columns={colunas}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={pessoaEditando ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={modalAberto}
        onCancel={fecharModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select>
              <Option value="Cliente">Cliente</Option>
              <Option value="Fornecedor">Fornecedor</Option>
              <Option value="Ambos">Ambos</Option>
            </Select>
          </Form.Item>
          <Form.Item name="cpfCnpj" label="CPF/CNPJ">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="telefone" label="Telefone">
            <Input />
          </Form.Item>
          <Form.Item name="endereco" label="Endereço">
            <Input />
          </Form.Item>
          <Form.Item name="cidade" label="Cidade">
            <Input />
          </Form.Item>
          <Form.Item name="estado" label="Estado">
            <Input maxLength={2} />
          </Form.Item>
          <Form.Item name="cep" label="CEP">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Pessoas;
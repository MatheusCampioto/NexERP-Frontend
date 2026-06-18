import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { listarPessoas, criarPessoa, atualizarPessoa, desativarPessoa } from '../services/pessoasService';
import { validarCNPJ, formatarCNPJ } from '../utils/validacoes';

const Transportadora = () => {
  const [transportadoras, setTransportadoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await listarPessoas();
      setTransportadoras(data.filter(p => p.tipo === 'Transportadora'));
    } catch {
      message.error('Erro ao carregar transportadoras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtradas = transportadoras.filter(t =>
    t.razaoSocial?.toLowerCase().includes(busca.toLowerCase()) ||
    t.nomeFantasia?.toLowerCase().includes(busca.toLowerCase()) ||
    t.cnpj?.includes(busca)
  );

  const abrirModal = (transportadora = null) => {
    setEditando(transportadora);
    if (transportadora) {
      form.setFieldsValue(transportadora);
    } else {
      form.resetFields();
      form.setFieldsValue({ tipoDocumento: 'CNPJ', tipo: 'Transportadora' });
    }
    setModalAberto(true);
  };

  const salvar = async (values) => {
    try {
      const dados = { ...values, tipo: 'Transportadora', tipoDocumento: 'CNPJ', nome: values.razaoSocial || '' };
      if (editando) {
        await atualizarPessoa(editando.id, dados);
        message.success('Transportadora atualizada!');
      } else {
        await criarPessoa(dados);
        message.success('Transportadora cadastrada!');
      }
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao salvar.');
    }
  };

  const desativar = async (id) => {
    try {
      await desativarPessoa(id);
      message.success('Transportadora desativada!');
      carregar();
    } catch {
      message.error('Erro ao desativar.');
    }
  };

  const colunas = [
    { title: 'Razão Social', dataIndex: 'razaoSocial', key: 'razaoSocial' },
    { title: 'Nome Fantasia', dataIndex: 'nomeFantasia', key: 'nomeFantasia' },
    { title: 'CNPJ', dataIndex: 'cnpj', key: 'cnpj' },
    { title: 'Cidade', dataIndex: 'cidade', key: 'cidade' },
    { title: 'Estado', dataIndex: 'estado', key: 'estado' },
    { title: 'Telefone', key: 'telefone', render: (_, r) => r.celular || r.telefone || '-' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(record)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => desativar(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Transportadoras</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Nova Transportadora
        </Button>
      </div>

      <Input
        placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
        prefix={<SearchOutlined />}
        value={busca}
        onChange={e => setBusca(e.target.value)}
        allowClear
        style={{ marginBottom: 16 }}
      />

      <Table dataSource={filtradas} columns={colunas} rowKey="id" loading={loading} />

      <Modal
        title={editando ? 'Editar Transportadora' : 'Nova Transportadora'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="razaoSocial" label="Razão Social" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cnpj"
                label="CNPJ"
                rules={[{
                  validator: (_, value) => {
                    if (!value || value.replace(/\D/g, '').length === 0) return Promise.resolve();
                    if (!validarCNPJ(value)) return Promise.reject('CNPJ inválido.');
                    return Promise.resolve();
                  }
                }]}
              >
                <Input
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  onChange={e => form.setFieldsValue({ cnpj: formatarCNPJ(e.target.value) })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nomeFantasia" label="Nome Fantasia">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inscricaoEstadual" label="Inscrição Estadual">
                <Input maxLength={20} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="E-mail">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="telefone" label="Telefone">
                <Input placeholder="(00) 0000-0000" maxLength={15} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="celular" label="Celular">
                <Input placeholder="(00) 00000-0000" maxLength={16} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="cep" label="CEP">
                <Input placeholder="00000-000" maxLength={9} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endereco" label="Logradouro">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="numero" label="Número">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="bairro" label="Bairro">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cidade" label="Cidade">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="estado" label="UF">
                <Input maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="rntrc" label="RNTRC">
                <Input maxLength={8} placeholder="00000000" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default Transportadora;
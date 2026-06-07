import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { IMaskInput } from 'react-imask';
import { listarPessoas, criarPessoa, atualizarPessoa, desativarPessoa } from '../services/pessoasService';

const { Option } = Select;

const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(cpf[10]);
};

const inputStyle = {
  width: '100%',
  padding: '4px 11px',
  borderRadius: 6,
  border: '1px solid #d9d9d9',
  fontSize: 14,
  lineHeight: '22px',
  outline: 'none',
};

const Pessoas = () => {
  const [pessoas, setPessoas] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [pessoaEditando, setPessoaEditando] = useState(null);
  const [busca, setBusca] = useState('');
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await listarPessoas();
      setPessoas(data);
      setFiltradas(data);
    } catch {
      message.error('Erro ao carregar pessoas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const resultado = pessoas.filter(p =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.email?.toLowerCase().includes(busca.toLowerCase()) ||
      p.cpF_CNPJ?.includes(busca)
    );
    setFiltradas(resultado);
  }, [busca, pessoas]);

  const abrirModal = (pessoa = null) => {
    setPessoaEditando(pessoa);
    form.setFieldsValue(pessoa ? {
      ...pessoa,
      cpfCnpj: pessoa.cpF_CNPJ
    } : {
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
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao salvar pessoa.');
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
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: (t) => <Tag color={t === 'Cliente' ? 'blue' : t === 'Fornecedor' ? 'green' : 'purple'}>{t}</Tag>
    },
    { title: 'CPF/CNPJ', dataIndex: 'cpF_CNPJ', key: 'cpF_CNPJ' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Telefone', dataIndex: 'telefone', key: 'telefone' },
    { title: 'Cidade', dataIndex: 'cidade', key: 'cidade' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          <Popconfirm title="Desativar pessoa?" onConfirm={() => desativar(record.id)} okText="Sim" cancelText="Não">
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

      <Input
        placeholder="Buscar por nome, email ou CPF/CNPJ..."
        prefix={<SearchOutlined />}
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
      />

      <Table dataSource={filtradas} columns={colunas} rowKey="id" loading={loading} />

      <Modal
        title={pessoaEditando ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={modalAberto}
        onCancel={fecharModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="nome" label="Nome" rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true, message: 'Tipo é obrigatório' }]}>
            <Select>
              <Option value="Cliente">Cliente</Option>
              <Option value="Fornecedor">Fornecedor</Option>
              <Option value="Ambos">Ambos</Option>
            </Select>
          </Form.Item>
          <Form.Item name="cpfCnpj" label="CPF/CNPJ" rules={[
            {
              validator: (_, value) => {
                if (!value || value.replace(/[^\d]/g, '') === '') return Promise.resolve();
                const digits = value.replace(/[^\d]/g, '');
                if (digits.length === 11 && !validarCPF(value))
                  return Promise.reject('CPF inválido');
                return Promise.resolve();
              }
            }
          ]}>
            <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[
            { type: 'email', message: 'Email inválido' }
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="telefone" label="Telefone">
            <IMaskInput
              mask="(00) 00000-0000"
              placeholder="(00) 00000-0000"
              style={inputStyle}
              onAccept={(value) => form.setFieldValue('telefone', value)}
            />
          </Form.Item>
          <Form.Item name="endereco" label="Endereço">
            <Input />
          </Form.Item>
          <Row gutter={8}>
            <Col span={14}>
              <Form.Item name="cidade" label="Cidade">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="estado" label="UF" rules={[
                { max: 2, message: 'Use a sigla do estado' }
              ]}>
                <Input maxLength={2} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="cep" label="CEP">
                <IMaskInput
                  mask="00000-000"
                  placeholder="00000-000"
                  style={inputStyle}
                  onAccept={(value) => form.setFieldValue('cep', value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default Pessoas;
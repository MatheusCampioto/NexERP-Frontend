import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Switch, Row, Col, Upload, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { listarPessoas } from '../services/pessoasService';

const { Option } = Select;

const Filial = () => {
  const [filiais, setFiliais] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [filialEditando, setFilialEditando] = useState(null);
  const [ativa, setAtiva] = useState(true);
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const p = await listarPessoas();
      setPessoas(p);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirModal = (filial = null) => {
    setFilialEditando(filial);
    if (filial) {
      setAtiva(filial.ativa);
      form.setFieldsValue(filial);
    } else {
      setAtiva(true);
      form.resetFields();
      form.setFieldsValue({ numero: filiais.length + 1 });
    }
    setModalAberto(true);
  };

  const salvar = (values) => {
    const dados = { ...values, ativa };
    if (filialEditando) {
      setFiliais(filiais.map(f => f.numero === filialEditando.numero ? { ...f, ...dados } : f));
      message.success('Filial atualizada!');
    } else {
      setFiliais([...filiais, { ...dados, numero: filiais.length + 1 }]);
      message.success('Filial criada!');
    }
    setModalAberto(false);
    form.resetFields();
  };

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { message.error('CEP não encontrado.'); return; }
      form.setFieldsValue({
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      });
      message.success('Endereço preenchido!');
    } catch {
      message.error('Erro ao buscar CEP.');
    }
  };

  const colunas = [
    { title: '#', dataIndex: 'numero', key: 'numero', width: 60 },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'CNPJ', dataIndex: 'cnpj', key: 'cnpj' },
    { title: 'Cidade', dataIndex: 'cidade', key: 'cidade' },
    { title: 'CRT', dataIndex: 'crt', key: 'crt' },
    {
      title: 'Tipo', key: 'tipo',
      render: (_, r) => <Tag color={r.numero === 1 ? 'gold' : 'blue'}>{r.numero === 1 ? 'Matriz' : 'Filial'}</Tag>
    },
    {
      title: 'Status', dataIndex: 'ativa', key: 'ativa',
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Ativa' : 'Inativa'}</Tag>
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(record)} />
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Filiais</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          {filiais.length === 0 ? 'Cadastrar Matriz' : 'Nova Filial'}
        </Button>
      </div>

      <Card loading={loading}>
        <Table dataSource={filiais} columns={colunas} rowKey="numero" />
      </Card>

      <Modal
        title={filialEditando ? 'Editar Filial' : filiais.length === 0 ? 'Cadastrar Matriz' : 'Nova Filial'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="numero" label="Número">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="descricao" label="Razão Social" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Status">
                <Switch checked={ativa} onChange={setAtiva} checkedChildren="Ativa" unCheckedChildren="Inativa" />
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
              <Form.Item name="cnpj" label="CNPJ">
                <Input placeholder="00.000.000/0000-00" maxLength={18} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pessoaId" label="Pessoa Vinculada">
                <Select showSearch optionFilterProp="children" allowClear placeholder="Selecione">
                  {pessoas.map(p => <Option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</Option>)}
                </Select>
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
              <Form.Item name="inscricaoMunicipal" label="Inscrição Municipal">
                <Input maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cnae" label="CNAE">
                <Input maxLength={10} placeholder="0000-0/00" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="crt" label="C.R.T">
                <Select allowClear>
                  <Option value="1">1 - Simples Nacional</Option>
                  <Option value="2">2 - Simples Nacional - Excesso</Option>
                  <Option value="3">3 - Regime Normal</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="modelo" label="Modelo">
                <Select allowClear>
                  <Option value="55">55 - NF-e</Option>
                  <Option value="65">65 - NFC-e</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="serieDanfe" label="Série DANFE">
                <Input maxLength={3} placeholder="001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="simplesNacional" label="% Simples Nacional">
                <Input placeholder="0,00%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certificadoDigital" label="Certificado Digital">
                <Upload maxCount={1} beforeUpload={() => false}>
                  <Button icon={<UploadOutlined />}>Upload .pfx</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="cep" label="CEP">
                <Input placeholder="00000-000" maxLength={9} onChange={e => buscarCep(e.target.value)} />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="endereco" label="Logradouro">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="numero_end" label="Número">
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
              <Form.Item name="email" label="E-mail">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="logomarca" label="Logomarca">
            <Upload maxCount={1} beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />}>Upload Logomarca</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Filial;
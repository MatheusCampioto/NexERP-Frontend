import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Switch, Row, Col, Upload, Tag, Divider, Card, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { listarPessoas } from '../services/pessoasService';
import { obterConfiguracao, salvarConfiguracao } from '../services/configuracaoService';

const { Option } = Select;

const Filial = () => {
  const [filiais, setFiliais] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [filialEditando, setFilialEditando] = useState(null);
  const [ativa, setAtiva] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();
  const [formConfig] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, config] = await Promise.all([listarPessoas(), obterConfiguracao()]);
      setPessoas(p);
      formConfig.setFieldsValue(config);
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

  const salvarFilial = async (values) => {
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

  const salvarConfig = async (values) => {
    setSalvando(true);
    try {
      await salvarConfiguracao(values);
      message.success('Configurações salvas!');
    } catch {
      message.error('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { message.error('CEP não encontrado.'); return; }
      formConfig.setFieldsValue({
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      });
    } catch {
      message.error('Erro ao buscar CEP.');
    }
  };

  const colunas = [
    { title: '#', dataIndex: 'numero', key: 'numero', width: 60 },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'CNPJ', dataIndex: 'cnpj', key: 'cnpj' },
    { title: 'CRT', dataIndex: 'crt', key: 'crt' },
    { title: 'Status', dataIndex: 'ativa', key: 'ativa', render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Ativa' : 'Inativa'}</Tag> },
    { title: 'Ações', key: 'acoes', render: (_, record) => <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(record)} /> }
  ];

  const tabItems = [
    {
      key: 'filiais',
      label: 'Filiais',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>Nova Filial</Button>
          </div>
          <Table dataSource={filiais} columns={colunas} rowKey="numero" loading={loading} />
        </>
      )
    },
    {
      key: 'empresa',
      label: 'Dados da Empresa',
      children: (
        <Form form={formConfig} layout="vertical" onFinish={salvarConfig}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="nomeEmpresa" label="Razão Social" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cnpj" label="CNPJ">
                <Input placeholder="00.000.000/0000-00" maxLength={18} />
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
              <Form.Item name="regimeTributario" label="Regime Tributário">
                <Select allowClear>
                  <Option value="SimplesNacional">Simples Nacional</Option>
                  <Option value="LucroPresumido">Lucro Presumido</Option>
                  <Option value="LucroReal">Lucro Real</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inscricaoEstadual" label="Inscrição Estadual">
                <Input maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inscricaoMunicipal" label="Inscrição Municipal">
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
              <Form.Item name="site" label="Site">
                <Input placeholder="www.empresa.com.br" />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Endereço</Divider>
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
              <Form.Item name="numero" label="Número">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="complemento" label="Complemento">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bairro" label="Bairro">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="cidade" label="Cidade">
                <Input />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item name="estado" label="UF">
                <Input maxLength={2} />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Fiscal</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cfop_PadraoVenda" label="CFOP Padrão Venda">
                <Input placeholder="5102" maxLength={5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cfop_PadraoCompra" label="CFOP Padrão Compra">
                <Input placeholder="1102" maxLength={5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="aliquotaICMS_Padrao" label="ICMS (%)">
                <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="aliquotaPIS_Padrao" label="PIS (%)">
                <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="aliquotaCOFINS_Padrao" label="COFINS (%)">
                <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="moedaSimbolo" label="Símbolo da Moeda">
                <Input placeholder="R$" maxLength={5} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={salvando}>Salvar</Button>
          </div>
        </Form>
      )
    }
  ];

  return (
    <>
      <h2>Filial</h2>
      <Card loading={loading}>
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title={filialEditando ? 'Editar Filial' : 'Nova Filial'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={salvarFilial}>
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="numero" label="Número">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="descricao" label="Descrição" rules={[{ required: true }]}>
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
              <Form.Item name="pessoaId" label="Pessoa Vinculada">
                <Select showSearch optionFilterProp="children" allowClear placeholder="Selecione">
                  {pessoas.map(p => <Option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</Option>)}
                </Select>
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
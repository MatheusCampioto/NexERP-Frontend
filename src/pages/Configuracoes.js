import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Tabs, Divider, Row, Col, Card } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { obterConfiguracao, salvarConfiguracao } from '../services/configuracaoService';

const { Option } = Select;

const Configuracoes = () => {
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const data = await obterConfiguracao();
        form.setFieldsValue(data);
      } catch {
        message.error('Erro ao carregar configurações.');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [form]);

  const salvar = async (values) => {
    setSalvando(true);
    try {
      await salvarConfiguracao(values);
      message.success('Configurações salvas com sucesso!');
    } catch {
      message.error('Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const tabItems = [
    {
      key: 'empresa',
      label: 'Dados da Empresa',
      children: (
        <>
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
        </>
      )
    },
    {
      key: 'endereco',
      label: 'Endereço',
      children: (
        <>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="cep" label="CEP">
                <Input placeholder="00000-000" maxLength={9} />
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
        </>
      )
    },
    {
      key: 'fiscal',
      label: 'Fiscal',
      children: (
        <>
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
          <Divider>Alíquotas Padrão</Divider>
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
        </>
      )
    },
    {
      key: 'sistema',
      label: 'Sistema',
      children: (
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="moedaSimbolo" label="Símbolo da Moeda">
              <Input placeholder="R$" maxLength={5} />
            </Form.Item>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Configurações do Sistema</h2>
        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={salvando}>
          Salvar
        </Button>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Tabs items={tabItems} />
        </Form>
      </Card>
    </>
  );
};

export default Configuracoes;
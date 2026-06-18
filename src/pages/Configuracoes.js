import { useState } from 'react';
import { Form, InputNumber, Select, Button, message, Tabs, Row, Col, Card, Switch } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Option } = Select;

const Configuracoes = () => {
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  const salvar = async (values) => {
    setSalvando(true);
    try {
      // futuramente: await salvarParametros(values);
      message.success('Parâmetros salvos com sucesso!');
    } catch {
      message.error('Erro ao salvar parâmetros.');
    } finally {
      setSalvando(false);
    }
  };

  const tabItems = [
    {
      key: 'vendas',
      label: 'Vendas',
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="permiteEstoqueNegativo" label="Permite venda com estoque negativo" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exigeAprovacaoPedido" label="Exige aprovação de pedido" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="descontoMaximoVendedor" label="Desconto máximo por vendedor (%)">
                <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorMinimoAprovacao" label="Valor mínimo para aprovação (R$)">
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="prazoMaximoOrcamento" label="Prazo máximo de orçamento (dias)">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="formaPagamentoPadrao" label="Forma de pagamento padrão">
                <Select allowClear>
                  <Option value="Dinheiro">Dinheiro</Option>
                  <Option value="PIX">PIX</Option>
                  <Option value="Boleto">Boleto</Option>
                  <Option value="Cartão de Crédito">Cartão de Crédito</Option>
                  <Option value="Transferência">Transferência</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'estoque',
      label: 'Estoque',
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="baixaEstoque" label="Baixar estoque ao">
                <Select>
                  <Option value="confirmar">Confirmar pedido</Option>
                  <Option value="faturar">Faturar</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="permiteAjusteManual" label="Permite ajuste manual de estoque" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'financeiro',
      label: 'Financeiro',
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="geraFinanceiroAoFaturar" label="Gera financeiro automaticamente ao faturar" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="diasToleranciaVencimento" label="Dias de tolerância para vencimento">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: 'nfe',
      label: 'NF-e',
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ambienteNFe" label="Ambiente NF-e">
                <Select>
                  <Option value="homologacao">Homologação</Option>
                  <Option value="producao">Produção</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contingencia" label="Contingência" valuePropName="checked">
                <Switch checkedChildren="Ativa" unCheckedChildren="Inativa" />
              </Form.Item>
            </Col>
          </Row>
        </>
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
      <Card>
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Tabs items={tabItems} />
        </Form>
      </Card>
    </>
  );
};

export default Configuracoes;
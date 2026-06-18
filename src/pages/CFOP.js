import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Option } = Select;

const cfopsPadrao = [
  { cfop: '1102', descricao: 'Compra para comercialização', tipo: 'Entrada', natureza: 'Compra' },
  { cfop: '1202', descricao: 'Devolução de venda de produção do estabelecimento', tipo: 'Entrada', natureza: 'Devolução' },
  { cfop: '1411', descricao: 'Compra para industrialização em zona franca', tipo: 'Entrada', natureza: 'Compra' },
  { cfop: '2102', descricao: 'Compra para comercialização - interestadual', tipo: 'Entrada', natureza: 'Compra' },
  { cfop: '3102', descricao: 'Compra para comercialização - importação', tipo: 'Entrada', natureza: 'Compra' },
  { cfop: '5102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros', tipo: 'Saída', natureza: 'Venda' },
  { cfop: '5202', descricao: 'Devolução de compra para comercialização', tipo: 'Saída', natureza: 'Devolução' },
  { cfop: '5405', descricao: 'Venda de mercadoria sujeita ao ICMS ST', tipo: 'Saída', natureza: 'Venda' },
  { cfop: '5411', descricao: 'Devolução de compra para industrialização', tipo: 'Saída', natureza: 'Devolução' },
  { cfop: '5912', descricao: 'Remessa para demonstração', tipo: 'Saída', natureza: 'Remessa' },
  { cfop: '6102', descricao: 'Venda de mercadoria adquirida - interestadual', tipo: 'Saída', natureza: 'Venda' },
  { cfop: '6202', descricao: 'Devolução de compra - interestadual', tipo: 'Saída', natureza: 'Devolução' },
  { cfop: '7102', descricao: 'Venda de mercadoria - exportação', tipo: 'Saída', natureza: 'Venda' },
];

const CFOP = () => {
  const [cfops, setCfops] = useState(cfopsPadrao);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [cfopEditando, setCfopEditando] = useState(null);
  const [form] = Form.useForm();

  const cfopsFiltrados = cfops.filter(c => {
    if (filtroTipo && c.tipo !== filtroTipo) return false;
    if (busca && !c.cfop.includes(busca) && !c.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const abrirModal = (cfop = null) => {
    setCfopEditando(cfop);
    if (cfop) {
      form.setFieldsValue(cfop);
    } else {
      form.resetFields();
    }
    setModalAberto(true);
  };

  const salvar = (values) => {
    if (cfopEditando) {
      setCfops(cfops.map(c => c.cfop === cfopEditando.cfop ? { ...c, ...values } : c));
      message.success('CFOP atualizado!');
    } else {
      if (cfops.find(c => c.cfop === values.cfop)) {
        message.error('CFOP já cadastrado.');
        return;
      }
      setCfops([...cfops, { ...values, personalizado: true }]);
      message.success('CFOP criado!');
    }
    setModalAberto(false);
    form.resetFields();
  };

  const colunas = [
    { title: 'CFOP', dataIndex: 'cfop', key: 'cfop', width: 100 },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    {
      title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: v => <Tag color={v === 'Saída' ? 'blue' : 'green'}>{v}</Tag>
    },
    {
      title: 'Natureza', dataIndex: 'natureza', key: 'natureza',
      render: v => <Tag>{v}</Tag>
    },
    {
      title: 'Origem', key: 'origem',
      render: (_, r) => <Tag color={r.personalizado ? 'orange' : 'default'}>{r.personalizado ? 'Personalizado' : 'Padrão'}</Tag>
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(record)} />
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>CFOP</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Novo CFOP
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Input
            placeholder="Buscar por código ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select placeholder="Filtrar por tipo" style={{ width: '100%' }} allowClear onChange={setFiltroTipo}>
            <Option value="Entrada">Entrada</Option>
            <Option value="Saída">Saída</Option>
          </Select>
        </Col>
      </Row>

      <Table dataSource={cfopsFiltrados} columns={colunas} rowKey="cfop" pagination={{ pageSize: 15 }} />

      <Modal
        title={cfopEditando ? 'Editar CFOP' : 'Novo CFOP'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="cfop" label="CFOP" rules={[{ required: true }]}>
                <Input maxLength={5} placeholder="0000" disabled={!!cfopEditando} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="descricao" label="Descrição" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                <Select>
                  <Option value="Entrada">Entrada</Option>
                  <Option value="Saída">Saída</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="natureza" label="Natureza da Operação" rules={[{ required: true }]}>
                <Select>
                  <Option value="Venda">Venda</Option>
                  <Option value="Compra">Compra</Option>
                  <Option value="Devolução">Devolução</Option>
                  <Option value="Remessa">Remessa</Option>
                  <Option value="Transferência">Transferência</Option>
                  <Option value="Outros">Outros</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default CFOP;
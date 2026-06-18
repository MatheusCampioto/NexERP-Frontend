import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Row, Col, Switch } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Option } = Select;

const Serie = () => {
  const [series, setSeries] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [serieEditando, setSerieEditando] = useState(null);
  const [ativa, setAtiva] = useState(true);
  const [form] = Form.useForm();

  const abrirModal = (serie = null) => {
    setSerieEditando(serie);
    if (serie) {
      setAtiva(serie.ativa);
      form.setFieldsValue(serie);
    } else {
      setAtiva(true);
      form.resetFields();
    }
    setModalAberto(true);
  };

  const salvar = (values) => {
    const dados = { ...values, ativa };
    if (serieEditando) {
      setSeries(series.map(s => s.serie === serieEditando.serie ? { ...s, ...dados } : s));
      message.success('Série atualizada!');
    } else {
      if (series.find(s => s.serie === values.serie)) {
        message.error('Série já cadastrada.');
        return;
      }
      setSeries([...series, dados]);
      message.success('Série criada!');
    }
    setModalAberto(false);
    form.resetFields();
  };

  const colunas = [
    { title: 'Série', dataIndex: 'serie', key: 'serie', width: 100 },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    {
      title: 'Modelo', dataIndex: 'modelo', key: 'modelo',
      render: v => <Tag>{v}</Tag>
    },
    {
      title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: v => <Tag color={v === 'Saída' ? 'blue' : 'green'}>{v}</Tag>
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
        <h2>Séries</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Nova Série
        </Button>
      </div>

      <Table dataSource={series} columns={colunas} rowKey="serie" />

      <Modal
        title={serieEditando ? 'Editar Série' : 'Nova Série'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="serie" label="Série" rules={[{ required: true }]}>
                <Input maxLength={3} placeholder="001" disabled={!!serieEditando} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="descricao" label="Descrição">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="modelo" label="Modelo" rules={[{ required: true }]}>
                <Select>
                  <Option value="55">55 - NF-e</Option>
                  <Option value="65">65 - NFC-e</Option>
                  <Option value="57">57 - CT-e</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                <Select>
                  <Option value="Saída">Saída</Option>
                  <Option value="Entrada">Entrada</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Status">
            <Switch checked={ativa} onChange={setAtiva} checkedChildren="Ativa" unCheckedChildren="Inativa" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Serie;
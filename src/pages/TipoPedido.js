import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

const tiposFaturamento = [
  { value: 'ContribuinteICMS', label: 'Contribuinte ICMS' },
  { value: 'ConsumidorFinal', label: 'Consumidor Final' },
  { value: 'Suframa', label: 'Suframa' },
];

const TipoPedido = () => {
  const [tipos, setTipos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();

  const abrirModal = (tipo = null) => {
    setEditando(tipo);
    if (tipo) {
      form.setFieldsValue(tipo);
    } else {
      form.resetFields();
    }
    setModalAberto(true);
  };

  const salvar = (values) => {
    if (editando) {
      setTipos(tipos.map(t => t.id === editando.id ? { ...t, ...values } : t));
      message.success('Tipo de pedido atualizado!');
    } else {
      setTipos([...tipos, { ...values, id: tipos.length + 1 }]);
      message.success('Tipo de pedido criado!');
    }
    setModalAberto(false);
    form.resetFields();
  };

  const excluir = (id) => {
    setTipos(tipos.filter(t => t.id !== id));
    message.success('Tipo de pedido excluído!');
  };

  const colunas = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo' },
    {
      title: 'Finalidade', dataIndex: 'finalidade', key: 'finalidade',
      render: v => <Tag>{v}</Tag>
    },
    {
      title: 'Tipo de Faturamento', dataIndex: 'tipoFaturamento', key: 'tipoFaturamento',
      render: v => {
        const found = tiposFaturamento.find(t => t.value === v);
        return <Tag color="blue">{found?.label || v}</Tag>;
      }
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirModal(record)} />
          <Popconfirm title="Excluir tipo de pedido?" onConfirm={() => excluir(record.id)} okText="Sim" cancelText="Não">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Tipo de Pedido</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Novo Tipo
        </Button>
      </div>

      <Table dataSource={tipos} columns={colunas} rowKey="id" />

      <Modal
        title={editando ? 'Editar Tipo de Pedido' : 'Novo Tipo de Pedido'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Input placeholder="Ex: Venda, Bonificação, Remessa" />
          </Form.Item>
          <Form.Item name="finalidade" label="Finalidade" rules={[{ required: true }]}>
            <Select>
              <Option value="Normal">Normal</Option>
              <Option value="Complementar">Complementar</Option>
              <Option value="Ajuste">Ajuste</Option>
              <Option value="Devolução">Devolução</Option>
              <Option value="Bonificação">Bonificação</Option>
              <Option value="Remessa">Remessa</Option>
              <Option value="Retorno">Retorno</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tipoFaturamento" label="Tipo de Faturamento" rules={[{ required: true }]}>
            <Select>
              {tiposFaturamento.map(t => (
                <Option key={t.value} value={t.value}>{t.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TipoPedido;
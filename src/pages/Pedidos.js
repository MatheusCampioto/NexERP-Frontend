import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, InputNumber, message, Tag, Space, Divider, Card, Row, Col, Statistic, DatePicker } from 'antd';
import { PlusOutlined, MinusCircleOutlined, PrinterOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { listarPedidos, criarPedido } from '../services/pedidosService';
import { listarPessoas } from '../services/pessoasService';
import { listarProdutos } from '../services/produtosService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Option } = Select;
const { RangePicker } = DatePicker;

const statusCor = { Orcamento: 'orange', Pedido: 'blue', Confirmado: 'green', Cancelado: 'red' };
const statusLabel = { Orcamento: 'Orçamento', Pedido: 'Pedido', Confirmado: 'Confirmado', Cancelado: 'Cancelado' };

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState(null);
  const [form] = Form.useForm();
  const itensWatch = Form.useWatch('itens', form);

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, pe, pr] = await Promise.all([listarPedidos(), listarPessoas(), listarProdutos()]);
      setPedidos(p);
      setPessoas(pe);
      setProdutos(pr);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroStatus && p.status !== filtroStatus) return false;
    if (filtroCliente && !p.pessoa?.nome?.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    if (filtroPeriodo) {
      const data = new Date(p.criadoEm);
      if (data < filtroPeriodo[0].toDate() || data > filtroPeriodo[1].toDate()) return false;
    }
    return true;
  });

  const calcularTotal = () => {
    if (!itensWatch) return 0;
    const subtotal = itensWatch.reduce((acc, item) => {
      if (!item?.produtoId || !item?.quantidade) return acc;
      const produto = produtos.find(p => p.id === item.produtoId);
      if (!produto) return acc;
      return acc + (produto.precoVenda * item.quantidade) - (item.desconto || 0);
    }, 0);
    const desconto = form.getFieldValue('desconto') || 0;
    return subtotal - desconto;
  };

  const salvar = async (values) => {
    try {
      await criarPedido({ ...values, desconto: values.desconto || 0 });
      message.success('Pedido criado com sucesso!');
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao criar pedido.');
    }
  };

  const avancar = async (id) => {
    try {
      const result = await fetch(`http://localhost:5132/api/Pedidos/${id}/avancar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await result.json();
      if (!result.ok) return message.error(data.mensagem);
      message.success(data.mensagem);
      carregar();
      if (pedidoDetalhe?.id === id) {
        const atualizado = await fetch(`http://localhost:5132/api/Pedidos/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setPedidoDetalhe(await atualizado.json());
      }
    } catch {
      message.error('Erro ao avançar pedido.');
    }
  };

  const cancelar = async (id) => {
    try {
      const result = await fetch(`http://localhost:5132/api/Pedidos/${id}/cancelar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await result.json();
      if (!result.ok) return message.error(data.mensagem);
      message.success(data.mensagem);
      carregar();
      if (pedidoDetalhe?.id === id) setPedidoDetalhe({ ...pedidoDetalhe, status: 'Cancelado' });
    } catch {
      message.error('Erro ao cancelar pedido.');
    }
  };

  const imprimirPDF = (pedido) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('NexERP', 14, 16);
    doc.setFontSize(12);
    doc.text(`${statusLabel[pedido.status] || pedido.status} #${pedido.id}`, 14, 24);
    doc.text(`Cliente: ${pedido.pessoa?.nome || ''}`, 14, 32);
    doc.text(`Data: ${new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}`, 14, 40);
    if (pedido.formaPagamento) doc.text(`Forma de Pagamento: ${pedido.formaPagamento}`, 14, 48);
    if (pedido.condicaoPagamento) doc.text(`Condição: ${pedido.condicaoPagamento}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Produto', 'Qtd', 'Preço Unit.', 'Desconto', 'Subtotal']],
      body: pedido.itens?.map(i => [
        i.produto?.nome || '',
        i.quantidade,
        `R$ ${i.precoUnitario?.toFixed(2)}`,
        `R$ ${i.desconto?.toFixed(2)}`,
        `R$ ${((i.quantidade * i.precoUnitario) - i.desconto).toFixed(2)}`
      ]) || []
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Bruto: R$ ${pedido.valorTotal?.toFixed(2)}`, 14, finalY);
    if (pedido.desconto > 0) doc.text(`Desconto: R$ ${pedido.desconto?.toFixed(2)}`, 14, finalY + 8);
    doc.setFontSize(14);
    doc.text(`Total Líquido: R$ ${(pedido.valorTotal - pedido.desconto).toFixed(2)}`, 14, finalY + 16);
    if (pedido.observacao) doc.text(`Obs: ${pedido.observacao}`, 14, finalY + 24);

    doc.save(`pedido_${pedido.id}.pdf`);
  };

  const colunas = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Cliente', dataIndex: ['pessoa', 'nome'], key: 'pessoa' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusCor[s]}>{statusLabel[s] || s}</Tag>
    },
    { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: (v) => `R$ ${v?.toFixed(2)}` },
    { title: 'Forma Pgto', dataIndex: 'formaPagamento', key: 'formaPagamento' },
    { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: (d) => new Date(d).toLocaleDateString('pt-BR') },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setPedidoDetalhe(record)}>Detalhes</Button>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => imprimirPDF(record)} />
          {(record.status === 'Orcamento' || record.status === 'Pedido') && (
            <Button type="primary" size="small" icon={<ArrowRightOutlined />} onClick={() => avancar(record.id)}>
              {record.status === 'Orcamento' ? 'Converter' : 'Confirmar'}
            </Button>
          )}
          {record.status !== 'Confirmado' && record.status !== 'Cancelado' && (
            <Button danger size="small" onClick={() => cancelar(record.id)}>Cancelar</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Pedidos</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalAberto(true)}>
          Novo Orçamento
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="Buscar por cliente..."
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select placeholder="Filtrar por status" style={{ width: '100%' }} allowClear onChange={setFiltroStatus}>
            <Option value="Orcamento">Orçamento</Option>
            <Option value="Pedido">Pedido</Option>
            <Option value="Confirmado">Confirmado</Option>
            <Option value="Cancelado">Cancelado</Option>
          </Select>
        </Col>
        <Col span={8}>
          <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={setFiltroPeriodo} />
        </Col>
        <Col span={4}>
          <Button onClick={() => { setFiltroStatus(null); setFiltroCliente(''); setFiltroPeriodo(null); }} block>
            Limpar
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total" value={pedidosFiltrados.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Confirmados" value={pedidosFiltrados.filter(p => p.status === 'Confirmado').length} valueStyle={{ color: 'green' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Pendentes" value={pedidosFiltrados.filter(p => p.status === 'Pedido' || p.status === 'Orcamento').length} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Valor Total" value={pedidosFiltrados.reduce((acc, p) => acc + (p.valorTotal - p.desconto), 0)} precision={2} prefix="R$" />
          </Card>
        </Col>
      </Row>

      <Table dataSource={pedidosFiltrados} columns={colunas} rowKey="id" loading={loading} />

      {/* Modal detalhe do pedido */}
      <Modal
        title={`${statusLabel[pedidoDetalhe?.status] || ''} #${pedidoDetalhe?.id}`}
        open={!!pedidoDetalhe}
        onCancel={() => setPedidoDetalhe(null)}
        footer={[
          <Button key="pdf" icon={<PrinterOutlined />} onClick={() => imprimirPDF(pedidoDetalhe)}>PDF</Button>,
          pedidoDetalhe?.status === 'Orcamento' || pedidoDetalhe?.status === 'Pedido' ? (
            <Button key="avancar" type="primary" onClick={() => avancar(pedidoDetalhe.id)}>
              {pedidoDetalhe?.status === 'Orcamento' ? 'Converter em Pedido' : 'Confirmar Pedido'}
            </Button>
          ) : null,
          <Button key="fechar" onClick={() => setPedidoDetalhe(null)}>Fechar</Button>
        ]}
        width={700}
      >
        {pedidoDetalhe && (
          <>
            <Row gutter={16}>
              <Col span={12}><b>Cliente:</b> {pedidoDetalhe.pessoa?.nome}</Col>
              <Col span={12}><b>Status:</b> <Tag color={statusCor[pedidoDetalhe.status]}>{statusLabel[pedidoDetalhe.status]}</Tag></Col>
              <Col span={12}><b>Forma de Pagamento:</b> {pedidoDetalhe.formaPagamento || '-'}</Col>
              <Col span={12}><b>Condição:</b> {pedidoDetalhe.condicaoPagamento || '-'}</Col>
              {pedidoDetalhe.observacao && <Col span={24}><b>Obs:</b> {pedidoDetalhe.observacao}</Col>}
            </Row>
            <Divider />
            <Table
              dataSource={pedidoDetalhe.itens}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Produto', dataIndex: ['produto', 'nome'] },
                { title: 'Qtd', dataIndex: 'quantidade' },
                { title: 'Preço Unit.', dataIndex: 'precoUnitario', render: (v) => `R$ ${v?.toFixed(2)}` },
                { title: 'Desconto', dataIndex: 'desconto', render: (v) => `R$ ${v?.toFixed(2)}` },
                { title: 'Subtotal', render: (_, r) => `R$ ${((r.quantidade * r.precoUnitario) - r.desconto).toFixed(2)}` },
              ]}
            />
            <Divider />
            <Row justify="end">
              <Col>
                <Statistic title="Total Bruto" value={pedidoDetalhe.valorTotal} prefix="R$" precision={2} />
                {pedidoDetalhe.desconto > 0 && <Statistic title="Desconto" value={pedidoDetalhe.desconto} prefix="- R$" precision={2} valueStyle={{ color: '#cf1322' }} />}
                <Statistic title="Total Líquido" value={pedidoDetalhe.valorTotal - pedidoDetalhe.desconto} prefix="R$" precision={2} valueStyle={{ color: '#3f8600' }} />
              </Col>
            </Row>
          </>
        )}
      </Modal>

      {/* Modal novo pedido */}
      <Modal
        title="Novo Orçamento"
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pessoaId" label="Cliente" rules={[{ required: true, message: 'Selecione o cliente' }]}>
                <Select placeholder="Selecione o cliente" showSearch optionFilterProp="children">
                  {pessoas.map(p => <Option key={p.id} value={p.id}>{p.nome || p.razaoSocial}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="formaPagamento" label="Forma de Pagamento">
                <Select placeholder="Selecione" allowClear>
                  <Option value="Dinheiro">Dinheiro</Option>
                  <Option value="Cartão de Crédito">Cartão de Crédito</Option>
                  <Option value="Cartão de Débito">Cartão de Débito</Option>
                  <Option value="Pix">Pix</Option>
                  <Option value="Boleto">Boleto</Option>
                  <Option value="Transferência">Transferência</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                <Select placeholder="Selecione" allowClear>
                  <Option value="À Vista">À Vista</Option>
                  <Option value="30 dias">30 dias</Option>
                  <Option value="30/60 dias">30/60 dias</Option>
                  <Option value="30/60/90 dias">30/60/90 dias</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="desconto" label="Desconto Geral (R$)">
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="observacao" label="Observação">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Itens</Divider>

          <Form.List name="itens" rules={[{ validator: async (_, itens) => { if (!itens || itens.length < 1) return Promise.reject('Adicione pelo menos um item.'); } }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row key={key} gutter={8} align="middle">
                    <Col span={10}>
                      <Form.Item name={[name, 'produtoId']} rules={[{ required: true, message: 'Selecione' }]}>
                        <Select placeholder="Produto" showSearch optionFilterProp="children">
                          {produtos.map(p => <Option key={p.id} value={p.id}>{p.nome} — R$ {p.precoVenda?.toFixed(2)}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'quantidade']} rules={[{ required: true, message: 'Qtd' }]}>
                        <InputNumber min={1} placeholder="Qtd" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[name, 'desconto']}>
                        <InputNumber min={0} precision={2} placeholder="Desconto R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: 18 }} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Adicionar Item
                </Button>
              </>
            )}
          </Form.List>

          <Divider />
          <Row justify="end">
            <Col>
              <b>Total Estimado: R$ {calcularTotal().toFixed(2)}</b>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default Pedidos;
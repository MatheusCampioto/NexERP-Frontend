import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, InputNumber, message, Tag, Space, Divider, Card, Row, Col, Statistic, DatePicker, Tabs } from 'antd';
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
// eslint-disable-next-line no-unused-vars
const [transportadoras, setTransportadoras] = useState([]);
// eslint-disable-next-line no-unused-vars
const [tipoPedidos, setTipoPedidos] = useState([]);

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
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusCor[s]}>{statusLabel[s] || s}</Tag> },
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

  const tabItems = [
    {
      key: 'pedidos',
      label: 'Pedidos',
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Input placeholder="Buscar por cliente..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} allowClear />
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
              <Button onClick={() => { setFiltroStatus(null); setFiltroCliente(''); setFiltroPeriodo(null); }} block>Limpar</Button>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card size="small"><Statistic title="Total" value={pedidosFiltrados.length} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Confirmados" value={pedidosFiltrados.filter(p => p.status === 'Confirmado').length} valueStyle={{ color: 'green' }} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Pendentes" value={pedidosFiltrados.filter(p => p.status === 'Pedido' || p.status === 'Orcamento').length} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
            <Col span={6}><Card size="small"><Statistic title="Valor Total" value={pedidosFiltrados.reduce((acc, p) => acc + (p.valorTotal - p.desconto), 0)} precision={2} prefix="R$" /></Card></Col>
          </Row>
          <Table dataSource={pedidosFiltrados} columns={colunas} rowKey="id" loading={loading} />
        </>
      )
    },
    {
      key: 'historico',
      label: 'Histórico',
      children: (
        <Table
          dataSource={[...pedidos].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))}
          rowKey="id"
          loading={loading}
          columns={[
            { title: '#', dataIndex: 'id', key: 'id', width: 60 },
            { title: 'Cliente', dataIndex: ['pessoa', 'nome'], key: 'pessoa' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{statusLabel[s]}</Tag> },
            { title: 'Forma Pgto', dataIndex: 'formaPagamento', key: 'formaPagamento' },
            { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
            { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => new Date(d).toLocaleDateString('pt-BR') },
          ]}
        />
      )
    },
    {
      key: 'relatorios',
      label: 'Relatórios',
      children: (
        <Row gutter={16}>
          <Col span={6}><Card size="small"><Statistic title="Total de Pedidos" value={pedidos.length} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Confirmados" value={pedidos.filter(p => p.status === 'Confirmado').length} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Cancelados" value={pedidos.filter(p => p.status === 'Cancelado').length} valueStyle={{ color: 'red' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Valor Total" value={pedidos.filter(p => p.status === 'Confirmado').reduce((acc, p) => acc + (p.valorTotal - p.desconto), 0)} precision={2} prefix="R$" /></Card></Col>
          <Col span={24} style={{ marginTop: 16 }}>
            <Card title="Pedidos por Status" size="small">
              <Table
                dataSource={['Orcamento', 'Pedido', 'Confirmado', 'Cancelado'].map(s => ({
                  status: s,
                  total: pedidos.filter(p => p.status === s).length,
                  valor: pedidos.filter(p => p.status === s).reduce((acc, p) => acc + (p.valorTotal || 0), 0)
                }))}
                rowKey="status"
                size="small"
                pagination={false}
                columns={[
                  { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{statusLabel[s]}</Tag> },
                  { title: 'Quantidade', dataIndex: 'total', key: 'total' },
                  { title: 'Valor Total', dataIndex: 'valor', key: 'valor', render: v => `R$ ${v.toFixed(2)}` },
                ]}
              />
            </Card>
          </Col>
        </Row>
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

      <Tabs items={tabItems} />

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
      {/* Modal novo pedido */}
<Modal
  title="Novo Orçamento"
  open={modalAberto}
  onCancel={() => { setModalAberto(false); form.resetFields(); }}
  onOk={() => form.submit()}
  okText="Salvar"
  cancelText="Cancelar"
  width={900}
>
  <Form form={form} layout="vertical" onFinish={salvar}>
    <Tabs items={[
      {
        key: 'geral',
        label: 'Geral',
        children: (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="pessoaId" label="Cliente" rules={[{ required: true, message: 'Selecione o cliente' }]}>
                  <Select placeholder="Selecione o cliente" showSearch optionFilterProp="children">
                    {pessoas.map(p => <Option key={p.id} value={p.id}>{p.nome || p.razaoSocial}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="representanteId" label="Representante / Vendedor">
                  <Select placeholder="Selecione" allowClear showSearch optionFilterProp="children">
                    {pessoas.filter(p => p.tipo === 'Representante').map(p => <Option key={p.id} value={p.id}>{p.nome || p.razaoSocial}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="tipoPedido" label="Tipo de Pedido">
                  <Select placeholder="Selecione" allowClear>
                    {tipoPedidos.map(t => <Option key={t.id} value={t.tipo}>{t.tipo}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="tabelaPreco" label="Tabela de Preço">
                  <Input placeholder="Tabela padrão" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="filial" label="Filial">
                  <Input placeholder="Filial" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
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
              <Col span={8}>
                <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                  <Select placeholder="Selecione" allowClear>
                    <Option value="À Vista">À Vista</Option>
                    <Option value="30 dias">30 dias</Option>
                    <Option value="30/60 dias">30/60 dias</Option>
                    <Option value="30/60/90 dias">30/60/90 dias</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="dataEntregaPrevista" label="Previsão de Entrega">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="transportadoraId" label="Transportadora">
                  <Select placeholder="Selecione" allowClear showSearch optionFilterProp="children">
                    {transportadoras.map(t => <Option key={t.id} value={t.id}>{t.razaoSocial || t.nome}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="frete" label="Valor do Frete (R$)">
                  <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )
      },
      {
        key: 'itens',
        label: 'Itens',
        children: (
          <>
            <Form.List name="itens" rules={[{ validator: async (_, itens) => { if (!itens || itens.length < 1) return Promise.reject('Adicione pelo menos um item.'); } }]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 4 }}>
                      <Col span={7}>
                        <Form.Item name={[name, 'produtoId']} rules={[{ required: true, message: 'Selecione' }]} style={{ marginBottom: 0 }}>
                          <Select
                            placeholder="Produto"
                            showSearch
                            optionFilterProp="children"
                            onChange={(val) => {
                              const produto = produtos.find(p => p.id === val);
                              if (produto) {
                                const itensAtual = form.getFieldValue('itens');
                                itensAtual[name].precoUnitario = produto.precoVenda;
                                itensAtual[name].unidade = produto.unidade;
                                form.setFieldsValue({ itens: itensAtual });
                              }
                            }}
                          >
                            {produtos.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item name={[name, 'quantidade']} rules={[{ required: true, message: 'Qtd' }]} style={{ marginBottom: 0 }}>
                          <InputNumber min={1} placeholder="Qtd" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Form.Item name={[name, 'unidade']} style={{ marginBottom: 0 }}>
                          <Input placeholder="UN" maxLength={5} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item name={[name, 'precoUnitario']} style={{ marginBottom: 0 }}>
                          <InputNumber min={0} precision={2} placeholder="Preço Unit." prefix="R$" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item name={[name, 'descontoPct']} style={{ marginBottom: 0 }}>
                          <InputNumber min={0} max={100} precision={2} placeholder="Desc%" suffix="%" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item name={[name, 'desconto']} style={{ marginBottom: 0 }}>
                          <InputNumber min={0} precision={2} placeholder="Desc R$" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: 18 }} />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block style={{ marginTop: 8 }}>
                    Adicionar Item
                  </Button>
                </>
              )}
            </Form.List>
            <Divider />
            <Row justify="end" gutter={16}>
              <Col>
                <b>Subtotal: R$ {calcularTotal().toFixed(2)}</b>
              </Col>
            </Row>
          </>
        )
      },
      {
        key: 'totais',
        label: 'Totais e Desconto',
        children: (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="desconto" label="Desconto Geral (R$)">
                  <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="frete" label="Frete (R$)">
                  <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="outrasDespesas" label="Outras Despesas (R$)">
                  <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={8}><Card size="small"><Statistic title="Subtotal" value={calcularTotal()} precision={2} prefix="R$" /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="Desconto" value={form.getFieldValue('desconto') || 0} precision={2} prefix="R$" valueStyle={{ color: 'red' }} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="Total Líquido" value={calcularTotal() + (form.getFieldValue('frete') || 0) + (form.getFieldValue('outrasDespesas') || 0)} precision={2} prefix="R$" valueStyle={{ color: 'green' }} /></Card></Col>
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
              <Col span={8}>
                <Form.Item name="cfop" label="CFOP">
                  <Input placeholder="5102" maxLength={5} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="naturezaOperacao" label="Natureza da Operação">
                  <Input placeholder="Venda de mercadoria" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="finalidade" label="Finalidade">
                  <Select allowClear>
                    <Option value="Normal">Normal</Option>
                    <Option value="Complementar">Complementar</Option>
                    <Option value="Ajuste">Ajuste</Option>
                    <Option value="Devolução">Devolução</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="observacaoFiscal" label="Observação Fiscal">
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        )
      },
      {
        key: 'obs',
        label: 'Observações',
        children: (
          <Form.Item name="observacao" label="Observação">
            <Input.TextArea rows={4} />
          </Form.Item>
        )
      }
    ]} />
  </Form>
</Modal>
    </>
  );
};

export default Pedidos;
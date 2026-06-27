import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, InputNumber, message, Tag, Space, Divider, Card, Row, Col, Statistic, DatePicker, Tabs, Steps, Alert, Tooltip } from 'antd';
import { PlusOutlined, MinusCircleOutlined, PrinterOutlined, EditOutlined, CheckOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import { listarPedidos, criarPedido } from '../services/pedidosService';
import { listarPessoas } from '../services/pessoasService';
import { listarProdutos } from '../services/produtosService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const estagios = ['Orçamento', 'Pedido', 'Confirmado', 'Em Separação', 'Faturado', 'Entregue'];
const estagioIndex = { Orcamento: 0, Pedido: 1, Confirmado: 2, EmSeparacao: 3, Faturado: 4, Entregue: 5 };

const statusCor = {
  Orcamento: 'orange', Pedido: 'blue', Confirmado: 'green',
  EmSeparacao: 'cyan', Faturado: 'purple', Entregue: 'green', Cancelado: 'red'
};
const statusLabel = {
  Orcamento: 'Orçamento', Pedido: 'Pedido', Confirmado: 'Confirmado',
  EmSeparacao: 'Em Separação', Faturado: 'Faturado', Entregue: 'Entregue', Cancelado: 'Cancelado'
};

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState(null);
  const [filtroEstagio, setFiltroEstagio] = useState(null);
  const [itensPedido, setItensPedido] = useState([{
    produtoId: null, descricao: '', quantidade: 1, unidade: '',
    precoUnitario: 0, descontoPct: 0, desconto: 0,
    cfop: '', ncm: '', ipi: 0, subtotal: 0
  }]);
  const [form] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, pe, pr] = await Promise.all([listarPedidos(), listarPessoas(), listarProdutos()]);
      setPedidos(p);
      setPessoas(pe);
      setProdutos(pr);
      setTransportadoras(pe.filter(x => x.tipo === 'Transportadora'));
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroStatus && p.status !== filtroStatus) return false;
    if (filtroEstagio && p.status !== filtroEstagio) return false;
    if (filtroCliente && !p.pessoa?.nome?.toLowerCase().includes(filtroCliente.toLowerCase()) &&
        !p.pessoa?.razaoSocial?.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    if (filtroPeriodo) {
      const data = new Date(p.criadoEm);
      if (data < filtroPeriodo[0].toDate() || data > filtroPeriodo[1].toDate()) return false;
    }
    return true;
  });

  const calcularSubtotalItem = (item) => {
    const subtotal = (item.quantidade || 0) * (item.precoUnitario || 0);
    const desconto = item.descontoPct > 0 ? subtotal * (item.descontoPct / 100) : (item.desconto || 0);
    return subtotal - desconto;
  };

  const calcularTotalItens = () => itensPedido.reduce((acc, i) => acc + calcularSubtotalItem(i), 0);

  const atualizarItem = (index, campo, valor) => {
    const novos = [...itensPedido];
    novos[index][campo] = valor;
    if (campo === 'produtoId') {
      const produto = produtos.find(p => p.id === valor);
      if (produto) {
        novos[index].descricao = produto.nome;
        novos[index].precoUnitario = produto.precoVenda;
        novos[index].unidade = produto.unidade || 'UN';
        novos[index].cfop = produto.cfop || '';
        novos[index].ncm = produto.ncm || '';
      }
    }
    if (campo === 'descontoPct' && valor > 0) novos[index].desconto = 0;
    if (campo === 'desconto' && valor > 0) novos[index].descontoPct = 0;
    setItensPedido(novos);
  };

  const adicionarItem = () => setItensPedido([...itensPedido, {
    produtoId: null, descricao: '', quantidade: 1, unidade: '',
    precoUnitario: 0, descontoPct: 0, desconto: 0, cfop: '', ncm: '', ipi: 0
  }]);

  const removerItem = (index) => setItensPedido(itensPedido.filter((_, i) => i !== index));

  const abrirModal = (pedido = null) => {
    setPedidoEditando(pedido);
    if (pedido) {
      form.setFieldsValue({
        ...pedido,
        dataEntregaPrevista: pedido.dataEntregaPrevista ? dayjs(pedido.dataEntregaPrevista) : null,
      });
      setItensPedido(pedido.itens?.length > 0 ? pedido.itens.map(i => ({
        produtoId: i.produtoId,
        descricao: i.produto?.nome || '',
        quantidade: i.quantidade,
        unidade: i.unidade || '',
        precoUnitario: i.precoUnitario,
        descontoPct: i.descontoPct || 0,
        desconto: i.desconto || 0,
        cfop: i.cfop || '',
        ncm: i.ncm || '',
        ipi: i.ipi || 0,
      })) : [{ produtoId: null, descricao: '', quantidade: 1, unidade: '', precoUnitario: 0, descontoPct: 0, desconto: 0, cfop: '', ncm: '', ipi: 0 }]);
    } else {
      form.resetFields();
      setItensPedido([{ produtoId: null, descricao: '', quantidade: 1, unidade: '', precoUnitario: 0, descontoPct: 0, desconto: 0, cfop: '', ncm: '', ipi: 0 }]);
    }
    setModalAberto(true);
  };

  const salvar = async (values) => {
    try {
      const dados = {
        ...values,
        desconto: values.desconto || 0,
        itens: itensPedido.filter(i => i.produtoId),
        dataEntregaPrevista: values.dataEntregaPrevista ? values.dataEntregaPrevista.toISOString() : null,
      };
      await criarPedido(dados);
      message.success(pedidoEditando ? 'Pedido atualizado!' : 'Pedido criado!');
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao salvar pedido.');
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
    doc.text(`Cliente: ${pedido.pessoa?.nome || pedido.pessoa?.razaoSocial || ''}`, 14, 32);
    doc.text(`Data: ${new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}`, 14, 40);
    if (pedido.formaPagamento) doc.text(`Forma de Pagamento: ${pedido.formaPagamento}`, 14, 48);
    if (pedido.condicaoPagamento) doc.text(`Condição: ${pedido.condicaoPagamento}`, 14, 56);
    autoTable(doc, {
      startY: 65,
      head: [['Produto', 'Qtd', 'UN', 'Preço Unit.', 'Desc%', 'Subtotal']],
      body: pedido.itens?.map(i => [
        i.produto?.nome || i.descricao || '',
        i.quantidade,
        i.unidade || '-',
        `R$ ${i.precoUnitario?.toFixed(2)}`,
        `${i.descontoPct || 0}%`,
        `R$ ${((i.quantidade * i.precoUnitario) * (1 - (i.descontoPct || 0) / 100)).toFixed(2)}`
      ]) || [],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 119, 255] },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: R$ ${pedido.valorTotal?.toFixed(2)}`, 14, finalY);
    if (pedido.observacao) doc.text(`Obs: ${pedido.observacao}`, 14, finalY + 8);
    doc.save(`pedido_${pedido.id}.pdf`);
  };

  const colunas = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Cliente', key: 'cliente', render: (_, r) => r.pessoa?.razaoSocial || r.pessoa?.nome || '-' },
    { title: 'Estágio', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusCor[s]}>{statusLabel[s] || s}</Tag> },
    { title: 'Forma Pgto', dataIndex: 'formaPagamento', key: 'formaPagamento' },
    { title: 'Cond. Pgto', dataIndex: 'condicaoPagamento', key: 'condicaoPagamento' },
    { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: (v) => `R$ ${v?.toFixed(2)}` },
    { title: 'Emissão', dataIndex: 'criadoEm', key: 'criadoEm', render: (d) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Prev. Entrega', dataIndex: 'dataEntregaPrevista', key: 'dataEntregaPrevista', render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Tooltip title="Detalhes">
            <Button size="small" icon={<FileTextOutlined />} onClick={() => setPedidoDetalhe(record)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button size="small" icon={<EditOutlined />} onClick={() => abrirModal(record)} disabled={record.status === 'Cancelado' || record.status === 'Entregue'} />
          </Tooltip>
          <Tooltip title="Imprimir">
            <Button size="small" icon={<PrinterOutlined />} onClick={() => imprimirPDF(record)} />
          </Tooltip>
          {record.status !== 'Cancelado' && record.status !== 'Entregue' && record.status !== 'Faturado' && (
            <Tooltip title="Avançar estágio">
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => avancar(record.id)} />
            </Tooltip>
          )}
          {record.status !== 'Cancelado' && record.status !== 'Entregue' && record.status !== 'Faturado' && (
            <Tooltip title="Cancelar">
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => cancelar(record.id)} />
            </Tooltip>
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
            <Col span={5}>
              <Select placeholder="Estágio" style={{ width: '100%' }} allowClear onChange={setFiltroEstagio}>
                {Object.keys(statusLabel).map(k => <Option key={k} value={k}>{statusLabel[k]}</Option>)}
              </Select>
            </Col>
            <Col span={9}>
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" onChange={setFiltroPeriodo} />
            </Col>
            <Col span={4}>
              <Button onClick={() => { setFiltroStatus(null); setFiltroCliente(''); setFiltroPeriodo(null); setFiltroEstagio(null); }} block>Limpar</Button>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}><Card size="small"><Statistic title="Total" value={pedidosFiltrados.length} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="Orçamentos" value={pedidosFiltrados.filter(p => p.status === 'Orcamento').length} valueStyle={{ color: 'orange' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="Confirmados" value={pedidosFiltrados.filter(p => p.status === 'Confirmado').length} valueStyle={{ color: 'green' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="Faturados" value={pedidosFiltrados.filter(p => p.status === 'Faturado').length} valueStyle={{ color: 'purple' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="Cancelados" value={pedidosFiltrados.filter(p => p.status === 'Cancelado').length} valueStyle={{ color: 'red' }} /></Card></Col>
            <Col span={4}><Card size="small"><Statistic title="Valor Total" value={pedidosFiltrados.reduce((acc, p) => acc + (p.valorTotal || 0), 0)} precision={2} prefix="R$" /></Card></Col>
          </Row>
          <Table dataSource={pedidosFiltrados} columns={colunas} rowKey="id" loading={loading} scroll={{ x: 1200 }} />
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
            { title: 'Cliente', key: 'cliente', render: (_, r) => r.pessoa?.razaoSocial || r.pessoa?.nome || '-' },
            { title: 'Estágio', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{statusLabel[s]}</Tag> },
            { title: 'Forma Pgto', dataIndex: 'formaPagamento', key: 'formaPagamento' },
            { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
            { title: 'Emissão', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
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
          <Col span={6}><Card size="small"><Statistic title="Faturados" value={pedidos.filter(p => p.status === 'Faturado').length} valueStyle={{ color: 'purple' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Cancelados" value={pedidos.filter(p => p.status === 'Cancelado').length} valueStyle={{ color: 'red' }} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="Valor Total" value={pedidos.reduce((acc, p) => acc + (p.valorTotal || 0), 0)} precision={2} prefix="R$" /></Card></Col>
          <Col span={24} style={{ marginTop: 16 }}>
            <Card title="Pedidos por Estágio" size="small">
              <Table
                dataSource={Object.keys(statusLabel).map(s => ({
                  status: s,
                  total: pedidos.filter(p => p.status === s).length,
                  valor: pedidos.filter(p => p.status === s).reduce((acc, p) => acc + (p.valorTotal || 0), 0)
                }))}
                rowKey="status"
                size="small"
                pagination={false}
                columns={[
                  { title: 'Estágio', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCor[s]}>{statusLabel[s]}</Tag> },
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Novo Pedido
        </Button>
      </div>

      <Tabs items={tabItems} />

      {/* Modal Detalhe */}
      <Modal
        title={`${statusLabel[pedidoDetalhe?.status] || ''} #${pedidoDetalhe?.id}`}
        open={!!pedidoDetalhe}
        onCancel={() => setPedidoDetalhe(null)}
        footer={[
          <Button key="pdf" icon={<PrinterOutlined />} onClick={() => imprimirPDF(pedidoDetalhe)}>PDF</Button>,
          <Button key="editar" icon={<EditOutlined />} onClick={() => { setPedidoDetalhe(null); abrirModal(pedidoDetalhe); }}>Editar</Button>,
          pedidoDetalhe?.status !== 'Cancelado' && pedidoDetalhe?.status !== 'Entregue' && pedidoDetalhe?.status !== 'Faturado' ? (
            <Button key="avancar" type="primary" onClick={() => { avancar(pedidoDetalhe.id); setPedidoDetalhe(null); }}>
              Avançar Estágio
            </Button>
          ) : null,
          <Button key="fechar" onClick={() => setPedidoDetalhe(null)}>Fechar</Button>
        ]}
        width={800}
      >
        {pedidoDetalhe && (
          <>
            <Steps
              size="small"
              current={estagioIndex[pedidoDetalhe.status] ?? 0}
              style={{ marginBottom: 16 }}
              items={estagios.map(e => ({ title: e }))}
            />
            {pedidoDetalhe.status === 'Cancelado' && <Alert message="Pedido Cancelado" type="error" style={{ marginBottom: 16 }} />}
            <Tabs items={[
              {
                key: 'geral',
                label: 'Geral',
                children: (
                  <Row gutter={16}>
                    <Col span={12}><b>Cliente:</b> {pedidoDetalhe.pessoa?.razaoSocial || pedidoDetalhe.pessoa?.nome}</Col>
                    <Col span={12}><b>Representante:</b> {pedidoDetalhe.representante?.nome || '-'}</Col>
                    <Col span={12} style={{ marginTop: 8 }}><b>Forma de Pagamento:</b> {pedidoDetalhe.formaPagamento || '-'}</Col>
                    <Col span={12} style={{ marginTop: 8 }}><b>Condição:</b> {pedidoDetalhe.condicaoPagamento || '-'}</Col>
                    <Col span={12} style={{ marginTop: 8 }}><b>Transportadora:</b> {pedidoDetalhe.transportadora?.razaoSocial || '-'}</Col>
                    <Col span={12} style={{ marginTop: 8 }}><b>Prev. Entrega:</b> {pedidoDetalhe.dataEntregaPrevista ? dayjs(pedidoDetalhe.dataEntregaPrevista).format('DD/MM/YYYY') : '-'}</Col>
                    <Col span={12} style={{ marginTop: 8 }}><b>CFOP:</b> {pedidoDetalhe.cfop || '-'}</Col>
                    <Col span={12} style={{ marginTop: 8 }}><b>Natureza Operação:</b> {pedidoDetalhe.naturezaOperacao || '-'}</Col>
                  </Row>
                )
              },
              {
                key: 'itens',
                label: 'Itens',
                children: (
                  <>
                    <Table
                      dataSource={pedidoDetalhe.itens}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={[
                        { title: 'Produto', key: 'produto', render: (_, r) => r.produto?.nome || r.descricao || '-' },
                        { title: 'Qtd', dataIndex: 'quantidade' },
                        { title: 'UN', dataIndex: 'unidade', render: v => v || '-' },
                        { title: 'Preço Unit.', dataIndex: 'precoUnitario', render: (v) => `R$ ${v?.toFixed(2)}` },
                        { title: 'Desc%', dataIndex: 'descontoPct', render: v => v ? `${v}%` : '-' },
                        { title: 'CFOP', dataIndex: 'cfop', render: v => v || '-' },
                        { title: 'Subtotal', render: (_, r) => `R$ ${((r.quantidade * r.precoUnitario) * (1 - (r.descontoPct || 0) / 100)).toFixed(2)}` },
                      ]}
                    />
                    <Divider />
                    <Row justify="end">
                      <Col>
                        <Statistic title="Total Bruto" value={pedidoDetalhe.valorTotal} prefix="R$" precision={2} />
                        {pedidoDetalhe.desconto > 0 && <Statistic title="Desconto" value={pedidoDetalhe.desconto} prefix="- R$" precision={2} valueStyle={{ color: '#cf1322' }} />}
                        {pedidoDetalhe.frete > 0 && <Statistic title="Frete" value={pedidoDetalhe.frete} prefix="R$" precision={2} />}
                        <Statistic title="Total Líquido" value={(pedidoDetalhe.valorTotal - (pedidoDetalhe.desconto || 0) + (pedidoDetalhe.frete || 0))} prefix="R$" precision={2} valueStyle={{ color: '#3f8600' }} />
                      </Col>
                    </Row>
                  </>
                )
              },
              {
                key: 'obs',
                label: 'Observações',
                children: (
                  <>
                    {pedidoDetalhe.observacao && <><b>Observação:</b><p>{pedidoDetalhe.observacao}</p></>}
                    {pedidoDetalhe.observacaoFiscal && <><b>Observação Fiscal:</b><p>{pedidoDetalhe.observacaoFiscal}</p></>}
                    {!pedidoDetalhe.observacao && !pedidoDetalhe.observacaoFiscal && <p>Nenhuma observação.</p>}
                  </>
                )
              }
            ]} />
          </>
        )}
      </Modal>

      {/* Modal Novo/Editar Pedido */}
      <Modal
        title={pedidoEditando ? `Editar Pedido #${pedidoEditando.id}` : 'Novo Pedido'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Tabs items={[
            {
              key: 'geral',
              label: 'Geral',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={10}>
                      <Form.Item name="pessoaId" label="Cliente" rules={[{ required: true }]}>
                        <Select placeholder="Selecione o cliente" showSearch optionFilterProp="children">
                          {pessoas.filter(p => p.tipo === 'Cliente' || !p.tipo).map(p => <Option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item name="representanteId" label="Representante">
                        <Select placeholder="Selecione" allowClear showSearch optionFilterProp="children">
                          {pessoas.filter(p => p.tipo === 'Representante').map(p => <Option key={p.id} value={p.id}>{p.nome || p.razaoSocial}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item name="tipoPedido" label="Tipo de Pedido">
                        <Select placeholder="Selecione" allowClear>
                          <Option value="Venda">Venda</Option>
                          <Option value="Bonificacao">Bonificação</Option>
                          <Option value="Remessa">Remessa</Option>
                          <Option value="Devolucao">Devolução</Option>
                          <Option value="Consignacao">Consignação</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={7}>
                      <Form.Item name="formaPagamento" label="Forma de Pagamento">
                        <Select placeholder="Selecione" allowClear>
                          <Option value="Dinheiro">Dinheiro</Option>
                          <Option value="Cartão de Crédito">Cartão de Crédito</Option>
                          <Option value="Cartão de Débito">Cartão de Débito</Option>
                          <Option value="Pix">Pix</Option>
                          <Option value="Boleto">Boleto</Option>
                          <Option value="Transferência">Transferência</Option>
                          <Option value="Cheque">Cheque</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item name="condicaoPagamento" label="Condição de Pagamento">
                        <Select placeholder="Selecione" allowClear>
                          <Option value="À Vista">À Vista</Option>
                          <Option value="7 dias">7 dias</Option>
                          <Option value="14 dias">14 dias</Option>
                          <Option value="21 dias">21 dias</Option>
                          <Option value="28 dias">28 dias</Option>
                          <Option value="30 dias">30 dias</Option>
                          <Option value="30/60 dias">30/60 dias</Option>
                          <Option value="30/60/90 dias">30/60/90 dias</Option>
                          <Option value="60/90/120 dias">60/90/120 dias</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name="dataEntregaPrevista" label="Prev. Entrega">
                        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name="tabelaPreco" label="Tabela de Preço">
                        <Input placeholder="Padrão" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={10}>
                      <Form.Item name="transportadoraId" label="Transportadora">
                        <Select placeholder="Selecione" allowClear showSearch optionFilterProp="children">
                          {transportadoras.map(t => <Option key={t.id} value={t.id}>{t.razaoSocial || t.nome}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name="frete" label="Frete (R$)">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name="outrasDespesas" label="Outras Despesas (R$)">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="filial" label="Filial">
                        <Input placeholder="001" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="referencia" label="Referência Externa">
                        <Input placeholder="Nº pedido do cliente" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="deposito" label="Depósito">
                        <Input placeholder="Depósito padrão" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="comissaoPct" label="Comissão (%)">
                        <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
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
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                          <th style={{ padding: '8px 4px', textAlign: 'left', width: '20%' }}>Produto</th>
                          <th style={{ padding: '8px 4px', width: '8%' }}>Qtd</th>
                          <th style={{ padding: '8px 4px', width: '5%' }}>UN</th>
                          <th style={{ padding: '8px 4px', width: '10%' }}>Preço Unit.</th>
                          <th style={{ padding: '8px 4px', width: '7%' }}>Desc%</th>
                          <th style={{ padding: '8px 4px', width: '9%' }}>Desc R$</th>
                          <th style={{ padding: '8px 4px', width: '7%' }}>CFOP</th>
                          <th style={{ padding: '8px 4px', width: '8%' }}>NCM</th>
                          <th style={{ padding: '8px 4px', width: '6%' }}>IPI%</th>
                          <th style={{ padding: '8px 4px', width: '10%' }}>Subtotal</th>
                          <th style={{ padding: '8px 4px', width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensPedido.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '4px' }}>
                              <Select
                                style={{ width: '100%' }}
                                placeholder="Produto"
                                showSearch
                                optionFilterProp="children"
                                value={item.produtoId}
                                onChange={v => atualizarItem(index, 'produtoId', v)}
                                size="small"
                              >
                                {produtos.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
                              </Select>
                            </td>
                            <td style={{ padding: '4px' }}>
                              <InputNumber size="small" min={1} value={item.quantidade} onChange={v => atualizarItem(index, 'quantidade', v)} style={{ width: '100%' }} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <Input size="small" value={item.unidade} onChange={e => atualizarItem(index, 'unidade', e.target.value)} maxLength={5} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <InputNumber size="small" min={0} precision={2} value={item.precoUnitario} onChange={v => atualizarItem(index, 'precoUnitario', v)} style={{ width: '100%' }} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <InputNumber size="small" min={0} max={100} precision={2} value={item.descontoPct} onChange={v => atualizarItem(index, 'descontoPct', v)} style={{ width: '100%' }} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <InputNumber size="small" min={0} precision={2} value={item.desconto} onChange={v => atualizarItem(index, 'desconto', v)} style={{ width: '100%' }} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <Input size="small" value={item.cfop} onChange={e => atualizarItem(index, 'cfop', e.target.value)} maxLength={5} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <Input size="small" value={item.ncm} onChange={e => atualizarItem(index, 'ncm', e.target.value)} maxLength={10} />
                            </td>
                            <td style={{ padding: '4px' }}>
                              <InputNumber size="small" min={0} max={100} precision={2} value={item.ipi} onChange={v => atualizarItem(index, 'ipi', v)} style={{ width: '100%' }} />
                            </td>
                            <td style={{ padding: '4px', fontWeight: 'bold' }}>
                              R$ {calcularSubtotalItem(item).toFixed(2)}
                            </td>
                            <td style={{ padding: '4px' }}>
                              <MinusCircleOutlined onClick={() => removerItem(index)} style={{ color: 'red', fontSize: 16, cursor: 'pointer' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button type="dashed" onClick={adicionarItem} icon={<PlusOutlined />} block style={{ marginTop: 8 }}>
                    Adicionar Item
                  </Button>
                  <Divider />
                  <Row justify="end">
                    <Col>
                      <b style={{ fontSize: 16 }}>Total: R$ {calcularTotalItens().toFixed(2)}</b>
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: 'totais',
              label: 'Totais',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="desconto" label="Desconto Geral (R$)">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="descontoPct" label="Desconto Geral (%)">
                        <InputNumber min={0} max={100} precision={2} suffix="%" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="acrescimo" label="Acréscimo (R$)">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
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
                    <Col span={8}>
                      <Form.Item name="brinde" label="Brinde (R$)">
                        <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Divider />
                  <Row gutter={16}>
                    <Col span={6}><Card size="small"><Statistic title="Total Produtos" value={calcularTotalItens()} precision={2} prefix="R$" /></Card></Col>
                    <Col span={6}><Card size="small"><Statistic title="Desconto" value={form.getFieldValue('desconto') || 0} precision={2} prefix="R$" valueStyle={{ color: 'red' }} /></Card></Col>
                    <Col span={6}><Card size="small"><Statistic title="Frete" value={form.getFieldValue('frete') || 0} precision={2} prefix="R$" /></Card></Col>
                    <Col span={6}><Card size="small"><Statistic title="Total Líquido" value={calcularTotalItens() - (form.getFieldValue('desconto') || 0) + (form.getFieldValue('frete') || 0) + (form.getFieldValue('outrasDespesas') || 0)} precision={2} prefix="R$" valueStyle={{ color: 'green' }} /></Card></Col>
                  </Row>
                </>
              )
            },
            {
              key: 'entrega',
              label: 'Endereço de Entrega',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item name="entregaCep" label="CEP">
                        <Input placeholder="00000-000" maxLength={9} />
                      </Form.Item>
                    </Col>
                    <Col span={14}>
                      <Form.Item name="entregaEndereco" label="Logradouro">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="entregaNumero" label="Número">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="entregaComplemento" label="Complemento">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="entregaBairro" label="Bairro">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="entregaCidade" label="Cidade">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item name="entregaEstado" label="UF">
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
                    <Col span={6}>
                      <Form.Item name="cfop" label="CFOP">
                        <Input placeholder="5102" maxLength={5} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="naturezaOperacao" label="Natureza da Operação">
                        <Input placeholder="Venda de mercadoria" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
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
                  <Form.Item name="observacaoFiscal" label="Observação Fiscal / Rodapé NF">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </>
              )
            },
            {
              key: 'obs',
              label: 'Observações',
              children: (
                <>
                  <Form.Item name="observacao" label="Observação do Pedido">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Form.Item name="observacaoInterna" label="Observação Interna (não imprime)">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </>
              )
            }
          ]} />
        </Form>
      </Modal>
    </>
  );
};

export default Pedidos;
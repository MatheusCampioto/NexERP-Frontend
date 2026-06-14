import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag, Space, Row, Col, DatePicker, Tabs, Popconfirm, Divider, Alert } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import {
  listarSolicitacoes, criarSolicitacao, aprovarSolicitacao, reprovarSolicitacao, cancelarSolicitacao,
  listarOrdensCompra, criarOrdemCompra, cancelarOrdemCompra, atualizarStatusOrdem,
  listarNotasFiscais, criarNotaFiscal, darEntradaEstoque,
  listarCondicoesPagamento, criarCondicaoPagamento, desativarCondicaoPagamento
} from '../services/comprasService';
import { listarPessoas } from '../services/pessoasService';
import { listarProdutos } from '../services/produtosService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const statusCorSolicitacao = { Pendente: 'blue', Aprovada: 'green', Reprovada: 'red', Cancelada: 'default' };
const statusCorOrdem = { Aberta: 'blue', Enviada: 'orange', Recebida: 'green', Cancelada: 'default' };

const Compras = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [notas, setNotas] = useState([]);
  const [condicoes, setCondicoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalSolicitacao, setModalSolicitacao] = useState(false);
  const [modalOrdem, setModalOrdem] = useState(false);
  const [modalNF, setModalNF] = useState(false);
  const [modalCondicao, setModalCondicao] = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [modalReprovar, setModalReprovar] = useState(false);
  const [modalLancamento, setModalLancamento] = useState(false);

  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [nfParaLancamento, setNfParaLancamento] = useState(null);

  const [itensSolicitacao, setItensSolicitacao] = useState([{ produtoId: null, descricao: '', quantidade: 1, unidade: '', observacao: '' }]);
  const [itensOrdem, setItensOrdem] = useState([{ produtoId: null, descricao: '', quantidade: 1, valorUnitario: 0 }]);
  const [itensNF, setItensNF] = useState([{ produtoId: null, descricao: '', quantidade: 1, valorUnitario: 0 }]);

  const [formSolicitacao] = Form.useForm();
  const [formOrdem] = Form.useForm();
  const [formNF] = Form.useForm();
  const [formCondicao] = Form.useForm();
  const [formReprovar] = Form.useForm();
  const [formLancamento] = Form.useForm();

  const carregar = async () => {
    setLoading(true);
    try {
      const [s, o, n, c, p, pr] = await Promise.all([
        listarSolicitacoes(), listarOrdensCompra(), listarNotasFiscais(),
        listarCondicoesPagamento(), listarPessoas(), listarProdutos()
      ]);
      setSolicitacoes(s);
      setOrdens(o);
      setNotas(n);
      setCondicoes(c);
      setPessoas(p.filter(p => p.tipo === 'Fornecedor'));
      setProdutos(pr);
    } catch {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // Solicitação
  const salvarSolicitacao = async (values) => {
    try {
      await criarSolicitacao({
        observacao: values.observacao,
        itens: itensSolicitacao.filter(i => i.descricao),
      });
      message.success('Solicitação criada!');
      setModalSolicitacao(false);
      formSolicitacao.resetFields();
      setItensSolicitacao([{ produtoId: null, descricao: '', quantidade: 1, unidade: '', observacao: '' }]);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao criar solicitação.');
    }
  };

  const aprovar = async (id) => {
    try {
      await aprovarSolicitacao(id);
      message.success('Solicitação aprovada!');
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao aprovar.');
    }
  };

  const reprovar = async (values) => {
    try {
      await reprovarSolicitacao(itemSelecionado.id, values.motivo);
      message.success('Solicitação reprovada.');
      setModalReprovar(false);
      formReprovar.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao reprovar.');
    }
  };

  // Ordem de Compra
  const salvarOrdem = async (values) => {
    try {
      await criarOrdemCompra({
        fornecedorId: values.fornecedorId,
        solicitacaoCompraId: values.solicitacaoCompraId || null,
        condicaoPagamentoId: values.condicaoPagamentoId || null,
        dataPrevista: values.dataPrevista ? values.dataPrevista.toISOString() : null,
        observacao: values.observacao,
        itens: itensOrdem.filter(i => i.descricao),
      });
      message.success('Ordem de compra criada!');
      setModalOrdem(false);
      formOrdem.resetFields();
      setItensOrdem([{ produtoId: null, descricao: '', quantidade: 1, valorUnitario: 0 }]);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao criar ordem.');
    }
  };

  // NF Entrada
  const salvarNF = async (values) => {
    try {
      await criarNotaFiscal({
        ordemCompraId: values.ordemCompraId,
        numeroNF: values.numeroNF,
        serie: values.serie,
        chaveAcesso: values.chaveAcesso,
        dataEmissao: values.dataEmissao.toISOString(),
        valorProdutos: values.valorProdutos,
        valorFrete: values.valorFrete || 0,
        valorImpostos: values.valorImpostos || 0,
        observacao: values.observacao,
        itens: itensNF.filter(i => i.descricao),
      });
      message.success('NF de entrada registrada!');
      setModalNF(false);
      formNF.resetFields();
      setItensNF([{ produtoId: null, descricao: '', quantidade: 1, valorUnitario: 0 }]);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao registrar NF.');
    }
  };

  const entradaEstoque = async (nf) => {
    try {
      await darEntradaEstoque(nf.id);
      message.success('Estoque atualizado!');
      setNfParaLancamento(nf);
      setModalLancamento(true);
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao dar entrada no estoque.');
    }
  };

  const salvarCondicao = async (values) => {
    try {
      await criarCondicaoPagamento(values);
      message.success('Condição criada!');
      setModalCondicao(false);
      formCondicao.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar condição.');
    }
  };

  const atualizarItem = (lista, setLista, index, campo, valor) => {
    const novos = [...lista];
    novos[index][campo] = valor;
    if (campo === 'produtoId' && valor) {
      const produto = produtos.find(p => p.id === valor);
      if (produto) novos[index].descricao = produto.nome;
    }
    setLista(novos);
  };

  const renderItens = (itens, setItens, comValor = false) => (
    <>
      {itens.map((item, index) => (
        <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
          <Col span={6}>
            <Select
              placeholder="Produto (opcional)"
              allowClear
              style={{ width: '100%' }}
              onChange={v => atualizarItem(itens, setItens, index, 'produtoId', v)}
              showSearch
              optionFilterProp="children"
            >
              {produtos.map(p => <Option key={p.id} value={p.id}>{p.nome}</Option>)}
            </Select>
          </Col>
          <Col span={comValor ? 7 : 10}>
            <Input
              placeholder="Descrição *"
              value={item.descricao}
              onChange={e => atualizarItem(itens, setItens, index, 'descricao', e.target.value)}
            />
          </Col>
          <Col span={3}>
            <InputNumber
              placeholder="Qtd"
              min={0}
              precision={2}
              value={item.quantidade}
              onChange={v => atualizarItem(itens, setItens, index, 'quantidade', v)}
              style={{ width: '100%' }}
            />
          </Col>
          {comValor && (
            <Col span={5}>
              <InputNumber
                placeholder="Valor Unit."
                min={0}
                precision={2}
                prefix="R$"
                value={item.valorUnitario}
                onChange={v => atualizarItem(itens, setItens, index, 'valorUnitario', v)}
                style={{ width: '100%' }}
              />
            </Col>
          )}
          <Col span={3}>
            <Button danger onClick={() => setItens(itens.filter((_, i) => i !== index))} disabled={itens.length === 1}>X</Button>
          </Col>
        </Row>
      ))}
      <Button type="dashed" block onClick={() => setItens([...itens, { produtoId: null, descricao: '', quantidade: 1, valorUnitario: 0 }])}>
        + Adicionar Item
      </Button>
    </>
  );

  const colunasSolicitacao = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Solicitante', key: 'usuario', render: (_, r) => r.usuario?.nome },
    { title: 'Itens', key: 'itens', render: (_, r) => `${r.itens?.length || 0} item(s)` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCorSolicitacao[s]}>{s}</Tag> },
    { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Ações', key: 'acoes',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setItemSelecionado(r); setModalDetalhe(true); }}>Ver</Button>
          {r.status === 'Pendente' && <>
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => aprovar(r.id)}>Aprovar</Button>
            <Button size="small" danger onClick={() => { setItemSelecionado(r); setModalReprovar(true); }}>Reprovar</Button>
          </>}
          {r.status !== 'Aprovada' && r.status !== 'Cancelada' && (
            <Popconfirm title="Cancelar?" onConfirm={() => cancelarSolicitacao(r.id).then(carregar)} okText="Sim" cancelText="Não">
              <Button size="small" icon={<CloseOutlined />}>Cancelar</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const colunasOrdem = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Fornecedor', key: 'fornecedor', render: (_, r) => r.fornecedor?.razaoSocial || r.fornecedor?.nome },
    { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color={statusCorOrdem[s]}>{s}</Tag> },
    { title: 'Prev. Entrega', dataIndex: 'dataPrevista', key: 'dataPrevista', render: d => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setItemSelecionado(r); setModalDetalhe(true); }}>Ver</Button>
          {r.status === 'Aberta' && (
            <Button size="small" onClick={() => atualizarStatusOrdem(r.id, 'Enviada').then(carregar)}>Marcar Enviada</Button>
          )}
          {r.status !== 'Recebida' && r.status !== 'Cancelada' && (
            <Popconfirm title="Cancelar?" onConfirm={() => cancelarOrdemCompra(r.id).then(carregar)} okText="Sim" cancelText="Não">
              <Button size="small" danger icon={<CloseOutlined />}>Cancelar</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const colunasNF = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'NF', dataIndex: 'numeroNF', key: 'numeroNF' },
    { title: 'Fornecedor', key: 'fornecedor', render: (_, r) => r.ordemCompra?.fornecedor?.razaoSocial || r.ordemCompra?.fornecedor?.nome },
    { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
    { title: 'Data Emissão', dataIndex: 'dataEmissao', key: 'dataEmissao', render: d => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Estoque', dataIndex: 'estoqueAtualizado', key: 'estoqueAtualizado',
      render: v => <Tag color={v ? 'green' : 'orange'}>{v ? 'Atualizado' : 'Pendente'}</Tag>
    },
    {
      title: 'Ações', key: 'acoes',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setItemSelecionado(r); setModalDetalhe(true); }}>Ver</Button>
          {!r.estoqueAtualizado && (
            <Popconfirm title="Dar entrada no estoque?" onConfirm={() => entradaEstoque(r)} okText="Sim" cancelText="Não">
              <Button size="small" type="primary">Entrada Estoque</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const colunasCondicao = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Parcelas', dataIndex: 'numeroParcelas', key: 'numeroParcelas' },
    { title: 'Dias entre parcelas', dataIndex: 'diasEntreParcelas', key: 'diasEntreParcelas' },
    { title: '1º Pagamento (dias)', dataIndex: 'primeiroPagamentoDias', key: 'primeiroPagamentoDias' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, r) => (
        <Popconfirm title="Desativar?" onConfirm={() => desativarCondicaoPagamento(r.id).then(carregar)} okText="Sim" cancelText="Não">
          <Button size="small" danger>Desativar</Button>
        </Popconfirm>
      )
    }
  ];

  const tabItems = [
    {
      key: 'solicitacoes',
      label: 'Solicitações de Compra',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalSolicitacao(true)}>
              Nova Solicitação
            </Button>
          </div>
          <Table dataSource={solicitacoes} columns={colunasSolicitacao} rowKey="id" loading={loading} />
        </>
      )
    },
    {
      key: 'ordens',
      label: 'Ordens de Compra',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOrdem(true)}>
              Nova Ordem de Compra
            </Button>
          </div>
          <Table dataSource={ordens} columns={colunasOrdem} rowKey="id" loading={loading} />
        </>
      )
    },
    {
      key: 'notas',
      label: 'NF de Entrada',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalNF(true)}>
              Registrar NF
            </Button>
          </div>
          <Table dataSource={notas} columns={colunasNF} rowKey="id" loading={loading} />
        </>
      )
    },
    {
      key: 'condicoes',
      label: 'Condições de Pagamento',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalCondicao(true)}>
              Nova Condição
            </Button>
          </div>
          <Table dataSource={condicoes} columns={colunasCondicao} rowKey="id" loading={loading} />
        </>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Compras</h2>
      </div>

      <Tabs items={tabItems} />

      {/* Modal Solicitação */}
      <Modal title="Nova Solicitação de Compra" open={modalSolicitacao}
        onCancel={() => { setModalSolicitacao(false); formSolicitacao.resetFields(); }}
        onOk={() => formSolicitacao.submit()} okText="Salvar" cancelText="Cancelar" width={750}>
        <Form form={formSolicitacao} layout="vertical" onFinish={salvarSolicitacao}>
          <Divider>Itens Solicitados</Divider>
          {renderItens(itensSolicitacao, setItensSolicitacao, false)}
          <Form.Item name="observacao" label="Observação" style={{ marginTop: 16 }}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Ordem de Compra */}
      <Modal title="Nova Ordem de Compra" open={modalOrdem}
        onCancel={() => { setModalOrdem(false); formOrdem.resetFields(); }}
        onOk={() => formOrdem.submit()} okText="Salvar" cancelText="Cancelar" width={750}>
        <Form form={formOrdem} layout="vertical" onFinish={salvarOrdem}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fornecedorId" label="Fornecedor" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children" placeholder="Selecione">
                  {pessoas.map(p => <Option key={p.id} value={p.id}>{p.razaoSocial || p.nome}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="condicaoPagamentoId" label="Condição de Pagamento">
                <Select allowClear placeholder="Selecione">
                  {condicoes.map(c => <Option key={c.id} value={c.id}>{c.nome}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="solicitacaoCompraId" label="Solicitação de Compra (opcional)">
                <Select allowClear placeholder="Vincular solicitação">
                  {solicitacoes.filter(s => s.status === 'Aprovada').map(s =>
                    <Option key={s.id} value={s.id}>SC #{s.id} — {s.usuario?.nome}</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dataPrevista" label="Previsão de Entrega">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Itens</Divider>
          {renderItens(itensOrdem, setItensOrdem, true)}
          <Form.Item name="observacao" label="Observação" style={{ marginTop: 16 }}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal NF Entrada */}
      <Modal title="Registrar NF de Entrada" open={modalNF}
        onCancel={() => { setModalNF(false); formNF.resetFields(); }}
        onOk={() => formNF.submit()} okText="Salvar" cancelText="Cancelar" width={750}>
        <Form form={formNF} layout="vertical" onFinish={salvarNF}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ordemCompraId" label="Ordem de Compra" rules={[{ required: true }]}>
                <Select placeholder="Selecione">
                  {ordens.filter(o => o.status !== 'Cancelada' && o.status !== 'Recebida').map(o =>
                    <Option key={o.id} value={o.id}>OC #{o.id} — {o.fornecedor?.razaoSocial || o.fornecedor?.nome}</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="numeroNF" label="Número NF" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="serie" label="Série">
                <Input maxLength={5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="chaveAcesso" label="Chave de Acesso">
                <Input maxLength={44} placeholder="44 dígitos" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dataEmissao" label="Data de Emissão" rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="valorProdutos" label="Valor Produtos" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="valorFrete" label="Frete">
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="valorImpostos" label="Impostos">
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Itens da NF</Divider>
          {renderItens(itensNF, setItensNF, true)}
          <Form.Item name="observacao" label="Observação" style={{ marginTop: 16 }}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Condição de Pagamento */}
      <Modal title="Nova Condição de Pagamento" open={modalCondicao}
        onCancel={() => { setModalCondicao(false); formCondicao.resetFields(); }}
        onOk={() => formCondicao.submit()} okText="Salvar" cancelText="Cancelar">
        <Form form={formCondicao} layout="vertical" onFinish={salvarCondicao}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Ex: 30/60/90, À Vista, 2x sem juros" />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="numeroParcelas" label="Nº de Parcelas" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="diasEntreParcelas" label="Dias entre parcelas" initialValue={30}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="primeiroPagamentoDias" label="1º pagamento (dias)" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Reprovar */}
      <Modal title="Reprovar Solicitação" open={modalReprovar}
        onCancel={() => { setModalReprovar(false); formReprovar.resetFields(); }}
        onOk={() => formReprovar.submit()} okText="Reprovar" cancelText="Cancelar">
        <Form form={formReprovar} layout="vertical" onFinish={reprovar}>
          <Form.Item name="motivo" label="Motivo da Reprovação" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Lançamento Financeiro após entrada estoque */}
      <Modal title="Criar Lançamento Financeiro" open={modalLancamento}
        onCancel={() => { setModalLancamento(false); formLancamento.resetFields(); }}
        footer={[
          <Button key="pular" onClick={() => { setModalLancamento(false); formLancamento.resetFields(); }}>
            Pular por agora
          </Button>,
          <Button key="salvar" type="primary" onClick={() => formLancamento.submit()}>
            Criar Lançamento
          </Button>
        ]}
        width={600}>
        {nfParaLancamento && (
          <Alert
            message={`NF #${nfParaLancamento.numeroNF} — Total: R$ ${nfParaLancamento.valorTotal?.toFixed(2)}`}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={formLancamento} layout="vertical" onFinish={async (values) => {
          try {
            const { default: api } = await import('../services/api');
            await api.post('/Financeiro', {
              tipo: 'Despesa',
              descricao: values.descricao,
              valor: values.valor,
              dataVencimento: values.dataVencimento.toISOString(),
              formaPagamento: values.formaPagamento,
              numeroParcelas: values.numeroParcelas || 1,
            });
            message.success('Lançamento criado!');
            setModalLancamento(false);
            formLancamento.resetFields();
          } catch {
            message.error('Erro ao criar lançamento.');
          }
        }}>
          <Form.Item name="descricao" label="Descrição" initialValue={nfParaLancamento ? `NF #${nfParaLancamento.numeroNF}` : ''} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor Total" initialValue={nfParaLancamento?.valorTotal} rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} prefix="R$" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dataVencimento" label="Data de Vencimento" rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="formaPagamento" label="Forma de Pagamento">
                <Select allowClear>
                  <Option value="Boleto">Boleto</Option>
                  <Option value="Transferencia">Transferência</Option>
                  <Option value="PIX">PIX</Option>
                  <Option value="Cartao">Cartão</Option>
                  <Option value="Dinheiro">Dinheiro</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="numeroParcelas" label="Parcelas" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Detalhe */}
      <Modal
        title="Detalhes"
        open={modalDetalhe}
        onCancel={() => setModalDetalhe(false)}
        footer={null}
        width={650}
      >
        {itemSelecionado && (
          <>
            <Row gutter={16}>
              {itemSelecionado.usuario && <Col span={12}><b>Solicitante:</b> {itemSelecionado.usuario?.nome}</Col>}
              {itemSelecionado.fornecedor && <Col span={12}><b>Fornecedor:</b> {itemSelecionado.fornecedor?.razaoSocial || itemSelecionado.fornecedor?.nome}</Col>}
              {itemSelecionado.status && <Col span={12} style={{ marginTop: 8 }}><b>Status:</b> <Tag>{itemSelecionado.status}</Tag></Col>}
              {itemSelecionado.valorTotal && <Col span={12} style={{ marginTop: 8 }}><b>Valor Total:</b> R$ {itemSelecionado.valorTotal?.toFixed(2)}</Col>}
              {itemSelecionado.motivoReprovacao && <Col span={24} style={{ marginTop: 8 }}><b>Motivo Reprovação:</b> {itemSelecionado.motivoReprovacao}</Col>}
              {itemSelecionado.observacao && <Col span={24} style={{ marginTop: 8 }}><b>Observação:</b> {itemSelecionado.observacao}</Col>}
            </Row>
            {itemSelecionado.itens?.length > 0 && (
              <>
                <Divider>Itens</Divider>
                <Table
                  dataSource={itemSelecionado.itens}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
                    { title: 'Qtd', dataIndex: 'quantidade', key: 'quantidade' },
                    ...(itemSelecionado.valorTotal ? [
                      { title: 'Valor Unit.', dataIndex: 'valorUnitario', key: 'valorUnitario', render: v => v ? `R$ ${v.toFixed(2)}` : '-' },
                      { title: 'Subtotal', key: 'subtotal', render: (_, r) => r.valorUnitario ? `R$ ${(r.quantidade * r.valorUnitario).toFixed(2)}` : '-' },
                    ] : []),
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default Compras;
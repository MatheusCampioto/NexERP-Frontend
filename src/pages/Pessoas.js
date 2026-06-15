import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag, Tabs, Row, Col, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { listarPessoas, criarPessoa, atualizarPessoa, desativarPessoa } from '../services/pessoasService';
import { validarCPF, validarCNPJ, formatarCPF, formatarCNPJ } from '../utils/validacoes';
import { listarPedidos } from '../services/pedidosService';
import { listarOrdensServico } from '../services/ordemServicoService';
import { listarOrdensCompra } from '../services/comprasService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const Pessoas = () => {
  const [pessoas, setPessoas] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [pessoaEditando, setPessoaEditando] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('CPF');
  const [busca, setBusca] = useState('');
  const [modalHistorico, setModalHistorico] = useState(false);
  const [pessoaHistorico, setPessoaHistorico] = useState(null);
  const [historico, setHistorico] = useState({ pedidos: [], ordens: [], compras: [] });
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [form] = Form.useForm();

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) { message.error('CEP não encontrado.'); return; }
      form.setFieldsValue({
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
        complemento: data.complemento || '',
      });
      message.success('Endereço preenchido automaticamente!');
    } catch {
      message.error('Erro ao buscar CEP.');
    }
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await listarPessoas();
      setPessoas(data);
      setFiltradas(data);
    } catch {
      message.error('Erro ao carregar pessoas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (!busca) { setFiltradas(pessoas); return; }
    const b = busca.toLowerCase();
    setFiltradas(pessoas.filter(p =>
      p.nome?.toLowerCase().includes(b) ||
      p.razaoSocial?.toLowerCase().includes(b) ||
      p.nomeFantasia?.toLowerCase().includes(b) ||
      p.cpf?.includes(busca) ||
      p.cnpj?.includes(busca) ||
      p.email?.toLowerCase().includes(b)
    ));
  }, [busca, pessoas]);

  const abrirModal = (pessoa = null) => {
    setPessoaEditando(pessoa);
    if (pessoa) {
      setTipoDocumento(pessoa.tipoDocumento || 'CPF');
      form.setFieldsValue({
        ...pessoa,
        dataNascimento: pessoa.dataNascimento ? dayjs(pessoa.dataNascimento) : null,
      });
    } else {
      setTipoDocumento('CPF');
      form.resetFields();
      form.setFieldsValue({ tipoDocumento: 'CPF', tipo: 'Cliente' });
    }
    setModalAberto(true);
  };

  const salvar = async (values) => {
    try {
      const dados = {
        ...values,
        dataNascimento: values.dataNascimento ? values.dataNascimento.toISOString() : null,
        nome: tipoDocumento === 'CPF' ? values.nome : (values.razaoSocial || ''),
      };
      if (pessoaEditando) {
        await atualizarPessoa(pessoaEditando.id, dados);
        message.success('Pessoa atualizada!');
      } else {
        await criarPessoa(dados);
        message.success('Pessoa cadastrada!');
      }
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch (e) {
      message.error(e.response?.data?.mensagem || 'Erro ao salvar.');
    }
  };

  const desativar = async (id) => {
    try {
      await desativarPessoa(id);
      message.success('Pessoa desativada!');
      carregar();
    } catch {
      message.error('Erro ao desativar.');
    }
  };

  const abrirHistorico = async (pessoa) => {
    setPessoaHistorico(pessoa);
    setModalHistorico(true);
    setLoadingHistorico(true);
    try {
      const [pedidos, ordens, compras] = await Promise.all([
        listarPedidos(),
        listarOrdensServico(),
        listarOrdensCompra(),
      ]);
      setHistorico({
        pedidos: pedidos.filter(p => p.pessoaId === pessoa.id),
        ordens: ordens.filter(o => o.pessoaId === pessoa.id),
        compras: compras.filter(c => c.fornecedorId === pessoa.id),
      });
    } catch {
      message.error('Erro ao carregar histórico.');
    } finally {
      setLoadingHistorico(false);
    }
  };

  const colunas = [
    {
      title: 'Nome / Razão Social', key: 'nome',
      render: (_, r) => r.tipoDocumento === 'CNPJ'
        ? <><div>{r.razaoSocial}</div><small style={{ color: '#888' }}>{r.nomeFantasia}</small></>
        : r.nome
    },
    {
      title: 'Tipo', dataIndex: 'tipo', key: 'tipo',
      render: (t) => {
        const cor = { Cliente: 'blue', Fornecedor: 'green', Representante: 'purple' };
        return <Tag color={cor[t] || 'default'}>{t}</Tag>;
      }
    },
    {
      title: 'Documento', key: 'documento',
      render: (_, r) => r.tipoDocumento === 'CNPJ' ? r.cnpj : r.cpf
    },
    { title: 'E-mail', dataIndex: 'email', key: 'email' },
    { title: 'Telefone', key: 'telefone', render: (_, r) => r.celular || r.telefone },
    { title: 'Cidade', dataIndex: 'cidade', key: 'cidade' },
    {
      title: 'Ações', key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<HistoryOutlined />} size="small" onClick={() => abrirHistorico(record)}>Histórico</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(record)} />
          <Popconfirm title="Desativar?" onConfirm={() => desativar(record.id)} okText="Sim" cancelText="Não">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Pessoas</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
          Nova Pessoa
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome, documento ou e-mail..."
        prefix={<SearchOutlined />}
        value={busca}
        onChange={e => setBusca(e.target.value)}
        allowClear
        style={{ marginBottom: 16 }}
      />

      <Table dataSource={filtradas} columns={colunas} rowKey="id" loading={loading} />

      {/* Modal Histórico */}
      <Modal
        title={`Histórico — ${pessoaHistorico?.razaoSocial || pessoaHistorico?.nome}`}
        open={modalHistorico}
        onCancel={() => setModalHistorico(false)}
        footer={null}
        width={750}
      >
        <Tabs items={[
          {
            key: 'pedidos',
            label: `Pedidos (${historico.pedidos.length})`,
            children: (
              <Table
                dataSource={historico.pedidos}
                rowKey="id"
                loading={loadingHistorico}
                size="small"
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '#', dataIndex: 'id', key: 'id', width: 60 },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
                  { title: 'Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
                  { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
                ]}
              />
            )
          },
          {
            key: 'ordens',
            label: `Ordens de Serviço (${historico.ordens.length})`,
            children: (
              <Table
                dataSource={historico.ordens}
                rowKey="id"
                loading={loadingHistorico}
                size="small"
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '#', dataIndex: 'id', key: 'id', width: 60 },
                  { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
                  { title: 'Valor Final', dataIndex: 'valorFinal', key: 'valorFinal', render: v => v ? `R$ ${v?.toFixed(2)}` : '-' },
                  { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
                ]}
              />
            )
          },
          {
            key: 'compras',
            label: `Compras (${historico.compras.length})`,
            children: (
              <Table
                dataSource={historico.compras}
                rowKey="id"
                loading={loadingHistorico}
                size="small"
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '#', dataIndex: 'id', key: 'id', width: 60 },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> },
                  { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => `R$ ${v?.toFixed(2)}` },
                  { title: 'Data', dataIndex: 'criadoEm', key: 'criadoEm', render: d => dayjs(d).format('DD/MM/YYYY') },
                ]}
              />
            )
          },
        ]} />
      </Modal>

      {/* Modal Cadastro */}
      <Modal
        title={pessoaEditando ? 'Editar Pessoa' : 'Nova Pessoa'}
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
              <Form.Item name="tipoDocumento" label="Tipo de Pessoa" initialValue="CPF">
                <Select onChange={v => { setTipoDocumento(v); form.setFieldsValue({ tipoDocumento: v }); }}>
                  <Option value="CPF">Pessoa Física (CPF)</Option>
                  <Option value="CNPJ">Pessoa Jurídica (CNPJ)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tipo" label="Classificação" initialValue="Cliente">
                <Select>
                  <Option value="Cliente">Cliente</Option>
                  <Option value="Fornecedor">Fornecedor</Option>
                  <Option value="Representante">Representante</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="funcao" label="Função / Cargo">
            <Input placeholder="Ex: Representante Comercial, Distribuidor..." />
          </Form.Item>

          {tipoDocumento === 'CPF' ? (
            <>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item name="nome" label="Nome Completo" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="cpf"
                    label="CPF"
                    rules={[{
                      validator: (_, value) => {
                        if (!value || value.replace(/\D/g, '').length === 0) return Promise.resolve();
                        if (!validarCPF(value)) return Promise.reject('CPF inválido.');
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <Input
                      placeholder="000.000.000-00"
                      maxLength={14}
                      onChange={e => form.setFieldsValue({ cpf: formatarCPF(e.target.value) })}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="rg" label="RG">
                    <Input maxLength={20} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="dataNascimento" label="Data de Nascimento">
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="estadoCivil" label="Estado Civil">
                    <Select allowClear>
                      <Option value="Solteiro">Solteiro(a)</Option>
                      <Option value="Casado">Casado(a)</Option>
                      <Option value="Divorciado">Divorciado(a)</Option>
                      <Option value="Viuvo">Viúvo(a)</Option>
                      <Option value="UniaoEstavel">União Estável</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="profissao" label="Profissão">
                <Input />
              </Form.Item>
            </>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item name="razaoSocial" label="Razão Social" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="cnpj"
                    label="CNPJ"
                    rules={[{
                      validator: (_, value) => {
                        if (!value || value.replace(/\D/g, '').length === 0) return Promise.resolve();
                        if (!validarCNPJ(value)) return Promise.reject('CNPJ inválido.');
                        return Promise.resolve();
                      }
                    }]}
                  >
                    <Input
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      onChange={e => form.setFieldsValue({ cnpj: formatarCNPJ(e.target.value) })}
                    />
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
                  <Form.Item name="nomeContato" label="Nome do Contato">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="inscricaoEstadual" label="Inscrição Estadual">
                    <Input maxLength={20} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="inscricaoMunicipal" label="Inscrição Municipal">
                    <Input maxLength={20} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="site" label="Site">
                    <Input placeholder="www.empresa.com.br" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Tabs
            size="small"
            style={{ marginTop: 8 }}
            items={[
              {
                key: 'contato',
                label: 'Contato',
                children: (
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
                      <Form.Item name="celular" label="Celular">
                        <Input placeholder="(00) 00000-0000" maxLength={16} />
                      </Form.Item>
                    </Col>
                  </Row>
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
                          <Input
                            placeholder="00000-000"
                            maxLength={9}
                            onChange={e => buscarCep(e.target.value)}
                          />
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
                key: 'obs',
                label: 'Observação',
                children: (
                  <Form.Item name="observacao">
                    <TextArea rows={4} />
                  </Form.Item>
                )
              }
            ]}
          />
        </Form>
      </Modal>
    </>
  );
};

export default Pessoas;
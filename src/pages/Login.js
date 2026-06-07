import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { salvarToken } = useAuth();

  const onFinish = async (values) => {
    try {
      const data = await login(values.email, values.senha);
      salvarToken(data.token);
      message.success('Login realizado com sucesso!');
      navigate('/');
    } catch {
      message.error('Email ou senha inválidos.');
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh',
      background: '#f0f2f5'
    }}>
      <Card title="NexERP" style={{ width: 380 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="email" label="Email"
            rules={[{ required: true, message: 'Digite seu email' }]}>
            <Input prefix={<UserOutlined />} placeholder="email@exemplo.com" />
          </Form.Item>
          <Form.Item name="senha" label="Senha"
            rules={[{ required: true, message: 'Digite sua senha' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
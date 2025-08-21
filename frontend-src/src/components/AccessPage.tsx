import React, { useState } from 'react';
import styled from 'styled-components';
import { databaseAPI } from '../services/api';

interface AccessPageProps {
  onConnect: () => void;
}

const Container = styled.div`
  background-color: #2E1F13;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Arial', sans-serif;
`;

const AccessCard = styled.div`
  background-color: #3E2F23;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  border: 1px solid #4A3B2F;
`;

const Title = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 10px;
  font-size: 32px;
  font-weight: bold;
  
  &:before {
    content: '🗄️';
    margin-right: 15px;
    font-size: 36px;
  }
`;

const Subtitle = styled.p`
  color: #ccc;
  text-align: center;
  margin-bottom: 40px;
  font-size: 16px;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: white;
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  background-color: #2E1F13;
  color: white;
  border: 1px solid #5A4B3F;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FFA726;
    box-shadow: 0 0 0 2px rgba(255, 167, 38, 0.2);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const ConnectButton = styled.button`
  background: linear-gradient(135deg, #FFA726 0%, #FF9800 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #d32f2f;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:before {
    content: '⚠️';
    font-size: 16px;
  }
`;

const SuccessMessage = styled.div`
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #c8e6c9;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:before {
    content: '✅';
    font-size: 16px;
  }
`;

function AccessPage({ onConnect }: AccessPageProps): JSX.Element {
  const [formData, setFormData] = useState({
    host: '',
    port: '3306',
    user: '',
    password: '',
    database: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.host || !formData.user || !formData.password || !formData.database) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const config = {
        host: formData.host,
        port: parseInt(formData.port),
        user: formData.user,
        password: formData.password,
        database: formData.database
      };

      await databaseAPI.connect(config);
      setSuccess('Successfully connected to database!');
      
      // 접속 성공 후 1초 후에 리다이렉트
      setTimeout(() => {
        onConnect();
      }, 1000);
      
    } catch (error: any) {
      setError('Failed to connect: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <AccessCard>
        <Title>BoarDB</Title>
        <Subtitle>
          Connect to your MySQL database to access the BoarDB dashboard
        </Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Host *</Label>
            <Input
              type="text"
              name="host"
              value={formData.host}
              onChange={handleChange}
              placeholder="localhost"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Port</Label>
            <Input
              type="number"
              name="port"
              value={formData.port}
              onChange={handleChange}
              placeholder="3306"
            />
          </FormGroup>

          <FormGroup>
            <Label>Username *</Label>
            <Input
              type="text"
              name="user"
              value={formData.user}
              onChange={handleChange}
              placeholder="root"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Password *</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Database *</Label>
            <Input
              type="text"
              name="database"
              value={formData.database}
              onChange={handleChange}
              placeholder="my_database"
              required
            />
          </FormGroup>

          <ConnectButton type="submit" disabled={loading}>
            {loading ? '⏳ Connecting...' : '🔗 Connect to Database'}
          </ConnectButton>
        </Form>
      </AccessCard>
    </Container>
  );
}

export default AccessPage;
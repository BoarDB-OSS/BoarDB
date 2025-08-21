import React, { useState } from "react";
import styled from "styled-components";
import { databaseAPI, DatabaseConfig } from "../services/api";

interface LoginFormProps {
  onConnect: () => void;
}

interface FormData {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const LoginCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
  margin: 20px;
  border: 1px solid #e1e1e1;
  transform: scale(0.9);
  animation: modalEnter 0.2s ease-out forwards;
  position: relative;

  @keyframes modalEnter {
    to {
      transform: scale(1);
    }
  }
`;

const Title = styled.h2`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
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
  color: #424242;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  &:hover {
    border-color: #bdbdbd;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);

  &:hover {
    background: linear-gradient(135deg, #1976d2, #1565c0);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #e0e0e0;
    color: #bdbdbd;
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
  font-size: 14px;
  border: 1px solid #ffcdd2;
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: "⚠️";
    font-size: 16px;
  }
`;

const SuccessMessage = styled.div`
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #c8e6c9;
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: "✅";
    font-size: 16px;
  }
`;

const Description = styled.p`
  color: #757575;
  text-align: center;
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.5;
`;

function LoginForm({ onConnect }: LoginFormProps): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    host: "localhost",
    port: "3306",
    user: "",
    password: "",
    database: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const dbConfig: DatabaseConfig = {
        ...formData,
        port: parseInt(formData.port),
      };

      const response = await databaseAPI.connect(dbConfig);

      if (response.data.success) {
        setSuccess("Database connected successfully!");
        setTimeout(() => {
          onConnect();
        }, 1000);
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to connect to database. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>🗄️ Database Connection</Title>
        <Description>
          Connect to your MySQL database to manage tables, execute queries, and
          view data.
        </Description>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Host</Label>
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
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Username</Label>
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
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Database Name</Label>
            <Input
              type="text"
              name="database"
              value={formData.database}
              onChange={handleChange}
              placeholder="my_database"
              required
            />
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? "🔄 Connecting..." : "🔗 Connect to Database"}
          </Button>
        </Form>
      </LoginCard>
    </Container>
  );
}

export default LoginForm;

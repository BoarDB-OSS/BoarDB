import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { metricsAPI, ApiMetric, EndpointMetric } from "../services/api";

const Container = styled.div`
  padding: 30px;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 300;
`;

const Section = styled.div`
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  color: #495057;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const Tr = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
`;

const MethodBadge = styled.span<{ method: string }>`
  background-color: ${(props) => {
    switch (props.method) {
      case "GET":
        return "#27ae60";
      case "POST":
        return "#f39c12";
      case "PUT":
        return "#3498db";
      case "DELETE":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
`;

const RefreshButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;

  &:hover {
    background-color: #2980b9;
  }
`;

function MetricsView(): JSX.Element {
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([]);
  const [allRequests, setAllRequests] = useState<ApiMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [endpointsRes, allRes] = await Promise.all([
        metricsAPI.getEndpoints(),
        metricsAPI.getAll(),
      ]);

      setEndpoints(endpointsRes.data);
      setAllRequests(allRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load metrics data:", error);
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading metrics...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Title>📊 API Metrics</Title>

      <RefreshButton onClick={loadData}>🔄 Refresh Data</RefreshButton>

      <Section>
        <SectionTitle>📈 Endpoint Statistics</SectionTitle>
        {endpoints.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}
          >
            No endpoint data available. Make some API calls to see statistics.
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Method</Th>
                <Th>Endpoint</Th>
                <Th>Total Calls</Th>
                <Th>Success</Th>
                <Th>Failed</Th>
                <Th>Avg Response Time</Th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <Tr key={index}>
                  <Td>
                    <MethodBadge method={endpoint.method}>
                      {endpoint.method}
                    </MethodBadge>
                  </Td>
                  <Td style={{ fontFamily: "monospace" }}>{endpoint.path}</Td>
                  <Td>{endpoint.count}</Td>
                  <Td style={{ color: "#27ae60" }}>{endpoint.successCount}</Td>
                  <Td style={{ color: "#e74c3c" }}>{endpoint.failedCount}</Td>
                  <Td>{endpoint.averageResponseTime}ms</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section>
        <SectionTitle>📝 All Requests Log</SectionTitle>
        {allRequests.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}
          >
            No requests logged yet.
          </div>
        ) : (
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <Table>
              <thead>
                <tr>
                  <Th>Time</Th>
                  <Th>Method</Th>
                  <Th>Path</Th>
                  <Th>Status</Th>
                  <Th>Response Time</Th>
                  <Th>IP</Th>
                </tr>
              </thead>
              <tbody>
                {allRequests.map((request, index) => (
                  <Tr key={index}>
                    <Td style={{ fontSize: "12px" }}>
                      {formatTime(request.timestamp)}
                    </Td>
                    <Td>
                      <MethodBadge method={request.method}>
                        {request.method}
                      </MethodBadge>
                    </Td>
                    <Td style={{ fontFamily: "monospace" }}>{request.path}</Td>
                    <Td>
                      <span
                        style={{
                          color: request.success ? "#27ae60" : "#e74c3c",
                          fontWeight: "bold",
                        }}
                      >
                        {request.statusCode}
                      </span>
                    </Td>
                    <Td>{request.responseTime}ms</Td>
                    <Td style={{ fontSize: "12px" }}>{request.ip}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Section>
    </Container>
  );
}

export default MetricsView;

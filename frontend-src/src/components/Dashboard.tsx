import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { metricsAPI, ApiMetric, MetricsSummary } from "../services/api";

const Container = styled.div`
  padding: 30px;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 300;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div<{ color?: string }>`
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(props) => props.color || "#3498db"};
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 32px;
  font-weight: bold;
  color: ${(props) => props.color || "#2c3e50"};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #7f8c8d;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
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

const RecentRequests = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const RequestItem = styled.div`
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
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
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
`;

const StatusBadge = styled.span<{ success: boolean }>`
  background-color: ${(props) => (props.success ? "#27ae60" : "#e74c3c")};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
`;

function Dashboard(): JSX.Element {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [recentRequests, setRecentRequests] = useState<ApiMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        metricsAPI.getSummary(),
        metricsAPI.getRecent(10),
      ]);

      setSummary(summaryRes.data);
      setRecentRequests(recentRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading dashboard...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Title>📊 Dashboard Overview</Title>

      {summary && (
        <StatsGrid>
          <StatCard color="#3498db">
            <StatValue color="#3498db">{summary.totalRequests}</StatValue>
            <StatLabel>Total Requests</StatLabel>
          </StatCard>

          <StatCard color="#27ae60">
            <StatValue color="#27ae60">{summary.successRequests}</StatValue>
            <StatLabel>Success Requests</StatLabel>
          </StatCard>

          <StatCard color="#e74c3c">
            <StatValue color="#e74c3c">{summary.failedRequests}</StatValue>
            <StatLabel>Failed Requests</StatLabel>
          </StatCard>

          <StatCard color="#f39c12">
            <StatValue color="#f39c12">{summary.successRate}%</StatValue>
            <StatLabel>Success Rate</StatLabel>
          </StatCard>

          <StatCard color="#9b59b6">
            <StatValue color="#9b59b6">
              {summary.averageResponseTime}ms
            </StatValue>
            <StatLabel>Avg Response Time</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      <Section>
        <SectionTitle>🕒 Recent API Requests</SectionTitle>
        <RecentRequests>
          {recentRequests.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}
            >
              No recent requests found. Start making API calls to see them here.
            </div>
          ) : (
            recentRequests.map((request, index) => (
              <RequestItem key={index}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <MethodBadge method={request.method}>
                    {request.method}
                  </MethodBadge>
                  <span style={{ fontFamily: "monospace" }}>
                    {request.path}
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "12px", color: "#7f8c8d" }}>
                    {formatTime(request.timestamp)}
                  </span>
                  <span style={{ fontSize: "12px", color: "#7f8c8d" }}>
                    {request.responseTime}ms
                  </span>
                  <StatusBadge success={request.success}>
                    {request.statusCode}
                  </StatusBadge>
                </div>
              </RequestItem>
            ))
          )}
        </RecentRequests>
      </Section>
    </Container>
  );
}

export default Dashboard;

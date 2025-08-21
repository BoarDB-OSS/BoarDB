import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { metricsAPI, ApiMetric, EndpointMetric } from "../services/api";

interface ApiStats {
  callsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
}

interface ApiEndpoint {
  rank: number;
  tag: string;
  endpoint: string;
  success: number;
  fail: number;
  total: number;
}

const Container = styled.div`
  background-color: #2E1F13;
  min-height: 100vh;
  padding: 30px;
  color: white;
  font-family: 'Arial', sans-serif;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 40px 0;
  color: white;
`;

const ServerSection = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: white;
`;

const SectionSubtitle = styled.div`
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AutoUpdateToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    font-size: 12px;
    color: #ccc;
  }
  
  .toggle {
    width: 40px;
    height: 20px;
    background-color: #4CAF50;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    
    &:after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      background-color: white;
      border-radius: 50%;
      top: 2px;
      right: 2px;
      transition: all 0.2s ease;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background-color: #3E2F23;
  border-radius: 12px;
  padding: 24px;
  position: relative;
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    color: white;
  }
  
  .icon {
    font-size: 20px;
  }
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
  color: white;
`;

const StatChange = styled.div<{ positive?: boolean }>`
  font-size: 12px;
  color: ${props => props.positive ? '#4CAF50' : '#F44336'};
  
  &:before {
    content: '${props => props.positive ? '↗' : '↘'}';
    margin-right: 4px;
  }
`;

const ApiCallsSection = styled.div`
  background-color: #3E2F23;
  border-radius: 12px;
  padding: 24px;
`;

const ApiCallsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    color: white;
  }
  
  span {
    font-size: 12px;
    color: #999;
  }
`;

const ApiTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const ApiTableHeader = styled.th`
  text-align: left;
  padding: 12px 16px;
  color: #999;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid #4A3B2F;
  
  &:first-child {
    width: 50px;
  }
  
  &:nth-child(2) {
    width: 100px;
  }
  
  &:nth-child(3) {
    flex: 1;
  }
  
  &:nth-child(4), &:nth-child(5), &:nth-child(6) {
    width: 80px;
    text-align: center;
  }
`;

const ApiTableRow = styled.tr`
  &:hover {
    background-color: #4A3B2F;
  }
`;

const ApiTableCell = styled.td<{ align?: string; color?: string }>`
  padding: 12px 16px;
  border-bottom: 1px solid #4A3B2F;
  color: ${props => props.color || 'white'};
  text-align: ${props => props.align || 'left'};
  
  &:first-child {
    color: #999;
    font-weight: 500;
  }
`;

const TagBadge = styled.span<{ color: string }>`
  background-color: ${props => {
    switch(props.color) {
      case 'API': return '#2196F3';
      case 'Users': return '#FF9800';
      case 'Posts': return '#4CAF50';
      case 'Test': return '#9C27B0';
      default: return '#666';
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  
  button {
    background: transparent;
    border: 1px solid #4A3B2F;
    color: #ccc;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #4A3B2F;
      color: white;
    }
    
    &.active {
      background: #FFA726;
      border-color: #FFA726;
      color: white;
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #ccc;
  font-size: 16px;
`;

function MetricsView(): JSX.Element {
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([]);
  const [allRequests, setAllRequests] = useState<ApiMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [apiStats, setApiStats] = useState<ApiStats>({
    callsPerMinute: 0,
    avgResponseTime: 0,
    errorRate: 0
  });
  const [previousStats, setPreviousStats] = useState<ApiStats>({
    callsPerMinute: 0,
    avgResponseTime: 0,
    errorRate: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoUpdate && !loading && !error) {
      interval = setInterval(() => {
        loadData();
      }, 5000); // Update every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, loading, error]);

  const loadData = async (): Promise<void> => {
    try {
      setError(null);
      const [endpointsRes, allRes, summaryRes] = await Promise.all([
        metricsAPI.getEndpoints(),
        metricsAPI.getAll(),
        metricsAPI.getSummary(),
      ]);

      setEndpoints(endpointsRes.data);
      setAllRequests(allRes.data);
      
      // Calculate real-time stats
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;
      const recentRequests = allRes.data.filter(req => req.timestamp >= oneMinuteAgo);
      
      const newStats: ApiStats = {
        callsPerMinute: recentRequests.length,
        avgResponseTime: summaryRes.data.averageResponseTime,
        errorRate: (summaryRes.data.failedRequests / summaryRes.data.totalRequests) * 100 || 0
      };
      
      setPreviousStats(apiStats);
      setApiStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metrics data';
      console.error("Failed to load metrics data:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getChangeText = (current: number, previous: number): string => {
    if (previous === 0) return "First measurement";
    const change = ((current - previous) / previous) * 100;
    return `${Math.abs(change).toFixed(1)}% from last update`;
  };

  const convertToApiEndpoints = (endpoints: EndpointMetric[]): ApiEndpoint[] => {
    return endpoints
      .sort((a, b) => b.count - a.count)
      .map((endpoint, index) => ({
        rank: index + 1,
        tag: getTagForEndpoint(endpoint.path),
        endpoint: endpoint.path,
        success: endpoint.successCount,
        fail: endpoint.failedCount,
        total: endpoint.count
      }));
  };

  const getTagForEndpoint = (path: string): string => {
    if (path.includes('/users')) return 'Users';
    if (path.includes('/posts')) return 'Posts';
    if (path.includes('/error') || path.includes('/slow')) return 'Test';
    return 'API';
  };

  const apiEndpoints = convertToApiEndpoints(endpoints);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(apiEndpoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEndpoints = apiEndpoints.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <Container>
        <LoadingMessage>🔄 Loading API metrics...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>API Usage</Title>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#F44336',
          background: '#3E2F23',
          borderRadius: '12px',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Failed to load metrics</div>
          <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '20px' }}>{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              loadData();
            }}
            style={{
              background: '#FFA726',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>API Usage</Title>

      <ServerSection>
        <SectionTitle>API Server</SectionTitle>
        <SectionSubtitle>
          <span>API Call Statistics</span>
          <AutoUpdateToggle>
            <span>Auto Update</span>
            <div 
              className="toggle" 
              onClick={() => setAutoUpdate(!autoUpdate)}
              style={{
                backgroundColor: autoUpdate ? '#4CAF50' : '#666'
              }}
            >
              <div 
                style={{
                  transform: autoUpdate ? 'translateX(0)' : 'translateX(-18px)'
                }}
              />
            </div>
          </AutoUpdateToggle>
        </SectionSubtitle>
        
        <StatsGrid>
          <StatCard>
            <StatHeader>
              <h3>API Calls per Minute</h3>
              <div className="icon">📊</div>
            </StatHeader>
            <StatValue>{apiStats.callsPerMinute.toLocaleString()}</StatValue>
            <StatChange positive={apiStats.callsPerMinute >= previousStats.callsPerMinute}>
              {getChangeText(apiStats.callsPerMinute, previousStats.callsPerMinute)}
            </StatChange>
          </StatCard>
          
          <StatCard>
            <StatHeader>
              <h3>Average Response Time</h3>
              <div className="icon">⏱️</div>
            </StatHeader>
            <StatValue>{Math.round(apiStats.avgResponseTime)}ms</StatValue>
            <StatChange positive={apiStats.avgResponseTime <= previousStats.avgResponseTime}>
              {getChangeText(apiStats.avgResponseTime, previousStats.avgResponseTime)}
            </StatChange>
          </StatCard>
          
          <StatCard>
            <StatHeader>
              <h3>Error Rate</h3>
              <div className="icon">⚠️</div>
            </StatHeader>
            <StatValue>{apiStats.errorRate.toFixed(2)}%</StatValue>
            <StatChange positive={apiStats.errorRate <= previousStats.errorRate}>
              {getChangeText(apiStats.errorRate, previousStats.errorRate)}
            </StatChange>
          </StatCard>
        </StatsGrid>
      </ServerSection>

      <ApiCallsSection>
        <ApiCallsHeader>
          <h3>API Calls <span style={{ fontWeight: 'normal' }}>in Last 24 Hours</span></h3>
        </ApiCallsHeader>
        
        <ApiTable>
          <thead>
            <tr>
              <ApiTableHeader>No.</ApiTableHeader>
              <ApiTableHeader>Tag</ApiTableHeader>
              <ApiTableHeader>API</ApiTableHeader>
              <ApiTableHeader>Success</ApiTableHeader>
              <ApiTableHeader>Fail</ApiTableHeader>
              <ApiTableHeader>Total</ApiTableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedEndpoints.length === 0 ? (
              <tr>
                <ApiTableCell colSpan={6} align="center" style={{ padding: '40px', color: '#999' }}>
                  No API calls recorded yet. Make some requests to see statistics.
                </ApiTableCell>
              </tr>
            ) : (
              paginatedEndpoints.map((api) => (
                <ApiTableRow key={api.rank}>
                  <ApiTableCell align="center">{api.rank}</ApiTableCell>
                  <ApiTableCell>
                    <TagBadge color={api.tag}>{api.tag}</TagBadge>
                  </ApiTableCell>
                  <ApiTableCell>{api.endpoint}</ApiTableCell>
                  <ApiTableCell align="center" color="#4CAF50">{api.success.toLocaleString()}</ApiTableCell>
                  <ApiTableCell align="center" color="#F44336">{api.fail}</ApiTableCell>
                  <ApiTableCell align="center">{api.total.toLocaleString()}</ApiTableCell>
                </ApiTableRow>
              ))
            )}
          </tbody>
        </ApiTable>

{apiEndpoints.length > itemsPerPage && (
          <Pagination>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </Pagination>
        )}
      </ApiCallsSection>
    </Container>
  );
}

export default MetricsView;
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import styled from "styled-components";
import MetricsView from "./components/MetricsView";
import DatabaseView from "./components/DatabaseView";

interface SystemStats {
  cpu: number;
  memory: number;
  storage: number;
}

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
  background-color: #2e1f13;
  min-height: 100vh;
  padding: 0;
  color: white;
  font-family: "Arial", sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 30px;
  background-color: #2e1f13;
  border-bottom: 1px solid #3e2f23;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: white;
  margin-right: 50px;

  &:before {
    content: "🗄️";
    margin-right: 10px;
    font-size: 24px;
  }
`;

const NavTabs = styled.div`
  display: flex;
  gap: 0;
`;

const NavTab = styled(Link)<{ active?: boolean }>`
  background: ${(props) => (props.active ? "#444" : "transparent")};
  color: ${(props) => (props.active ? "white" : "#999")};
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    background: #555;
    color: white;
  }
`;

const MainContent = styled.div`
  padding: 30px;
`;

const ServerStatusSection = styled.div`
  margin-bottom: 40px;
`;

const ServerStatusHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    font-size: 32px;
    font-weight: bold;
    margin: 0;
    margin-right: 15px;
  }

  .status-icon {
    width: 24px;
    height: 24px;
    background-color: #4caf50;
    border-radius: 50%;
    position: relative;

    &:after {
      content: "✓";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #4caf50;
  }

  span {
    font-size: 14px;
    color: #ccc;
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  margin-top: 0;
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
    background-color: #4caf50;
    border-radius: 10px;
    position: relative;
    cursor: pointer;

    &:after {
      content: "";
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
  background-color: #3e2f23;
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
  color: ${(props) => (props.positive ? "#4CAF50" : "#F44336")};

  &:before {
    content: "${(props) => (props.positive ? "↗" : "↘")}";
    margin-right: 4px;
  }
`;

const ApiStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
`;

const ApiStatCard = styled.div`
  background-color: #3e2f23;
  border-radius: 12px;
  padding: 24px;
`;

const ApiStatHeader = styled.div`
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

const ApiStatValue = styled.div`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
  color: white;
`;

const ApiStatChange = styled.div<{ positive?: boolean }>`
  font-size: 12px;
  color: ${(props) => (props.positive ? "#4CAF50" : "#F44336")};

  &:before {
    content: "${(props) => (props.positive ? "↗" : "↘")}";
    margin-right: 4px;
  }
`;

const TopApisSection = styled.div`
  background-color: #3e2f23;
  border-radius: 12px;
  padding: 24px;
`;

const TopApisHeader = styled.div`
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
  border-bottom: 1px solid #4a3b2f;

  &:first-child {
    width: 50px;
  }

  &:nth-child(2) {
    width: 100px;
  }

  &:nth-child(3) {
    flex: 1;
  }

  &:nth-child(4),
  &:nth-child(5),
  &:nth-child(6) {
    width: 80px;
    text-align: center;
  }
`;

const ApiTableRow = styled.tr`
  &:hover {
    background-color: #4a3b2f;
  }
`;

const ApiTableCell = styled.td<{ align?: string; color?: string }>`
  padding: 12px 16px;
  border-bottom: 1px solid #4a3b2f;
  color: ${(props) => props.color || "white"};
  text-align: ${(props) => props.align || "left"};

  &:first-child {
    color: #999;
    font-weight: 500;
  }
`;

const TagBadge = styled.span<{ color: string }>`
  background-color: ${(props) => {
    switch (props.color) {
      case "Product":
        return "#2196F3";
      case "Payment":
        return "#FF9800";
      case "Account":
        return "#4CAF50";
      default:
        return "#666";
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

function App(): JSX.Element {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: 46,
    memory: 74,
    storage: 32,
  });
  const [apiStats, setApiStats] = useState<ApiStats>({
    callsPerMinute: 1367,
    avgResponseTime: 83,
    errorRate: 0.16,
  });
  const [topApis, setTopApis] = useState<ApiEndpoint[]>([
    {
      rank: 1,
      tag: "Product",
      endpoint: "/api/v1/product",
      success: 3312,
      fail: 21,
      total: 3333,
    },
    {
      rank: 2,
      tag: "Product",
      endpoint: "/api/v1/product/filtered",
      success: 1324,
      fail: 1,
      total: 1325,
    },
    {
      rank: 3,
      tag: "Product",
      endpoint: "/api/v1/product/category",
      success: 709,
      fail: 31,
      total: 740,
    },
    {
      rank: 4,
      tag: "Payment",
      endpoint: "/api/v1/payment/buy",
      success: 216,
      fail: 9,
      total: 225,
    },
    {
      rank: 5,
      tag: "Payment",
      endpoint: "/api/v1/payment/cancel",
      success: 179,
      fail: 2,
      total: 181,
    },
    {
      rank: 6,
      tag: "Account",
      endpoint: "/api/v1/account/login",
      success: 132,
      fail: 3,
      total: 135,
    },
    {
      rank: 7,
      tag: "Account",
      endpoint: "/api/v1/account/find_pw",
      success: 78,
      fail: 2,
      total: 80,
    },
    {
      rank: 8,
      tag: "Product",
      endpoint: "/api/v1/add_favorite",
      success: 25,
      fail: 6,
      total: 31,
    },
    {
      rank: 9,
      tag: "Product",
      endpoint: "/api/v1/remove_favorite",
      success: 14,
      fail: 3,
      total: 17,
    },
    {
      rank: 10,
      tag: "Product",
      endpoint: "/api/v1/logout",
      success: 3,
      fail: 1,
      total: 4,
    },
  ]);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);

  useEffect(() => {
    // Simulate real-time data updates
    if (autoUpdate) {
      const interval = setInterval(() => {
        // Update system stats with small random variations
        setSystemStats((prev) => ({
          cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 2)),
          memory: Math.max(
            0,
            Math.min(100, prev.memory + (Math.random() - 0.5) * 1)
          ),
          storage: Math.max(
            0,
            Math.min(100, prev.storage + (Math.random() - 0.5) * 0.5)
          ),
        }));

        // Update API stats
        setApiStats((prev) => ({
          callsPerMinute: Math.max(
            0,
            prev.callsPerMinute + Math.floor((Math.random() - 0.5) * 100)
          ),
          avgResponseTime: Math.max(
            0,
            prev.avgResponseTime + Math.floor((Math.random() - 0.5) * 10)
          ),
          errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.1),
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [autoUpdate]);

  const renderDashboard = () => {
    return (
      <MainContent>
        <ServerStatusSection>
          <ServerStatusHeader>
            <h1>Server Status</h1>
            <div className="status-icon"></div>
          </ServerStatusHeader>

          <StatusIndicators>
            <StatusIndicator>
              <div className="indicator"></div>
              <span>System</span>
            </StatusIndicator>
            <StatusIndicator>
              <div className="indicator"></div>
              <span>API Server</span>
            </StatusIndicator>
            <StatusIndicator>
              <div className="indicator"></div>
              <span>Database</span>
            </StatusIndicator>
          </StatusIndicators>
        </ServerStatusSection>

        <div>
          <SectionTitle>System</SectionTitle>
          <SectionSubtitle>
            <span>Resource Usage</span>
            <AutoUpdateToggle>
              <span>Auto Update</span>
              <div
                className="toggle"
                onClick={() => setAutoUpdate(!autoUpdate)}
              ></div>
            </AutoUpdateToggle>
          </SectionSubtitle>

          <StatsGrid>
            <StatCard>
              <StatHeader>
                <h3>CPU</h3>
                <div className="icon">🖥️</div>
              </StatHeader>
              <StatValue>{Math.round(systemStats.cpu)}%</StatValue>
              <StatChange positive={false}>Last 24 Hours ↘ 2.3%</StatChange>
            </StatCard>

            <StatCard>
              <StatHeader>
                <h3>Memory</h3>
                <div className="icon">💾</div>
              </StatHeader>
              <StatValue>{Math.round(systemStats.memory)}%</StatValue>
              <StatChange positive={false}>Last 24 Hours ↘ 12.3%</StatChange>
            </StatCard>

            <StatCard>
              <StatHeader>
                <h3>Storage</h3>
                <div className="icon">💿</div>
              </StatHeader>
              <StatValue>{Math.round(systemStats.storage)}%</StatValue>
              <StatChange positive={false}>Last 24 Hours ↘ 7.2%</StatChange>
            </StatCard>
          </StatsGrid>
        </div>

        <div>
          <SectionTitle>API Server</SectionTitle>
          <SectionSubtitle>
            <span>API Call Statistics</span>
            <AutoUpdateToggle>
              <span>Auto Update</span>
              <div
                className="toggle"
                onClick={() => setAutoUpdate(!autoUpdate)}
              ></div>
            </AutoUpdateToggle>
          </SectionSubtitle>

          <ApiStatsGrid>
            <ApiStatCard>
              <ApiStatHeader>
                <h3>API Calls per Minute</h3>
                <div className="icon">📊</div>
              </ApiStatHeader>
              <ApiStatValue>
                {apiStats.callsPerMinute.toLocaleString()}
              </ApiStatValue>
              <ApiStatChange positive={true}>Last 1 Hours ↗ 3.5%</ApiStatChange>
            </ApiStatCard>

            <ApiStatCard>
              <ApiStatHeader>
                <h3>Average Response Time</h3>
                <div className="icon">⏱️</div>
              </ApiStatHeader>
              <ApiStatValue>
                {Math.round(apiStats.avgResponseTime)}ms
              </ApiStatValue>
              <ApiStatChange positive={true}>Last 1 Hours ↗ 2.3%</ApiStatChange>
            </ApiStatCard>

            <ApiStatCard>
              <ApiStatHeader>
                <h3>Error Rate</h3>
                <div className="icon">⚠️</div>
              </ApiStatHeader>
              <ApiStatValue>{apiStats.errorRate.toFixed(2)}%</ApiStatValue>
              <ApiStatChange positive={true}>Last1 Hours ↗ 0.2%</ApiStatChange>
            </ApiStatCard>
          </ApiStatsGrid>
        </div>

        <TopApisSection>
          <TopApisHeader>
            <h3>Top 10 Most Called</h3>
            <span>in Last 24 Hours</span>
          </TopApisHeader>

          <ApiTable>
            <thead>
              <tr>
                <ApiTableHeader>No.</ApiTableHeader>
                <ApiTableHeader>Tag</ApiTableHeader>
                <ApiTableHeader>API Endpoint</ApiTableHeader>
                <ApiTableHeader>Success</ApiTableHeader>
                <ApiTableHeader>Fail</ApiTableHeader>
                <ApiTableHeader>Total</ApiTableHeader>
              </tr>
            </thead>
            <tbody>
              {topApis.map((api) => (
                <ApiTableRow key={api.rank}>
                  <ApiTableCell align="center">{api.rank}</ApiTableCell>
                  <ApiTableCell>
                    <TagBadge color={api.tag}>{api.tag}</TagBadge>
                  </ApiTableCell>
                  <ApiTableCell>{api.endpoint}</ApiTableCell>
                  <ApiTableCell align="center" color="#4CAF50">
                    {api.success.toLocaleString()}
                  </ApiTableCell>
                  <ApiTableCell align="center" color="#F44336">
                    {api.fail}
                  </ApiTableCell>
                  <ApiTableCell align="center">
                    {api.total.toLocaleString()}
                  </ApiTableCell>
                </ApiTableRow>
              ))}
            </tbody>
          </ApiTable>
        </TopApisSection>
      </MainContent>
    );
  };

  return (
    <Router>
      <Container>
        <Header>
          <Logo>BoarDB</Logo>
          <NavTabs>
            <NavTab
              to="/"
              active={currentPath === "/"}
              onClick={() => setCurrentPath("/")}
            >
              Dashboard
            </NavTab>
            <NavTab
              to="/database"
              active={currentPath === "/database"}
              onClick={() => setCurrentPath("/database")}
            >
              Database
            </NavTab>
            <NavTab
              to="/api-usage"
              active={currentPath === "/api-usage"}
              onClick={() => setCurrentPath("/api-usage")}
            >
              API Usage
            </NavTab>
          </NavTabs>
        </Header>

        <Routes>
          <Route path="/" element={renderDashboard()} />
          <Route path="/database" element={<DatabaseView />} />
          <Route path="/api-usage" element={<MetricsView />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;

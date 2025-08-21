# BoarDB

Developer tool for API monitoring and database management with TypeScript. Provides a beautiful web interface for tracking API metrics and managing MySQL databases.

## Features

- 🚀 **API Monitoring**: Real-time API call tracking with detailed metrics
- 📊 **Beautiful Dashboard**: Modern web UI with dark theme
- 🗄️ **Database Management**: MySQL database browser and editor
- ⚡ **Real-time Updates**: Auto-refreshing metrics every 5 seconds
- 📈 **Statistics**: Response times, error rates, and call frequency
- 🔍 **Endpoint Analysis**: Track individual API endpoint performance

## Installation

```bash
npm install boardb
```

## Quick Start

```typescript
import { BoarDB } from "boardb";

const app = express();

// Initialize BoarDB
const boardb = new BoarDB({
  database: {
    host: "localhost",
    user: "root",
    password: "password",
    database: "mydb",
  },
});

// Add API monitoring middleware
app.use("/api", boardb.middleware());

// Start the dashboard server
boardb.startServer({
  port: 3001,
  enableFrontend: true,
});

console.log("BoarDB dashboard running at http://localhost:3001");
```

## API Usage

### Basic Setup

```typescript
import express from "express";
import { BoarDB, apiWrapperMiddleware } from "boardb";

const app = express();

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "your_database",
};

// Initialize BoarDB
const boardb = new BoarDB({ database: dbConfig });

// Add monitoring to your API routes
app.use("/api", boardb.middleware());

// Your API routes
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

app.post("/api/users", (req, res) => {
  res.json({ success: true });
});

// Start your main server
app.listen(3000, () => {
  console.log("API server running on port 3000");
});

// Start BoarDB dashboard
boardb.startServer({
  port: 3001,
  enableFrontend: true,
});
```

### Advanced Configuration

```typescript
import { BoarDB, MetricsCollector, FrontendServer } from "boardb";

// Custom metrics collector
const metrics = new MetricsCollector({
  trackRequests: true,
  trackResponses: true,
  trackErrors: true,
});

// Initialize with custom options
const boardb = new BoarDB({
  database: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "myapp",
  },
  metrics: metrics,
});

// Custom middleware with options
app.use(
  "/api",
  boardb.middleware({
    excludePaths: ["/health", "/ping"],
    trackBody: false,
  })
);
```

## Web Dashboard

Once running, open your browser to `http://localhost:3001` to access:

- **API Metrics**: Real-time API call statistics and performance metrics
- **Database Browser**: View and edit your MySQL database tables
- **Endpoint Analysis**: Detailed breakdown of API endpoint usage

## Configuration Options

### Database Config

```typescript
interface DatabaseConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}
```

### Server Options

```typescript
interface ServerOptions {
  port?: number;
  host?: string;
  enableFrontend?: boolean;
  frontendPath?: string;
}
```

## API Endpoints

BoarDB provides these API endpoints for the dashboard:

- `GET /api/metrics/summary` - Overall metrics summary
- `GET /api/metrics/endpoints` - Endpoint-specific metrics
- `GET /api/metrics/recent` - Recent API calls
- `GET /api/db/tables` - List database tables
- `GET /api/db/table/:name/data` - Get table data

## Development

```bash
# Clone the repository
git clone https://github.com/baesungjoon/boardb.git

# Install dependencies
npm install

# Run example
npm run example

# Build the project
npm run build
```

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

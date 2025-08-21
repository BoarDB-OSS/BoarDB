# 🗄️ BoarDB

**Developer tool for API monitoring and database management with TypeScript**

BoarDB is a comprehensive developer tool that provides real-time API monitoring, database management, and system metrics visualization. Built with TypeScript, Express.js, and React, it offers an intuitive web dashboard for tracking your application's performance and managing your MySQL databases.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)

## ✨ Features

- 📊 **Real-time API Monitoring**: Track API calls, response times, success/failure rates
- 🗄️ **Database Management**: Full CRUD operations for MySQL databases
- 📈 **System Metrics**: Monitor CPU, Memory, and Storage usage
- 🎨 **Modern Dashboard**: Beautiful dark-themed web interface
- 🔧 **Easy Integration**: Simple middleware setup for Express.js applications
- 🚀 **Live Updates**: Auto-refreshing metrics and data
- 📋 **Top API Tracking**: See your most frequently called endpoints
- 🔍 **SQL Query Editor**: Execute custom queries directly from the dashboard

## 🚀 Quick Start

### Installation

```bash
npm install boardb
```

### Basic Usage

```typescript
import express from "express";
import BoarDB from "boardb";

const app = express();
const boardb = new BoarDB();

// Add BoarDB middleware to track API calls
app.use(
  boardb.apiWrapper({
    excludePaths: ["/health"],
    includeBody: false,
  })
);

// Start BoarDB dashboard (default port: 3333)
boardb.startBoarDB(3333);

// Optional: Connect to MySQL database
boardb.connectDB({
  host: "localhost",
  port: 3306,
  user: "your_username",
  password: "your_password",
  database: "your_database",
});

// Your API routes
app.get("/api/users", (req, res) => {
  res.json([{ id: 1, name: "John Doe" }]);
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
  console.log("🚀 BoarDB dashboard: http://localhost:3333");
});
```

## 📁 Project Structure

```
boardb/
├── src/                          # Source code
│   ├── core/                     # Core functionality
│   │   ├── BoardB.ts            # Main BoardB class
│   │   ├── DBConnector.ts       # Database connection handler
│   │   └── MetricsCollector.ts  # Metrics collection logic
│   ├── middleware/              # Express middleware
│   │   └── apiWrapper.ts        # API monitoring middleware
│   ├── server/                  # Server components
│   │   ├── frontendServer.ts    # Frontend server setup
│   │   └── routes/              # API routes for dashboard
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                   # Utility functions
│   └── index.ts                 # Main export file
├── frontend-src/                # React frontend source
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── DatabaseView.tsx # Database management UI
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── LoginForm.tsx    # Database login form
│   │   │   └── MetricsView.tsx  # Metrics visualization
│   │   ├── services/            # API services
│   │   │   └── api.ts
│   │   └── App.tsx              # Main App component
│   ├── public/
│   └── package.json
├── example/                     # Example implementation
│   ├── test-server.ts          # Sample Express server
│   └── package.json
├── dist/                       # Compiled JavaScript output
├── frontend/                   # Built React frontend
├── README.md
├── package.json
├── tsconfig.json
└── .gitignore
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- MySQL (optional, for database features)

### Setting up the Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/boardb.git
   cd boardb
   ```

2. **Install dependencies**

   ```bash
   # Install main dependencies
   npm install

   # Install frontend dependencies
   cd frontend-src && npm install && cd ..

   # Install example dependencies
   cd example && npm install && cd ..
   ```

3. **Build the project**

   ```bash
   # Build TypeScript source
   npm run build

   # Build React frontend
   npm run build-frontend
   ```

4. **Run the example**

   ```bash
   npm run example
   ```

   This will start:

   - Test API server on `http://localhost:3000`
   - BoarDB dashboard on `http://localhost:3333`

## 🎯 Running the Example

The `example/` directory contains a fully functional Express.js server with BoarDB integration:

```bash
cd example
npm install
npm start
```

### Available Test Endpoints:

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `GET /api/error` - Test error endpoint (returns 500)
- `GET /api/slow` - Test slow response endpoint

### Testing the API

```bash
# Get all users
curl http://localhost:3000/api/users

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# Test error endpoint
curl http://localhost:3000/api/error
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Database Configuration (optional)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# Server Configuration
PORT=3000
BOARDB_PORT=3333
```

### API Wrapper Options

```typescript
boardb.apiWrapper({
  excludePaths: ["/health", "/favicon.ico"], // Paths to exclude from monitoring
  includeBody: false, // Include request/response body in logs
  maxBodySize: 1024, // Maximum body size to log (bytes)
});
```

## 🎨 Dashboard Features

### 📊 Main Dashboard

- Real-time server status indicators
- System resource usage (CPU, Memory, Storage)
- API call statistics (calls per minute, response time, error rate)
- Top 10 most called API endpoints

### 🗄️ Database Management

- Visual table browser
- Inline cell editing with keyboard navigation
- Table structure modification (add/edit/delete columns)
- SQL query editor with syntax highlighting
- Real-time data updates

### 📈 API Usage Analytics

- Detailed API call metrics
- Response time graphs
- Error rate tracking
- Request/response logging

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)
   - Screenshots if applicable

### 💡 Suggesting Features

1. Check existing feature requests
2. Create a detailed proposal with:
   - Use case description
   - Proposed solution
   - Alternative solutions considered

### 🔧 Code Contributions

1. **Fork the repository**

   ```bash
   git fork https://github.com/yourusername/boardb.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Set up development environment**

   ```bash
   npm install
   cd frontend-src && npm install && cd ..
   cd example && npm install && cd ..
   ```

4. **Make your changes**

   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

5. **Test your changes**

   ```bash
   npm run build
   npm run build-frontend
   npm run example
   ```

6. **Commit your changes**

   ```bash
   git commit -m "feat: add amazing feature"
   ```

7. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

8. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

### 📝 Development Guidelines

- **Code Style**: Follow existing TypeScript/React conventions
- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline docs

### 🏗️ Architecture

- **Backend**: TypeScript + Express.js
- **Frontend**: React + TypeScript + Styled Components
- **Database**: MySQL with direct SQL queries
- **Build**: TypeScript compiler + Create React App

## 📜 API Reference

### BoarDB Class

```typescript
class BoarDB {
  // Start BoarDB dashboard
  startBoarDB(port?: number): void;

  // Connect to MySQL database
  connectDB(config: DatabaseConfig): Promise<void>;

  // Get API monitoring middleware
  apiWrapper(options?: ApiWrapperOptions): express.RequestHandler;

  // Get metrics collector instance
  getMetrics(): MetricsCollector;
}
```

### Types

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface ApiWrapperOptions {
  excludePaths?: string[];
  includeBody?: boolean;
  maxBodySize?: number;
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Frontend powered by [React](https://reactjs.org/)
- Styled with [Styled Components](https://styled-components.com/)
- Database integration with [MySQL2](https://github.com/sidorares/node-mysql2)

## 📞 Support

- 📧 Create an issue for bug reports or feature requests
- 💬 Join our discussions for questions and community support
- 📖 Check the documentation for detailed guides

---

**Happy monitoring! 🚀**

import express, { Request, Response } from "express";
import BoarDB from "../dist/index";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
}

interface CreatePostRequest {
  title: string;
  content: string;
  userId: string;
}

const app = express();
const boardb = new BoarDB();

app.use(express.json());

app.use(
  boardb.apiWrapper({
    excludePaths: ["/health"],
    includeBody: false,
  })
);

// Start BoarDB dashboard
boardb.startBoarDB(3333);

// Auto-connect to database if environment variables are set
if (
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_NAME
) {
  boardb
    .connectDB({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
    .then(() => {
      console.log("✅ Auto-connected to database");
    })
    .catch((err: Error) => {
      console.log("❌ Auto-connect failed:", err.message);
    });
}

const users: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

const posts: Post[] = [
  { id: 1, title: "First Post", content: "Hello World", userId: 1 },
  { id: 2, title: "Second Post", content: "This is a test", userId: 2 },
  { id: 3, title: "Third Post", content: "Another post", userId: 1 },
];

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/api/users", (req: Request, res: Response) => {
  setTimeout(() => {
    res.json(users);
  }, Math.random() * 100 + 50);
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  setTimeout(() => {
    res.json(user);
  }, Math.random() * 200 + 100);
});

app.post(
  "/api/users",
  (req: Request<{}, User, CreateUserRequest>, res: Response) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const newUser: User = {
      id: users.length + 1,
      name,
      email,
    };

    users.push(newUser);

    setTimeout(() => {
      res.status(201).json(newUser);
    }, Math.random() * 300 + 200);
  }
);

app.put(
  "/api/users/:id",
  (req: Request<{ id: string }, User, UpdateUserRequest>, res: Response) => {
    const user = users.find((u) => u.id === parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;

    setTimeout(() => {
      res.json(user);
    }, Math.random() * 250 + 150);
  }
);

app.delete("/api/users/:id", (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users.splice(index, 1);

  setTimeout(() => {
    res.status(204).send();
  }, Math.random() * 100 + 50);
});

app.get("/api/posts", (req: Request, res: Response) => {
  setTimeout(() => {
    res.json(posts);
  }, Math.random() * 150 + 75);
});

app.get("/api/posts/:id", (req: Request, res: Response) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  setTimeout(() => {
    res.json(post);
  }, Math.random() * 200 + 100);
});

app.post(
  "/api/posts",
  (req: Request<{}, Post, CreatePostRequest>, res: Response) => {
    const { title, content, userId } = req.body;

    if (!title || !content || !userId) {
      return res
        .status(400)
        .json({ error: "Title, content, and userId are required" });
    }

    const newPost: Post = {
      id: posts.length + 1,
      title,
      content,
      userId: parseInt(userId),
    };

    posts.push(newPost);

    setTimeout(() => {
      res.status(201).json(newPost);
    }, Math.random() * 400 + 300);
  }
);

app.get("/api/error", (req: Request, res: Response) => {
  res.status(500).json({ error: "This is a test error endpoint" });
});

app.get("/api/slow", (req: Request, res: Response) => {
  setTimeout(() => {
    res.json({ message: "This was a slow endpoint" });
  }, 2000 + Math.random() * 1000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🚀 BoarDB dashboard available at: http://localhost:3333`);
  console.log(`\n🧪 Test endpoints:`);
  console.log(`- GET /api/users`);
  console.log(`- GET /api/users/:id`);
  console.log(`- POST /api/users`);
  console.log(`- PUT /api/users/:id`);
  console.log(`- DELETE /api/users/:id`);
  console.log(`- GET /api/posts`);
  console.log(`- GET /api/posts/:id`);
  console.log(`- POST /api/posts`);
  console.log(`- GET /api/error (returns 500)`);
  console.log(`- GET /api/slow (slow response)`);
  console.log(
    `\n💡 Try making requests to these endpoints to see them in the BoarDB dashboard!`
  );
});

// Importações principais para configurar o servidor e o banco de dados
import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';
import 'dotenv/config';


// Criação da aplicação Express
const app = express();
app.use(express.json()); // Middleware para interpretar requisições JSON

// Configuração do banco de dados usando TypeORM
const AppDataSource = new DataSource({
  type: "mysql", // Banco de dados MySQL
  host: process.env.DB_HOST || "localhost", // Host do banco
  port: 3306, // Porta padrão do MySQL
  username: process.env.DB_USER || "root", // Usuário do banco
  password: process.env.DB_PASSWORD || "password", // Senha do banco
  database: process.env.DB_NAME || "test_db", // Nome do banco de dados
  entities: [User, Post], // Entidades gerenciadas pelo TypeORM
  synchronize: true, // Sincroniza automaticamente as entidades com o banco
});

// Função para inicializar o banco de dados com tolerância a falhas
const initializeDatabase = async () => {
  let retries = 10; // Número de tentativas de reconexão
  while (retries) {
    try {
      await AppDataSource.initialize(); // Tenta inicializar a conexão
      console.log("Data Source has been initialized!");
      break; // Sai do loop caso tenha sucesso
    } catch (err) {
      console.error("Error during Data Source initialization:", err);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, 5000)); // Aguarda 5 segundos antes de tentar novamente
    }
  }

  if (!retries) {
    console.error("Could not connect to the database. Exiting...");
    process.exit(1); // Sai do processo caso a conexão falhe
  }
};

// Inicializa o banco de dados
initializeDatabase();

// Rotas para operações com usuários

/**
 * Endpoint para listar todos os usuários
 * Rota: GET /users
 */
app.get('/users', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

/**
 * Endpoint para criar um novo usuário
 * Rota: POST /users
 */
app.post('/users', async (req, res) => {
  const { firstName, lastName, email } = req.body;
  try {
    const userRepository = AppDataSource.getRepository(User);

    // Cria um novo usuário e salva no banco de dados
    const newUser = userRepository.create({ firstName, lastName, email });
    await userRepository.save(newUser);

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

/**
 * Endpoint para atualizar um usuário existente
 * Rota: PUT /users/:id
 */
app.put('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { firstName, lastName, email } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);

    // Busca o usuário pelo ID
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Atualiza apenas os campos fornecidos
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    // Salva as alterações no banco de dados
    await userRepository.save(user);

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
});

/**
 * Endpoint para deletar um usuário
 * Rota: DELETE /users/:id
 */
app.delete('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const userRepository = AppDataSource.getRepository(User);

    // Busca o usuário pelo ID
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove o usuário do banco de dados
    await userRepository.remove(user);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Rotas para operações com posts

/**
 * Endpoint para criar um novo post associado a um usuário
 * Rota: POST /posts
 */
app.post('/posts', async (req, res) => {
  const { title, description, userId } = req.body;

  if (!title || !description || !userId) {
    return res.status(400).json({ message: "Title, description, and userId are required" });
  }

  try {
    const postRepository = AppDataSource.getRepository(Post);
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPost = postRepository.create({ title, description, user });
    await postRepository.save(newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});


/**
 * Endpoint para listar os posts de um usuário
 * Rota: GET /users/:id/posts
 */
app.get('/users/:id/posts', async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const postRepository = AppDataSource.getRepository(Post);

    // Busca os posts pelo ID do usuário
    const posts = await postRepository.find({ where: { user: { id: userId } } });
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

/**
 * Endpoint para atualizar um post
 * Rota: PUT /posts/:id
 */
app.put('/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, description } = req.body;

  try {
    const postRepository = AppDataSource.getRepository(Post);

    // Busca o post pelo ID
    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Atualiza apenas os campos fornecidos
    post.title = title || post.title;
    post.description = description || post.description;

    // Salva as alterações no banco de dados
    await postRepository.save(post);

    res.status(200).json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Error updating post" });
  }
});

/**
 * Endpoint para deletar um post
 * Rota: DELETE /posts/:id
 */
app.delete('/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);

  try {
    const postRepository = AppDataSource.getRepository(Post);

    // Busca o post pelo ID
    const post = await postRepository.findOne({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Remove o post do banco de dados
    await postRepository.remove(post);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
});

// Inicializa o servidor na porta definida
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

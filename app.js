import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import User from './models/User.js';
import checkToken from './middleware/auth.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'sua_chave_secreta_sessions',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/projeto2node',
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true em produção
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true 
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Frontend')));
app.use('/IMG', express.static(path.join(__dirname, 'IMG')));

// Rota principal - serve o HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Rota para o dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'dashboard.html'));
});

// Rota para testar conexão com o banco
app.get('/status', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    res.json({
        message: 'Status do servidor',
        database: statusMap[dbStatus] || 'unknown',
        session: req.sessionID ? 'active' : 'none',
        timestamp: new Date().toISOString()
    });
});

// Rota protegida
app.get('/user/profile', checkToken, (req, res) => {
    res.json({
        msg: 'Rota protegida acessada com sucesso!',
        user: req.user,
        sessionId: req.sessionID
    });
});


app.get('/session/check', (req, res) => {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            userId: req.session.userId,
            sessionId: req.sessionID
        });
    } else {
        res.json({
            authenticated: false,
            sessionId: req.sessionID
        });
    }
});

// Rota para logout (sessão)
app.post('/session/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ msg: 'Erro ao fazer logout' });
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.json({ msg: 'Logout realizado com sucesso' });
    });
});




app.post('/auth/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Validações
    if (!name) return res.status(422).json({ msg: "O nome é obrigatório" });
    if (!email) return res.status(422).json({ msg: "O email é obrigatório" });
    if (!password) return res.status(422).json({ msg: "A senha é obrigatória" });
    if (password !== confirmPassword) {
        return res.status(422).json({ msg: "As senhas não conferem" });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(422).json({ msg: "Por favor, utilize outro email!" });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: passwordHash,
        });

        await user.save();
        
       
        req.session.userId = user._id;
        req.session.userEmail = user.email;

        // Gerar JWT 
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(
            { id: user._id },
            secret,
            { expiresIn: '1d' }
        );
        
        res.status(201).json({ 
            msg: "Usuário criado com sucesso!",
            token,
            sessionId: req.sessionID,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro no servidor!" });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email) return res.status(422).json({ msg: "O email é obrigatório" });
    if (!password) return res.status(422).json({ msg: "A senha é obrigatória" });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" });
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        if (!checkPassword) {
            return res.status(422).json({ msg: "Senha inválida!" });
        }

        // Criar sessão
        req.session.userId = user._id;
        req.session.userEmail = user.email;

        // Gerar JWT (mantendo compatibilidade)
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(
            { id: user._id },
            secret,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            msg: "Autenticação realizada com sucesso!",
            token,
            sessionId: req.sessionID,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro no servidor!" });
    }
});

// CONEXÃO COM O MONGODB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projeto2node';

mongoose.connect(mongoURI)
    .then(() => {
        console.log(' Conectado ao MongoDB com sucesso!');
        console.log(`Database: ${mongoose.connection.name}`);
        console.log(`Host: ${mongoose.connection.host}`);
        console.log(`Atlas: ${mongoURI.includes('mongodb.net') ? 'Sim' : 'Não'}`);
        console.log(`Sessions habilitadas`);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(` Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        console.log('Verifique se a string de conexão do Atlas está correta no arquivo .env');
        process.exit(1);
    });

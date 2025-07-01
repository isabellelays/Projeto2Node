import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const checkToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ msg: 'Acesso negado!' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        
        // Buscar usuário no banco
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ msg: 'Token inválido!' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ msg: 'Token inválido!' });
    }
};

export default checkToken; 
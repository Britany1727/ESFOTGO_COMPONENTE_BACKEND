import { Router } from 'express';
import { verificarTokenJWT, verificarRolesPermitidos } from '../middlewares/JWT.js';
import {
    getMessages,
    sendMessage
} from '../controllers/chat_controllers.js';
import {
    getOrCreateConversation,
    getConversations,
    getConversationMessages,
    sendPrivateMessage
} from '../controllers/private_chat_controllers.js';

const routerChat = Router();

// Chat general (solo admin y docente)
routerChat.get('/chat/messages', verificarTokenJWT, verificarRolesPermitidos('admin', 'docente'), getMessages);
routerChat.post('/chat/messages', verificarTokenJWT, verificarRolesPermitidos('admin', 'docente'), sendMessage);

// Chat privado (requiere JWT)
routerChat.post('/chat/conversation', verificarTokenJWT, getOrCreateConversation);
routerChat.get('/chat/conversations', verificarTokenJWT, getConversations);
routerChat.get('/chat/conversation/:id/messages', verificarTokenJWT, getConversationMessages);
routerChat.post('/chat/private-message', verificarTokenJWT, sendPrivateMessage);

export default routerChat;

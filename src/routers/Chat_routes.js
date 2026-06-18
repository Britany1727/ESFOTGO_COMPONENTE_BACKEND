import { Router } from 'express';
import { verificarTokenJWT } from '../middlewares/JWT.js';
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

// Chat general (público - opcional JWT)
routerChat.get('/chat/messages', getMessages);
routerChat.post('/chat/messages', sendMessage);

// Chat privado (requiere JWT)
routerChat.post('/chat/conversation', verificarTokenJWT, getOrCreateConversation);
routerChat.get('/chat/conversations', verificarTokenJWT, getConversations);
routerChat.get('/chat/conversation/:id/messages', verificarTokenJWT, getConversationMessages);
routerChat.post('/chat/private-message', verificarTokenJWT, sendPrivateMessage);

export default routerChat;

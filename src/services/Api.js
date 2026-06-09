import axios from 'axios';
import storeAuth from '../context/storeAuth';

// Configuración base de la API - ajusta la URL según tu backend
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
    'Content-Type': 'application/json'
}
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const { token } = storeAuth.getState();
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
    },
    (error) => {
    return Promise.reject(error);
}
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
        // Token expirado o inválido
        storeAuth.getState().clearToken();
        window.location.href = '/login';
        }
        return Promise.reject(error);
    }
    );

// ============ SERVICIOS ADMIN ============
export const adminService = {
  // Autenticación
    registro: (data) => api.post('/registro', data),
    login: (credentials) => api.post('/login', credentials),
    confirmarMail: (token) => api.get(`/confirmar/${token}`),
    recuperarPassword: (email) => api.post('/recuperarpassword', { email }),
    comprobarTokenPassword: (token) => api.get(`/recuperarpassword/${token}`),
    nuevoPassword: (token, password) => api.post(`/nuevopassword/${token}`, { password }),
    
    // Perfil
    perfil: () => api.get('/perfil'),
    actualizarPerfil: (id, data) => api.put(`/actualizarperfil/${id}`, data),
    actualizarPassword: (id, data) => api.put(`/actualizarpassword/${id}`, data),
    
    // Eventos
    crearEvento: (data) => api.post('/evento', data),
    listarEventos: () => api.get('/eventos'),
    obtenerEvento: (id) => api.get(`/evento/${id}`),
    };

    // ============ SERVICIOS DOCENTE ============
    export const docenteService = {
    // Autenticación
    registro: (data) => api.post('/docente/registro', data),
    login: (credentials) => api.post('/docente/login', credentials),
    confirmarMail: (token) => api.get(`/docente/confirmar/${token}`),
    recuperarPassword: (email) => api.post('/docente/recuperarpassword', { email }),
    comprobarTokenPassword: (token) => api.get(`/docente/recuperarpassword/${token}`),
    nuevoPassword: (token, password) => api.post(`/docente/nuevopassword/${token}`, { password }),
    
    // Perfil
    perfil: () => api.get('/docente/perfil'),
    actualizarPerfil: (id, data) => api.put(`/docente/actualizarperfil/${id}`, data),
    actualizarPassword: (id, data) => api.put(`/docente/actualizarpassword/${id}`, data),
    
    // Eventos
    crearEvento: (data) => api.post('/docente/evento', data),
    listarEventos: () => api.get('/docente/eventos'),
    obtenerEvento: (id) => api.get(`/docente/evento/${id}`),
    };

    // ============ SERVICIOS USER============
    export const estudianteService = {
    // Autenticación
    registro: (data) => api.post('/user/registro', data),
    login: (credentials) => api.post('/user/login', credentials),
    confirmarMail: (token) => api.get(`/user/confirmar/${token}`),
    recuperarPassword: (email) => api.post('/user/recuperarpassword', { email }),
    comprobarTokenPassword: (token) => api.get(`/user/recuperarpassword/${token}`),
    nuevoPassword: (token, password) => api.post(`/user/nuevopassword/${token}`, { password }),
    
    // Perfil
    perfil: () => api.get('/user/perfil'),
    actualizarPerfil: (id, data) => api.put(`/user/actualizarperfil/${id}`, data),
    actualizarPassword: (id, data) => api.put(`/user/actualizarpassword/${id}`, data),
    
    // Eventos (solo visualización y registro)
    listarEventos: () => api.get('/user/eventos'),
    obtenerEvento: (id) => api.get(`/user/evento/${id}`),
    registrarseEvento: (eventoId) => api.post(`/user/evento/${eventoId}/registrar`),
    cancelarRegistroEvento: (eventoId) => api.delete(`/user/evento/${eventoId}/registrar`),
    misEventos: () => api.get('/user/mis-eventos'),
    };

    // Función helper para obtener el servicio según el rol
    export const getServiceByRole = (rol) => {
    switch(rol) {
        case 'admin':
        return adminService;
        case 'docente':
        return docenteService;
        case 'estudiante':
        case 'invitado':
        return estudianteService;
        default:
        return estudianteService;
    }
    };

    export default api;
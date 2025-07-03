const BASE_URL = 'http://localhost:3000';

const API_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000 
};

// Elementos do DOM
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const responseDiv = document.getElementById('response');

// Função para exibir mensagens na tela
function showMessage(message, type = 'info') {
    responseDiv.textContent = message;
    responseDiv.className = `response ${type}`;
}

// Validação de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validação de senha
function isValidPassword(password) {
    return password.length >= 6;
}

// Limpa os campos do formulário
function clearForm(form) {
    form.reset();
}

// Requisição com fetch + headers + token
async function makeRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
        ...API_CONFIG,
        ...options,
        headers: {
            ...API_CONFIG.headers,
            ...options.headers,
            ...(token && { Authorization: `Bearer ${token}` })
        }
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        return {
            ok: response.ok,
            status: response.status,
            data,
            headers: response.headers
        };
    } catch (error) {
        throw new Error(`Erro na requisição: ${error.message}`);
    }
}

// Requisição de registro
async function registerUser(userData) {
    const url = `${BASE_URL}/auth/register`;
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

// Requisição de login
async function loginUser(credentials) {
    const url = `${BASE_URL}/auth/login`;
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

// Evento de registro
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!name || !email || !password || !confirmPassword) {
            showMessage('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Por favor, insira um email válido.', 'error');
            return;
        }

        if (!isValidPassword(password)) {
            showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.', 'error');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';

        try {
            const result = await registerUser({ name, email, password, confirmPassword });

            if (result.ok) {
                showMessage(result.data.msg || 'Usuário registrado com sucesso!', 'success');
                clearForm(registerForm);
            } else {
                showMessage(result.data.msg || result.data.error || result.data.message || 'Erro ao registrar usuário.', 'error');
            }
        } catch (err) {
            showMessage('Erro ao conectar com o servidor.', 'error');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar';
        }
    });
}

// Evento de login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showMessage('Todos os campos são obrigatórios.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Por favor, insira um email válido.', 'error');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        try {
            const result = await loginUser({ email, password });

            if (result.ok && result.data.token) {
                localStorage.setItem('token', result.data.token);
                if (result.data.user) {
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                }

                showMessage('Login realizado com sucesso!', 'success');
                clearForm(loginForm);
            } else {
                showMessage(result.data.msg || result.data.error || result.data.message || 'Email ou senha incorretos.', 'error');
            }
        } catch (err) {
            showMessage('Erro ao conectar com o servidor.', 'error');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showMessage('Logout realizado com sucesso!', 'success');
}

// Validação de token
async function validateToken() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const result = await makeRequest(`${BASE_URL}/auth/validate`, { method: 'GET' });
        return result.ok;
    } catch {
        return false;
    }
}

// Testar conexão com a API
async function testAPIConnection() {
    try {
        const res = await fetch(`${BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            const data = await res.json();
            console.log('✅ API conectada:', data);
            showMessage('API conectada com sucesso!', 'success');
        } else {
            showMessage(`API respondeu com status: ${res.status}`, 'info');
        }
    } catch (error) {
        console.error('Erro ao testar API:', error);
        showMessage('Erro ao conectar com a API.', 'error');
    }
}

// Testar endpoint qualquer (útil para debug)
async function testEndpoint(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            ...(data && ['POST', 'PUT'].includes(method) && { body: JSON.stringify(data) })
        };

        const res = await fetch(`${BASE_URL}${endpoint}`, options);
        const resData = await res.json();

        console.log(`📡 ${method} ${endpoint}:`, resData);
        return { ok: res.ok, status: res.status, data: resData };
    } catch (error) {
        console.error(`Erro ao chamar ${endpoint}:`, error);
        throw error;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        const isValid = await validateToken();
        if (isValid) {
            showMessage('Você já está logado!', 'info');
        } else {
            logout();
        }
    }

    testAPIConnection();
});


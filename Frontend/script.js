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
    
    // Limpar mensagem após 5 segundos
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            responseDiv.textContent = '';
            responseDiv.className = 'response';
        }, 5000);
    }
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


async function makeRequest(url, options = {}) {
    const config = {
        ...API_CONFIG,
        ...options,
        headers: {
            ...API_CONFIG.headers,
            ...options.headers
        },
        credentials: 'include' 
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

async function registerUser(userData) {
    const url = `${BASE_URL}/auth/register`;
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

async function loginUser(credentials) {
    const url = `${BASE_URL}/auth/login`;
    return await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

// Logout
async function logout() {
    try {
        const url = `${BASE_URL}/session/logout`;
        const result = await makeRequest(url, { method: 'POST' });
        
        if (result.ok) {
            showMessage('Logout realizado com sucesso!', 'success');
        } else {
            showMessage('Erro ao fazer logout', 'error');
        }
    } catch (error) {
        showMessage('Erro ao fazer logout', 'error');
    }
    
    
    hideUserInfo();
}

// Obter perfil do usuário
async function getUserProfile() {
    const url = `${BASE_URL}/user/profile`;
    return await makeRequest(url, { method: 'GET' });
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
                
                // Redirecionar para o dashboard após 3 segundos
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 3000);
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

            if (result.ok) {
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                
                showMessage('Login realizado com sucesso!', 'success');
                clearForm(loginForm);
                
                // Redirecionar para o dashboard após 3 segundos
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 3000);
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

// Carregar perfil do usuário
async function loadUserProfile() {
    try {
        const result = await getUserProfile();
        
        if (result.ok) {
            const user = result.data.user;
            console.log('Perfil carregado:', user);
            
            // Mostrar informações do usuário na interface
            showUserInfo(user);
        } else {
            console.log('Erro ao carregar perfil:', result.data);
            hideUserInfo();
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        hideUserInfo();
    }
}

// Verificar autenticação existente
async function checkAuthentication() {
    try {
        const result = await getUserProfile();
        if (result.ok) {
            console.log('Usuário já autenticado');
            await loadUserProfile();
            return true;
        }
    } catch (error) {
        console.log('Usuário não autenticado');
    }

    return false;
}

// Testar conexão com a API
async function testAPIConnection() {
    updateApiStatus('checking', 'Verificando conexão...');
    
    try {
        const result = await makeRequest(`${BASE_URL}/status`, { method: 'GET' });

        if (result.ok) {
            console.log('✅ API conectada:', result.data);
            updateApiStatus('online', `API Online - DB: ${result.data.database}`);
        } else {
            updateApiStatus('offline', `API Offline - Status: ${result.status}`);
        }
    } catch (error) {
        console.error('Erro ao testar API:', error);
        updateApiStatus('offline', 'API Offline - Erro de conexão');
    }
}


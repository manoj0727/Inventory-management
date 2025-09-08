// Authentication System
const AUTH_KEY = 'qr_inventory_auth';
const USERS_KEY = 'qr_inventory_users';

// Initialize default users if not exists
function initializeUsers() {
    const existingUsers = localStorage.getItem(USERS_KEY);
    if (!existingUsers) {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'System Administrator',
                email: 'admin@qrinventory.com'
            },
            {
                id: 2,
                username: 'employee1',
                password: 'emp123',
                role: 'employee',
                name: 'John Doe',
                email: 'john@qrinventory.com',
                department: 'Production'
            },
            {
                id: 3,
                username: 'employee2',
                password: 'emp456',
                role: 'employee',
                name: 'Jane Smith',
                email: 'jane@qrinventory.com',
                department: 'Quality Control'
            }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth) {
        const authData = JSON.parse(auth);
        // Check if session is still valid (24 hours)
        if (authData.timestamp && Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
            return authData;
        } else {
            // Session expired
            logout();
        }
    }
    return null;
}

// Get current user
function getCurrentUser() {
    const auth = isAuthenticated();
    return auth ? auth.user : null;
}

// Login function
function login(username, password, role) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role
    );
    
    if (user) {
        // Create session
        const authData = {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            },
            timestamp: Date.now()
        };
        
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        return { success: true, user: authData.user };
    }
    
    return { success: false, message: 'Invalid credentials or role' };
}

// Logout function
function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '/login.html';
}

// Protect page function
function protectPage(allowedRoles = []) {
    const auth = isAuthenticated();
    
    if (!auth) {
        window.location.href = '/login.html';
        return false;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(auth.user.role)) {
        alert('You do not have permission to access this page');
        window.location.href = auth.user.role === 'admin' ? '/index.html' : '/employee-portal.html';
        return false;
    }
    
    return true;
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeUsers();
    
    // Check if already logged in
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html')) {
        const auth = isAuthenticated();
        if (auth) {
            // Redirect based on role
            window.location.href = auth.user.role === 'admin' ? '/index.html' : '/employee-portal.html';
        }
        
        // Handle login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const role = document.getElementById('role').value;
                const rememberMe = document.getElementById('rememberMe').checked;
                
                const result = login(username, password, role);
                
                if (result.success) {
                    // Redirect based on role
                    window.location.href = result.user.role === 'admin' ? '/index.html' : '/employee-portal.html';
                } else {
                    // Show error message
                    const errorMsg = document.getElementById('errorMessage');
                    errorMsg.textContent = result.message;
                    errorMsg.classList.add('show');
                    
                    // Hide error after 3 seconds
                    setTimeout(() => {
                        errorMsg.classList.remove('show');
                    }, 3000);
                }
            });
        }
    }
});
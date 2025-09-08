// Global variables
let html5QrCode;
let currentTransactionsPage = 1;
let transactionsPerPage = 50;
let allTransactions = [];
let filteredTransactions = [];
let onlineUsers = [];
let activityFeed = [];
let productTracking = {};
let reportCharts = {};

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            mainContent.style.marginLeft = '0';
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

// Collapse sidebar
function collapseSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const topHeader = document.querySelector('.top-header');
    
    sidebar.classList.toggle('collapsed');
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    if (isCollapsed) {
        if (mainContent) mainContent.style.marginLeft = '70px';
        if (topHeader) topHeader.style.left = '70px';
    } else {
        if (mainContent) mainContent.style.marginLeft = '250px';
        if (topHeader) topHeader.style.left = '250px';
    }
}

// Show section
function showSection(sectionId, event) {
    if (event) {
        event.preventDefault();
    }
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    const pageTitles = {
        'dashboard': 'Dashboard',
        'create-product': 'Create Product',
        'scan-qr': 'Scan QR Code',
        'inventory': 'Inventory Management',
        'transactions': 'Transaction History',
        'reports': 'Reports & Analytics'
    };
    
    const currentPage = document.getElementById('current-page');
    if (currentPage) {
        currentPage.textContent = pageTitles[sectionId] || 'Dashboard';
    }
    
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (sectionId === 'dashboard') {
        loadDashboardData();
    } else if (sectionId === 'inventory') {
        loadInventoryComponent();
    } else if (sectionId === 'transactions') {
        if (allTransactions.length === 0) {
            loadTransactions();
        } else {
            displayTransactions();
        }
    } else if (sectionId === 'reports') {
        initReports();
    }
}

// Load Inventory Component
async function loadInventoryComponent() {
    const container = document.getElementById('inventory-component-container');
    if (!container) return;
    
    // Check if component is already loaded
    if (container.querySelector('.inventory-container')) {
        // Component already loaded, just refresh data
        if (window.inventoryManager) {
            inventoryManager.loadInventory();
        }
        return;
    }
    
    try {
        // Load the component HTML
        const response = await fetch('components/inventory/inventory-component.html');
        const html = await response.text();
        container.innerHTML = html;
        
        // Initialize the inventory manager
        if (window.inventoryManager) {
            inventoryManager.init();
        }
    } catch (error) {
        console.error('Error loading inventory component:', error);
        container.innerHTML = '<p>Error loading inventory component</p>';
    }
}

// QR Scanner functions
function startScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const cameraInfo = document.getElementById('camera-info');
    const cameraLoading = document.getElementById('camera-loading');
    
    scannerContainer.style.display = 'block';
    cameraInfo.textContent = 'Initializing camera...';
    cameraLoading.style.display = 'block';

    html5QrCode = new Html5Qrcode("reader");
    
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            const cameraId = devices[0].id;
            html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Scan error
                }
            ).then(() => {
                cameraInfo.textContent = 'Camera ready! Point at QR code to scan.';
                cameraLoading.style.display = 'none';
            }).catch(err => {
                cameraInfo.textContent = 'Error starting camera: ' + err;
                cameraLoading.style.display = 'none';
            });
        }
    }).catch(err => {
        cameraInfo.textContent = 'No cameras found or permission denied.';
        cameraLoading.style.display = 'none';
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-container').style.display = 'none';
            showNotification('Scanner stopped', 'info');
        });
    }
}

function showManualEntry() {
    document.getElementById('manual-entry').style.display = 'block';
}

function manualLookup() {
    const productId = document.getElementById('manual-product-id').value.trim();
    if (productId) {
        lookupProduct(productId);
    } else {
        showNotification('Please enter a product ID', 'warning');
    }
}

function onScanSuccess(decodedText) {
    stopScanner();
    lookupProduct(decodedText);
}

function lookupProduct(productId) {
    fetch(`/api/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Product not found');
            }
            return response.json();
        })
        .then(product => {
            displayProductDetails(product);
            document.getElementById('scan-result').style.display = 'block';
            showNotification('Product found!', 'success');
        })
        .catch(error => {
            showNotification('Product not found: ' + error.message, 'error');
        });
}

function displayProductDetails(product) {
    const detailsDiv = document.getElementById('product-details');
    detailsDiv.innerHTML = `
        <div class="product-card">
            <h3>${product.name || 'Unknown Product'}</h3>
            <p><strong>Product ID:</strong> ${product.id || product.product_id || 'N/A'}</p>
            <p><strong>Current Stock:</strong> ${product.stock_quantity || 0} items</p>
            <p><strong>Price:</strong> ₹${product.price || 0}</p>
            <p><strong>Category:</strong> ${product.category || 'General'}</p>
        </div>
    `;
}

// Dashboard functions
function loadDashboardData() {
    Promise.all([
        fetch('/api/dashboard/stats').catch(() => ({ ok: false })),
        fetch('/api/products').catch(() => ({ ok: false })),
        fetch('/api/transactions?limit=5').catch(() => ({ ok: false }))
    ]).then(responses => {
        responses.forEach((response, index) => {
            if (response.ok) {
                response.json().then(data => {
                    if (index === 0) updateDashboardStats(data);
                    else if (index === 1) updateProductStats(data);
                    else if (index === 2) updateRecentActivity(data);
                });
            }
        });
    });
}

function updateDashboardStats(stats) {
    if (stats) {
        document.getElementById('total-products').textContent = stats.totalProducts || 0;
        document.getElementById('total-items').textContent = stats.totalItems || 0;
        document.getElementById('product-types').textContent = stats.productTypes || 0;
        document.getElementById('recent-transactions').textContent = stats.recentTransactions || 0;
        document.getElementById('low-stock').textContent = stats.lowStock || 0;
    }
}

function updateProductStats(products) {
    if (Array.isArray(products)) {
        document.getElementById('total-products').textContent = products.length;
        const totalItems = products.reduce((sum, product) => sum + (product.stock_quantity || 0), 0);
        document.getElementById('total-items').textContent = totalItems;
        
        const categories = [...new Set(products.map(p => p.category || 'General'))];
        document.getElementById('product-types').textContent = categories.length;
        
        const lowStock = products.filter(p => (p.stock_quantity || 0) < 10).length;
        document.getElementById('low-stock').textContent = lowStock;
    }
}

function updateRecentActivity(transactions) {
    if (Array.isArray(transactions)) {
        document.getElementById('recent-transactions').textContent = transactions.length;
    }
}

// Transaction functions
function loadTransactions() {
    fetch('/api/transactions')
        .then(response => {
            if (!response.ok) {
                throw new Error('API not available');
            }
            return response.json();
        })
        .then(transactions => {
            allTransactions = Array.isArray(transactions) ? transactions : [];
            filteredTransactions = [...allTransactions];
            updateTransactionsSummary();
            displayTransactions();
        })
        .catch(error => {
            console.log('Error loading transactions:', error);
            allTransactions = [];
            filteredTransactions = [];
            updateTransactionsSummary();
            displayTransactions();
        });
}

function getTransactionStatus(transactionType) {
    const statusMap = {
        'STOCK_IN': 'Stock In',
        'STOCK_OUT': 'Stock Out',
        'SALE': 'Removed',
        'INITIAL_STOCK': 'Updated',
        'UPDATE': 'Updated',
        'ADJUSTMENT': 'Updated'
    };
    return statusMap[transactionType] || transactionType;
}

function updateTransactionsSummary() {
    const total = filteredTransactions.length;
    const recordCount = document.getElementById('trans-record-count');
    if (recordCount) {
        recordCount.textContent = `${total} Transactions`;
    }
}

function displayTransactions() {
    const tbody = document.getElementById('transactions-list');
    const startIndex = (currentTransactionsPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);

    if (pageTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #666;">No transactions found</td></tr>';
        const emptyState = document.querySelector('.empty-state.trans-empty');
        if (emptyState) emptyState.style.display = 'none';
        return;
    } else {
        const emptyState = document.querySelector('.empty-state.trans-empty');
        if (emptyState) emptyState.style.display = 'none';
    }

    tbody.innerHTML = pageTransactions.map((transaction, index) => {
        const transactionId = transaction.product_id || `PRD-${String(startIndex + index + 1).padStart(3, '0')}`;
        const date = new Date(transaction.created_at || Date.now());
        const actionType = transaction.transaction_type || 'STOCK_IN';
        const typeClass = actionType === 'STOCK_IN' || actionType === 'INITIAL_STOCK' ? 'type-in' : 
                        actionType === 'STOCK_OUT' || actionType === 'SALE' ? 'type-out' : 'type-sale';
        const qtyClass = actionType === 'STOCK_OUT' || actionType === 'SALE' ? 'negative' : 'positive';
        const qtySign = actionType === 'STOCK_OUT' || actionType === 'SALE' ? '-' : '+';
        
        return `
            <tr>
                <td class="trans-id">
                    <a href="#" class="link">${transactionId}</a>
                </td>
                <td class="timestamp">
                    <span class="date">${date.toLocaleDateString()}</span>
                    <span class="time">${date.toLocaleTimeString()}</span>
                </td>
                <td class="product-name">
                    <div class="name-cell">
                        <span class="name">${transaction.product_name || 'Unknown Product'}</span>
                        <span class="sub-info">ID: ${transaction.id || 'N/A'}</span>
                    </div>
                </td>
                <td class="trans-type">
                    <span class="type-badge ${typeClass}">
                        ${getTransactionStatus(actionType)}
                    </span>
                </td>
                <td class="size">${transaction.size || '-'}</td>
                <td class="quantity">
                    <span class="qty-change ${qtyClass}">${qtySign}${Math.abs(transaction.quantity || 0)}</span>
                </td>
                <td class="user">${transaction.performed_by || 'System'}</td>
                <td class="location">
                    <span class="location-badge">${transaction.location || 'Main'}</span>
                </td>
            </tr>
        `;
    }).join('');

    const recordCount = document.getElementById('trans-record-count');
    if (recordCount) {
        recordCount.textContent = `${filteredTransactions.length} Transactions`;
    }
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    const startRecord = ((currentTransactionsPage - 1) * transactionsPerPage) + 1;
    const endRecord = Math.min(currentTransactionsPage * transactionsPerPage, filteredTransactions.length);
    
    const transStart = document.getElementById('trans-start-record');
    const transEnd = document.getElementById('trans-end-record');
    const transTotal = document.getElementById('trans-total-records');
    
    if (transStart) transStart.textContent = filteredTransactions.length > 0 ? startRecord : 0;
    if (transEnd) transEnd.textContent = endRecord;
    if (transTotal) transTotal.textContent = filteredTransactions.length;
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) prevBtn.disabled = currentTransactionsPage <= 1;
    if (nextBtn) nextBtn.disabled = currentTransactionsPage >= totalPages;
    
    const paginationDiv = document.querySelector('#transactions .pagination');
    if (paginationDiv && totalPages > 0) {
        const prevBtn = paginationDiv.querySelector('#prev-btn');
        const nextBtn = paginationDiv.querySelector('#next-btn');
        
        const existingPageNumbers = paginationDiv.querySelectorAll('.page-number, .page-dots');
        existingPageNumbers.forEach(el => el.remove());
        
        let pageButtonsHTML = '';
        
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pageButtonsHTML += `<button class="page-number ${i === currentTransactionsPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
            }
        } else {
            if (currentTransactionsPage <= 3) {
                for (let i = 1; i <= 5; i++) {
                    pageButtonsHTML += `<button class="page-number ${i === currentTransactionsPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
                }
                pageButtonsHTML += `<span class="page-dots">...</span>`;
                pageButtonsHTML += `<button class="page-number" onclick="goToPage(${totalPages})">${totalPages}</button>`;
            } else if (currentTransactionsPage >= totalPages - 2) {
                pageButtonsHTML += `<button class="page-number" onclick="goToPage(1)">1</button>`;
                pageButtonsHTML += `<span class="page-dots">...</span>`;
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pageButtonsHTML += `<button class="page-number ${i === currentTransactionsPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
                }
            } else {
                pageButtonsHTML += `<button class="page-number" onclick="goToPage(1)">1</button>`;
                pageButtonsHTML += `<span class="page-dots">...</span>`;
                for (let i = currentTransactionsPage - 1; i <= currentTransactionsPage + 1; i++) {
                    pageButtonsHTML += `<button class="page-number ${i === currentTransactionsPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
                }
                pageButtonsHTML += `<span class="page-dots">...</span>`;
                pageButtonsHTML += `<button class="page-number" onclick="goToPage(${totalPages})">${totalPages}</button>`;
            }
        }
        
        if (nextBtn) {
            nextBtn.insertAdjacentHTML('beforebegin', pageButtonsHTML);
        }
    }
}

function previousPage() {
    if (currentTransactionsPage > 1) {
        currentTransactionsPage--;
        displayTransactions();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    if (currentTransactionsPage < totalPages) {
        currentTransactionsPage++;
        displayTransactions();
    }
}

function goToPage(pageNumber) {
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        currentTransactionsPage = pageNumber;
        displayTransactions();
    }
}

function filterTransactions() {
    const dateFilter = document.getElementById('date-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();

    filteredTransactions = allTransactions.filter(transaction => {
        if (dateFilter !== 'all') {
            const transactionDate = new Date(transaction.created_at || Date.now());
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            switch (dateFilter) {
                case 'today':
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    if (transactionDate < todayStart || transactionDate > today) return false;
                    break;
                case 'week':
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    weekAgo.setHours(0, 0, 0, 0);
                    if (transactionDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    monthAgo.setHours(0, 0, 0, 0);
                    if (transactionDate < monthAgo) return false;
                    break;
                case 'year':
                    const yearAgo = new Date();
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    yearAgo.setHours(0, 0, 0, 0);
                    if (transactionDate < yearAgo) return false;
                    break;
            }
        }

        if (typeFilter !== 'all' && transaction.transaction_type !== typeFilter) {
            return false;
        }
        
        if (searchTerm && searchTerm !== '') {
            const searchMatch = 
                (transaction.product_name || '').toLowerCase().includes(searchTerm) ||
                (transaction.product_id || '').toLowerCase().includes(searchTerm) ||
                (transaction.performed_by || '').toLowerCase().includes(searchTerm) ||
                (transaction.location || '').toLowerCase().includes(searchTerm) ||
                (transaction.size || '').toLowerCase().includes(searchTerm);
            
            if (!searchMatch) return false;
        }

        return true;
    });

    currentTransactionsPage = 1;
    updateTransactionsSummary();
    displayTransactions();
    updateFilterIndicators();
}

function searchTransactions() {
    filterTransactions();
}

function clearAllFilters() {
    document.getElementById('date-filter').value = 'all';
    document.getElementById('type-filter').value = 'all';
    document.getElementById('search-transactions').value = '';
    
    filteredTransactions = [...allTransactions];
    currentTransactionsPage = 1;
    
    updateTransactionsSummary();
    displayTransactions();
    updateFilterIndicators();
    
    const btn = document.querySelector('.clear-filters-btn');
    if (btn) {
        btn.style.background = '#667eea';
        btn.style.color = 'white';
        setTimeout(() => {
            btn.style.background = '';
            btn.style.color = '';
        }, 300);
    }
}

function updateFilterIndicators() {
    const dateFilter = document.getElementById('date-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const searchTerm = document.getElementById('search-transactions').value;
    const clearBtn = document.querySelector('.clear-filters-btn');
    
    const hasActiveFilters = dateFilter !== 'all' || typeFilter !== 'all' || searchTerm !== '';
    
    if (clearBtn) {
        clearBtn.style.display = hasActiveFilters ? 'flex' : 'none';
    }
    
    const dateSelect = document.getElementById('date-filter');
    const typeSelect = document.getElementById('type-filter');
    
    if (dateSelect) {
        if (dateFilter !== 'all') {
            dateSelect.style.borderColor = '#667eea';
            dateSelect.style.background = '#f0f4ff';
        } else {
            dateSelect.style.borderColor = '';
            dateSelect.style.background = '';
        }
    }
    
    if (typeSelect) {
        if (typeFilter !== 'all') {
            typeSelect.style.borderColor = '#667eea';
            typeSelect.style.background = '#f0f4ff';
        } else {
            typeSelect.style.borderColor = '';
            typeSelect.style.background = '';
        }
    }
}

function updateTransPerPage() {
    const perPageSelect = document.getElementById('per-page-trans');
    if (perPageSelect) {
        transactionsPerPage = parseInt(perPageSelect.value);
        currentTransactionsPage = 1;
        displayTransactions();
        updatePagination();
        
        perPageSelect.style.borderColor = '#667eea';
        setTimeout(() => {
            perPageSelect.style.borderColor = '';
        }, 300);
    }
}

// Real-time tracking functions (simplified)
function initializeRealtimeTracking() {
    loadOnlineUsers();
    loadLoginActivity(); 
    loadProductTracking();
    loadActivityFeed();
    
    setInterval(checkOnlineUsers, 5000);
    setInterval(updateActivityFeed, 3000);
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'userActivities' || e.key === 'onlineUsers' || e.key === 'productTracking') {
            loadOnlineUsers();
            loadLoginActivity();
            loadActivityFeed();
            loadProductTracking();
        }
    });
}

function loadOnlineUsers() {
    onlineUsers = [];
    updateOnlineUsersDisplay();
}

function updateOnlineUsersDisplay() {
    const container = document.getElementById('online-users');
    const count = document.getElementById('online-count');
    
    if (!container) return;
    
    count.textContent = onlineUsers.length;
    
    if (onlineUsers.length === 0) {
        container.innerHTML = '<div class="no-users">No users currently online</div>';
        return;
    }
    
    container.innerHTML = onlineUsers.map(user => `
        <div class="online-user-item">
            <div class="user-info">
                <div class="user-avatar">${(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <span class="user-name">${user.name || user.username}</span>
                    <span class="user-role">${user.role}</span>
                </div>
            </div>
            <div class="user-status">
                <span class="login-time">N/A</span>
                <span class="status-dot"></span>
            </div>
        </div>
    `).join('');
}

function loadLoginActivity() {
    const activities = [];
    const loginActivities = activities
        .filter(a => a.type === 'login')
        .slice(0, 10);
    
    const container = document.getElementById('login-activity');
    if (!container) return;
    
    if (loginActivities.length === 0) {
        container.innerHTML = '<div class="no-activity">No recent login activity</div>';
        return;
    }
    
    container.innerHTML = loginActivities.map(activity => {
        const isLogin = activity.type === 'login';
        return `
            <div class="log-item ${isLogin ? 'login' : 'logout'}">
                <i class="fas fa-${isLogin ? 'sign-in-alt' : 'sign-out-alt'} log-icon ${isLogin ? 'login' : 'logout'}"></i>
                <div class="log-content">
                    <span class="log-user">${activity.user?.name || activity.user?.username || 'Unknown'}</span> ${activity.description}
                    <div class="log-time">N/A</div>
                </div>
            </div>
        `;
    }).join('');
}

function loadProductTracking() {
    const storedTracking = [];
    const onlineUsersList = [];
    
    Object.keys(storedTracking).forEach(userId => {
        const isOnline = onlineUsersList.some(u => u.id === userId);
        storedTracking[userId].isOnline = isOnline;
    });
    
    productTracking = storedTracking;
    updateProductTrackingDisplay();
}

function updateProductTrackingDisplay() {
    const tbody = document.getElementById('product-tracking-body');
    if (!tbody) return;
    
    const trackingData = Object.values(productTracking);
    
    if (trackingData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No product activity data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = trackingData.map(user => `
        <tr>
            <td class="employee-name">${user.name}</td>
            <td><span class="role-badge employee">Employee</span></td>
            <td><span class="product-count">${user.todayProducts || 0}</span></td>
            <td>N/A</td>
            <td>
                <span class="status-${user.isOnline ? 'online' : 'offline'}">
                    <i class="fas fa-circle"></i> ${user.isOnline ? 'Online' : 'Offline'}
                </span>
            </td>
            <td>
                <button class="view-details-btn" onclick="viewUserDetails('${user.id}')">
                    View Details
                </button>
            </td>
        </tr>
    `).join('');
}

function updateProductTracking(period) {
    console.log('Updating product tracking for period:', period);
    loadProductTracking();
}

function loadActivityFeed() {
    activityFeed = [];
    updateActivityFeedDisplay('all');
}

function updateActivityFeedDisplay(filter) {
    const container = document.getElementById('live-activity-feed');
    if (!container) return;
    
    let filteredFeed = activityFeed;
    if (filter !== 'all') {
        filteredFeed = activityFeed.filter(item => {
            if (filter === 'login') return item.type === 'login';
            if (filter === 'products') return item.type === 'product';
            return true;
        });
    }
    
    if (filteredFeed.length === 0) {
        container.innerHTML = '<div class="no-activity">No activity to display</div>';
        return;
    }
    
    container.innerHTML = filteredFeed.map(item => `
        <div class="feed-item">
            <div class="feed-icon ${item.type === 'product' ? 'product' : item.type}">
                <i class="fas fa-${item.type === 'login' ? 'sign-in-alt' : 'box'}"></i>
            </div>
            <div class="feed-content">
                <div class="feed-title">${item.user?.name || item.user?.username || 'System'}</div>
                <div class="feed-description">${item.description}</div>
                <div class="feed-timestamp">N/A</div>
            </div>
        </div>
    `).join('');
}

function checkOnlineUsers() {
    loadOnlineUsers();
}

function updateActivityFeed() {
    loadActivityFeed();
}

function clearLoginHistory() {
    if (confirm('Are you sure you want to clear the login history?')) {
        document.getElementById('login-activity').innerHTML = '<div class="no-activity">Login history cleared</div>';
        showNotification('Login history cleared successfully', 'success');
    }
}

function viewUserDetails(userName) {
    showNotification(`Viewing details for ${userName}`, 'info');
}

// Reports functions
async function initReports() {
    try {
        const response = await fetch('/api/reports/summary');
        const reportData = await response.json();
        
        updateReportsMetrics(reportData);
        createReportCharts(reportData);
        
        showNotification('Reports loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
        updateReportsMetricsFallback();
    }
}

function updateReportsMetrics(data) {
    if (data.products) {
        document.getElementById('total-value-metric').textContent = '₹' + (data.products.total_value || 0).toFixed(0);
        document.getElementById('total-products-metric').textContent = data.products.total_products || 0;
        document.getElementById('deleted-items-metric').textContent = data.products.deleted_products || 0;
        
        document.getElementById('value-change').innerHTML = `<span style="color: #059669">${data.products.total_items || 0} items in stock</span>`;
        document.getElementById('products-change').innerHTML = `<span>${data.products.out_of_stock || 0} out of stock</span>`;
        document.getElementById('deleted-change').innerHTML = `<span style="color: #dc2626">${data.products.deleted_products || 0} removed</span>`;
    }
}

function updateReportsMetricsFallback() {
    document.getElementById('total-value-metric').textContent = '₹0';
    document.getElementById('total-products-metric').textContent = '0';
    document.getElementById('deleted-items-metric').textContent = '0';
}

function createReportCharts(data) {
    Object.values(reportCharts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    createStockMovementChart(data.daily_activity || []);
    createCategoryChart(data.categories || []);
    createStockStatusChart(data.products || {});
    createTopProductsChart(data.top_products || []);
}

function createStockMovementChart(activityData) {
    const ctx = document.getElementById('stockMovementChart').getContext('2d');
    
    const generateLast30Days = () => {
        const dates = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return dates;
    };
    
    const labels = activityData.length > 0 
        ? activityData.map(d => d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
        : generateLast30Days();
        
    const stockIn = activityData.length > 0 
        ? activityData.map(d => d.stock_in || 0)
        : Array(30).fill(0).map(() => Math.floor(Math.random() * 50) + 10);
        
    const stockOut = activityData.length > 0 
        ? activityData.map(d => d.stock_out || 0)
        : Array(30).fill(0).map(() => Math.floor(Math.random() * 40) + 5);
    
    reportCharts.stockMovement = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock In',
                data: stockIn,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }, {
                label: 'Stock Out',
                data: stockOut,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createCategoryChart(categories) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const labels = categories.map(c => c.category || 'Unknown');
    const quantities = categories.map(c => c.total_quantity || 0);
    
    reportCharts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Shirts', 'Pants', 'Jackets', 'Others'],
            datasets: [{
                data: quantities.length ? quantities : [45, 30, 15, 10],
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function createStockStatusChart(productStats) {
    const ctx = document.getElementById('stockStatusChart').getContext('2d');
    
    const inStock = (productStats.total_products || 0) - (productStats.out_of_stock || 0) - (productStats.low_stock || 0);
    
    reportCharts.stockStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['In Stock', 'Low Stock', 'Out of Stock'],
            datasets: [{
                data: [inStock, productStats.low_stock || 0, productStats.out_of_stock || 0],
                backgroundColor: ['#059669', '#f59e0b', '#dc2626']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createTopProductsChart(topProducts) {
    const ctx = document.getElementById('topProductsChart').getContext('2d');
    const labels = topProducts.slice(0, 5).map(p => p.name || 'Unknown');
    const quantities = topProducts.slice(0, 5).map(p => p.quantity || 0);
    
    reportCharts.topProducts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Product 1', 'Product 2', 'Product 3', 'Product 4', 'Product 5'],
            datasets: [{
                label: 'Quantity',
                data: quantities.length ? quantities : [50, 45, 40, 35, 30],
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateStockChart(type) {
    if (reportCharts.stockMovement) {
        reportCharts.stockMovement.config.type = type;
        reportCharts.stockMovement.update();
        
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase() === type) {
                btn.classList.add('active');
            }
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            closeNotification(notification.querySelector('.notification-close'));
        }
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    if (notification) {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
}

// Header Functions
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('active');
    
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.closest('.user-menu-wrapper')) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function showProfile() {
    showNotification('Profile page coming soon', 'info');
}

function showSettings() {
    showNotification('Settings panel coming soon', 'info');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    const inventoryForm = document.getElementById('inventory-action-form');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const actionData = {
                qr_data: document.getElementById('manual-product-id')?.value || 'scanned-product',
                action: formData.get('action') || document.getElementById('action').value,
                quantity: parseInt(formData.get('quantity') || document.getElementById('quantity').value),
                performed_by: formData.get('performed_by') || document.getElementById('performed-by').value,
                location: formData.get('location') || document.getElementById('location').value,
                notes: formData.get('notes') || document.getElementById('notes').value
            };

            fetch('/api/inventory/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(actionData)
            })
            .then(response => response.json())
            .then(result => {
                if (result.error) {
                    showNotification('Error: ' + result.error, 'error');
                } else {
                    showNotification('Inventory updated successfully!', 'success');
                    this.reset();
                    document.getElementById('scan-result').style.display = 'none';
                    loadDashboardData();
                }
            })
            .catch(error => {
                showNotification('Network error: ' + error.message, 'error');
            });
        });
    }
    
    showSection('dashboard');
    loadTransactions();
    
    setTimeout(() => {
        updateFilterIndicators();
    }, 100);
    
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        const topHeader = document.querySelector('.top-header');
        
        sidebar.classList.add('collapsed');
        if (mainContent) mainContent.style.marginLeft = '70px';
        if (topHeader) topHeader.style.left = '70px';
    }
    
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            mainContent.style.marginLeft = '';
            document.body.style.overflow = 'auto';
        }
    });

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid #3b82f6;
            }
            
            .notification-success { border-left-color: #10b981; }
            .notification-error { border-left-color: #ef4444; }
            .notification-warning { border-left-color: #f59e0b; }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                color: #6b7280;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        const filterButtons = document.querySelectorAll('.feed-controls .filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateActivityFeedDisplay(this.dataset.filter);
            });
        });
        
        initializeRealtimeTracking();
    }, 1500);
});
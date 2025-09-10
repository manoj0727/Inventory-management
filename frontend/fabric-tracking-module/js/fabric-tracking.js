// Global variables
let fabricsData = [];
let cuttingsData = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    loadFabrics();
    loadCuttings();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Fabric form submission
    document.getElementById('fabricForm').addEventListener('submit', handleFabricSubmission);
    
    // Cutting form submission
    document.getElementById('cuttingForm').addEventListener('submit', handleCuttingSubmission);
    
    // Calculate total meters when pieces or meter per piece changes
    const piecesInput = document.getElementById('piecesCount');
    const meterPerPieceInput = document.getElementById('meterPerPiece');
    const totalMetersInput = document.getElementById('totalMetersUsed');
    
    function calculateTotal() {
        const pieces = parseFloat(piecesInput.value) || 0;
        const meterPerPiece = parseFloat(meterPerPieceInput.value) || 0;
        const total = pieces * meterPerPiece;
        totalMetersInput.value = total.toFixed(2);
    }
    
    if (piecesInput) piecesInput.addEventListener('input', calculateTotal);
    if (meterPerPieceInput) meterPerPieceInput.addEventListener('input', calculateTotal);
}

// Toggle mobile menu
function toggleMenu() {
    const navButtons = document.getElementById('navButtons');
    const hamburger = document.getElementById('hamburger');
    navButtons.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Navigation function
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Close mobile menu after selection
    const navButtonsContainer = document.getElementById('navButtons');
    const hamburger = document.getElementById('hamburger');
    if (window.innerWidth <= 768) {
        navButtonsContainer.classList.remove('active');
        hamburger.classList.remove('active');
    }
    
    // Load data when switching to dashboard or cutting section
    if (sectionName === 'dashboard') {
        loadFabrics();
    } else if (sectionName === 'cutting') {
        loadFabricsForCutting();
        loadCuttings();
    } else if (sectionName === 'viewCutting') {
        loadCuttings();
        updateCuttingDashboard();
        populateCuttingTable();
    }
}

// Handle fabric form submission
async function handleFabricSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const fabricData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/fabrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fabricData)
        });
        
        if (response.ok) {
            showMessage('Fabric registered successfully!', 'success');
            event.target.reset();
            loadFabrics();
        } else {
            const error = await response.json();
            showMessage('Error: ' + error.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Handle cutting form submission
async function handleCuttingSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const cuttingData = Object.fromEntries(formData.entries());
    
    // Calculate total meters if not already calculated
    cuttingData.totalMetersUsed = parseFloat(cuttingData.piecesCount) * parseFloat(cuttingData.meterPerPiece);
    
    // Validate quantity
    const selectedFabric = fabricsData.find(f => f._id === cuttingData.fabricId);
    if (selectedFabric && cuttingData.totalMetersUsed > selectedFabric.quantity) {
        showMessage('Error: Not enough fabric in stock. Available: ' + selectedFabric.quantity + ' meters', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/cutting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cuttingData)
        });
        
        if (response.ok) {
            showMessage('Cutting recorded successfully!', 'success');
            event.target.reset();
            loadFabrics();
            loadCuttings();
            loadFabricsForCutting();
        } else {
            const error = await response.json();
            showMessage('Error: ' + error.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Load fabrics from API
async function loadFabrics() {
    try {
        const response = await fetch('/api/fabrics');
        fabricsData = await response.json();
        
        updateDashboard();
        populateFabricTable();
        
    } catch (error) {
        console.error('Error loading fabrics:', error);
        showMessage('Error loading fabrics: ' + error.message, 'error');
    }
}

// Load cuttings from API
async function loadCuttings() {
    try {
        const response = await fetch('/api/cutting');
        cuttingsData = await response.json();
        
        displayCuttingHistory();
        updateCuttingDashboard();
        populateCuttingTable();
        
    } catch (error) {
        console.error('Error loading cuttings:', error);
        showMessage('Error loading cutting history: ' + error.message, 'error');
    }
}

// Load fabrics for cutting dropdown
async function loadFabricsForCutting() {
    const fabricSelect = document.getElementById('fabricSelect');
    fabricSelect.innerHTML = '<option value="">Choose a fabric</option>';
    
    // Only show fabrics with quantity > 0
    const availableFabrics = fabricsData.filter(fabric => fabric.quantity > 0);
    
    availableFabrics.forEach(fabric => {
        const option = document.createElement('option');
        option.value = fabric._id;
        option.textContent = `${fabric.fabricType} - ${fabric.color} (${fabric.quantity}m available)`;
        fabricSelect.appendChild(option);
    });
}

// Update dashboard statistics
function updateDashboard() {
    const totalFabrics = fabricsData.length;
    const inStock = fabricsData.filter(fabric => fabric.status === 'In Stock').length;
    const lowStock = fabricsData.filter(fabric => fabric.quantity <= 10 && fabric.quantity > 0).length;
    
    document.getElementById('totalFabrics').textContent = totalFabrics;
    document.getElementById('inStock').textContent = inStock;
    document.getElementById('lowStock').textContent = lowStock;
}

// Populate fabric table
function populateFabricTable() {
    const tableBody = document.getElementById('fabricTableBody');
    tableBody.innerHTML = '';
    
    fabricsData.forEach(fabric => {
        const row = document.createElement('tr');
        
        // Add row class based on stock level
        if (fabric.quantity === 0) {
            row.classList.add('out-of-stock');
        } else if (fabric.quantity <= 10) {
            row.classList.add('low-stock');
        }
        
        row.innerHTML = `
            <td>${fabric.fabricType}</td>
            <td>${fabric.color}</td>
            <td>${fabric.quality}</td>
            <td>${fabric.quantity} meters</td>
            <td>${fabric.supplier}</td>
            <td>${new Date(fabric.dateReceived).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-${fabric.status.toLowerCase().replace(' ', '-')}">
                    ${fabric.status}
                </span>
            </td>
            <td>${fabric.employeeName}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Display cutting history
function displayCuttingHistory() {
    const historyContainer = document.getElementById('cuttingHistory');
    historyContainer.innerHTML = '';
    
    // Sort by date (most recent first)
    const sortedCuttings = cuttingsData.sort((a, b) => new Date(b.cuttingDate) - new Date(a.cuttingDate));
    
    sortedCuttings.slice(0, 10).forEach(cutting => { // Show last 10 records
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        const fabricInfo = cutting.fabricId ? 
            `${cutting.fabricId.fabricType} - ${cutting.fabricId.color}` : 
            'Unknown Fabric';
        
        historyItem.innerHTML = `
            <h4>${cutting.productName}</h4>
            <p><strong>Fabric:</strong> ${fabricInfo}</p>
            <p><strong>Pieces Cut:</strong> ${cutting.piecesCount || '-'}</p>
            <p><strong>Meter/Piece:</strong> ${cutting.meterPerPiece || '-'} meters</p>
            <p><strong>Total Used:</strong> ${cutting.totalMetersUsed || cutting.quantityUsed || '-'} meters</p>
            <p><strong>Location:</strong> ${cutting.usageLocation || '-'}</p>
            <p><strong>Date:</strong> ${new Date(cutting.cuttingDate).toLocaleDateString()}</p>
            <p><strong>Cut By:</strong> ${cutting.employeeName}</p>
            ${cutting.notes ? `<p><strong>Notes:</strong> ${cutting.notes}</p>` : ''}
        `;
        
        historyContainer.appendChild(historyItem);
    });
    
    if (sortedCuttings.length === 0) {
        historyContainer.innerHTML = '<p>No cutting history available.</p>';
    }
}

// Show success/error messages
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(type === 'success' ? 'success-message' : 'error-message');
    messageDiv.textContent = message;
    
    // Insert message at the top of the active section
    const activeSection = document.querySelector('.section.active');
    const firstChild = activeSection.firstElementChild;
    activeSection.insertBefore(messageDiv, firstChild);
    
    // Auto-remove message after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Add CSS classes for stock status
const additionalStyles = `
    .out-of-stock {
        background-color: #ffebee !important;
    }
    
    .low-stock {
        background-color: #fff3e0 !important;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .status-in-stock {
        background-color: #c8e6c9;
        color: #2e7d32;
    }
    
    .status-out-of-stock {
        background-color: #ffcdd2;
        color: #c62828;
    }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Update cutting dashboard statistics
function updateCuttingDashboard() {
    const totalCuts = cuttingsData.length;
    const totalFabricUsed = cuttingsData.reduce((sum, cutting) => {
        return sum + (cutting.totalMetersUsed || cutting.quantityUsed || 0);
    }, 0);
    
    // Count unique products
    const uniqueProducts = new Set(cuttingsData.map(cutting => cutting.productName));
    const totalProducts = uniqueProducts.size;
    
    // Count today's cuts
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todaysCuts = cuttingsData.filter(cutting => 
        new Date(cutting.cuttingDate) >= todayStart
    ).length;
    
    // Update the dashboard elements
    const totalCutsEl = document.getElementById('totalCuts');
    const totalFabricUsedEl = document.getElementById('totalFabricUsed');
    const totalProductsEl = document.getElementById('totalProducts');
    const todaysCutsEl = document.getElementById('todaysCuts');
    
    if (totalCutsEl) totalCutsEl.textContent = totalCuts;
    if (totalFabricUsedEl) totalFabricUsedEl.textContent = totalFabricUsed.toFixed(2);
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (todaysCutsEl) todaysCutsEl.textContent = todaysCuts;
}

// Populate cutting table
function populateCuttingTable() {
    const tableBody = document.getElementById('cuttingTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Sort by date (most recent first)
    const sortedCuttings = cuttingsData.sort((a, b) => new Date(b.cuttingDate) - new Date(a.cuttingDate));
    
    sortedCuttings.forEach(cutting => {
        const row = document.createElement('tr');
        
        const fabricInfo = cutting.fabricId ? 
            `${cutting.fabricId.fabricType} - ${cutting.fabricId.color}` : 
            'Unknown Fabric';
        
        row.innerHTML = `
            <td>${new Date(cutting.cuttingDate).toLocaleDateString()}</td>
            <td>${cutting.productName}</td>
            <td>${fabricInfo}</td>
            <td>${cutting.piecesCount || '-'}</td>
            <td>${cutting.meterPerPiece || '-'}</td>
            <td>${cutting.totalMetersUsed || cutting.quantityUsed || '-'}</td>
            <td>${cutting.usageLocation || '-'}</td>
            <td>${cutting.employeeName}</td>
            <td>${cutting.notes || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    if (sortedCuttings.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="9" style="text-align: center;">No cutting records available</td>';
        tableBody.appendChild(row);
    }
}
// Fabric Manager Module
const fabricManager = {
    fabrics: [],
    recentEntries: [],
    
    // Initialize
    init() {
        this.attachEventListeners();
        this.loadRecentEntries();
        this.setupAutoCalculate();
    },

    // Attach event listeners
    attachEventListeners() {
        const quantityInput = document.getElementById('fabric-quantity');
        const priceInput = document.getElementById('fabric-price');
        
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.calculateTotal());
        }
        if (priceInput) {
            priceInput.addEventListener('input', () => this.calculateTotal());
        }
    },

    // Setup auto-calculate for total value
    setupAutoCalculate() {
        this.calculateTotal();
    },

    // Calculate total value
    calculateTotal() {
        const quantity = parseFloat(document.getElementById('fabric-quantity')?.value) || 0;
        const price = parseFloat(document.getElementById('fabric-price')?.value) || 0;
        const total = quantity * price;
        
        const totalInput = document.getElementById('fabric-total');
        if (totalInput) {
            totalInput.value = `₹${total.toFixed(2)}`;
        }
    },

    // Submit fabric entry
    async submitFabric(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const fabricData = {
            name: formData.get('name'),
            type: formData.get('type'),
            color: formData.get('color'),
            pattern: formData.get('pattern'),
            quantity: parseFloat(formData.get('quantity')),
            unit: formData.get('unit'),
            pricePerUnit: parseFloat(formData.get('pricePerUnit')),
            supplier: formData.get('supplier'),
            invoiceNumber: formData.get('invoiceNumber'),
            location: formData.get('location'),
            minStockLevel: parseInt(formData.get('minStockLevel')) || 10,
            notes: formData.get('notes'),
            enteredBy: localStorage.getItem('currentEmployeeId') || 'EMP-001' // Default for now
        };

        try {
            // Try to save to backend
            const response = await fetch('/api/fabrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fabricData)
            }).catch(() => null);

            if (response && response.ok) {
                const result = await response.json();
                this.showNotification('Fabric added successfully!', 'success');
            } else {
                // Fallback to localStorage
                this.saveToLocalStorage(fabricData);
            }

            // Reset form and reload entries
            this.resetForm();
            this.loadRecentEntries();
            
        } catch (error) {
            console.error('Error saving fabric:', error);
            // Save to localStorage as fallback
            this.saveToLocalStorage(fabricData);
            this.showNotification('Fabric saved locally', 'info');
        }
    },

    // Save to localStorage
    saveToLocalStorage(fabricData) {
        const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
        fabricData.fabricId = 'FAB-' + Date.now();
        fabricData.createdAt = new Date().toISOString();
        fabrics.push(fabricData);
        localStorage.setItem('fabrics', JSON.stringify(fabrics));
        this.showNotification('Fabric saved successfully!', 'success');
    },

    // Load recent entries
    async loadRecentEntries() {
        const container = document.getElementById('recent-fabric-entries');
        if (!container) return;

        try {
            // Try to fetch from API
            const response = await fetch('/api/fabrics/recent').catch(() => null);
            
            if (response && response.ok) {
                this.recentEntries = await response.json();
            } else {
                // Fallback to localStorage
                const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
                this.recentEntries = fabrics.slice(-5).reverse();
            }

            this.displayRecentEntries();
            
        } catch (error) {
            console.error('Error loading recent entries:', error);
            // Use localStorage as fallback
            const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
            this.recentEntries = fabrics.slice(-5).reverse();
            this.displayRecentEntries();
        }
    },

    // Display recent entries
    displayRecentEntries() {
        const container = document.getElementById('recent-fabric-entries');
        if (!container) return;

        if (this.recentEntries.length === 0) {
            container.innerHTML = '<p class="no-data">No recent entries</p>';
            return;
        }

        container.innerHTML = `
            <div class="recent-entries-list">
                ${this.recentEntries.map(fabric => `
                    <div class="recent-entry-item">
                        <div class="entry-header">
                            <span class="entry-id">${fabric.fabricId}</span>
                            <span class="entry-date">${new Date(fabric.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="entry-details">
                            <p><strong>${fabric.name}</strong></p>
                            <p>${fabric.type} - ${fabric.color}</p>
                            <p>${fabric.quantity} ${fabric.unit} @ ₹${fabric.pricePerUnit}/unit</p>
                            <p>Supplier: ${fabric.supplier}</p>
                        </div>
                        <div class="entry-actions">
                            <button class="btn-icon" onclick="fabricManager.viewFabric('${fabric.fabricId}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="fabricManager.editFabric('${fabric.fabricId}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // View fabric details
    viewFabric(fabricId) {
        const fabric = this.findFabric(fabricId);
        if (fabric) {
            alert(`Fabric Details:\n\nID: ${fabric.fabricId}\nName: ${fabric.name}\nType: ${fabric.type}\nColor: ${fabric.color}\nQuantity: ${fabric.quantity} ${fabric.unit}\nLocation: ${fabric.location}`);
        }
    },

    // Edit fabric
    editFabric(fabricId) {
        console.log('Edit fabric:', fabricId);
        this.showNotification('Edit functionality coming soon', 'info');
    },

    // Find fabric by ID
    findFabric(fabricId) {
        const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
        return fabrics.find(f => f.fabricId === fabricId);
    },

    // View inventory
    viewInventory() {
        if (window.showSection) {
            window.showSection('inventory');
        }
    },

    // Scan barcode
    scanBarcode() {
        this.showNotification('Barcode scanning coming soon', 'info');
    },

    // Reset form
    resetForm() {
        const form = document.getElementById('fabric-entry-form');
        if (form) {
            form.reset();
            this.calculateTotal();
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = fabricManager;
}
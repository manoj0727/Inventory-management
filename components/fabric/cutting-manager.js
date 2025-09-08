// Cutting Manager Module
const cuttingManager = {
    availableFabrics: [],
    selectedFabric: null,
    cuttingHistory: [],
    
    // Initialize
    init() {
        this.loadAvailableFabrics();
        this.loadCuttingHistory();
        this.updateStats();
        this.attachEventListeners();
    },

    // Attach event listeners
    attachEventListeners() {
        const quantityInput = document.getElementById('quantity-to-cut');
        const piecesInput = document.getElementById('number-pieces');
        const wastageInput = document.getElementById('expected-wastage');
        
        [quantityInput, piecesInput, wastageInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updatePreview());
            }
        });
    },

    // Load available fabrics
    async loadAvailableFabrics() {
        try {
            // Try API first
            const response = await fetch('/api/fabrics/available').catch(() => null);
            
            if (response && response.ok) {
                this.availableFabrics = await response.json();
            } else {
                // Fallback to localStorage
                const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
                this.availableFabrics = fabrics.filter(f => f.quantity > 0);
            }
            
            this.displayAvailableFabrics();
        } catch (error) {
            console.error('Error loading fabrics:', error);
            const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
            this.availableFabrics = fabrics.filter(f => f.quantity > 0);
            this.displayAvailableFabrics();
        }
    },

    // Display available fabrics
    displayAvailableFabrics() {
        const container = document.getElementById('available-fabrics');
        if (!container) return;

        if (this.availableFabrics.length === 0) {
            container.innerHTML = '<p class="no-data">No fabrics available for cutting</p>';
            return;
        }

        container.innerHTML = `
            <div class="fabric-cards">
                ${this.availableFabrics.map(fabric => `
                    <div class="fabric-card ${this.selectedFabric?.fabricId === fabric.fabricId ? 'selected' : ''}" 
                         onclick="cuttingManager.selectFabric('${fabric.fabricId}')">
                        <div class="fabric-color" style="background-color: ${fabric.color}"></div>
                        <div class="fabric-info">
                            <h4>${fabric.name}</h4>
                            <p>${fabric.type} - ${fabric.color}</p>
                            <p class="fabric-quantity">${fabric.quantity} ${fabric.unit} available</p>
                        </div>
                        <div class="fabric-select">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Select fabric for cutting
    selectFabric(fabricId) {
        this.selectedFabric = this.availableFabrics.find(f => f.fabricId === fabricId);
        
        if (this.selectedFabric) {
            // Update UI
            document.getElementById('selected-fabric-info').style.display = 'block';
            document.getElementById('selected-fabric-name').textContent = 
                `${this.selectedFabric.name} - ${this.selectedFabric.color}`;
            document.getElementById('selected-fabric-quantity').textContent = 
                `${this.selectedFabric.quantity} ${this.selectedFabric.unit} available`;
            
            // Update fabric cards
            this.displayAvailableFabrics();
            
            // Update preview
            this.updatePreview();
        }
    },

    // Change selected fabric
    changeFabric() {
        this.selectedFabric = null;
        document.getElementById('selected-fabric-info').style.display = 'none';
        this.displayAvailableFabrics();
    },

    // Search fabric
    searchFabric() {
        const searchTerm = document.getElementById('fabric-search').value.toLowerCase();
        
        const filtered = this.availableFabrics.filter(fabric => 
            fabric.name.toLowerCase().includes(searchTerm) ||
            fabric.color.toLowerCase().includes(searchTerm) ||
            fabric.type.toLowerCase().includes(searchTerm) ||
            fabric.fabricId.toLowerCase().includes(searchTerm)
        );
        
        const container = document.getElementById('available-fabrics');
        if (filtered.length === 0) {
            container.innerHTML = '<p class="no-data">No matching fabrics found</p>';
            return;
        }
        
        // Temporarily update the display with filtered results
        const temp = this.availableFabrics;
        this.availableFabrics = filtered;
        this.displayAvailableFabrics();
        this.availableFabrics = temp;
    },

    // Update cutting preview
    updatePreview() {
        if (!this.selectedFabric) return;
        
        const quantity = parseFloat(document.getElementById('quantity-to-cut')?.value) || 0;
        const pieces = parseInt(document.getElementById('number-pieces')?.value) || 0;
        const wastagePercent = parseFloat(document.getElementById('expected-wastage')?.value) || 5;
        
        const wastage = (quantity * wastagePercent) / 100;
        const remaining = this.selectedFabric.quantity - quantity - wastage;
        
        document.getElementById('preview-fabric-used').textContent = `${quantity} ${this.selectedFabric.unit}`;
        document.getElementById('preview-pieces').textContent = pieces;
        document.getElementById('preview-wastage').textContent = `${wastage.toFixed(2)} ${this.selectedFabric.unit}`;
        document.getElementById('preview-remaining').textContent = `${remaining.toFixed(2)} ${this.selectedFabric.unit}`;
    },

    // Submit cutting
    async submitCutting(event) {
        event.preventDefault();
        
        if (!this.selectedFabric) {
            this.showNotification('Please select a fabric first', 'error');
            return;
        }
        
        const formData = new FormData(event.target);
        const cuttingData = {
            fabricId: this.selectedFabric.fabricId,
            pattern: formData.get('pattern'),
            quantityCut: parseFloat(formData.get('quantityCut')),
            numberOfPieces: parseInt(formData.get('numberOfPieces')),
            pieceSize: {
                length: parseFloat(formData.get('pieceLength')),
                width: parseFloat(formData.get('pieceWidth')),
                unit: formData.get('sizeUnit')
            },
            wastage: parseFloat(formData.get('wastage')) || 0,
            notes: formData.get('notes'),
            employeeId: localStorage.getItem('currentEmployeeId') || 'EMP-001',
            cuttingDate: new Date().toISOString()
        };
        
        // Validate quantity
        if (cuttingData.quantityCut > this.selectedFabric.quantity) {
            this.showNotification('Insufficient fabric quantity', 'error');
            return;
        }
        
        try {
            // Save cutting record
            this.saveCuttingRecord(cuttingData);
            
            // Update fabric quantity
            this.updateFabricQuantity(this.selectedFabric.fabricId, cuttingData.quantityCut + (cuttingData.wastage || 0));
            
            this.showNotification('Cutting completed successfully!', 'success');
            this.resetForm();
            this.loadAvailableFabrics();
            this.loadCuttingHistory();
            this.updateStats();
            
        } catch (error) {
            console.error('Error saving cutting:', error);
            this.showNotification('Error saving cutting record', 'error');
        }
    },

    // Save cutting record
    saveCuttingRecord(cuttingData) {
        const cuttings = JSON.parse(localStorage.getItem('cuttingRecords') || '[]');
        cuttingData.cuttingId = 'CUT-' + Date.now();
        cuttingData.status = 'cut';
        cuttings.push(cuttingData);
        localStorage.setItem('cuttingRecords', JSON.stringify(cuttings));
    },

    // Update fabric quantity
    updateFabricQuantity(fabricId, usedQuantity) {
        const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
        const fabricIndex = fabrics.findIndex(f => f.fabricId === fabricId);
        
        if (fabricIndex !== -1) {
            fabrics[fabricIndex].quantity -= usedQuantity;
            fabrics[fabricIndex].status = fabrics[fabricIndex].quantity > 0 ? 'available' : 'out_of_stock';
            localStorage.setItem('fabrics', JSON.stringify(fabrics));
        }
    },

    // Load cutting history
    loadCuttingHistory() {
        const cuttings = JSON.parse(localStorage.getItem('cuttingRecords') || '[]');
        this.cuttingHistory = cuttings.sort((a, b) => 
            new Date(b.cuttingDate) - new Date(a.cuttingDate)
        );
        this.displayCuttingHistory();
    },

    // Display cutting history
    displayCuttingHistory() {
        const tbody = document.getElementById('cutting-history-body');
        if (!tbody) return;
        
        const filter = document.getElementById('history-filter')?.value || 'today';
        let filtered = this.filterHistoryByDate(this.cuttingHistory, filter);
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No cutting records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.slice(0, 10).map(cutting => {
            const fabric = this.findFabricById(cutting.fabricId);
            return `
                <tr>
                    <td>${cutting.cuttingId}</td>
                    <td>${fabric ? fabric.name : 'Unknown'}</td>
                    <td>${cutting.pattern}</td>
                    <td>${cutting.numberOfPieces}</td>
                    <td>${cutting.quantityCut} ${fabric?.unit || 'units'}</td>
                    <td>${new Date(cutting.cuttingDate).toLocaleDateString()}</td>
                    <td><span class="status-badge ${cutting.status}">${cutting.status}</span></td>
                    <td>
                        <button class="btn-icon" onclick="cuttingManager.assignToTailor('${cutting.cuttingId}')">
                            <i class="fas fa-user-tie"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Filter history by date
    filterHistoryByDate(history, filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch(filter) {
            case 'today':
                return history.filter(h => new Date(h.cuttingDate) >= today);
            case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return history.filter(h => new Date(h.cuttingDate) >= weekAgo);
            case 'month':
                const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                return history.filter(h => new Date(h.cuttingDate) >= monthAgo);
            default:
                return history;
        }
    },

    // Find fabric by ID
    findFabricById(fabricId) {
        const fabrics = JSON.parse(localStorage.getItem('fabrics') || '[]');
        return fabrics.find(f => f.fabricId === fabricId);
    },

    // Update stats
    updateStats() {
        const cuttings = JSON.parse(localStorage.getItem('cuttingRecords') || '[]');
        const today = new Date().toDateString();
        
        const todayCuts = cuttings.filter(c => 
            new Date(c.cuttingDate).toDateString() === today
        );
        
        document.getElementById('today-cuts').textContent = todayCuts.length;
        document.getElementById('pending-cuts').textContent = 
            cuttings.filter(c => c.status === 'cutting').length;
        document.getElementById('completed-cuts').textContent = 
            cuttings.filter(c => c.status === 'assigned_to_tailor' || c.status === 'completed').length;
    },

    // Assign to tailor
    assignToTailor(cuttingId) {
        if (window.tailorManager) {
            window.tailorManager.showAssignmentForCutting(cuttingId);
        } else {
            this.showNotification('Tailor assignment coming soon', 'info');
        }
    },

    // Filter history
    filterHistory() {
        this.displayCuttingHistory();
    },

    // Scan fabric
    scanFabric() {
        this.showNotification('QR scanning coming soon', 'info');
    },

    // Reset form
    resetForm() {
        document.getElementById('cutting-form').reset();
        this.selectedFabric = null;
        document.getElementById('selected-fabric-info').style.display = 'none';
        this.displayAvailableFabrics();
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
    module.exports = cuttingManager;
}
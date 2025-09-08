// Inventory Manager Module
const inventoryManager = {
    allProducts: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: 10,
    currentQRCode: null,
    currentProductId: null,

    // Initialize inventory
    init() {
        this.attachEventListeners();
        this.loadInventory();
    },

    // Attach event listeners
    attachEventListeners() {
        const searchInput = document.getElementById('inv-search-input');
        const typeFilter = document.getElementById('inv-type-filter');
        const statusFilter = document.getElementById('inv-status-filter');

        if (searchInput) searchInput.addEventListener('input', () => this.filterProducts());
        if (typeFilter) typeFilter.addEventListener('change', () => this.filterProducts());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterProducts());
    },

    // Load inventory data
    async loadInventory() {
        const loading = document.getElementById('inv-loading');
        const table = document.getElementById('inventory-table');
        const emptyState = document.getElementById('inv-empty-state');

        if (loading) loading.style.display = 'block';
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';

        try {
            // Try to fetch from API first
            const response = await fetch('/api/products').catch(() => null);
            
            if (response && response.ok) {
                this.allProducts = await response.json();
            } else {
                // Fallback to localStorage
                this.allProducts = JSON.parse(localStorage.getItem('products') || '[]');
            }
            
            this.updateStats();
            this.filterProducts();
        } catch (error) {
            console.error('Error loading inventory:', error);
            // Use localStorage as fallback
            this.allProducts = JSON.parse(localStorage.getItem('products') || '[]');
            this.updateStats();
            this.filterProducts();
        } finally {
            if (loading) loading.style.display = 'none';
        }
    },

    // Update statistics
    updateStats() {
        const totalProducts = this.allProducts.length;
        const lowStock = this.allProducts.filter(p => p.quantity > 0 && p.quantity <= (p.min_stock_level || 10)).length;
        const outOfStock = this.allProducts.filter(p => p.quantity === 0).length;
        const totalItems = this.allProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('inv-total-products', totalProducts);
        updateElement('inv-low-stock', lowStock);
        updateElement('inv-out-stock', outOfStock);
        updateElement('inv-total-items', totalItems);
    },

    // Filter products
    filterProducts() {
        const searchTerm = document.getElementById('inv-search-input')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('inv-type-filter')?.value || '';
        const statusFilter = document.getElementById('inv-status-filter')?.value || '';

        this.filteredProducts = this.allProducts.filter(product => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (product.name && product.name.toLowerCase().includes(searchTerm)) ||
                (product.product_id && product.product_id.toLowerCase().includes(searchTerm)) ||
                (product.productName && product.productName.toLowerCase().includes(searchTerm)) ||
                (product.color && product.color.toLowerCase().includes(searchTerm));

            // Type filter
            const matchesType = !typeFilter || 
                product.type === typeFilter || 
                product.productCategory === typeFilter;

            // Status filter
            let matchesStatus = true;
            if (statusFilter === 'in-stock') {
                matchesStatus = product.quantity > (product.min_stock_level || 10);
            } else if (statusFilter === 'low-stock') {
                matchesStatus = product.quantity > 0 && product.quantity <= (product.min_stock_level || 10);
            } else if (statusFilter === 'out-stock') {
                matchesStatus = product.quantity === 0;
            }

            return matchesSearch && matchesType && matchesStatus;
        });

        this.currentPage = 1;
        this.displayProducts();
    },

    // Display products in table
    displayProducts() {
        const tbody = document.getElementById('inv-tbody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (this.filteredProducts.length === 0) {
            this.showEmptyState();
            return;
        }

        const table = document.getElementById('inventory-table');
        const emptyState = document.getElementById('inv-empty-state');
        
        if (table) table.style.display = 'table';
        if (emptyState) emptyState.style.display = 'none';

        if (tbody) {
            tbody.innerHTML = productsToShow.map(product => {
                // Handle different data structures
                const productId = product.product_id || product.id || 'N/A';
                const productName = product.name || product.productName || 'Unknown';
                const productType = product.type || product.productCategory || 'Other';
                const productSize = product.size || '-';
                const productColor = product.color || '-';
                const productQuantity = product.quantity || 0;

                let statusBadge = '';
                if (productQuantity === 0) {
                    statusBadge = '<span class="badge out-stock">Out of Stock</span>';
                } else if (productQuantity <= (product.min_stock_level || 10)) {
                    statusBadge = '<span class="badge low-stock">Low Stock</span>';
                } else {
                    statusBadge = '<span class="badge in-stock">In Stock</span>';
                }

                return `
                    <tr>
                        <td class="product-id">${productId}</td>
                        <td><strong>${productName}</strong></td>
                        <td>${productType}</td>
                        <td>${productSize}</td>
                        <td>${productColor}</td>
                        <td class="quantity-display">${productQuantity}</td>
                        <td>${statusBadge}</td>
                        <td class="table-actions-cell">
                            <button class="icon-btn qr" onclick="inventoryManager.showQRCode('${productId}')" title="View QR">
                                <i class="fas fa-qrcode"></i>
                            </button>
                            <button class="icon-btn view" onclick="inventoryManager.viewProduct('${productId}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="icon-btn edit" onclick="inventoryManager.editProduct('${productId}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn delete" onclick="inventoryManager.deleteProduct('${productId}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.updatePagination();
    },

    // Show empty state
    showEmptyState() {
        const table = document.getElementById('inventory-table');
        const emptyState = document.getElementById('inv-empty-state');
        const pagination = document.getElementById('inv-pagination');
        
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
    },

    // Update pagination
    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredProducts.length);

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('inv-showing-from', startIndex);
        updateElement('inv-showing-to', endIndex);
        updateElement('inv-total-records', this.filteredProducts.length);

        // Update page numbers
        const pageNumbers = document.getElementById('inv-page-numbers');
        if (pageNumbers) {
            pageNumbers.innerHTML = '';
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    const btn = document.createElement('button');
                    btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
                    btn.textContent = i;
                    btn.onclick = () => this.goToPage(i);
                    pageNumbers.appendChild(btn);
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    pageNumbers.appendChild(document.createTextNode(' ... '));
                }
            }
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('inv-prev-btn');
        const nextBtn = document.getElementById('inv-next-btn');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;

        const pagination = document.getElementById('inv-pagination');
        if (pagination) pagination.style.display = this.filteredProducts.length > 0 ? 'flex' : 'none';
    },

    // Navigate to page
    goToPage(page) {
        this.currentPage = page;
        this.displayProducts();
    },

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayProducts();
        }
    },

    nextPage() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayProducts();
        }
    },

    // Product actions
    showQRCode(productId) {
        const product = this.allProducts.find(p => 
            p.product_id === productId || p.id === productId
        );
        
        if (product) {
            const modal = document.getElementById('inv-qr-modal');
            const modalImage = document.getElementById('inv-qr-modal-image');
            const modalProductId = document.getElementById('inv-qr-product-id');
            
            if (modal) modal.style.display = 'block';
            if (modalProductId) modalProductId.textContent = productId;
            
            // Generate QR code (placeholder)
            if (modalImage) {
                modalImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(product))}`;
            }
        }
    },

    closeQRModal() {
        const modal = document.getElementById('inv-qr-modal');
        if (modal) modal.style.display = 'none';
    },

    viewProduct(productId) {
        const product = this.allProducts.find(p => 
            p.product_id === productId || p.id === productId
        );
        
        if (product) {
            alert(`Product Details:\n\nID: ${productId}\nName: ${product.name || product.productName}\nQuantity: ${product.quantity}\nType: ${product.type || product.productCategory}`);
        }
    },

    editProduct(productId) {
        // Implement edit functionality
        console.log('Edit product:', productId);
        alert('Edit functionality will be implemented soon');
    },

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.allProducts = this.allProducts.filter(p => 
                p.product_id !== productId && p.id !== productId
            );
            
            // Update localStorage
            localStorage.setItem('products', JSON.stringify(this.allProducts));
            
            // Reload display
            this.updateStats();
            this.filterProducts();
            
            if (window.showNotification) {
                window.showNotification('Product deleted successfully', 'success');
            }
        }
    },

    // Export data
    exportData() {
        const csvContent = "data:text/csv;charset=utf-8," + 
            "Product ID,Name,Type,Size,Color,Quantity,Status\n" +
            this.filteredProducts.map(p => {
                const status = p.quantity === 0 ? 'Out of Stock' : 
                              p.quantity <= 10 ? 'Low Stock' : 'In Stock';
                return `${p.product_id || p.id},${p.name || p.productName},${p.type || p.productCategory},${p.size || '-'},${p.color || '-'},${p.quantity},${status}`;
            }).join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `inventory-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.showNotification) {
            window.showNotification('Inventory exported successfully', 'success');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = inventoryManager;
}
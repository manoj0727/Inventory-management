// Tailor Management System

class TailorManagement {
    constructor() {
        this.tailors = JSON.parse(localStorage.getItem('tailors')) || [];
        this.assignments = JSON.parse(localStorage.getItem('assignments')) || [];
        this.specializations = JSON.parse(localStorage.getItem('specializations')) || [
            'Shirt Tailor', 'Trouser Specialist', 'Suit Maker', 'Dress Maker',
            'Traditional Wear', 'Alterations', 'General Tailor', 'Saree Blouse',
            'Kurta Pajama', 'Wedding Wear', 'Kids Wear', 'Uniform Maker'
        ];
        this.currentTailorId = null;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadSpecializations();
        this.loadTailors();
        this.loadStats();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add Tailor Button
        document.getElementById('add-tailor-btn')?.addEventListener('click', () => {
            this.showAddTailorModal();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Form submissions
        document.getElementById('add-tailor-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTailor(e);
        });

        document.getElementById('assign-work-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAssignWork(e);
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Tailor Management
    addTailor(tailorData) {
        const newTailor = {
            id: Date.now().toString(),
            username: tailorData.username,
            password: tailorData.password,
            fullName: tailorData.fullName,
            phone: tailorData.phone,
            email: tailorData.email,
            specialization: tailorData.specialization,
            experience: tailorData.experience,
            status: 'active',
            createdAt: new Date().toISOString(),
            completedOrders: 0,
            activeOrders: 0,
            rating: 5.0
        };

        this.tailors.push(newTailor);
        this.saveTailors();
        this.loadTailors();
        this.loadStats();
        this.closeModal('add-tailor-modal');
        this.showNotification('Tailor added successfully!', 'success');
    }

    deleteTailor(tailorId) {
        if (confirm('Are you sure you want to delete this tailor?')) {
            this.tailors = this.tailors.filter(t => t.id !== tailorId);
            this.assignments = this.assignments.filter(a => a.tailorId !== tailorId);
            this.saveTailors();
            this.saveAssignments();
            this.loadTailors();
            this.loadStats();
            this.showNotification('Tailor deleted successfully!', 'success');
        }
    }

    toggleTailorStatus(tailorId) {
        const tailor = this.tailors.find(t => t.id === tailorId);
        if (tailor) {
            tailor.status = tailor.status === 'active' ? 'inactive' : 'active';
            this.saveTailors();
            this.loadTailors();
            this.showNotification(`Tailor ${tailor.status === 'active' ? 'activated' : 'deactivated'}!`, 'success');
        }
    }

    // Work Assignment
    assignWork(assignmentData) {
        const assignment = {
            id: Date.now().toString(),
            tailorId: assignmentData.tailorId,
            orderType: assignmentData.orderType,
            description: assignmentData.description,
            quantity: parseInt(assignmentData.quantity),
            fabricType: assignmentData.fabricType,
            deadline: assignmentData.deadline,
            priority: assignmentData.priority,
            status: 'assigned',
            assignedAt: new Date().toISOString(),
            estimatedHours: parseInt(assignmentData.estimatedHours),
            notes: assignmentData.notes
        };

        this.assignments.push(assignment);
        
        // Update tailor's active orders
        const tailor = this.tailors.find(t => t.id === assignmentData.tailorId);
        if (tailor) {
            tailor.activeOrders++;
            tailor.status = 'busy';
        }

        this.saveAssignments();
        this.saveTailors();
        this.loadTailors();
        this.loadStats();
        this.closeModal('assign-work-modal');
        this.showNotification('Work assigned successfully!', 'success');
    }

    completeAssignment(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (assignment) {
            assignment.status = 'completed';
            assignment.completedAt = new Date().toISOString();
            
            const tailor = this.tailors.find(t => t.id === assignment.tailorId);
            if (tailor) {
                tailor.activeOrders = Math.max(0, tailor.activeOrders - 1);
                tailor.completedOrders++;
                if (tailor.activeOrders === 0) {
                    tailor.status = 'active';
                }
            }

            this.saveAssignments();
            this.saveTailors();
            this.loadTailors();
            this.loadStats();
            this.showNotification('Assignment marked as completed!', 'success');
        }
    }

    // UI Methods
    loadTailors() {
        const container = document.getElementById('tailors-container');
        if (!container) return;

        if (this.tailors.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <i class="fas fa-user-tie" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                    <h3 style="color: #6b7280; margin: 0;">No Tailors Added</h3>
                    <p style="color: #9ca3af; margin: 8px 0 0 0;">Add your first tailor to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tailors.map(tailor => this.createTailorCard(tailor)).join('');
    }

    createTailorCard(tailor) {
        const activeAssignments = this.assignments.filter(a => a.tailorId === tailor.id && a.status === 'assigned');
        const overdueAssignments = activeAssignments.filter(a => new Date(a.deadline) < new Date());
        const completionRate = tailor.completedOrders > 0 ? 
            Math.round((tailor.completedOrders / (tailor.completedOrders + tailor.activeOrders)) * 100) : 0;
        
        // Calculate progress for active orders
        const progressPercentage = this.calculateTailorProgress(tailor.id);
        
        return `
            <div class="tailor-card">
                <div class="tailor-header">
                    <div class="tailor-avatar">
                        ${tailor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div class="tailor-info">
                        <h4>${tailor.fullName}</h4>
                        <p>${tailor.specialization} • ${tailor.experience} years exp</p>
                    </div>
                    <span class="status-badge status-${tailor.status}">${tailor.status}</span>
                </div>
                
                ${tailor.activeOrders > 0 ? `
                <div class="progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Current Work Progress</span>
                        <span class="progress-percentage">${progressPercentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="progress-info">
                        <span class="info-item"><i class="fas fa-clock"></i> ${this.getEstimatedCompletion(tailor.id)}</span>
                        ${overdueAssignments.length > 0 ? `<span class="info-item danger"><i class="fas fa-exclamation-triangle"></i> ${overdueAssignments.length} overdue</span>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="tailor-stats">
                    <div class="stat">
                        <span class="stat-number">${tailor.activeOrders}</span>
                        <span class="stat-label">Active</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${tailor.completedOrders}</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${completionRate}%</span>
                        <span class="stat-label">Success Rate</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">⭐ ${tailor.rating}</span>
                        <span class="stat-label">Rating</span>
                    </div>
                </div>
                
                <div class="tailor-actions">
                    <button class="btn btn-primary btn-small" onclick="tailorMgmt.showAssignWorkModal('${tailor.id}')">
                        <i class="fas fa-plus"></i> Assign
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="tailorMgmt.viewTailorProgress('${tailor.id}')">
                        <i class="fas fa-chart-line"></i> Progress
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="tailorMgmt.toggleTailorStatus('${tailor.id}')">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="tailorMgmt.deleteTailor('${tailor.id}')" style="color: #ef4444;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    loadStats() {
        const totalTailors = this.tailors.length;
        const activeTailors = this.tailors.filter(t => t.status === 'active').length;
        const busyTailors = this.tailors.filter(t => t.status === 'busy').length;
        const totalAssignments = this.assignments.length;
        const activeAssignments = this.assignments.filter(a => a.status === 'assigned').length;
        const completedAssignments = this.assignments.filter(a => a.status === 'completed').length;
        const overdueAssignments = this.assignments.filter(a => a.status === 'assigned' && new Date(a.deadline) < new Date()).length;

        // Update stat cards
        this.updateStatCard('total-tailors', totalTailors);
        this.updateStatCard('active-tailors', activeTailors);
        this.updateStatCard('busy-tailors', busyTailors);
        this.updateStatCard('active-assignments', activeAssignments);
        this.updateStatCard('completed-assignments', completedAssignments);
        this.updateStatCard('overdue-assignments', overdueAssignments);
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Modal Management
    showAddTailorModal() {
        document.getElementById('add-tailor-modal').classList.add('active');
    }

    showAssignWorkModal(tailorId) {
        this.currentTailorId = tailorId;
        const tailor = this.tailors.find(t => t.id === tailorId);
        if (tailor) {
            document.getElementById('assignment-tailor-name').textContent = tailor.fullName;
        }
        document.getElementById('assign-work-modal').classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Reset forms
        const forms = document.querySelectorAll(`#${modalId} form`);
        forms.forEach(form => form.reset());
        this.currentTailorId = null;
    }

    viewTailorDetails(tailorId) {
        const tailor = this.tailors.find(t => t.id === tailorId);
        const assignments = this.assignments.filter(a => a.tailorId === tailorId);
        
        if (tailor) {
            alert(`Tailor Details:\n\nName: ${tailor.fullName}\nUsername: ${tailor.username}\nPhone: ${tailor.phone}\nEmail: ${tailor.email}\nSpecialization: ${tailor.specialization}\nExperience: ${tailor.experience} years\nStatus: ${tailor.status}\nActive Orders: ${tailor.activeOrders}\nCompleted Orders: ${tailor.completedOrders}\nTotal Assignments: ${assignments.length}`);
        }
    }

    // Form Handlers
    handleAddTailor(e) {
        const formData = new FormData(e.target);
        const tailorData = {
            username: formData.get('username'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            specialization: formData.get('specialization'),
            experience: formData.get('experience')
        };

        // Validation
        if (this.tailors.find(t => t.username === tailorData.username)) {
            this.showNotification('Username already exists!', 'error');
            return;
        }

        this.addTailor(tailorData);
    }

    handleAssignWork(e) {
        const formData = new FormData(e.target);
        const assignmentData = {
            tailorId: this.currentTailorId,
            orderType: formData.get('orderType'),
            description: formData.get('description'),
            quantity: formData.get('quantity'),
            fabricType: formData.get('fabricType'),
            deadline: formData.get('deadline'),
            priority: formData.get('priority'),
            estimatedHours: formData.get('estimatedHours'),
            notes: formData.get('notes')
        };

        this.assignWork(assignmentData);
    }

    // Storage
    saveTailors() {
        localStorage.setItem('tailors', JSON.stringify(this.tailors));
    }

    saveAssignments() {
        localStorage.setItem('assignments', JSON.stringify(this.assignments));
    }

    // Progress Tracking Methods
    calculateTailorProgress(tailorId) {
        const assignments = this.assignments.filter(a => a.tailorId === tailorId && a.status === 'assigned');
        if (assignments.length === 0) return 0;
        
        let totalProgress = 0;
        assignments.forEach(assignment => {
            const created = new Date(assignment.assignedAt);
            const deadline = new Date(assignment.deadline);
            const now = new Date();
            
            const totalTime = deadline - created;
            const elapsed = now - created;
            const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
            
            totalProgress += progress;
        });
        
        return Math.round(totalProgress / assignments.length);
    }
    
    getEstimatedCompletion(tailorId) {
        const assignments = this.assignments.filter(a => a.tailorId === tailorId && a.status === 'assigned');
        if (assignments.length === 0) return 'No active work';
        
        const nearestDeadline = assignments.reduce((nearest, assignment) => {
            const deadline = new Date(assignment.deadline);
            return deadline < nearest ? deadline : nearest;
        }, new Date('2099-12-31'));
        
        const daysLeft = Math.ceil((nearestDeadline - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) return 'Overdue';
        if (daysLeft === 0) return 'Due today';
        if (daysLeft === 1) return '1 day left';
        return `${daysLeft} days left`;
    }
    
    viewTailorProgress(tailorId) {
        const tailor = this.tailors.find(t => t.id === tailorId);
        const assignments = this.assignments.filter(a => a.tailorId === tailorId);
        
        if (tailor) {
            // Create a detailed progress view
            const progressHTML = `
                <h3>${tailor.fullName} - Progress Report</h3>
                <div style="padding: 20px;">
                    <p><strong>Total Assignments:</strong> ${assignments.length}</p>
                    <p><strong>Active:</strong> ${assignments.filter(a => a.status === 'assigned').length}</p>
                    <p><strong>Completed:</strong> ${assignments.filter(a => a.status === 'completed').length}</p>
                    <p><strong>Progress:</strong> ${this.calculateTailorProgress(tailorId)}%</p>
                    <p><strong>Next Deadline:</strong> ${this.getEstimatedCompletion(tailorId)}</p>
                </div>
            `;
            
            // Show in a temporary alert (you can replace with a modal)
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Progress Report</h2>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    ${progressHTML}
                </div>
            `;
            document.body.appendChild(modal);
        }
    }
    
    // Filter Methods
    filterTailors(filter) {
        this.currentFilter = filter;
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        let filteredTailors = this.tailors;
        
        switch(filter) {
            case 'active':
                filteredTailors = this.tailors.filter(t => t.status === 'active');
                break;
            case 'busy':
                filteredTailors = this.tailors.filter(t => t.status === 'busy');
                break;
            case 'inactive':
                filteredTailors = this.tailors.filter(t => t.status === 'inactive');
                break;
        }
        
        const container = document.getElementById('tailors-container');
        if (filteredTailors.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; grid-column: 1/-1;">
                    <i class="fas fa-filter" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                    <h3 style="color: #6b7280; margin: 0;">No ${filter} tailors found</h3>
                </div>
            `;
        } else {
            container.innerHTML = filteredTailors.map(tailor => this.createTailorCard(tailor)).join('');
        }
    }
    
    // Specialization Management
    loadSpecializations() {
        const datalist = document.getElementById('specialization-list');
        if (datalist) {
            datalist.innerHTML = this.specializations.map(spec => 
                `<option value="${spec}">${spec}</option>`
            ).join('');
        }
    }
    
    manageSpecializations() {
        const currentSpecs = this.specializations.join(', ');
        const newSpecs = prompt('Edit specializations (comma-separated):', currentSpecs);
        
        if (newSpecs !== null) {
            this.specializations = newSpecs.split(',').map(s => s.trim()).filter(s => s);
            localStorage.setItem('specializations', JSON.stringify(this.specializations));
            this.loadSpecializations();
            this.showNotification('Specializations updated successfully!', 'success');
        }
    }
    
    // Notifications
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tailorMgmt = new TailorManagement();
});
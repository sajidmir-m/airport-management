// Staff Portal JavaScript - AI-Powered Airport Operations Management
class StaffPortal {
    constructor() {
        this.currentAirport = null;
        this.conveyorData = null;
        this.staffData = null;
        this.complaintsData = null;
        this.aiInsightsData = null;
        this.refreshInterval = 90000; // 90 seconds (1.5 minutes)
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-bs-target');
                this.loadTabData(targetTab);
            });
        });

        // Theme toggle
        const themeToggle = document.querySelector('[onclick="toggleTheme()"]');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Load data for all airports (staff can monitor multiple)
            await this.loadAllAirportsData();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load staff portal data');
            this.showLoading(false);
        }
    }

    async loadAllAirportsData() {
        // Load data for all airports
        const airports = ['DEL', 'BLR', 'GOX', 'PNY', 'IXJ', 'SXR'];
        
        for (const airportCode of airports) {
            try {
                await this.loadAirportData(airportCode);
            } catch (error) {
                console.error(`Error loading data for ${airportCode}:`, error);
            }
        }
        
        // Set default airport to DEL for initial display
        this.currentAirport = 'DEL';
        this.renderCurrentAirportData();
    }

    async loadAirportData(airportCode) {
        try {
            // Load conveyor system data
            const conveyorResponse = await fetch(`/api/airport/${airportCode}/live-conveyors`);
            const conveyorData = await conveyorResponse.json();
            
            if (!conveyorData.error) {
                if (!this.conveyorData) this.conveyorData = {};
                this.conveyorData[airportCode] = conveyorData;
            }

            // Load staff availability data
            const staffResponse = await fetch(`/api/airport/${airportCode}/staff-availability`);
            const staffData = await staffResponse.json();
            
            if (!staffData.error) {
                if (!this.staffData) this.staffData = {};
                this.staffData[airportCode] = staffData;
            }

            // Load complaints data
            const complaintsResponse = await fetch(`/api/airport/${airportCode}/complaints`);
            const complaintsData = await complaintsResponse.json();
            
            if (!complaintsData.error) {
                if (!this.complaintsData) this.complaintsData = {};
                this.complaintsData[airportCode] = complaintsData;
            }

            // Load AI insights
            const aiResponse = await fetch(`/api/airport/${airportCode}/ai-insights`);
            const aiData = await aiResponse.json();
            
            if (!aiData.error) {
                if (!this.aiInsightsData) this.aiInsightsData = {};
                this.aiInsightsData[airportCode] = aiData;
            }

        } catch (error) {
            console.error(`Error loading data for ${airportCode}:`, error);
        }
    }

    renderCurrentAirportData() {
        if (!this.currentAirport) return;

        this.renderConveyorSystem();
        this.renderStaffManagement();
        this.renderComplaints();
        this.renderAIInsights();
        this.renderAIAlerts();
    }

    renderConveyorSystem() {
        if (!this.currentAirport || !this.conveyorData[this.currentAirport]) return;

        const data = this.conveyorData[this.currentAirport];
        
        // Update overview metrics
        document.getElementById('total-belts').textContent = data.total_belts || 0;
        document.getElementById('active-belts').textContent = data.active_belts || 0;
        document.getElementById('total-bags').textContent = data.total_bags_active || 0;
        document.getElementById('avg-efficiency').textContent = 
            data.system_insights ? `${data.system_insights.system_efficiency || 0}%` : '0%';

        // Render conveyor belts grid
        const gridContainer = document.getElementById('conveyor-belts-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = this.generateConveyorBeltsGrid(data.conveyor_belts);
        
        // Animate conveyor belts
        this.animateConveyorBelts();
    }

    generateConveyorBeltsGrid(belts) {
        if (!belts || belts.length === 0) {
            return '<div class="col-12"><p class="text-center text-muted">No conveyor data available</p></div>';
        }

        return belts.map(belt => {
            const statusClass = `status-${belt.status.toLowerCase()}`;
            const healthClass = `health-${belt.health_status.toLowerCase()}`;
            
            // Generate bag visualization
            const bagsHTML = belt.bags_on_belt.map(bag => {
                const bagClass = `bag-visual ${bag.priority.toLowerCase()}`;
                const leftPosition = `${bag.position}%`;
                
                return `<div class="${bagClass}" style="left: ${leftPosition};" 
                         title="Bag ${bag.bag_id} - ${bag.flight} to ${bag.destination}"></div>`;
            }).join('');

            // Generate sensor data display
            const sensorHTML = this.generateSensorDataDisplay(belt.sensor_data);

            // Generate issues display
            const issuesHTML = this.generateIssuesDisplay(belt.predicted_issues);

            return `
                <div class="conveyor-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">${belt.belt_id}</h5>
                            <small class="text-muted">${belt.terminal}</small>
                        </div>
                        <span class="status-badge ${statusClass}">${belt.status}</span>
                    </div>

                    <div class="conveyor-belt-visual">
                        ${bagsHTML}
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="sensor-data">
                                <small>Speed</small>
                                <div class="sensor-value">${belt.speed.toFixed(1)} m/s</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="sensor-data">
                                <small>Utilization</small>
                                <div class="sensor-value">${belt.utilization}%</div>
                            </div>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="sensor-data">
                                <small>Health</small>
                                <div>
                                    <span class="health-indicator ${healthClass}"></span>
                                    ${belt.health_status}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="efficiency-gauge efficiency-${Math.floor(belt.efficiency_score / 15) * 15}">
                                ${belt.efficiency_score}%
                            </div>
                        </div>
                    </div>

                    ${sensorHTML}
                    ${issuesHTML}

                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary btn-action" onclick="staffPortal.takeAction('${belt.belt_id}', 'monitor')">
                            <i class="fas fa-eye me-1"></i>Monitor
                        </button>
                        <button class="btn btn-sm btn-warning btn-action" onclick="staffPortal.takeAction('${belt.belt_id}', 'maintenance')">
                            <i class="fas fa-tools me-1"></i>Maintenance
                        </button>
                        <button class="btn btn-sm btn-info btn-action" onclick="staffPortal.takeAction('${belt.belt_id}', 'details')">
                            <i class="fas fa-info-circle me-1"></i>Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateSensorDataDisplay(sensorData) {
        if (!sensorData) return '';

        let html = '<div class="row mb-3">';
        
        if (sensorData.weight_sensor) {
            const weight = sensorData.weight_sensor;
            const isOverloaded = weight.current_load > 80;
            html += `
                <div class="col-md-4">
                    <div class="sensor-data ${isOverloaded ? 'bg-warning text-dark' : ''}">
                        <small>Weight Sensor</small>
                        <div class="sensor-value">${weight.current_load}%</div>
                        <small>Max: ${weight.max_capacity}%</small>
                        ${isOverloaded ? '<br><small class="text-danger">Overload Warning!</small>' : ''}
                    </div>
                </div>
            `;
        }
        
        if (sensorData.temperature_sensor) {
            const temp = sensorData.temperature_sensor;
            const isHot = temp.current_temp > 30;
            html += `
                <div class="col-md-4">
                    <div class="sensor-data ${isHot ? 'bg-warning text-dark' : ''}">
                        <small>Temperature</small>
                        <div class="sensor-value">${temp.current_temp.toFixed(1)}°C</div>
                        <small>Max Safe: ${temp.max_safe_temp}°C</small>
                        ${isHot ? '<br><small class="text-danger">High Temperature!</small>' : ''}
                    </div>
                </div>
            `;
        }
        
        if (sensorData.vibration_sensor) {
            const vib = sensorData.vibration_sensor;
            const isHighVibration = vib.vibration_level > 1.5;
            html += `
                <div class="col-md-4">
                    <div class="sensor-data ${isHighVibration ? 'bg-warning text-dark' : ''}">
                        <small>Vibration</small>
                        <div class="sensor-value">${vib.vibration_level.toFixed(1)}</div>
                        <small>Bearing: ${vib.bearing_health}</small>
                        ${isHighVibration ? '<br><small class="text-danger">High Vibration!</small>' : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    generateIssuesDisplay(issues) {
        if (!issues || issues.length === 0) return '';
        
        return `
            <div class="mt-3">
                <h6 class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Issues Detected:</h6>
                ${issues.map(issue => `
                    <div class="alert alert-warning alert-sm py-2 mt-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>${issue.type}</strong><br>
                                <small>${issue.description}</small><br>
                                <small class="text-muted">Action: ${issue.recommended_action}</small>
                            </div>
                            <span class="badge bg-warning">${issue.severity}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderStaffManagement() {
        if (!this.currentAirport || !this.staffData[this.currentAirport]) return;

        const data = this.staffData[this.currentAirport];
        const container = document.getElementById('staff-management-container');
        if (!container) return;

        container.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.total_staff}</h4>
                            <p class="card-text">Total Staff</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.available_staff}</h4>
                            <p class="card-text">Available</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.overall_availability}%</h4>
                            <p class="card-text">Availability</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.total_staff - data.available_staff}</h4>
                            <p class="card-text">Busy/Offline</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <h5>Department Status</h5>
                    <div id="staff-departments-chart" style="height: 300px;"></div>
                </div>
                <div class="col-md-4">
                    <h5>Quick Actions</h5>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="staffPortal.assignStaff()">
                            <i class="fas fa-user-plus me-2"></i>Assign Staff
                        </button>
                        <button class="btn btn-warning" onclick="staffPortal.scheduleMaintenance()">
                            <i class="fas fa-tools me-2"></i>Schedule Maintenance
                        </button>
                        <button class="btn btn-info" onclick="staffPortal.generateReport()">
                            <i class="fas fa-chart-bar me-2"></i>Generate Report
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Render staff chart
        this.renderStaffChart(data);
    }

    renderStaffChart(data) {
        const chartContainer = document.getElementById('staff-departments-chart');
        if (!chartContainer) return;

        const chartData = [{
            x: data.departments.map(d => d.name),
            y: data.departments.map(d => d.availability_percent),
            type: 'bar',
            marker: {
                color: data.departments.map(d => {
                    if (d.availability_percent >= 80) return '#10b981';
                    if (d.availability_percent >= 60) return '#3b82f6';
                    if (d.availability_percent >= 40) return '#f59e0b';
                    return '#ef4444';
                })
            }
        }];

        const layout = {
            title: 'Staff Availability by Department',
            xaxis: { title: 'Department' },
            yaxis: { title: 'Availability %', range: [0, 100] },
            showlegend: false,
            margin: { t: 50, b: 50, l: 50, r: 20 }
        };

        Plotly.newPlot(chartContainer, chartData, layout, {responsive: true});
    }

    renderComplaints() {
        if (!this.currentAirport || !this.complaintsData[this.currentAirport]) return;

        const data = this.complaintsData[this.currentAirport];
        const container = document.getElementById('complaints-container');
        if (!container) return;

        container.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-primary">${data.total_complaints}</h4>
                            <p class="card-text">Total Complaints</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-warning">${data.open_complaints}</h4>
                            <p class="card-text">Open</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-danger">${data.high_priority_complaints}</h4>
                            <p class="card-text">High Priority</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-success">${data.resolved_complaints}</h4>
                            <p class="card-text">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Recent Complaints</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Passenger</th>
                                    <th>Flight</th>
                                    <th>Issue Type</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.complaints.slice(0, 10).map(complaint => `
                                    <tr>
                                        <td><strong>${complaint.complaint_id}</strong></td>
                                        <td>${complaint.passenger_name}</td>
                                        <td>${complaint.flight_number}</td>
                                        <td>${complaint.issue_type}</td>
                                        <td>
                                            <span class="badge ${complaint.priority === 'High' ? 'bg-danger' : 'bg-warning'}">
                                                ${complaint.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge ${complaint.status === 'Resolved' ? 'bg-success' : 'bg-warning'}">
                                                ${complaint.status}
                                            </span>
                                        </td>
                                        <td><small>${complaint.submitted_at}</small></td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="staffPortal.viewComplaint('${complaint.complaint_id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-success" onclick="staffPortal.resolveComplaint('${complaint.complaint_id}')">
                                                <i class="fas fa-check"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderAIInsights() {
        if (!this.currentAirport || !this.aiInsightsData[this.currentAirport]) return;

        const data = this.aiInsightsData[this.currentAirport];
        const container = document.getElementById('ai-insights-container');
        if (!container) return;

        container.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="insight-panel">
                        <h5><i class="fas fa-lightbulb me-2"></i>AI Insights</h5>
                        <ul class="list-unstyled">
                            ${data.insights.map(insight => `
                                <li class="mb-2">
                                    <i class="fas fa-arrow-right me-2"></i>${insight}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="insight-panel">
                        <h5><i class="fas fa-tasks me-2"></i>Recommendations</h5>
                        <ul class="list-unstyled">
                            ${data.recommendations.map(rec => `
                                <li class="mb-2">
                                    <i class="fas fa-check me-2"></i>${rec}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.efficiency_score || 0}%</h4>
                            <p class="card-text">Efficiency Score</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.ai_enabled ? 'Active' : 'Inactive'}</h4>
                            <p class="card-text">AI Status</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4>${data.last_analysis || 'N/A'}</h4>
                            <p class="card-text">Last Analysis</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAIAlerts() {
        if (!this.currentAirport || !this.conveyorData[this.currentAirport]) return;

        const data = this.conveyorData[this.currentAirport];
        const container = document.getElementById('ai-alerts-content');
        const header = document.querySelector('#ai-alerts-section .section-header h3');
        
        if (!container || !header) return;

        // Update the header to show alert count
        this.updateStaffAlertsHeader(header, data);

        if (!data.ai_alerts || data.ai_alerts.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle text-success"></i>
                    <h6>All Systems Normal</h6>
                    <p>No active alerts at this time. All conveyor belts are operating efficiently.</p>
                </div>
            `;
            return;
        }

        // Auto-expand if there are critical alerts
        if (data.ai_alerts.some(alert => alert.priority.toLowerCase() === 'critical')) {
            this.autoExpandStaffAlerts();
        }

        const alertsHTML = data.ai_alerts.map(alert => {
            const alertClass = `ai-alert-item ${alert.priority.toLowerCase()}`;
            const priorityIcon = this.getPriorityIcon(alert.priority);
            
            return `
                <div class="${alertClass}">
                    <div class="ai-alert-header">
                        <div class="ai-alert-type">
                            <i class="${priorityIcon} me-2"></i>${alert.type}
                        </div>
                        <div class="ai-alert-time">
                            ${alert.timestamp}
                        </div>
                    </div>
                    <div class="ai-alert-message">
                        ${alert.message}
                    </div>
                    <div class="ai-alert-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewStaffAlertDetails('${alert.id}')">
                            <i class="fas fa-eye me-1"></i>View Details
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resolveStaffAlert('${alert.id}')">
                            <i class="fas fa-check me-1"></i>Resolve
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = alertsHTML;
    }

    updateStaffAlertsHeader(header, data) {
        const headerContainer = header.closest('.section-header');
        if (!headerContainer) return;

        if (!data.ai_alerts || data.ai_alerts.length === 0) {
            header.innerHTML = '<i class="fas fa-exclamation-triangle me-2 text-warning"></i>AI-Powered Alerts & Notifications';
            headerContainer.classList.remove('has-alerts');
            return;
        }

        const totalAlerts = data.ai_alerts.length;
        const criticalAlerts = data.ai_alerts.filter(alert => 
            alert.priority.toLowerCase() === 'critical'
        ).length;
        const highAlerts = data.ai_alerts.filter(alert => 
            alert.priority.toLowerCase() === 'high'
        ).length;

        let alertText = 'AI-Powered Alerts & Notifications';
        
        if (criticalAlerts > 0) {
            alertText += ` <span class="badge bg-danger ms-2">${criticalAlerts} Critical</span>`;
        }
        if (highAlerts > 0) {
            alertText += ` <span class="badge bg-warning ms-2">${highAlerts} High</span>`;
        }
        if (totalAlerts > 0) {
            alertText += ` <span class="badge bg-info ms-2">${totalAlerts} Total</span>`;
        }

        header.innerHTML = alertText;
        headerContainer.classList.add('has-alerts');
    }

    autoExpandStaffAlerts() {
        const content = document.getElementById('ai-alerts-section-content');
        const chevron = document.getElementById('ai-alerts-section-chevron');
        
        if (content && content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            
            if (chevron) {
                chevron.classList.add('rotated');
            }
        }
    }

    getPriorityIcon(priority) {
        const icons = {
            'critical': 'fas fa-exclamation-triangle',
            'high': 'fas fa-exclamation-circle',
            'medium': 'fas fa-info-circle',
            'low': 'fas fa-info'
        };
        return icons[priority.toLowerCase()] || 'fas fa-info';
    }

    animateConveyorBelts() {
        // Animate bags moving on conveyor belts
        const bags = document.querySelectorAll('.bag-visual');
        
        bags.forEach(bag => {
            const currentLeft = parseFloat(bag.style.left);
            const newLeft = Math.min(100, currentLeft + Math.random() * 3);
            
            bag.style.left = `${newLeft}%`;
            
            // Remove bag if it reaches the end
            if (newLeft >= 100) {
                setTimeout(() => {
                    bag.remove();
                }, 800);
            }
        });
        
        // Continue animation
        setTimeout(() => this.animateConveyorBelts(), 3000);
    }

    async loadTabData(tabId) {
        switch (tabId) {
            case '#conveyor':
                this.renderConveyorSystem();
                break;
            case '#staff':
                this.renderStaffManagement();
                break;
            case '#complaints':
                this.renderComplaints();
                break;
            case '#ai-insights':
                this.renderAIInsights();
                break;
        }
    }

    setupAutoRefresh() {
        setInterval(() => {
            this.loadAllAirportsData();
            this.renderCurrentAirportData();
        }, this.refreshInterval);
    }

    // Action methods
    takeAction(beltId, action) {
        console.log(`Taking action ${action} on belt ${beltId}`);
        
        switch (action) {
            case 'monitor':
                this.monitorBelt(beltId);
                break;
            case 'maintenance':
                this.scheduleMaintenance(beltId);
                break;
            case 'details':
                this.showBeltDetails(beltId);
                break;
        }
    }

    monitorBelt(beltId) {
        alert(`Monitoring belt ${beltId} - Enhanced monitoring activated`);
    }

    scheduleMaintenance(beltId) {
        alert(`Maintenance scheduled for belt ${beltId} - Maintenance team notified`);
    }

    showBeltDetails(beltId) {
        alert(`Showing detailed information for belt ${beltId}`);
    }

    assignStaff() {
        alert('Staff assignment interface opened');
    }

    scheduleMaintenance() {
        alert('Maintenance scheduling interface opened');
    }

    generateReport() {
        alert('Generating comprehensive operations report...');
    }

    viewComplaint(complaintId) {
        alert(`Viewing complaint ${complaintId}`);
    }

    resolveComplaint(complaintId) {
        alert(`Resolving complaint ${complaintId}`);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        console.error(message);
        // Implement toast notification
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = document.body.classList.contains('dark-theme') ? 
                'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Global functions
function refreshAllData() {
    if (window.staffPortal) {
        window.staffPortal.loadAllAirportsData();
        window.staffPortal.renderCurrentAirportData();
    }
}

function toggleTheme() {
    if (window.staffPortal) {
        window.staffPortal.toggleTheme();
    }
}

// Initialize staff portal
function initializeStaffPortal() {
    window.staffPortal = new StaffPortal();
}

// Widget content toggle function for staff portal
function toggleWidgetContent(widgetName) {
    const contentId = `${widgetName}-content`;
    const content = document.getElementById(contentId);
    const chevron = document.getElementById(`${widgetName}-chevron`);
    
    if (!content) return;
    
    if (content.style.display === 'none' || content.classList.contains('collapsed')) {
        // Expand the widget
        content.style.display = 'block';
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        
        if (chevron) {
            chevron.classList.add('rotated');
        }
    } else {
        // Collapse the widget
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        
        if (chevron) {
            chevron.classList.remove('rotated');
        }
    }
}

// Section content toggle function for staff portal
function toggleSectionContent(sectionName) {
    const contentId = `${sectionName}-content`;
    const content = document.getElementById(contentId);
    const chevron = document.getElementById(`${sectionName}-chevron`);
    
    if (!content) return;
    
    if (content.classList.contains('collapsed')) {
        // Expand the section
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        
        if (chevron) {
            chevron.classList.add('rotated');
        }
    } else {
        // Collapse the section
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        
        if (chevron) {
            chevron.classList.remove('rotated');
        }
    }
}

// Staff Portal Alert Action Functions
function viewStaffAlertDetails(alertId) {
    console.log(`Viewing details for staff alert: ${alertId}`);
    alert(`Viewing details for alert: ${alertId}`);
}

function resolveStaffAlert(alertId) {
    console.log(`Resolving staff alert: ${alertId}`);
    alert(`Alert ${alertId} has been resolved`);
    
    // Refresh the staff portal data
    if (window.staffPortal) {
        window.staffPortal.loadAllAirportsData();
        window.staffPortal.renderCurrentAirportData();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaffPortal;
}

// Enhanced Airport Dashboard with AI-Powered Conveyor Belt System
class AirportDashboard {
    constructor(airportCode) {
        this.airportCode = airportCode;
        this.refreshInterval = 90000; // 90 seconds (1.5 minutes) for real-time updates
        this.conveyorData = null;
        this.aiAlerts = [];
        this.init();
    }

    init() {
        this.loadAllData();
        this.setupAutoRefresh();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.querySelector('[onclick="toggleTheme()"]');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }
    }

    async loadAllData() {
        try {
            this.showLoading(true);
            
            // Load all dashboard data including conveyor system
            const response = await fetch(`/api/airport/${this.airportCode}/dashboard-data`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Load conveyor system data separately for enhanced features
            const conveyorResponse = await fetch(`/api/airport/${this.airportCode}/live-conveyors`);
            const conveyorData = await conveyorResponse.json();
            
            if (!conveyorData.error) {
                this.conveyorData = conveyorData;
                this.renderConveyorSystem();
                this.renderAIAlerts();
                this.renderAIInsights();
            }

            // Render all other widgets
            this.renderPassengerFlow(data.passenger_flow);
            this.renderQueueStatus(data.queue_status);
            this.renderBaggageTracking(data.baggage_tracking);
            this.renderFlightStatus(data.flight_status);
            this.renderSecurityStatus(data.security_status);
            this.renderResourceUtilization(data.resource_utilization);
            this.renderStaffAvailability(data.staff_availability);
            
            // Load and render facilities data
            this.loadFacilitiesData();

            this.updateLastUpdate();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
            this.showLoading(false);
        }
    }

    renderConveyorSystem() {
        if (!this.conveyorData || this.conveyorData.error) return;

        const container = document.getElementById('conveyor-belts-container');
        const performanceContainer = document.getElementById('system-performance');
        
        if (!container || !performanceContainer) return;

        // Render conveyor belts
        container.innerHTML = this.generateConveyorBeltsHTML();
        
        // Render system performance
        performanceContainer.innerHTML = this.generateSystemPerformanceHTML();
        
        // Animate bags on belts
        this.animateConveyorBelts();
    }

    generateConveyorBeltsHTML() {
        if (!this.conveyorData.conveyor_belts) return '<p>No conveyor data available</p>';

        return this.conveyorData.conveyor_belts.map(belt => {
            const statusClass = `status-${belt.status.toLowerCase()}`;
            const healthClass = `health-${belt.health_status.toLowerCase()}`;
            
            // Generate bag HTML
            const bagsHTML = belt.bags_on_belt.map(bag => {
                const bagClass = `bag-item ${bag.priority.toLowerCase()}`;
                const leftPosition = `${bag.position}%`;
                
                return `<div class="${bagClass}" style="left: ${leftPosition};" 
                         title="Bag ${bag.bag_id} - ${bag.flight} to ${bag.destination}"></div>`;
            }).join('');

            // Generate sensor data HTML
            const sensorHTML = this.generateSensorDataHTML(belt.sensor_data);

            return `
                <div class="conveyor-card mb-3">
                    <div class="belt-info">
                        <span><strong>${belt.belt_id}</strong> - ${belt.terminal}</span>
                        <span class="belt-status ${statusClass}">${belt.status}</span>
                    </div>
                    
                    <div class="conveyor-belt">
                        ${bagsHTML}
                    </div>
                    
                    <div class="row mt-2">
                        <div class="col-md-3">
                            <div class="sensor-panel">
                                <small>Speed</small>
                                <div class="sensor-value">${belt.speed.toFixed(1)} m/s</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="sensor-panel">
                                <small>Utilization</small>
                                <div class="sensor-value">${belt.utilization}%</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="sensor-panel">
                                <small>Health</small>
                                <div><span class="health-indicator ${healthClass}"></span>${belt.health_status}</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="sensor-panel">
                                <small>Efficiency</small>
                                <div class="efficiency-gauge efficiency-${Math.floor(belt.efficiency_score / 15) * 15}">
                                    ${belt.efficiency_score}%
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${sensorHTML}
                    
                    ${this.generateIssuesHTML(belt.predicted_issues)}
                </div>
            `;
        }).join('');
    }

    generateSensorDataHTML(sensorData) {
        if (!sensorData) return '';

        let html = '<div class="row mt-2">';
        
        if (sensorData.weight_sensor) {
            const weight = sensorData.weight_sensor;
            html += `
                <div class="col-md-4">
                    <div class="sensor-panel">
                        <small>Weight Sensor</small>
                        <div class="sensor-value">${weight.current_load}%</div>
                        <small>Max: ${weight.max_capacity}%</small>
                    </div>
                </div>
            `;
        }
        
        if (sensorData.temperature_sensor) {
            const temp = sensorData.temperature_sensor;
            html += `
                <div class="col-md-4">
                    <div class="sensor-panel">
                        <small>Temperature</small>
                        <div class="sensor-value">${temp.current_temp.toFixed(1)}°C</div>
                        <small>Max Safe: ${temp.max_safe_temp}°C</small>
                    </div>
                </div>
            `;
        }
        
        if (sensorData.vibration_sensor) {
            const vib = sensorData.vibration_sensor;
            html += `
                <div class="col-md-4">
                    <div class="sensor-panel">
                        <small>Vibration</small>
                        <div class="sensor-value">${vib.vibration_level.toFixed(1)}</div>
                        <small>Bearing: ${vib.bearing_health}</small>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    generateIssuesHTML(issues) {
        if (!issues || issues.length === 0) return '';
        
        return `
            <div class="mt-2">
                <small class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Issues Detected:</small>
                ${issues.map(issue => `
                    <div class="alert alert-warning alert-sm py-1 mt-1">
                        <strong>${issue.type}</strong>: ${issue.description}
                        <br><small>Action: ${issue.recommended_action}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    generateSystemPerformanceHTML() {
        if (!this.conveyorData.system_insights) return '<p>No performance data available</p>';
        
        const insights = this.conveyorData.system_insights;
        
        return `
            <div class="text-white">
                <div class="mb-3">
                    <h6>System Efficiency</h6>
                    <div class="sensor-value">${insights.system_efficiency}%</div>
                </div>
                
                <div class="mb-3">
                    <h6>Active Belts</h6>
                    <div class="sensor-value">${insights.active_belts_ratio}%</div>
                </div>
                
                <div class="mb-3">
                    <h6>Critical Issues</h6>
                    <div class="sensor-value">${insights.critical_issues_count}</div>
                </div>
                
                <div class="mb-3">
                    <h6>System Health</h6>
                    <div class="sensor-value">${insights.system_health}</div>
                </div>
                
                <div class="mb-3">
                    <h6>Maintenance Priority</h6>
                    <div class="sensor-value">${insights.maintenance_priority}</div>
                </div>
            </div>
        `;
    }

    renderAIAlerts() {
        const container = document.getElementById('ai-alerts-content-inner');
        if (!container) return;

        // Update the header to show alert count
        this.updateAlertsHeader();

        if (!this.conveyorData.ai_alerts || this.conveyorData.ai_alerts.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle text-success"></i>
                    <h6>All Systems Normal</h6>
                    <p>No active alerts at this time. All conveyor belts are operating efficiently.</p>
                </div>
            `;
            return;
        }

        const alertsHTML = this.conveyorData.ai_alerts.map(alert => {
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
                        <button class="btn btn-sm btn-outline-primary" onclick="viewAlertDetails('${alert.id}')">
                            <i class="fas fa-eye me-1"></i>View Details
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resolveAlert('${alert.id}')">
                            <i class="fas fa-check me-1"></i>Resolve
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = alertsHTML;
    }

    updateAlertsHeader() {
        const header = document.querySelector('[data-widget="ai-alerts"] .widget-header h5');
        const headerContainer = document.querySelector('[data-widget="ai-alerts"] .widget-header');
        if (!header || !headerContainer) return;

        if (!this.conveyorData.ai_alerts || this.conveyorData.ai_alerts.length === 0) {
            header.innerHTML = '<i class="fas fa-exclamation-triangle me-2 text-warning"></i>AI-Powered Alerts & Notifications';
            headerContainer.classList.remove('has-alerts');
            return;
        }

        const totalAlerts = this.conveyorData.ai_alerts.length;
        const criticalAlerts = this.conveyorData.ai_alerts.filter(alert => 
            alert.priority.toLowerCase() === 'critical'
        ).length;
        const highAlerts = this.conveyorData.ai_alerts.filter(alert => 
            alert.priority.toLowerCase() === 'high'
        ).length;

        let alertText = 'AI-Powered Alerts & Notifications';
        
        if (criticalAlerts > 0) {
            alertText += ` <span class="badge bg-danger ms-2">${criticalAlerts} Critical</span>`;
            // Auto-expand if there are critical alerts
            this.autoExpandAlerts();
        }
        if (highAlerts > 0) {
            alertText += ` <span class="badge bg-warning ms-2">${highAlerts} High</span>`;
        }
        if (totalAlerts > 0) {
            alertText += ` <span class="badge bg-info ms-2">${totalAlerts} Total</span>`;
        }

        header.innerHTML = `<i class="fas fa-exclamation-triangle me-2 text-warning"></i>${alertText}`;
        headerContainer.classList.add('has-alerts');
    }

    autoExpandAlerts() {
        const content = document.getElementById('ai-alerts-content');
        const chevron = document.getElementById('ai-alerts-chevron');
        
        if (content && content.style.display === 'none') {
            content.style.display = 'block';
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

    renderAIInsights() {
        if (!this.conveyorData.system_insights) return;

        const container = document.getElementById('ai-insights-container');
        if (!container) return;

        const insights = this.conveyorData.system_insights;
        
        container.innerHTML = `
            <div class="ai-insight mb-3">
                <h6><i class="fas fa-lightbulb me-2"></i>System Insights</h6>
                <p class="mb-2">Overall system efficiency is at <strong>${insights.system_efficiency}%</strong> with <strong>${insights.active_belts_ratio}%</strong> belts active.</p>
                <small>Peak performance time: ${insights.peak_performance_time}</small>
            </div>
            
            ${insights.recommendations.map(rec => `
                <div class="alert alert-info py-2">
                    <i class="fas fa-info-circle me-2"></i>${rec}
                </div>
            `).join('')}
            
            <div class="mt-3">
                <h6>Performance Metrics</h6>
                ${this.conveyorData.performance_metrics ? `
                    <div class="row">
                        <div class="col-md-6">
                            <small>Speed: ${this.conveyorData.performance_metrics.speed_metrics?.average || 0} m/s avg</small>
                        </div>
                        <div class="col-md-6">
                            <small>Efficiency: ${this.conveyorData.performance_metrics.efficiency_metrics?.average || 0}% avg</small>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    animateConveyorBelts() {
        // Animate bags moving on conveyor belts
        const bags = document.querySelectorAll('.bag-item');
        
        bags.forEach(bag => {
            const currentLeft = parseFloat(bag.style.left);
            const newLeft = Math.min(100, currentLeft + Math.random() * 2);
            
            bag.style.left = `${newLeft}%`;
            
            // Remove bag if it reaches the end
            if (newLeft >= 100) {
                setTimeout(() => {
                    bag.remove();
                }, 500);
            }
        });
        
        // Continue animation
        setTimeout(() => this.animateConveyorBelts(), 2000);
    }

    renderPassengerFlow(data) {
        if (!data || data.error) return;

        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('passenger-flow-chart', chartData, layout, {responsive: true});

        // Update metrics
        document.getElementById('current-passengers').textContent = data.current_hour_passengers;
        document.getElementById('peak-hour').textContent = data.peak_hour;
        document.getElementById('daily-total').textContent = data.total_daily;
    }

    renderQueueStatus(data) {
        if (!data || data.error) return;

        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('queue-status-chart', chartData, layout, {responsive: true});

        // Update metrics
        document.getElementById('total-queues').textContent = data.total_in_queues;
        document.getElementById('avg-wait').textContent = Math.round(data.avg_wait_time_overall);
    }

    renderBaggageTracking(data) {
        if (!data || data.error) return;

        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('baggage-tracking-chart', chartData, layout, {responsive: true});
        
        // Update metrics
        document.getElementById('active-belts').textContent = data.active_belts;
        document.getElementById('live-bags').textContent = data.live_bags_count;
        document.getElementById('avg-speed').textContent = `${data.avg_belt_speed.toFixed(1)} m/s`;
    }

    renderFlightStatus(data) {
        if (!data || data.error) return;

        // Render chart
        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('flight-status-chart', chartData, layout, {responsive: true});
        
        // Render flights table
        this.renderFlightsTable(data.flights);
        
        // Update metrics
        document.getElementById('weather-delays').textContent = data.weather_delays;
        document.getElementById('on-time-flights').textContent = data.on_time_flights;
        document.getElementById('total-flights').textContent = data.total_flights;
        
        // Show weather alert if impact is high
        if (data.weather && data.weather.impact === 'High') {
            this.showWeatherAlert(data.weather);
        }
    }

    renderFlightsTable(flights) {
        const tbody = document.getElementById('flights-tbody');
        if (!tbody) return;

        tbody.innerHTML = flights.map(flight => `
            <tr>
                <td><strong>${flight.flight_number}</strong><br><small>${flight.airline}</small></td>
                <td>${flight.destination}</td>
                <td>${flight.scheduled_time}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(flight.status)}">
                        ${flight.status}
                    </span>
                </td>
                <td>${flight.gate}</td>
                <td>
                    ${flight.delay_reason ? `<small class="text-danger">${flight.delay_reason}</small>` : '-'}
                </td>
            </tr>
        `).join('');
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'On Time': 'bg-success',
            'Delayed': 'bg-warning',
            'Boarding': 'bg-info',
            'Departed': 'bg-secondary',
            'Cancelled': 'bg-danger',
            'Arrived': 'bg-success'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    showWeatherAlert(weather) {
        const alert = document.getElementById('weather-alert');
        if (!alert) return;

        document.getElementById('weather-info').textContent = 
            `${weather.condition}, ${weather.temperature}°C, Wind: ${weather.wind_speed} km/h`;
        document.getElementById('weather-impact').textContent = weather.impact;
        
        alert.style.display = 'block';
        alert.className = `alert ${weather.impact === 'High' ? 'alert-warning' : 'alert-info'} mb-3`;
    }

    renderSecurityStatus(data) {
        if (!data || data.error) return;

        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('security-status-chart', chartData, layout, {responsive: true});
        
        // Update metrics
        document.getElementById('operational-checkpoints').textContent = data.operational_checkpoints;
        document.getElementById('security-staff').textContent = data.total_staff_deployed;
    }

    renderResourceUtilization(data) {
        if (!data || data.error) return;

        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('resource-utilization-chart', chartData, layout, {responsive: true});
        
        // Update metrics
        document.getElementById('system-health').textContent = data.overall_health;
        document.getElementById('peak-usage').textContent = `${data.peak_usage}%`;
    }

    renderStaffAvailability(data) {
        if (!data || data.error) return;

        const chartData = [data.chart];
        const layout = data.layout;
        
        Plotly.newPlot('staff-availability-chart', chartData, layout, {responsive: true});
        
        // Update metrics
        document.getElementById('available-staff').textContent = data.available_staff;
        document.getElementById('overall-availability').textContent = `${data.overall_availability}%`;
    }

    setupAutoRefresh() {
        setInterval(() => {
            this.loadAllData();
            }, this.refreshInterval);
        }

    updateLastUpdate() {
        const now = new Date();
        document.getElementById('last-update').textContent = now.toLocaleTimeString();
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        // Show error message to user
        console.error(message);
        // You can implement a toast notification system here
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = document.body.classList.contains('dark-theme') ? 
                'fas fa-sun' : 'fas fa-moon';
        }
    }

    async loadFacilitiesData() {
        try {
            const response = await fetch(`/api/airport/${this.airportCode}/facilities`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.renderFacilities(data);
        } catch (error) {
            console.error('Error loading facilities data:', error);
            this.showError('Failed to load facilities data');
        }
    }

    renderFacilities(data) {
        const terminalsDiv = document.getElementById('dashboard-terminals-gates');
        const servicesDiv = document.getElementById('dashboard-services');
        const summaryDiv = document.getElementById('facility-summary');
        
        if (!terminalsDiv || !servicesDiv || !summaryDiv) return;

        // Render terminals and gates
        let terminalsHtml = '<div class="row">';
        data.facilities.terminals.forEach(terminal => {
            const gates = data.facilities.gates[terminal] || [];
            const airlines = data.facilities.airlines[terminal] || [];
            terminalsHtml += `
                <div class="col-md-6 mb-2">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white py-2">
                            <h6 class="mb-0"><i class="fas fa-terminal me-2"></i>${terminal}</h6>
                        </div>
                        <div class="card-body py-2">
                            <p class="mb-1"><strong><i class="fas fa-door-open me-1"></i>Gates:</strong></p>
                            <p class="text-muted small mb-2">${gates.join(', ')}</p>
                            <p class="mb-1"><strong><i class="fas fa-plane me-1"></i>Airlines:</strong></p>
                            <p class="text-muted small">${airlines.join(', ')}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        terminalsHtml += '</div>';
        terminalsDiv.innerHTML = terminalsHtml;

        // Render services
        let servicesHtml = '<div class="row">';
        
        // Washrooms section
        servicesHtml += `
            <div class="col-md-6 mb-2">
                <div class="card border-success">
                    <div class="card-header bg-success text-white py-2">
                        <h6 class="mb-0"><i class="fas fa-restroom me-2"></i>Washrooms (${data.facilities.washrooms.length})</h6>
                    </div>
                    <div class="card-body py-2">
                        <ul class="list-unstyled mb-0">
        `;
        data.facilities.washrooms.slice(0, 3).forEach(washroom => {
            const statusColor = washroom.status === 'Available' ? 'text-success' : 'text-warning';
            servicesHtml += `
                <li class="mb-1">
                    <i class="fas fa-map-marker-alt text-primary me-1"></i>
                    <strong>${washroom.location}</strong>
                    <br><span class="text-muted small">Type: ${washroom.type}</span>
                    <br><span class="${statusColor} small"><i class="fas fa-circle me-1"></i>${washroom.status}</span>
                </li>
            `;
        });
        if (data.facilities.washrooms.length > 3) {
            servicesHtml += `<li class="text-muted small">+${data.facilities.washrooms.length - 3} more...</li>`;
        }
        servicesHtml += `
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        // Services section
        servicesHtml += `
            <div class="col-md-6 mb-2">
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white py-2">
                        <h6 class="mb-0"><i class="fas fa-concierge-bell me-2"></i>Services (${data.facilities.services.length})</h6>
                    </div>
                    <div class="card-body py-2">
                        <ul class="list-unstyled mb-0">
        `;
        data.facilities.services.slice(0, 3).forEach(service => {
            servicesHtml += `
                <li class="mb-2">
                    <div class="d-flex align-items-start">
                        <i class="fas fa-star text-warning me-1 mt-1"></i>
                        <div>
                            <strong>${service.name}</strong>
                            <br><span class="text-muted small"><i class="fas fa-map-marker-alt me-1"></i>${service.location}</span>
                            <br><span class="text-info small"><i class="fas fa-clock me-1"></i>${service.hours}</span>
                        </div>
                    </div>
                </li>
            `;
        });
        if (data.facilities.services.length > 3) {
            servicesHtml += `<li class="text-muted small">+${data.facilities.services.length - 3} more...</li>`;
        }
        servicesHtml += `
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        servicesHtml += '</div>';
        servicesDiv.innerHTML = servicesHtml;

        // Update summary statistics
        const summaryItems = summaryDiv.querySelectorAll('h4');
        if (summaryItems.length >= 4) {
            summaryItems[0].textContent = data.total_terminals;
            summaryItems[1].textContent = data.total_gates;
            summaryItems[2].textContent = data.airlines_count;
            summaryItems[3].textContent = data.facilities.washrooms.length + data.facilities.services.length;
        }
    }
}

// Global functions for widget interactions
function refreshWidget(widgetName) {
    // Implement individual widget refresh
    console.log(`Refreshing widget: ${widgetName}`);
    
    if (widgetName === 'facilities' && window.dashboard) {
        window.dashboard.loadFacilitiesData();
    }
}

function refreshAllData() {
    if (window.dashboard) {
        window.dashboard.loadAllData();
    }
}

function toggleFullscreen(button) {
    const widget = button.closest('.dashboard-widget');
    if (widget) {
        widget.classList.toggle('fullscreen');
    const icon = button.querySelector('i');
        icon.className = widget.classList.contains('fullscreen') ? 
            'fas fa-compress' : 'fas fa-expand';
    }
}

// Initialize dashboard when DOM is loaded
function initializeDashboard(airportCode) {
    window.dashboard = new AirportDashboard(airportCode);
}

// Alert action functions
function viewAlertDetails(alertId) {
    console.log(`Viewing details for alert: ${alertId}`);
    // You can implement a modal or detailed view here
    alert(`Viewing details for alert: ${alertId}`);
}

function resolveAlert(alertId) {
    console.log(`Resolving alert: ${alertId}`);
    // You can implement alert resolution logic here
    alert(`Alert ${alertId} has been resolved`);
    
    // Refresh the dashboard to update alerts
    if (window.dashboard) {
        window.dashboard.loadAllData();
    }
}

// Widget content toggle function
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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AirportDashboard;
}

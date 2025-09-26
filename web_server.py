from flask import Flask, render_template, jsonify, request
from dashboard_manager import DashboardManager
from data_sources import DataSourceManager
import logging

logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # Initialize managers
    dashboard_manager = DashboardManager()
    data_source_manager = DataSourceManager()
    
    # Airport configurations
    airports = {
        'DEL': {'name': 'Indira Gandhi International Airport', 'city': 'New Delhi', 'code': 'DEL'},
        'BLR': {'name': 'Kempegowda International Airport', 'city': 'Bangalore', 'code': 'BLR'},
        'GOX': {'name': 'Manohar International Airport', 'city': 'Goa', 'code': 'GOX'},
        'PNY': {'name': 'Puducherry Airport', 'city': 'Puducherry', 'code': 'PNY'},
        'IXJ': {'name': 'Jammu Airport', 'city': 'Jammu', 'code': 'IXJ'},
        'SXR': {'name': 'Sheikh ul-Alam International Airport', 'city': 'Srinagar', 'code': 'SXR'}
    }
    
    @app.route('/')
    def index():
        """Main page showing airport selection grid"""
        return render_template('index.html', airports=airports)
    
    @app.route('/dashboard/<airport_code>')
    def dashboard(airport_code):
        """Individual airport dashboard"""
        if airport_code not in airports:
            return "Airport not found", 404
        
        airport_info = airports[airport_code]
        return render_template('dashboard.html', 
                             airport=airport_info, 
                             airport_code=airport_code)
    
    @app.route('/settings')
    def settings():
        """Settings and configuration page"""
        return render_template('settings.html', airports=airports)
    
    # API Endpoints
    @app.route('/api/airport/<airport_code>/passenger-flow')
    def get_passenger_flow(airport_code):
        """Get passenger flow data for charts"""
        try:
            data = data_source_manager.get_passenger_flow_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting passenger flow data: {e}")
            return jsonify({'error': 'Failed to fetch passenger flow data'}), 500
    
    @app.route('/api/airport/<airport_code>/queue-status')
    def get_queue_status(airport_code):
        """Get queue monitoring data"""
        try:
            data = data_source_manager.get_queue_status_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting queue status data: {e}")
            return jsonify({'error': 'Failed to fetch queue status data'}), 500
    
    @app.route('/api/airport/<airport_code>/baggage-tracking')
    def get_baggage_tracking(airport_code):
        """Get baggage tracking data"""
        try:
            data = data_source_manager.get_baggage_tracking_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting baggage tracking data: {e}")
            return jsonify({'error': 'Failed to fetch baggage tracking data'}), 500
    
    @app.route('/api/airport/<airport_code>/flight-status')
    def get_flight_status(airport_code):
        """Get flight status data"""
        try:
            data = data_source_manager.get_flight_status_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting flight status data: {e}")
            return jsonify({'error': 'Failed to fetch flight status data'}), 500
    
    @app.route('/api/airport/<airport_code>/security-status')
    def get_security_status(airport_code):
        """Get security checkpoint status"""
        try:
            data = data_source_manager.get_security_status_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting security status data: {e}")
            return jsonify({'error': 'Failed to fetch security status data'}), 500
    
    @app.route('/api/airport/<airport_code>/resource-utilization')
    def get_resource_utilization(airport_code):
        """Get resource utilization data"""
        try:
            data = data_source_manager.get_resource_utilization_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting resource utilization data: {e}")
            return jsonify({'error': 'Failed to fetch resource utilization data'}), 500
    
    @app.route('/api/airport/<airport_code>/staff-availability')
    def get_staff_availability(airport_code):
        """Get staff availability data"""
        try:
            data = data_source_manager.get_staff_availability_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting staff availability data: {e}")
            return jsonify({'error': 'Failed to fetch staff availability data'}), 500
    
    @app.route('/api/airport/<airport_code>/dashboard-data')
    def get_dashboard_data(airport_code):
        """Get all dashboard data at once"""
        try:
            data = {
                'passenger_flow': data_source_manager.get_passenger_flow_data(airport_code),
                'queue_status': data_source_manager.get_queue_status_data(airport_code),
                'baggage_tracking': data_source_manager.get_baggage_tracking_data(airport_code),
                'flight_status': data_source_manager.get_flight_status_data(airport_code),
                'security_status': data_source_manager.get_security_status_data(airport_code),
                'resource_utilization': data_source_manager.get_resource_utilization_data(airport_code),
                'staff_availability': data_source_manager.get_staff_availability_data(airport_code)
            }
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return jsonify({'error': 'Failed to fetch dashboard data'}), 500
    
    # New Enhanced API Endpoints
    @app.route('/api/airport/<airport_code>/weather')
    def get_weather(airport_code):
        """Get weather data"""
        try:
            data = data_source_manager.get_weather_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting weather data: {e}")
            return jsonify({'error': 'Failed to fetch weather data'}), 500
    
    @app.route('/api/airport/<airport_code>/live-conveyors')
    def get_live_conveyors(airport_code):
        """Get live conveyor belt data"""
        try:
            data = data_source_manager.get_live_conveyor_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting live conveyor data: {e}")
            return jsonify({'error': 'Failed to fetch live conveyor data'}), 500
    
    @app.route('/api/airport/<airport_code>/facilities')
    def get_facilities(airport_code):
        """Get airport facilities information"""
        try:
            data = data_source_manager.get_airport_facilities(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting facilities data: {e}")
            return jsonify({'error': 'Failed to fetch facilities data'}), 500
    
    @app.route('/api/baggage/track')
    def track_baggage():
        """Track passenger baggage"""
        try:
            bag_id = request.args.get('bag_id')
            flight_number = request.args.get('flight_number')
            data = data_source_manager.track_passenger_baggage(bag_id, flight_number)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error tracking baggage: {e}")
            return jsonify({'error': 'Failed to track baggage'}), 500
    
    @app.route('/api/complaints/submit', methods=['POST'])
    def submit_complaint():
        """Submit baggage complaint"""
        try:
            request_data = request.get_json()
            data = data_source_manager.submit_baggage_complaint(
                request_data.get('passenger_name', ''),
                request_data.get('flight_number', ''),
                request_data.get('bag_id', ''),
                request_data.get('issue_type', ''),
                request_data.get('description', '')
            )
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error submitting complaint: {e}")
            return jsonify({'error': 'Failed to submit complaint'}), 500
    
    @app.route('/api/airport/<airport_code>/complaints')
    def get_complaints(airport_code):
        """Get complaints data for staff"""
        try:
            data = data_source_manager.get_complaints_data(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting complaints data: {e}")
            return jsonify({'error': 'Failed to fetch complaints data'}), 500
    
    @app.route('/api/airport/<airport_code>/ai-insights')
    def get_ai_insights(airport_code):
        """Get AI-powered baggage system insights"""
        try:
            data = data_source_manager.get_ai_baggage_insights(airport_code)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Error getting AI insights: {e}")
            return jsonify({'error': 'Failed to fetch AI insights'}), 500
    
    # Passenger Services Pages
    @app.route('/passenger')
    def passenger_services():
        """Passenger services page"""
        return render_template('passenger_services.html', airports=airports)
    
    @app.route('/staff')
    def staff_portal():
        """Staff portal page"""
        return render_template('staff_portal.html', airports=airports)
    
    @app.errorhandler(404)
    def not_found(error):
        return render_template('index.html', error="Page not found"), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

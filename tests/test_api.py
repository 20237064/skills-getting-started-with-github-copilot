"""
Tests for the High School Management System API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Create a test client for the FastAPI application"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities data before each test"""
    # Store original state
    original_activities = {
        "Basketball Team": {
            "description": "Join our competitive basketball team and participate in inter-school tournaments",
            "schedule": "Mondays and Wednesdays, 4:00 PM - 6:00 PM",
            "max_participants": 15,
            "participants": ["alex@mergington.edu", "sarah@mergington.edu"]
        },
        "Swimming Club": {
            "description": "Learn swimming techniques and train for competitions",
            "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
            "max_participants": 20,
            "participants": ["james@mergington.edu", "emily@mergington.edu"]
        },
        "Drama Club": {
            "description": "Explore acting, stage production, and perform in school plays",
            "schedule": "Wednesdays, 3:30 PM - 5:30 PM",
            "max_participants": 25,
            "participants": ["lucas@mergington.edu", "ava@mergington.edu"]
        },
        "Art Studio": {
            "description": "Express creativity through painting, drawing, and sculpture",
            "schedule": "Thursdays, 3:00 PM - 5:00 PM",
            "max_participants": 18,
            "participants": ["mia@mergington.edu", "ethan@mergington.edu"]
        },
        "Debate Team": {
            "description": "Develop critical thinking and public speaking skills through competitive debates",
            "schedule": "Fridays, 4:00 PM - 6:00 PM",
            "max_participants": 16,
            "participants": ["noah@mergington.edu", "isabella@mergington.edu"]
        },
        "Science Olympiad": {
            "description": "Compete in science and engineering events at regional and national levels",
            "schedule": "Saturdays, 10:00 AM - 12:00 PM",
            "max_participants": 20,
            "participants": ["liam@mergington.edu", "charlotte@mergington.edu"]
        },
        "Chess Club": {
            "description": "Learn strategies and compete in chess tournaments",
            "schedule": "Fridays, 3:30 PM - 5:00 PM",
            "max_participants": 12,
            "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
        },
        "Programming Class": {
            "description": "Learn programming fundamentals and build software projects",
            "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
            "max_participants": 20,
            "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
        },
        "Gym Class": {
            "description": "Physical education and sports activities",
            "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
            "max_participants": 30,
            "participants": ["john@mergington.edu", "olivia@mergington.edu"]
        }
    }
    
    # Reset to original state before each test
    activities.clear()
    activities.update(original_activities)
    yield
    # Cleanup after test
    activities.clear()
    activities.update(original_activities)


class TestRootEndpoint:
    """Tests for the root endpoint"""
    
    def test_root_redirects_to_static(self, client):
        """Test that root redirects to static/index.html"""
        response = client.get("/", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "/static/index.html"


class TestGetActivities:
    """Tests for GET /activities endpoint"""
    
    def test_get_activities_returns_all_activities(self, client):
        """Test that GET /activities returns all activities"""
        response = client.get("/activities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert len(data) == 9
        assert "Basketball Team" in data
        assert "Swimming Club" in data
    
    def test_activities_have_correct_structure(self, client):
        """Test that each activity has the required fields"""
        response = client.get("/activities")
        data = response.json()
        
        for activity_name, activity_data in data.items():
            assert "description" in activity_data
            assert "schedule" in activity_data
            assert "max_participants" in activity_data
            assert "participants" in activity_data
            assert isinstance(activity_data["participants"], list)


class TestSignupForActivity:
    """Tests for POST /activities/{activity_name}/signup endpoint"""
    
    def test_signup_for_existing_activity(self, client):
        """Test signing up for an existing activity"""
        response = client.post(
            "/activities/Basketball%20Team/signup?email=newstudent@mergington.edu"
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "newstudent@mergington.edu" in data["message"]
        
        # Verify participant was added
        activities_response = client.get("/activities")
        activities_data = activities_response.json()
        assert "newstudent@mergington.edu" in activities_data["Basketball Team"]["participants"]
    
    def test_signup_for_nonexistent_activity(self, client):
        """Test signing up for a non-existent activity"""
        response = client.post(
            "/activities/Nonexistent%20Activity/signup?email=student@mergington.edu"
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
    
    def test_signup_duplicate_participant(self, client):
        """Test signing up when already registered"""
        email = "alex@mergington.edu"
        response = client.post(
            f"/activities/Basketball%20Team/signup?email={email}"
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "already signed up" in data["detail"].lower()
    
    def test_signup_multiple_different_students(self, client):
        """Test signing up multiple different students"""
        emails = ["student1@mergington.edu", "student2@mergington.edu", "student3@mergington.edu"]
        
        for email in emails:
            response = client.post(
                f"/activities/Drama%20Club/signup?email={email}"
            )
            assert response.status_code == 200
        
        # Verify all were added
        activities_response = client.get("/activities")
        activities_data = activities_response.json()
        drama_participants = activities_data["Drama Club"]["participants"]
        
        for email in emails:
            assert email in drama_participants


class TestUnregisterFromActivity:
    """Tests for DELETE /activities/{activity_name}/unregister endpoint"""
    
    def test_unregister_existing_participant(self, client):
        """Test unregistering an existing participant"""
        email = "alex@mergington.edu"
        response = client.delete(
            f"/activities/Basketball%20Team/unregister?email={email}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Unregistered" in data["message"]
        
        # Verify participant was removed
        activities_response = client.get("/activities")
        activities_data = activities_response.json()
        assert email not in activities_data["Basketball Team"]["participants"]
    
    def test_unregister_from_nonexistent_activity(self, client):
        """Test unregistering from a non-existent activity"""
        response = client.delete(
            "/activities/Nonexistent%20Activity/unregister?email=student@mergington.edu"
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
    
    def test_unregister_non_participant(self, client):
        """Test unregistering a student who is not registered"""
        response = client.delete(
            "/activities/Basketball%20Team/unregister?email=notregistered@mergington.edu"
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "not registered" in data["detail"].lower()
    
    def test_signup_and_unregister_workflow(self, client):
        """Test complete workflow of signup and unregister"""
        email = "workflow@mergington.edu"
        activity = "Chess Club"
        
        # Sign up
        signup_response = client.post(
            f"/activities/{activity}/signup?email={email}"
        )
        assert signup_response.status_code == 200
        
        # Verify signed up
        activities_response = client.get("/activities")
        activities_data = activities_response.json()
        assert email in activities_data[activity]["participants"]
        
        # Unregister
        unregister_response = client.delete(
            f"/activities/{activity}/unregister?email={email}"
        )
        assert unregister_response.status_code == 200
        
        # Verify unregistered
        activities_response = client.get("/activities")
        activities_data = activities_response.json()
        assert email not in activities_data[activity]["participants"]


class TestEdgeCases:
    """Tests for edge cases and error handling"""
    
    def test_signup_with_special_characters_in_activity_name(self, client):
        """Test handling activity names with special characters"""
        # Activities with spaces should work when properly encoded
        response = client.post(
            "/activities/Art%20Studio/signup?email=artist@mergington.edu"
        )
        assert response.status_code == 200
    
    def test_empty_participants_list(self, client):
        """Test activity with no participants"""
        # Clear participants for a test activity
        activities["Gym Class"]["participants"] = []
        
        response = client.get("/activities")
        assert response.status_code == 200
        data = response.json()
        assert data["Gym Class"]["participants"] == []

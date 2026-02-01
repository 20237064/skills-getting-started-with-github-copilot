document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activitiesData = await response.json();

      // Convert activities object to array with id/name properties
      const activities = Object.entries(activitiesData).map(([name, data]) => ({
        id: name,
        name: name,
        ...data
      }));

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      displayActivities(activities);

      // Clear and populate select dropdown
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      activities.forEach(activity => {
        const option = document.createElement("option");
        option.value = activity.id;
        option.textContent = activity.name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to delete a participant
  async function deleteParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities list to show updated participants
        fetchActivities();
        
        // Show success message
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        
        // Hide message after 5 seconds
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Function to display activities
  function displayActivities(activities) {
    const activitiesList = document.getElementById('activities-list');
    const activitySelect = document.getElementById('activity');
    
    if (activities.length === 0) {
      activitiesList.innerHTML = '<p class="info">No activities available at this time.</p>';
      return;
    }
    
    activitiesList.innerHTML = '';
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    
    activities.forEach(activity => {
      // Create activity card
      const card = document.createElement('div');
      card.className = 'activity-card';
      
      // Create participants HTML
      let participantsHTML = '<div class="participants"><h5>Participants:</h5>';
      if (activity.participants && activity.participants.length > 0) {
        participantsHTML += '<ul class="participant-list">';
        activity.participants.forEach(participant => {
          participantsHTML += `
            <li class="participant-item">
              <span class="participant-email">${participant}</span>
              <button class="delete-btn" onclick="deleteParticipantHandler('${activity.id}', '${participant}')" title="Remove participant">🗑️</button>
            </li>`;
        });
        participantsHTML += '</ul>';
      } else {
        participantsHTML += '<p class="no-participants">No participants yet. Be the first to sign up!</p>';
      }
      participantsHTML += '</div>';
      
      card.innerHTML = `
        <h4>${activity.name}</h4>
        <p>${activity.description}</p>
        <p><strong>Schedule:</strong> ${activity.schedule}</p>
        <p><strong>Max Participants:</strong> ${activity.max_participants}</p>
        <p><strong>Current Participants:</strong> ${activity.participants.length}/${activity.max_participants}</p>
        ${participantsHTML}
      `;
      
      activitiesList.appendChild(card);
      
      // Add to select dropdown
      const option = document.createElement('option');
      option.value = activity.id;
      option.textContent = activity.name;
      activitySelect.appendChild(option);
    });
  }

  // Make deleteParticipant available globally for onclick handlers
  window.deleteParticipantHandler = function(activityName, email) {
    deleteParticipant(activityName, email);
  };

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

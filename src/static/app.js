document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      displayActivities(activities);

      // Add option to select dropdown
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
        participantsHTML += '<ul>';
        activity.participants.forEach(participant => {
          participantsHTML += `<li>${participant}</li>`;
        });
        participantsHTML += '</ul>';
      } else {
        participantsHTML += '<p class="no-participants">No participants yet. Be the first to sign up!</p>';
      }
      participantsHTML += '</div>';
      
      card.innerHTML = `
        <h4>${activity.name}</h4>
        <p><strong>Day:</strong> ${activity.day}</p>
        <p><strong>Time:</strong> ${activity.time}</p>
        <p><strong>Location:</strong> ${activity.location}</p>
        <p><strong>Advisor:</strong> ${activity.advisor}</p>
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

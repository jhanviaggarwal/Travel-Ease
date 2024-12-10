const baseUrl = "http://localhost:3001";

function handlePlacesPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const destination = urlParams.get("destination");

  if (destination) {
    fetchPlaces(destination);
  }
}

let currentSlide = 0;
const slides = document.querySelectorAll(".slide");

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

setInterval(nextSlide, 3000); // Change image every 3 seconds

// Initialize dropdown menus and functionality
function initializeMenus() {
  // Seasons Dropdown
  const seasonsMenu = document.getElementById("seasons-menu");
  const seasons = ["Summer", "Winter", "Monsoon"];
  seasons.forEach((season) => {
    const seasonOption = document.createElement("li");
    seasonOption.innerText = season;
    seasonOption.onclick = () => fetchDestinations(season);
    seasonsMenu.appendChild(seasonOption);
  });

  // Itinerary Dropdown
  const itineraryMenu = document.getElementById("itinerary-menu");
  const itineraryOptions = [
    { name: "Create Your Own Itinerary", link: "itinerary.html" },
    { name: "Pre-Made Itineraries", link: "premade.html" },
  ];
  itineraryOptions.forEach((option) => {
    const itineraryOption = document.createElement("li");
    itineraryOption.innerText = option.name;
    itineraryOption.onclick = () => (window.location.href = option.link);
    itineraryMenu.appendChild(itineraryOption);
  });

  // Book Dropdown
  const bookMenu = document.getElementById("book-menu");
  const bookOptions = [{ name: "Flight", link: "flight.html" }];
  bookOptions.forEach((option) => {
    const bookOption = document.createElement("li");
    bookOption.innerText = option.name;
    bookOption.onclick = () => (window.location.href = option.link);
    bookMenu.appendChild(bookOption);
  });
}

function fetchSeasons() {
  const seasons = ["Summer", "Winter", "Monsoon"];
  const seasonContainer = document.getElementById("seasons");

  const bar = document.createElement("div");
  bar.className = "season-bar";
  bar.innerHTML = "<h2>Explore the Seasons</h2>";
  seasonContainer.appendChild(bar);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "season-button-container";

  seasons.forEach((season) => {
    const div = document.createElement("div");
    div.className = "season-item";

    const image = document.createElement("img");
    image.src = `/assets/${season.toLowerCase()}1.jpg`; // Updated path
    image.className = "season-image";

    const name = document.createElement("div");
    name.className = "season-name";
    name.innerText = season.charAt(0).toUpperCase() + season.slice(1);

    div.appendChild(image);
    div.appendChild(name);

    div.onclick = () =>
      (window.location.href = `destinations.html?season=${season}`);

    buttonContainer.appendChild(div);
  });

  seasonContainer.appendChild(buttonContainer);
}

// Fetch and display destinations by season
function fetchDestinations(season) {
  fetch(`${baseUrl}/destination/${season.toLowerCase()}`)
    .then((response) => response.json())
    .then((destinations) => {
      const destinationContainer = document.getElementById("destinations");
      destinationContainer.innerHTML = ""; // Clear previous destinations

      const titleBar = document.createElement("div");
      titleBar.className = "destination-bar";
      titleBar.innerHTML = `<h2>${season} Destinations</h2>`;
      destinationContainer.appendChild(titleBar);

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "button-container";

      destinations.forEach((destination) => {
        const div = document.createElement("div");
        div.className = "list-item";

        // Destination image
        const img = document.createElement("img");
        img.src = `/assets/${destination.toLowerCase()}.jpg`;
        img.alt = destination;
        img.className = "destination-image";

        // Destination name
        const text = document.createElement("p");
        text.innerText = destination;
        text.className = "destination-name";

        // Buttons for further actions
        const placesButton = document.createElement("button");
        placesButton.className = "places-btn";
        placesButton.innerText = "Places to Visit";
        placesButton.onclick = () =>
          (window.location.href = `places.html?destination=${destination}`);

        const hotelsButton = document.createElement("button");
        hotelsButton.className = "hotels-btn";
        hotelsButton.innerText = "Hotel Recommendations";
        hotelsButton.onclick = () =>
          (window.location.href = `hotels.html?destination=${destination}`);

        div.appendChild(img);
        div.appendChild(text);
        div.appendChild(placesButton);
        div.appendChild(hotelsButton);

        buttonContainer.appendChild(div);
      });

      destinationContainer.appendChild(buttonContainer);
    })
    .catch((error) => {
      console.error("Error fetching destinations:", error);
    });
}

document.getElementById("weather-btn").onclick = () => {
  window.location.href = "weather.html";
};

function fetchPlaces(destination) {
  fetch(`${baseUrl}/destinations/${destination}`)
    .then((response) => response.json())
    .then((places) => {
      const placesContainer = document.getElementById("places-container");
      placesContainer.innerHTML = ""; // Clear any existing content

      places.forEach((place) => {
        const div = document.createElement("div");
        div.className = "place-item";

        const img = document.createElement("img");
        img.src = `/assets/${place.name.toLowerCase()}.jpg`;
        img.alt = place.name;

        const title = document.createElement("h2");
        title.innerText = place.name;

        const description = document.createElement("p");
        description.innerText = place.description;

        const hours = document.createElement("p");
        hours.innerText = `Opening Hours: ${place.opening_hours}`;

        const ticketInfo = document.createElement("p");
        ticketInfo.innerText = place.requires_ticket
          ? ""
          : "No ticket is required.";

        div.appendChild(img);
        div.appendChild(title);
        div.appendChild(description);
        div.appendChild(hours);
        div.appendChild(ticketInfo);

        if (place.requires_ticket) {
          const ticketButton = document.createElement("button");
          ticketButton.innerText = "Book Ticket";
          ticketButton.className = "ticket-button";
          ticketButton.onclick = () => openTicketModal(destination, place);

          const updateButton = document.createElement("button");
          updateButton.innerText = "Update Ticket";
          updateButton.className = "update-button";
          updateButton.onclick = () =>
            openTicketModal(destination, place, true);
          div.appendChild(updateButton);

          const cancelButton = document.createElement("button");
          cancelButton.innerText = "Cancel Ticket";
          cancelButton.className = "cancel-button";
          cancelButton.onclick = () => cancelTicket(destination, place.name);

          div.appendChild(ticketButton);
          div.appendChild(updateButton);
          div.appendChild(cancelButton);
        }

        placesContainer.appendChild(div);
      });
    })
    .catch((error) => {
      console.error("Error fetching places:", error);
    });
}

function cancelTicket(destination, placeName) {
  const ticketId = prompt("Enter the Ticket ID to cancel:");
  if (!ticketId) return;

  // Fetch ticket details first to validate the ticket against the place
  fetch(`${baseUrl}/tickets/${ticketId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ticket not found.");
      }
      return response.json();
    })
    .then((ticket) => {
      // Check if the ticket matches the destination and place
      if (ticket.destination === destination && ticket.place === placeName) {
        // If valid, delete the ticket
        return fetch(`${baseUrl}/tickets/ticketId/${ticketId}`, {
          method: "DELETE",
        });
      } else {
        throw new Error("This ticket does not belong to this place!");
      }
    })
    .then((response) => {
      if (response.ok) {
        alert("Ticket canceled successfully!");
      } else {
        throw new Error("Failed to cancel ticket.");
      }
    })
    .catch((error) => {
      console.error("Error canceling ticket:", error);
      alert(error.message || "Failed to cancel ticket. Please try again.");
    });
}

function openTicketModal(
  destination,
  place,
  isUpdate = false,
  ticketId = null
) {
  const modal = document.getElementById("ticket-modal");
  modal.style.display = "block";

  // Reset the form fields
  const ticketForm = document.getElementById("ticket-form");
  const modalTitle = document.querySelector(".modal-content h2");
  const submitButton = ticketForm.querySelector("button[type='submit']");
  ticketForm.reset();

  // Common fields for booking and updating
  document.getElementById("visitor-name").value = "";
  document.getElementById("visit-date").value = "";
  document.getElementById("num-tickets").value = "";

  if (isUpdate) {
    modalTitle.innerText = "Update Your Ticket";
    submitButton.innerText = "Update Ticket";

    // Add ticketId field with label for updates
    let ticketIdContainer = document.getElementById("ticket-id-container");
    if (!ticketIdContainer) {
      ticketIdContainer = document.createElement("div");
      ticketIdContainer.id = "ticket-id-container";

      const ticketIdLabel = document.createElement("label");
      ticketIdLabel.htmlFor = "ticket-id";
      ticketIdLabel.textContent = "Ticket ID:";

      const ticketIdField = document.createElement("input");
      ticketIdField.id = "ticket-id";
      ticketIdField.type = "text";
      ticketIdField.placeholder = "Enter your Ticket ID";
      ticketIdField.required = true;

      ticketIdContainer.appendChild(ticketIdLabel);
      ticketIdContainer.appendChild(ticketIdField);
      ticketForm.insertBefore(ticketIdContainer, ticketForm.firstChild);
    }
  } else {
    modalTitle.innerText = "Book Your Ticket";
    submitButton.innerText = "Book Ticket";

    // Remove Ticket ID container if it exists
    const ticketIdContainer = document.getElementById("ticket-id-container");
    if (ticketIdContainer) {
      ticketIdContainer.remove();
    }
  }

  // Close modal on clicking 'x'
  document.getElementById("close-modal").onclick = () => {
    modal.style.display = "none";
  };

  // Form submission handler
  ticketForm.onsubmit = (event) => {
    event.preventDefault();

    const visitorName = document.getElementById("visitor-name").value;
    const visitDate = document.getElementById("visit-date").value;
    const numTickets = document.getElementById("num-tickets").value;
    const ticketId = document.getElementById("ticket-id")?.value;

    // Validate the visit date
    const today = new Date();
    const selectedDate = new Date(visitDate);

    if (selectedDate < today.setHours(0, 0, 0, 0)) {
      alert(
        "You cannot book a ticket for a past date. Please select a valid date."
      );
      return;
    }

    if (isUpdate) {
      if (!ticketId) {
        alert("Please enter a valid Ticket ID.");
        return;
      }

      updateTicket({
        id: ticketId,
        destination,
        place: place.name,
        visitDate,
        numTickets,
      });
    } else {
      bookTicket({
        destination,
        place: place.name,
        visitorName,
        visitDate,
        numTickets,
      });
    }

    modal.style.display = "none";
  };
}

function bookTicket(ticketData) {
  fetch(`${baseUrl}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.ticketId) {
        alert(
          `Ticket booked successfully! Your Ticket ID is: ${data.ticketId}`
        );
      } else {
        alert("Failed to book the ticket. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error booking ticket:", error);
    });
}

function updateTicket(ticketData) {
  fetch(`${baseUrl}/tickets/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
    })
    .catch((error) => {
      console.error("Error updating ticket:", error);
      alert("Failed to update the ticket. Please try again.");
    });
}

// Function to delete a ticket by ID
function deleteTicket(ticketId) {
  try {
    const response = fetch(`http://localhost:3000/tickets/${ticketId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Ticket deleted successfully!");
      loadTickets(); // Refresh the ticket list
    } else {
      alert("Error deleting ticket: " + response.text());
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while deleting the ticket.");
  }
}

document.getElementById("weather-btn").onclick = () => {
  window.location.href = "weather.html";
};

// Initialize chatbot functionality
function initializeChatbot() {
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotSend = document.getElementById("chatbot-send");
  const chatbotClose = document.getElementById("chatbot-close");

  chatbotToggle.addEventListener("click", () => {
    chatbotWindow.classList.toggle("active");
  });

  chatbotClose.addEventListener("click", () => {
    chatbotWindow.classList.remove("active");
  });

  // Initially hide the chatbot window
  chatbotWindow.style.display = "none";

  // Welcome message and suggestions
  addBotMessage(
    "Hello! I'm your TravelEase assistant. I can help you with travel planning, destinations, accommodations, activities, weather, flights, and more. Feel free to ask any questions!"
  );
  addSuggestedQuestions();

  // Toggle chatbot visibility on button click
  chatbotToggle.onclick = () => {
    if (chatbotWindow.style.display === "none") {
      chatbotWindow.style.display = "block";
    } else {
      chatbotWindow.style.display = "none";
    }
  };

  // Close chatbot window when the close button is clicked
  chatbotClose.onclick = () => {
    chatbotWindow.style.display = "none";
  };

  // Handle send button click
  chatbotSend.onclick = () => sendMessage();

  // Handle Enter key press
  chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Send message function
  function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    // Display user's message
    addUserMessage(message);
    chatbotInput.value = "";

    // Fetch response from backend
    fetch(`${baseUrl}/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((response) => response.json())
      .then((data) => {
        addBotMessage(data.response);
      })
      .catch((error) => {
        console.error("Chatbot error:", error);
        addBotMessage("Oops! Something went wrong. Please try again later.");
      });
  }
}

// Add user message to the chat window
function addUserMessage(message) {
  const userMessage = document.createElement("div");
  userMessage.className = "chat-message user";
  userMessage.innerText = message;
  document.getElementById("chatbot-messages").appendChild(userMessage);
  scrollToBottom();
}

// Add bot message to the chat window
function addBotMessage(message) {
  const botMessage = document.createElement("div");
  botMessage.className = "chat-message bot";
  botMessage.innerText = message;
  document.getElementById("chatbot-messages").appendChild(botMessage);
  scrollToBottom();
}

// Suggested questions for user
function addSuggestedQuestions() {
  const suggestedQuestionsDiv = document.createElement("div");
  suggestedQuestionsDiv.className = "suggested-questions";
  const suggestedQuestions = [
    "What are the best destinations for monsoon?",
    "Tell me about Eravikulam National Park",
    "I want to visit Goa",
    "What's the weather in Udaipur?",
    "Help me find a flight to Goa",
  ];

  suggestedQuestions.forEach((question) => {
    const button = document.createElement("button");
    button.className = "suggested-question";
    button.innerText = question;
    button.onclick = () => {
      addUserMessage(question);
      fetch(`${baseUrl}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      })
        .then((response) => response.json())
        .then((data) => {
          addBotMessage(data.response);
        })
        .catch((error) => {
          console.error("Chatbot error:", error);
          addBotMessage("Oops! Something went wrong. Please try again later.");
        });
    };
    suggestedQuestionsDiv.appendChild(button);
  });

  document
    .getElementById("chatbot-messages")
    .appendChild(suggestedQuestionsDiv);
}

// Scroll chat window to the bottom
function scrollToBottom() {
  const messages = document.getElementById("chatbot-messages");
  messages.scrollTop = messages.scrollHeight;
}

// Initialize seasons on the page
function fetchSeasons() {
  const seasons = ["Summer", "Winter", "Monsoon"];
  const seasonContainer = document.getElementById("seasons");

  const bar = document.createElement("div");
  bar.className = "season-bar";
  bar.innerHTML = "<h2>Explore the Seasons</h2>";
  seasonContainer.appendChild(bar);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "season-button-container";

  seasons.forEach((season) => {
    const div = document.createElement("div");
    div.className = "season-item";

    const image = document.createElement("img");
    image.src = `/assets/${season.toLowerCase()}1.jpg`; // Updated path
    image.className = "season-image";

    const name = document.createElement("div");
    name.className = "season-name";
    name.innerText = season.charAt(0).toUpperCase() + season.slice(1);

    div.appendChild(image);
    div.appendChild(name);

    div.onclick = () =>
      (window.location.href = `destinations.html?season=${season}`);

    buttonContainer.appendChild(div);
  });

  seasonContainer.appendChild(buttonContainer);
}

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeChatbot();
  fetchSeasons();
  initializeMenus();
});

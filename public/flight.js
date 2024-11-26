// Base URL for the backend API
const BASE_URL = "http://localhost:3001";

// Function to fetch available flights
async function fetchFlights(from, to, date) {
    try {
        const response = await fetch(`${BASE_URL}/user/flights?from=${from}&to=${to}&date=${date}`);
        if (!response.ok) throw new Error("Error fetching flights");
        const data = await response.json();

        if (data.flights && data.flights.length > 0) {
            displayFlights(data.flights);
        } else {
            alert('No flights available for the selected criteria.');
            document.querySelector(".flights-list").style.display = 'none';
        }
    } catch (error) {
        alert(error.message);
    }
}

// Function to display flights
function displayFlights(flights) {
    const flightsContainer = document.querySelector(".flights-list");
    const flightResults = document.getElementById("flightResults");
    flightResults.innerHTML = ""; // Clear previous results
    flightsContainer.style.display = "block"; // Show flights section

    if (flights.length === 0) {
        flightResults.innerHTML = `<p>No flights available for the selected criteria.</p>`;
        return;
    }

    flights.forEach(flight => {
        const flightDiv = document.createElement("div");
        flightDiv.classList.add("flight");
        flightDiv.innerHTML = `
            <p><strong>From:</strong> ${flight.from}</p>
            <p><strong>To:</strong> ${flight.to}</p>
            <p><strong>Date:</strong> ${flight.date}</p>
            <p><strong>Seats Available:</strong></p>
            <ul>
                <li>Economy: ${flight.seatsAvailable.economy || 0}</li>
                <li>Business: ${flight.seatsAvailable.business || 0}</li>
                <li>First: ${flight.seatsAvailable.first || 0}</li>
            </ul>
            <button onclick="bookFlight(${flight.id}, '${flight.from}', '${flight.to}', '${flight.date}')">Book Flight</button>
        `;
        flightResults.appendChild(flightDiv);
    });
}

// Function to book a flight
// async function bookFlight(flightId, from, to, date) {
//     const passengers = parseInt(prompt("Enter the number of passengers:"));
//     const travelClass = prompt("Enter travel class (economy, business, first):").toLowerCase();

//     if (!passengers || passengers <= 0 || !["economy", "business", "first"].includes(travelClass)) {
//         alert("Invalid input. Try again.");
//         return;
//     }

//     // Send the booking data to the backend (match the required structure)
//     try {
//         const response = await fetch(`${BASE_URL}/user/bookings`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ from, to, date, passengers, travelClass }),
//         });
        

//         if (!response.ok) throw new Error("Error booking the flight");
//         const data = await response.json();
//         alert(data.message || "Flight booked successfully");
//         fetchFlights(from, to, date); // Refresh available flights after booking
//         fetchBookings(); // Refresh user's bookings
//     } catch (error) {
//         alert(error.message);
//     }
// }

// Function to book a flight
// Function to book a flight
function bookFlight(flightId) {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const date = document.getElementById('date').value;
    const passengers = prompt('Enter number of passengers:');
    const travelClass = prompt('Enter class (economy, premium economy, business, first):');

    // Validate input
    if (!passengers || !travelClass || isNaN(passengers) || passengers <= 0 || !['economy', 'premium economy', 'business', 'first'].includes(travelClass)) {
        alert('Please provide valid number of passengers and travel class.');
        return;
    }

    const bookingData = {
        from,
        to,
        date,
        passengers: parseInt(passengers),
        travelClass
    };

    console.log('Booking Data:', bookingData);  // Log the booking data to check it

    // Make the booking request
    fetch('http://localhost:3000/user/bookings', {  // Correct port to match your server
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => {
        console.log('Response Status:', response.status);  // Log status code
        return response.json();
    })
    .then(data => {
        console.log('Backend Response:', data);  // Log the backend response
        if (data.message === 'Flight booked successfully') {
            alert('Booking successful!');
        } else {
            alert(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error making booking:', error);
        alert('An error occurred while booking the flight.');
    });
}



// Function to fetch user's bookings
async function fetchBookings() {
    try {
        const response = await fetch(`${BASE_URL}/user/bookings`);
        if (!response.ok) throw new Error("Error fetching bookings");
        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        alert(error.message);
    }
}

// Function to display user's bookings
function displayBookings(bookings) {
    const bookingsContainer = document.querySelector(".user-bookings");
    const bookingResults = document.getElementById("bookingResults");
    bookingResults.innerHTML = ""; // Clear previous bookings
    bookingsContainer.style.display = "block"; // Show bookings section

    if (bookings.length === 0) {
        bookingResults.innerHTML = `<p>You have no bookings yet.</p>`;
        return;
    }

    bookings.forEach(booking => {
        const bookingDiv = document.createElement("div");
        bookingDiv.classList.add("booking");
        bookingDiv.innerHTML = `
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>From:</strong> ${booking.from}</p>
            <p><strong>To:</strong> ${booking.to}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Passengers:</strong> ${booking.passengers}</p>
            <p><strong>Class:</strong> ${booking.travelClass}</p>
            <button onclick="cancelBooking(${booking.id})">Cancel Booking</button>
        `;
        bookingResults.appendChild(bookingDiv);
    });
}

// Function to cancel a booking
async function cancelBooking(bookingId) {
    try {
        const response = await fetch(`${BASE_URL}/user/bookings/${bookingId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Error canceling booking");
        const data = await response.json();
        alert(data.message || "Booking canceled successfully");
        fetchBookings(); // Refresh user's bookings
    } catch (error) {
        alert(error.message);
    }
}

// Attach event listener to the "Search Flights" button
document.getElementById("searchFlights").addEventListener("click", () => {
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const date = document.getElementById("date").value;

    if (!from || !to || !date) {
        alert("Please fill in all fields.");
        return;
    }

    fetchFlights(from, to, date);
});

// Fetch user's bookings on page load
fetchBookings();

// Function to fetch available flights
async function fetchFlights(from, to, date) {
    try {
        const response = await fetch(`${BASE_URL}/user/flights?from=${from}&to=${to}&date=${date}`);
        if (!response.ok) throw new Error("Error fetching flights");
        const data = await response.json();

        if (data.flights && data.flights.length > 0) {
            displayFlights(data.flights);
        } else {
            alert('No flights available for the selected criteria.');
            document.querySelector(".flights-list").style.display = 'none';
        }
    } catch (error) {
        alert(error.message);
    }
}

// Function to display flights
function displayFlights(flights) {
    const flightsContainer = document.querySelector(".flights-list");
    const flightResults = document.getElementById("flightResults");
    flightResults.innerHTML = ""; // Clear previous results
    flightsContainer.style.display = "block"; // Show flights section

    if (flights.length === 0) {
        flightResults.innerHTML = `<p>No flights available for the selected criteria.</p>`;
        return;
    }

    flights.forEach(flight => {
        const flightDiv = document.createElement("div");
        flightDiv.classList.add("flight");
        flightDiv.innerHTML = `
            <p><strong>From:</strong> ${flight.from}</p>
            <p><strong>To:</strong> ${flight.to}</p>
            <p><strong>Date:</strong> ${flight.date}</p>
            <p><strong>Seats Available:</strong></p>
            <ul>
                <li>Economy: ${flight.seatsAvailable.economy || 0}</li>
                <li>Business: ${flight.seatsAvailable.business || 0}</li>
                <li>First: ${flight.seatsAvailable.first || 0}</li>
            </ul>
            <button onclick="bookFlight(${flight.id})">Book Flight</button>
        `;
        flightResults.appendChild(flightDiv);
    });
}

// Function to book a flight
async function bookFlight(flightId) {
    // Get flight details from the UI or flight object
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const date = document.getElementById('date').value;
    const passengers = parseInt(prompt("Enter the number of passengers:"));
    const travelClass = prompt("Enter travel class (economy, business, first):").toLowerCase();

    // Validate input
    if (!from || !to || !date || !passengers || passengers <= 0 || !["economy", "business", "first"].includes(travelClass)) {
        alert("Invalid input. Try again.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/user/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from, to, date, passengers, travelClass }),  // Send all required fields
        });

        if (!response.ok) throw new Error("Error booking the flight");
        const data = await response.json();
        alert(data.message || "Flight booked successfully");
        fetchFlights(); // Refresh available flights after booking
        fetchBookings(); // Refresh user's bookings
    } catch (error) {
        alert(error.message);
    }
}


// Function to fetch user's bookings
async function fetchBookings() {
    try {
        const response = await fetch(`${BASE_URL}/user/bookings`);
        if (!response.ok) throw new Error("Error fetching bookings");
        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        alert(error.message);
    }
}

// Function to display user's bookings
function displayBookings(bookings) {
    const bookingsContainer = document.querySelector(".user-bookings");
    const bookingResults = document.getElementById("bookingResults");
    bookingResults.innerHTML = ""; // Clear previous bookings
    bookingsContainer.style.display = "block"; // Show bookings section

    if (bookings.length === 0) {
        bookingResults.innerHTML = `<p>You have no bookings yet.</p>`;
        return;
    }

    bookings.forEach(booking => {
        const bookingDiv = document.createElement("div");
        bookingDiv.classList.add("booking");
        bookingDiv.innerHTML = `
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>From:</strong> ${booking.from}</p>
            <p><strong>To:</strong> ${booking.to}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Passengers:</strong> ${booking.passengers}</p>
            <p><strong>Class:</strong> ${booking.travelClass}</p>
            <button onclick="cancelBooking(${booking.id})">Cancel Booking</button>
        `;
        bookingResults.appendChild(bookingDiv);
    });
}

// Function to cancel a booking
async function cancelBooking(bookingId) {
    try {
        const response = await fetch(`${BASE_URL}/user/bookings/${bookingId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Error canceling booking");
        const data = await response.json();
        alert(data.message || "Booking canceled successfully");
        fetchBookings(); // Refresh user's bookings
    } catch (error) {
        alert(error.message);
    }
}

// Attach event listener to the "Search Flights" button
document.getElementById("searchFlights").addEventListener("click", () => {
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const date = document.getElementById("date").value;

    if (!from || !to || !date) {
        alert("Please fill in all fields.");
        return;
    }

    fetchFlights(from, to, date);
});

// Attach event listener to the "My Bookings" button
document.getElementById("viewBookings").addEventListener("click", () => {
    const bookingsSection = document.querySelector(".user-bookings");
    // Toggle visibility of user bookings section
    bookingsSection.style.display = bookingsSection.style.display === "block" ? "none" : "block";
    fetchBookings(); // Refresh bookings each time
});
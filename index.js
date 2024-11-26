const express = require("express");
const fs = require('fs');  
const cors = require("cors");
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

const { readFile, writeFile } = require("./file");
const usersRouter = require("./users");
const hotelsFile = "./hotels.json";
const destinationFile = "./destinations.json";
const ticketFile = "./tickets.json";
const postsFile = './posts.json';
const flightFile = "./flights.json";
const bookingFile = "./bookings.json";

// Importing moment.js for date handling
const moment = require("moment");
const fetch = require("node-fetch"); // Ensure you have node-fetch installed
const api_key = "6f939a5e5d230b2ce1b88b44f178ffc5"; // OpenWeatherMap API key

// const destinations = readFile();
// console.log(destinations); // Add this line to check the structure

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use(cors({ origin: "http://localhost:3001" }));

const itinerariesRouter = require("./itineraries");
app.use("/users", usersRouter);

app.use("/itineraries", itinerariesRouter);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "itinerary.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "hotels.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "flight.html"));
});

const hotelRoutes = require("./hotels");
app.use("/", hotelRoutes);

const galleryRoutes = require("./gallery");
app.use("/", galleryRoutes);

const premadeRoutes = require("./premade");
app.use("/",premadeRoutes);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Read destinations data
function readDestinations() {
  const dataPath = path.join(__dirname, "destinations.json");
  const data = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(data);
}

const isPastDate = (date) => {
  const today = new Date();
  const inputDate = new Date(date);
  return inputDate < today.setHours(0, 0, 0, 0);
};



// Chatbot endpoint
app.post("/chatbot", async (req, res) => {
  const { message } = req.body;

  if (!message) {
      return res.status(400).json({ error: "Message is required." });
  }

  const messageLower = message.toLowerCase();
  const destinations = readDestinations();
  let response = "I'm here to assist! Could you provide more details about what you're looking for?";

  // Handle season-based queries
  if (messageLower.includes("summer")) {
      const summerDestinations = destinations
          .filter((dest) => dest.season.toLowerCase() === "summer")
          .map((dest) => dest.destination);
      response = `Here are some great destinations to visit in summer:\n- ${summerDestinations.join("\n- ")}`;
  } else if (messageLower.includes("winter")) {
      const winterDestinations = destinations
          .filter((dest) => dest.season.toLowerCase() === "winter")
          .map((dest) => dest.destination);
      response = `Here are some great destinations to visit in winter:\n- ${winterDestinations.join("\n- ")}`;
  } else if (messageLower.includes("monsoon")) {
      const monsoonDestinations = destinations
          .filter((dest) => dest.season.toLowerCase() === "monsoon")
          .map((dest) => dest.destination);
      response = `Here are some great destinations to visit in monsoon:\n- ${monsoonDestinations.join("\n- ")}`;
  }

  // Handle destination description queries (e.g., "Tell me about Shimla")
  destinations.forEach((dest) => {
      if (messageLower === `tell me about ${dest.destination.toLowerCase()}`) {
          response = `About ${dest.destination}: ${dest.description || "No description available."}`;
      }
  });

  // Handle destination-specific places queries (e.g., "I want to visit Shimla")
  destinations.forEach((dest) => {
      if (messageLower.includes(`i want to visit ${dest.destination.toLowerCase()}`)) {
          const places = dest.places.map((place) => {
              const ticketInfo = place.requires_ticket ? "(Ticket Required)" : "(No Ticket Required)";
              return `${place.name} - ${place.description} [${place.opening_hours}] ${ticketInfo}`;
          });
          response = `Here are some places you can visit in ${dest.destination}:\n\n- ${places.join("\n\n- ")}`;
      }
  });

  // Handle place-specific queries (e.g., "Tell me about Mall Road")
  destinations.forEach((dest) => {
      dest.places.forEach((place) => {
          if (messageLower === `tell me about ${place.name.toLowerCase()}`) {
              response = `${place.name} in ${dest.destination}:\n\n${place.description}\n\nOpening Hours: ${place.opening_hours}\nTicket Info: ${
                  place.requires_ticket ? "Ticket Required" : "No Ticket Required"
              }.`;
          }
      });
  });

  // Handle weather queries
  if (messageLower.includes("weather")) {
      const cityMatch = messageLower.match(/weather in ([a-z\s]+)/i);
      if (cityMatch) {
          const city = cityMatch[1].trim();
          try {
              const weatherResponse = await fetch(
                  `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${api_key}`
              );
              const weatherData = await weatherResponse.json();

              if (weatherData.cod === 200) {
                  const { main, weather, wind } = weatherData;
                  response = `The weather in ${city} is currently ${weather[0].description} with a temperature of ${main.temp}°C. Humidity is ${main.humidity}%, and wind speed is ${wind.speed} km/h.`;
              } else {
                  response = `I couldn't find weather information for ${city}. Please check the city name and try again.`;
              }
          } catch (error) {
              console.error("Error fetching weather data:", error);
              response = "There was an error fetching the weather information. Please try again later.";
          }
      } else {
          response = "Please specify a city to check the weather, like 'What's the weather in Shimla?'.";
      }
  }

  // Handle flight queries
  if (messageLower.includes("flight")) {
    const validDestinations = destinations.map(dest => dest.destination.toLowerCase());

    // Extract the destination from the message
    const destinationMatch = messageLower.match(/flight to ([a-z\s,]+)/i);
    if (destinationMatch) {
        const userDestination = destinationMatch[1].trim().toLowerCase();

        // Check for partial matches
        const matchedDestination = validDestinations.find(dest =>
            dest.includes(userDestination) || userDestination.includes(dest)
        );

        if (matchedDestination) {
            response = `Great! I can assist you with flights to ${matchedDestination.charAt(0).toUpperCase() + matchedDestination.slice(1)}. Please provide the departure city (e.g., Delhi, Mumbai, etc.) and your preferred travel dates (must be a future date).`;
        } else {
            response = `I'm here to assist! Could you provide more details about what you're looking for?`;
        }
    } else {
        response = "I can assist you in finding flights. Please specify the destination (e.g., 'Help me find a flight to Goa') and provide departure city and travel dates.";
    }
}

  res.json({ response });
});

// Post a new destination with places  DIYA
app.post("/destination", (req, res) => {
  const { season, destination, places } = req.body;

  if (!season || !destination || !places) {
    return res.status(400).send("All fields are required.");
  }

  let destinations = readFile(destinationFile);
  let dest_id = destinations.length
    ? destinations[destinations.length - 1].id + 1
    : 1;

  const newDest = { id: dest_id, season, destination, places };
  destinations.push(newDest);
  writeFile(destinationFile, destinations);

  res.status(201).json(newDest);
});

app.get("/destinations", (req, res) => {
  let destinations = readFile(destinationFile); // Read destinations from the file
  
  // Check if destinations are found
  if (destinations && destinations.length > 0) {
    res.status(200).json(destinations); // Return destinations as JSON response
  } else {
    res.status(404).json({ message: "Destinations not found." }); // Handle error if no destinations found
  }
});

// Retrieve destinations for a particular season  DIYA
app.get("/destination/:season", (req, res) => {
  const season = req.params.season.toLowerCase();
  const destinations = readFile(destinationFile);
  const selectedDest = destinations.filter(
    (dest) => dest.season.toLowerCase() === season
  );
  res.status(200).json(selectedDest.map((dest) => dest.destination));
});

app.delete('/destinations/:id',(req,res)=>{
  const id = parseInt(req.params.id);
  const destinations = readFile(destinationFile);
  for(let i=0; i<destinations.length; i++){
    if(destinations[i].id===id){
      destinations.splice(i,1);
      writeFile(destinationFile, destinations);
      res.status(204).send();
      return;
    }
  }
  res.send(404).send(`${id} does not exist.`);
})

app.put('/destinations/:id',(req,res)=>{
  const id = parseInt(req.params.id);
  const destinations = readFile(destinationFile);
  for (let i = 0; i < destinations.length; i++) {
    if (destinations[i].id === id) {
      destinations[i].destination = req.body.destination;
      writeFile(destinationFile, destinations);
      res.status(204).send();
      return;
    }
  }
  res.status(404).send(`${id} does not exist.`);
})

// Retrieve a destination by id   // DIYA
app.get("/destinat/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const destinations = readFile(destinationFile);
  const dest = destinations.find((dest) => dest.id === id);

  if (dest) {
    res.status(200).json(dest);
  } else {
    res.status(404).send(`Id ${id} does not exist.`);
  }
});

// POST method to add a new place with ticket details // PRAGATI
app.post("/destinations/:id/places", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, opening_hours, ticket } = req.body;
  const destinations = readFile(destinationFile);
  const destIndex = destinations.findIndex((dest) => dest.id === id);

  if (destIndex === -1) {
    return res.status(404).send("Destination not found.");
  }

  if (!name || !description || !opening_hours || !ticket) {
    return res
      .status(400)
      .send("Name, description, opening hours, and ticket are required.");
  }

  const newPlace = { name, description, opening_hours, ticket };
  destinations[destIndex].places.push(newPlace);
  writeFile(destinationFile, destinations);

  res.status(201).json(newPlace);
});

// PUT method to update a place's details, including ticket information // PRAGATI
app.put("/destinations/:id/places/:placeName", (req, res) => {
  const id = parseInt(req.params.id);
  const placeName = req.params.placeName.toLowerCase();
  const { name, description, opening_hours, ticket } = req.body;
  const destinations = readFile(destinationFile);
  const destIndex = destinations.findIndex((dest) => dest.id === id);

  if (destIndex === -1) {
    return res.status(404).send("Destination not found.");
  }

  const placeIndex = destinations[destIndex].places.findIndex(
    (place) => place.name.toLowerCase() === placeName
  );

  if (placeIndex === -1) {
    return res.status(404).send("Place not found.");
  }

  const place = destinations[destIndex].places[placeIndex];
  if (name) place.name = name;
  if (description) place.description = description;
  if (opening_hours) place.opening_hours = opening_hours;
  if (ticket) place.ticket = ticket;

  writeFile(destinationFile, destinations);
  res.status(200).json(place);
});

// DELETE a place by destination and place name // PRAGATI
app.delete("/destinations/:destination/places/:placeName", (req, res) => {
  const destination = req.params.destination.toLowerCase();
  const placeName = req.params.placeName.toLowerCase();
  const destinations = readFile(destinationFile);
  const destinationIndex = destinations.findIndex(
    (dest) => dest.destination.toLowerCase() === destination
  );
  if (destinationIndex === -1) {
    return res.status(404).send(`Destination ${destination} not found.`);
  }
  const placeIndex = destinations[destinationIndex].places.findIndex(
    (place) => place.name.toLowerCase() === placeName
  );
  if (placeIndex === -1) {
    return res.status(404).send(`Place ${placeName} not found in ${destination}.`);
  }
  destinations[destinationIndex].places.splice(placeIndex, 1);
  writeFile(destinationFile, destinations);
  res.status(204).send();
});

// Retrieve places for a particular destination  //PRAGATI
app.get("/destinations/:destination", (req, res) => {
  const destination = req.params.destination.toLowerCase();
  const destinations = readFile(destinationFile);
  const placesArr = destinations.find(
    (dest) => dest.destination.toLowerCase() === destination
  );

  if (placesArr) {
    res.status(200).json(placesArr.places);
  } else {
    res.status(404).send("Destination not found.");
  }
});

// GET /tickets - Retrieve all booked tickets
app.get("/tickets/all", (req, res) => {
  try {
    // Read the tickets from the file
    const tickets = readFile(ticketFile);

    // If no tickets found, respond with a 404 status
    if (!tickets || tickets.length === 0) {
      return res.status(404).send("No tickets found.");
    }

    // Respond with the list of tickets
    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).send("An error occurred while fetching tickets.");
  }
});

// Retrieve a ticket by ID
app.get("/tickets/:id", (req, res) => {
  const { id } = req.params;

  const tickets = readFile(ticketFile);
  const ticket = tickets.find((ticket) => ticket.id == id);

  if (!ticket) {
    return res.status(404).send("Ticket not found.");
  }

  res.status(200).json(ticket);
});

// Ticket booking endpoint
app.post("/tickets", (req, res) => {
  const { destination, place, visitorName, visitDate, numTickets } = req.body;

  if (!destination || !place || !visitorName || !visitDate || !numTickets) {
    return res.status(400).send("All fields are required for booking a ticket.");
  }

  const today = moment().format('YYYY-MM-DD');
  if (moment(visitDate).isBefore(today)) {
    return res.status(400).send("You cannot book a ticket for a past date. Please select today or a future date.");
  }

  const newTicket = {
    id: Date.now(),
    destination,
    place,
    visitorName,
    visitDate,
    numTickets,
  };

  let tickets = readFile(ticketFile);
  tickets.push(newTicket);
  writeFile(ticketFile, tickets);

  // Return ticket information, including the ticket ID
  res.status(201).json({ message: "Ticket booked successfully", ticketId: newTicket.id });
});

// Update ticket endpoint
app.put("/tickets/update", (req, res) => {
  const { id, destination, place, visitDate, numTickets } = req.body;

  if (!id || !destination || !place || (!visitDate && !numTickets)) {
    return res
      .status(400)
      .send(
        "Ticket ID, and at least one field to update are required."
      );
  }

  const tickets = readFile(ticketFile);
  const ticketIndex = tickets.findIndex(
    (ticket) =>
      ticket.id == id &&
      ticket.destination.toLowerCase() === destination.toLowerCase() &&
      ticket.place.toLowerCase() === place.toLowerCase()
  );

  if (ticketIndex === -1) {
    return res.status(404).send("Matching ticket not found.");
  }

  // Update ticket details
  if (visitDate) {
    const today = moment().format("YYYY-MM-DD");
    if (moment(visitDate).isBefore(today)) {
      return res
        .status(400)
        .send("You cannot set a visit date in the past. Please select today or a future date.");
    }
    tickets[ticketIndex].visitDate = visitDate;
  }

  if (numTickets) {
    tickets[ticketIndex].numTickets = numTickets;
  }

  writeFile(ticketFile, tickets);

  res.status(200).json({
    message: "Ticket updated successfully!",
    updatedTicket: tickets[ticketIndex],
  });
});

//  Delete a ticket by ID
app.delete("/tickets/ticketId/:id", (req, res) => {
  const { id } = req.params;

  let tickets = readFile(ticketFile);
  const ticketIndex = tickets.findIndex((ticket) => ticket.id == id);

  if (ticketIndex === -1) {
    return res.status(404).send("Ticket not found.");
  }

  tickets.splice(ticketIndex, 1);
  writeFile(ticketFile, tickets);

  res.status(200).send("Ticket deleted successfully.");
});

// Get all flights
app.get('/admin/flights', (req, res) => {
  const flights = readFile(flightFile);
  res.json(flights);
});

// Admin: Search flight by ID
app.get('/admin/flights/:id', (req, res) => {
  const flights = readFile(flightFile);
  const flightId = parseInt(req.params.id);

  // Find the flight by ID
  const flight = flights.find(f => f.id === flightId);
  if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
  }

  res.json(flight);
});


// Add a new flight
app.post('/admin/flights', (req, res) => {
  const flights = readFile(flightFile);
  const { from, to, date, seatsAvailable } = req.body;

  // Validate input
  if (!from || !to || !date || !seatsAvailable) {
      return res.status(400).json({ message: 'All fields are required: from, to, date, seatsAvailable.' });
  }

  if (isPastDate(date)) {
      return res.status(400).json({ message: 'Cannot add a flight with a past date.' });
  }

  // Ensure seatsAvailable has valid classes
  const validClasses = ['economy', 'business', 'first'];
  const invalidClasses = Object.keys(seatsAvailable).filter(classType => !validClasses.includes(classType));

  if (invalidClasses.length > 0) {
      return res.status(400).json({ message: `Invalid seat classes: ${invalidClasses.join(', ')}.` });
  }

  const newFlight = {
      id: flights.length + 1,
      from,
      to,
      date,
      seatsAvailable,
  };

  flights.push(newFlight);
  writeFile(flightFile, flights);

  res.status(201).json({ message: 'Flight added successfully', flight: newFlight });
});

// Update a flight
app.put('/admin/flights/:id', (req, res) => {
  const flights = readFile(flightFile);
  const flightId = parseInt(req.params.id);
  const { from, to, date, seatsAvailable } = req.body;

  // Find the flight by ID
  const flight = flights.find(f => f.id === flightId);
  if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
  }

  // Validate date
  if (date && isPastDate(date)) {
      return res.status(400).json({ message: 'Cannot set a flight date in the past.' });
  }

  // Update flight details
  if (from) flight.from = from;
  if (to) flight.to = to;
  if (date) flight.date = date;
  if (seatsAvailable !== undefined) {
      if (seatsAvailable < 0) {
          return res.status(400).json({ message: 'Seats available cannot be negative.' });
      }
      flight.seatsAvailable = seatsAvailable;
  }

  writeFile(flightFile, flights);

  res.status(200).json({ message: 'Flight updated successfully', flight });
});

// Delete a flight
app.delete('/admin/flights/:id', (req, res) => {
  const flights = readFile(flightFile);
  const flightId = parseInt(req.params.id);

  const updatedFlights = flights.filter(flight => flight.id !== flightId);

  if (updatedFlights.length === flights.length) {
      return res.status(404).json({ message: 'Flight not found' });
  }

  writeFile(flightFile, updatedFlights);

  res.status(200).json({ message: 'Flight deleted successfully.' });
});

// Get all bookings
app.get('/admin/bookings', (req, res) => {
  const bookings = readFile(bookingFile);
  res.json(bookings);
});

// USER ENDPOINTS

// Get flights based on query parameters (from, to, date)
app.get('/user/flights', (req, res) => {
  const { from, to, date } = req.query;

  // Check if the required query parameters are provided
  if (!from || !to || !date) {
      return res.status(400).json({ message: 'Missing required query parameters: from, to, and date.' });
  }

  // Validate date: Ensure the date is not in the past
  const today = new Date();
  const inputDate = new Date(date);

  if (inputDate < today.setHours(0, 0, 0, 0)) {  
      return res.status(400).json({ message: 'Past flights cannot be shown.' });
  }
  const flights = readFile(flightFile);  
  const availableFlights = flights.filter(flight => 
      flight.from === from && 
      flight.to === to && 
      flight.date === date
  );

  // If no flights are found for the given date and route
  if (availableFlights.length === 0) {
      return res.status(404).json({ message: 'No flights available for the selected route and date.' });
  }

  // Return the available flights
  res.status(200).json({ flights: availableFlights });
});


// User: Search Bookings by ID
app.get('/user/bookings/:id', (req, res) => {
  const flights = readFile(bookingFile);
  const flightId = parseInt(req.params.id);

  // Find the flight by ID
  const flight = flights.find(f => f.id === flightId);
  if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
  }

  res.json(flight);
});


// User creates a new booking
app.post('/user/bookings', (req, res) => {
  const bookings = readFile(bookingFile);
  const flights = readFile(flightFile);
  const { from, to, date, passengers, travelClass } = req.body;

  // Validate input
  if (!from || !to || !date || !passengers || !travelClass) {
      return res.status(400).json({ message: 'All fields are required: from, to, date, passengers, travelClass.' });
  }

  // Validate date
  if (isPastDate(date)) {
      return res.status(400).json({ message: 'Cannot book a flight for a past date.' });
  }

  // Validate passengers
  if (passengers <= 0) {
      return res.status(400).json({ message: 'Number of passengers must be at least 1.' });
  }

  
  // Find the flight
  const flight = flights.find(f => f.from === from && f.to === to && f.date === date);
  if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
  }

  // Check seat availability for the requested class
  if (!flight.seatsAvailable[travelClass] || flight.seatsAvailable[travelClass] < passengers) {
      return res.status(400).json({ message: `Not enough seats available in ${travelClass} class.` });
  }

  // Decrease seat count for the requested class
  flight.seatsAvailable[travelClass] -= passengers;
  writeFile(flightFile, flights);

  // Add the booking to the bookings array
  const newBooking = {
      id: bookings.length + 1,
      from,
      to,
      date,
      passengers,
      travelClass,
  };

  bookings.push(newBooking);
  writeFile(bookingFile, bookings);

  res.status(201).json({ message: 'Flight booked successfully', booking: newBooking });
});



// View user bookings
app.get('/user/bookings', (req, res) => {
  const bookings = readFile(bookingFile);
  res.json(bookings);
});

// Cancel a booking
app.delete('/user/bookings/:id', (req, res) => {
  const bookings = readFile(bookingFile);
  const flights = readFile(flightFile);
  const bookingId = parseInt(req.params.id);

  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const flight = flights.find(f => f.from === booking.from && f.to === booking.to && f.date === booking.date);
  if (flight) flight.seatsAvailable += 1;

  writeFile(flightFile, flights);

  const updatedBookings = bookings.filter(b => b.id !== bookingId);
  writeFile(bookingFile, updatedBookings);

  res.status(200).json({ message: 'Booking canceled successfully.' });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

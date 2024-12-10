const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;
const MONGO_URI = "mongodb://localhost:27017/itineraryPlanner";

const { readFile, writeFile } = require("./file");
const usersRouter = require("./users");
const hotelsFile = "./hotels.json";
const destinationFile = "./destinations.json";
const ticketFile = "./tickets.json";
const postsFile = "./posts.json";
const flightFile = "./flights.json";
const bookingFile = "./bookings.json";

// Importing moment.js for date handling
const moment = require("moment");
const fetch = require("node-fetch"); // Ensure you have node-fetch installed
const api_key = "6f939a5e5d230b2ce1b88b44f178ffc5"; // OpenWeatherMap API key

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
app.use("/", premadeRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
  let response =
    "I'm here to assist! Could you provide more details about what you're looking for?";

  // Handle season-based queries
  if (messageLower.includes("summer")) {
    const summerDestinations = destinations
      .filter((dest) => dest.season.toLowerCase() === "summer")
      .map((dest) => dest.destination);
    response = `Here are some great destinations to visit in summer:\n- ${summerDestinations.join(
      "\n- "
    )}`;
  } else if (messageLower.includes("winter")) {
    const winterDestinations = destinations
      .filter((dest) => dest.season.toLowerCase() === "winter")
      .map((dest) => dest.destination);
    response = `Here are some great destinations to visit in winter:\n- ${winterDestinations.join(
      "\n- "
    )}`;
  } else if (messageLower.includes("monsoon")) {
    const monsoonDestinations = destinations
      .filter((dest) => dest.season.toLowerCase() === "monsoon")
      .map((dest) => dest.destination);
    response = `Here are some great destinations to visit in monsoon:\n- ${monsoonDestinations.join(
      "\n- "
    )}`;
  }

  // Handle destination description queries (e.g., "Tell me about Shimla")
  destinations.forEach((dest) => {
    if (messageLower === `tell me about ${dest.destination.toLowerCase()}`) {
      response = `About ${dest.destination}: ${
        dest.description || "No description available."
      }`;
    }
  });

  // Handle destination-specific places queries (e.g., "I want to visit Shimla")
  destinations.forEach((dest) => {
    if (
      messageLower.includes(`i want to visit ${dest.destination.toLowerCase()}`)
    ) {
      const places = dest.places.map((place) => {
        const ticketInfo = place.requires_ticket
          ? "(Ticket Required)"
          : "(No Ticket Required)";
        return `${place.name} - ${place.description} [${place.opening_hours}] ${ticketInfo}`;
      });
      response = `Here are some places you can visit in ${
        dest.destination
      }:\n\n- ${places.join("\n\n- ")}`;
    }
  });

  // Handle place-specific queries (e.g., "Tell me about Mall Road")
  destinations.forEach((dest) => {
    dest.places.forEach((place) => {
      if (messageLower === `tell me about ${place.name.toLowerCase()}`) {
        response = `${place.name} in ${dest.destination}:\n\n${
          place.description
        }\n\nOpening Hours: ${place.opening_hours}\nTicket Info: ${
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
        response =
          "There was an error fetching the weather information. Please try again later.";
      }
    } else {
      response =
        "Please specify a city to check the weather, like 'What's the weather in Shimla?'.";
    }
  }

  // Handle flight queries
  if (messageLower.includes("flight")) {
    const validDestinations = destinations.map((dest) =>
      dest.destination.toLowerCase()
    );

    // Extract the destination from the message
    const destinationMatch = messageLower.match(/flight to ([a-z\s,]+)/i);
    if (destinationMatch) {
      const userDestination = destinationMatch[1].trim().toLowerCase();

      // Check for partial matches
      const matchedDestination = validDestinations.find(
        (dest) =>
          dest.includes(userDestination) || userDestination.includes(dest)
      );

      if (matchedDestination) {
        response = `Great! I can assist you with flights to ${
          matchedDestination.charAt(0).toUpperCase() +
          matchedDestination.slice(1)
        }. Please provide the departure city (e.g., Delhi, Mumbai, etc.) and your preferred travel dates (must be a future date).`;
      } else {
        response = `I'm here to assist! Could you provide more details about what you're looking for?`;
      }
    } else {
      response =
        "I can assist you in finding flights. Please specify the destination (e.g., 'Help me find a flight to Goa') and provide departure city and travel dates.";
    }
  }

  res.json({ response });
});

// Post a new destination with places
app.post("/destination", async (req, res) => {
  const { season, destination, places } = req.body;

  // Check if required fields are present
  if (!season || !destination || !places) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Create a new destination document with places
    const newDest = new Destination({
      season,
      destination,
      places,
    });

    // Save the new destination to MongoDB
    await newDest.save();

    // Respond with the newly created destination
    res.status(201).json(newDest);
  } catch (err) {
    console.error("Error saving destination:", err);
    res.status(500).send("Server error");
  }
});

// Get all destinations
app.get("/destinations", async (req, res) => {
  try {
    // Fetch all destinations from MongoDB
    const destinations = await Destination.find();

    // Check if destinations are found
    if (destinations && destinations.length > 0) {
      res.status(200).json(destinations); // Return destinations as JSON response
    } else {
      res.status(404).json({ message: "Destinations not found." }); // Handle error if no destinations found
    }
  } catch (err) {
    console.error("Error fetching destinations:", err);
    res.status(500).send("Server error"); // Handle server errors
  }
});

app.get("/destination/:season", async (req, res) => {
  const season = req.params.season.toLowerCase();

  try {
    // Use the 'admin' database and the 'destinations' collection
    const selectedDest = await mongoose.connection.db
      .collection("destinations")
      .find({
        season: { $regex: new RegExp(season, "i") },
      })
      .toArray();

    // Check if destinations are found
    if (selectedDest.length > 0) {
      res.status(200).json(selectedDest.map((dest) => dest.destination));
    } else {
      res
        .status(404)
        .json({ message: `No destinations found for the season ${season}.` });
    }
  } catch (err) {
    console.error("Error fetching destinations for season:", err);
    res.status(500).send("Server error");
  }
});

// Delete a destination by ID
app.delete("/destinations/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Find and delete the destination by ID in MongoDB
    const deletedDest = await Destination.findByIdAndDelete(id);

    if (deletedDest) {
      res.status(204).send(); // Successfully deleted
    } else {
      res.status(404).send(`${id} does not exist.`); // Destination not found
    }
  } catch (err) {
    console.error("Error deleting destination:", err);
    res.status(500).send("Server error");
  }
});

// Update a destination by ID
app.put("/destinations/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Find the destination by ID and update it
    const updatedDest = await Destination.findByIdAndUpdate(
      id,
      { destination: req.body.destination },
      { new: true } // Return the updated document
    );

    if (updatedDest) {
      res.status(204).send(); // Successfully updated
    } else {
      res.status(404).send(`${id} does not exist.`); // Destination not found
    }
  } catch (err) {
    console.error("Error updating destination:", err);
    res.status(500).send("Server error");
  }
});

// Retrieve a destination by id
app.get("/destinat/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Find destination by ID
    const dest = await Destination.findById(id);

    if (dest) {
      res.status(200).json(dest); // Return the found destination
    } else {
      res.status(404).send(`Id ${id} does not exist.`); // Destination not found
    }
  } catch (err) {
    console.error("Error retrieving destination:", err);
    res.status(500).send("Server error");
  }
});

// POST method to add a new place with ticket details // PRAGATI
app.post("/destinations/:id/places", async (req, res) => {
  const destinationId = req.params.id;
  const { name, description, opening_hours, requires_ticket } = req.body;

  try {
    // Access the destinations collection
    const destinationsCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists using ObjectId
    const destination = await destinationsCollection.findOne({
      _id: new mongoose.Types.ObjectId(destinationId), // Use 'new' here
    });

    if (!destination) {
      return res.status(404).send("Destination not found.");
    }

    // Validate that all required fields are present
    if (
      !name ||
      !description ||
      !opening_hours ||
      requires_ticket === undefined
    ) {
      return res
        .status(400)
        .send(
          "Name, description, opening hours, and requires_ticket are required."
        );
    }

    // Create a new place object
    const newPlace = { name, description, opening_hours, requires_ticket };

    // Update the destination by pushing the new place into the places array
    const updateResult = await destinationsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(destinationId) }, // Use 'new' here
      { $push: { places: newPlace } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).send("Failed to add the place.");
    }

    // Respond with the newly added place
    res.status(201).json(newPlace);
  } catch (error) {
    console.error("Error adding place:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT method to update a place's details, including ticket information
app.put("/destinations/:id/places/:placeName", async (req, res) => {
  const destinationId = req.params.id;
  const placeName = req.params.placeName.toLowerCase();
  const { name, description, opening_hours, requires_ticket } = req.body;

  try {
    // Access the destinations collection
    const destinationsCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists using ObjectId
    const destination = await destinationsCollection.findOne({
      _id: new mongoose.Types.ObjectId(destinationId), // Use 'new' here
    });

    if (!destination) {
      return res.status(404).send("Destination not found.");
    }

    // Find the place to update
    const placeIndex = destination.places.findIndex(
      (place) => place.name.toLowerCase() === placeName
    );

    if (placeIndex === -1) {
      return res.status(404).send("Place not found.");
    }

    // Update the place details
    const place = destination.places[placeIndex];
    if (name) place.name = name;
    if (description) place.description = description;
    if (opening_hours) place.opening_hours = opening_hours;
    if (requires_ticket !== undefined) place.requires_ticket = requires_ticket;

    // Update the destination with the modified place
    const updateResult = await destinationsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(destinationId) }, // Use 'new' here
      { $set: { [`places.${placeIndex}`]: place } } // Use the index to update the specific place
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).send("Failed to update the place.");
    }

    // Respond with the updated place
    res.status(200).json(place);
  } catch (error) {
    console.error("Error updating place:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a place by destination and place name
app.delete("/destinations/:id/places/:placeName", async (req, res) => {
  const destinationId = req.params.id;
  const placeName = req.params.placeName.toLowerCase();

  try {
    // Access the destinations collection
    const destinationsCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists using ObjectId
    const destination = await destinationsCollection.findOne({
      _id: new mongoose.Types.ObjectId(destinationId), // Use 'new' here
    });

    if (!destination) {
      return res
        .status(404)
        .send(`Destination with ID ${destinationId} not found.`);
    }

    // Find the place to delete
    const placeIndex = destination.places.findIndex(
      (place) => place.name.toLowerCase() === placeName
    );

    if (placeIndex === -1) {
      return res
        .status(404)
        .send(`Place ${placeName} not found in destination ${destinationId}.`);
    }

    // Remove the place from the destination
    destination.places.splice(placeIndex, 1);

    // Update the destination with the modified places array
    const updateResult = await destinationsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(destinationId) }, // Use 'new' here
      { $set: { places: destination.places } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).send("Failed to delete the place.");
    }

    res.status(204).send(); // Successfully deleted the place
  } catch (error) {
    console.error("Error deleting place:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to get places for a specific destination
app.get("/destinations/:destination", async (req, res) => {
  const destinationName = req.params.destination.toLowerCase();

  try {
    // Access the destinations collection
    const destinationsCollection =
      mongoose.connection.db.collection("destinations");

    // Find the destination in the database
    const destination = await destinationsCollection.findOne({
      destination: { $regex: new RegExp(destinationName, "i") },
    });

    if (destination) {
      // If destination is found, return the places array
      res.status(200).json(destination.places);
    } else {
      // If destination is not found, return a 404 error
      res.status(404).send("Destination not found.");
    }
  } catch (error) {
    console.error("Error retrieving destination places:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ticket Schema and Model
const ticketSchema = new mongoose.Schema({
  destination: String,
  place: String,
  visitorName: String,
  visitDate: String,
  numTickets: Number,
});

const Ticket = mongoose.model("Ticket", ticketSchema);

// GET /tickets/all - Retrieve all booked tickets
app.get("/tickets/all", async (req, res) => {
  try {
    const tickets = await Ticket.find(); // Fetch all tickets
    if (tickets.length === 0) {
      return res.status(404).send("No tickets found.");
    }
    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).send("An error occurred while fetching tickets.");
  }
});

// GET /tickets/:id - Retrieve a ticket by ID
app.get("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id); // Fetch ticket by ID
    if (!ticket) {
      return res.status(404).send("Ticket not found.");
    }
    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).send("An error occurred while fetching the ticket.");
  }
});

// POST /tickets - Book a ticket
app.post("/tickets", async (req, res) => {
  const { destination, place, visitorName, visitDate, numTickets } = req.body;

  if (!destination || !place || !visitorName || !visitDate || !numTickets) {
    return res
      .status(400)
      .send("All fields are required for booking a ticket.");
  }

  const today = moment().format("YYYY-MM-DD");
  if (moment(visitDate).isBefore(today)) {
    return res.status(400).send("You cannot book a ticket for a past date.");
  }

  const newTicket = new Ticket({
    destination,
    place,
    visitorName,
    visitDate,
    numTickets,
  });

  try {
    await newTicket.save(); // Save ticket to MongoDB
    res
      .status(201)
      .json({ message: "Ticket booked successfully", ticketId: newTicket._id });
  } catch (error) {
    console.error("Error booking ticket:", error);
    res.status(500).send("An error occurred while booking the ticket.");
  }
});

// PUT /tickets/update - Update a ticket
app.put("/tickets/update", async (req, res) => {
  const { id, destination, place, visitorName, visitDate, numTickets } =
    req.body;

  if (!id) {
    return res.status(400).send("Ticket ID is required for updating a ticket.");
  }

  try {
    // Find the ticket by ID
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).send("Ticket not found.");
    }

    // Update fields only if provided in the request body
    if (destination) ticket.destination = destination;
    if (place) ticket.place = place;
    if (visitDate) {
      const today = moment().format("YYYY-MM-DD");
      if (moment(visitDate).isBefore(today)) {
        return res
          .status(400)
          .send(
            "You cannot set a visit date in the past. Please select today or a future date."
          );
      }
      ticket.visitDate = visitDate;
    }
    if (numTickets) ticket.numTickets = numTickets;
    if (visitorName) ticket.visitorName = visitorName;

    // Save the updated ticket to MongoDB
    const updatedTicket = await ticket.save();

    res.status(200).json({
      message: "Ticket updated successfully!",
      updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).send("An error occurred while updating the ticket.");
  }
});

// DELETE /tickets/ticketId/:id - Delete a ticket
app.delete("/tickets/ticketId/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTicket = await Ticket.findByIdAndDelete(id); // Delete ticket by ID
    if (!deletedTicket) {
      return res.status(404).send("Ticket not found.");
    }
    res.status(200).send("Ticket deleted successfully.");
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).send("An error occurred while deleting the ticket.");
  }
});


// Define Flight schema and model
const flightSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  seatsAvailable: {
    economy: { type: Number, required: true },
    business: { type: Number, required: true },
    first: { type: Number, required: true }
  }
});

const Flight = mongoose.model('Flight', flightSchema);

// Define Booking schema and model
const bookingSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  passengers: { type: Number, required: true },
  travelClass: { type: String, required: true, enum: ['economy', 'premiumEconomy', 'business', 'first'] }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Admin: Get all flights
app.get('/admin/flights', async (req, res) => {
  try {
    const flights = await Flight.find(); // MongoDB query to get all flights
    res.json(flights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flights' });
  }
});

// Admin: Search flight by ID
app.get('/admin/flights/:id', async (req, res) => {
  const flightId = req.params.id;

  try {
    const flight = await Flight.findById(flightId); // MongoDB query to find flight by ID
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }
    res.json(flight);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flight' });
  }
});


// Admin: Add a new flight
app.post('/admin/flights', async (req, res) => {
  const { from, to, date, seatsAvailable } = req.body;

  const isPastDate = (date) => {
    const flightDate = new Date(date);
    const currentDate = new Date();
    return flightDate < currentDate;
  };

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

  const newFlight = new Flight({
    from,
    to,
    date,
    seatsAvailable
  });

  try {
    await newFlight.save();
    res.status(201).json({ message: 'Flight added successfully', flight: newFlight });
  } catch (error) {
    console.error('Error adding flight:', error); // Log the error
    res.status(500).json({ message: 'Error adding flight', error: error.message });
  }

});

// Admin: Update a flight
app.put('/admin/flights/:id', async (req, res) => {
  const flightId = req.params.id;
  const { from, to, date, seatsAvailable } = req.body;

  try {
    const flight = await Flight.findById(flightId); // MongoDB query to find flight by ID
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    if (date && isPastDate(date)) {
      return res.status(400).json({ message: 'Cannot set a flight date in the past.' });
    }

    if (from) flight.from = from;
    if (to) flight.to = to;
    if (date) flight.date = date;
    if (seatsAvailable !== undefined) {
      if (seatsAvailable < 0) {
        return res.status(400).json({ message: 'Seats available cannot be negative.' });
      }
      flight.seatsAvailable = seatsAvailable;
    }

    await flight.save();

    res.status(200).json({ message: 'Flight updated successfully', flight });
  } catch (error) {
    res.status(500).json({ message: 'Error updating flight' });
  }
});

// Admin: Delete a flight
app.delete('/admin/flights/:id', async (req, res) => {
  const flightId = req.params.id;

  try {
    const flight = await Flight.findByIdAndDelete(flightId); // MongoDB query to delete flight
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.status(200).json({ message: 'Flight deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting flight' });
  }
});

// Admin: Get all bookings
app.get('/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find(); // MongoDB query to get all bookings
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// USER ENDPOINTS

// Get flights based on query parameters (from, to, date)
app.get('/user/flights', async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ message: 'Missing required query parameters: from, to, and date.' });
  }

  const today = new Date();
  const inputDate = new Date(date);

  if (inputDate < today.setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: 'Past flights cannot be shown.' });
  }

  try {
    const flights = await Flight.find({ from, to, date });
    if (flights.length === 0) {
      return res.status(404).json({ message: 'No flights available for the selected route and date.' });
    }
    res.status(200).json({ flights });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flights' });
  }
});

// User: Search Bookings by ID
app.get('/user/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// User creates a new booking
app.post('/user/bookings', async (req, res) => {
  const { from, to, date, passengers, travelClass } = req.body;

  if (!from || !to || !date || !passengers || !travelClass) {
    return res.status(400).json({ message: 'All fields are required: from, to, date, passengers, travelClass.' });
  }

  const today = new Date();
  const inputDate = new Date(date);

  if (inputDate < today.setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: 'Cannot book a flight for a past date.' });
  }

  if (passengers <= 0) {
    return res.status(400).json({ message: 'Number of passengers must be at least 1.' });
  }

  try {
    const flight = await Flight.findOne({ from, to, date });
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
    }

    if (flight.seatsAvailable[travelClass] < passengers) {
      return res.status(400).json({ message: `Not enough seats available in ${travelClass} class.` });
    }

    flight.seatsAvailable[travelClass] -= passengers;
    await flight.save();

    const newBooking = new Booking({
      from,
      to,
      date,
      passengers,
      travelClass
    });

    await newBooking.save();

    res.status(201).json({ message: 'Flight booked successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// View user bookings
app.get('/user/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Cancel a booking
app.delete('/user/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const flight = await Flight.findOne({ from: booking.from, to: booking.to, date: booking.date });
    if (flight) {
      flight.seatsAvailable[booking.travelClass] += booking.passengers;
      await flight.save();
    }

    res.status(200).json({ message: 'Booking canceled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error canceling booking' });
  }
});

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the server only after successful connection
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });




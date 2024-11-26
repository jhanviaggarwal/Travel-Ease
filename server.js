const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const flightFile = "./flights.json";
const bookingFile = "./bookings.json";
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility functions
const readFile = (filename) => {
    const filePath = path.join(__dirname, 'data', filename);
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
};

const writeFile = (filename, data) => {
    const filePath = path.join(__dirname, 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const isPastDate = (date) => {
    const today = new Date();
    const inputDate = new Date(date);
    return inputDate < today.setHours(0, 0, 0, 0);
};

// ADMIN ENDPOINTS
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
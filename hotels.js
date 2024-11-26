const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

router.use(express.json());

const destinationFile = path.join(__dirname, "destinations.json");
const hotelsFile = path.join(__dirname, "hotels.json");

// Utility functions to read and write JSON files
const readFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
const writeFile = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));//stringify converts the jso to json, null-> no filter, 2 -> 2 indentation

// Route to get all hotels for a specific destination
router.get("/:destinationName/hotels", (req, res) => {
  const destinationName = req.params.destinationName;

  // Read destinations and hotels data
  const destinations = readFile(destinationFile);
  const hotels = readFile(hotelsFile);

  // Validate if the destination exists
  const destinationExists = destinations.some(
    (destination) => destination.destination === destinationName
  );
  if (!destinationExists) {
    return res.status(404).json({ msg: "Destination not found." });
  }

  // Filter hotels by destination ID
  const hotelsForDestination = hotels.filter(
    (hotel) => hotel.destinationName === destinationName
  );

  res.status(200).json(hotelsForDestination);
});

// Route to add a new hotel for a specific destination
router.post("/:destinationName/hotels", (req, res) => {
  const destinationName = req.params.destinationName;
  const {
    name,
    rating,
    distanceFromCenter,
    pricePerNight,
    address,
    amenities,
    contact,
    rooms,
    cancellationPolicy,
    checkInTime,
    checkOutTime,
  } = req.body;

  if (!name || !rating || !distanceFromCenter || !pricePerNight || !address) {
    return res
      .status(400)
      .send(
        "Required fields: name, rating, distanceFromCenter, pricePerNight, and address."
      );
  }

  const destinations = readFile(destinationFile);

  // Validate destination existence
  const destinationExists = destinations.some(
    (destination) => destination.destination === destinationName
  );

  if (!destinationExists) {
    return res.status(404).json({ msg: "Destination not found." });
  }

  const hotels = readFile(hotelsFile);
  const hotelId = hotels.length ? hotels[hotels.length - 1].id + 1 : 1;

  const newHotel = {
    id: hotelId,
    destinationName,
    name,
    rating,
    distanceFromCenter,
    pricePerNight,
    address,
    amenities: amenities || [],
    contact: contact || null,
    rooms: rooms || [],
    cancellationPolicy: cancellationPolicy || null,
    checkInTime: checkInTime || null,
    checkOutTime: checkOutTime || null,
  };

  hotels.push(newHotel);
  writeFile(hotelsFile, hotels);

  res.status(201).json(newHotel);
});

// Route to update hotel details
router.put("/:destinationName/hotels/:hotelId", (req, res) => {
  const destinationName = req.params.destinationName;
  const hotelId = parseInt(req.params.hotelId);
  const {
    name,
    rating,
    distanceFromCenter,
    pricePerNight,
    address,
    amenities,
    contact,
    rooms,
    cancellationPolicy,
    checkInTime,
    checkOutTime,
  } = req.body;

  const destinations = readFile(destinationFile);
  const hotels = readFile(hotelsFile);

  // Validate destination existence
  const destinationExists = destinations.some(
    (destination) => destination.destination === destinationName
  );
  if (!destinationExists) {
    return res.status(404).json({ msg: "Destination not found." });
  }

  // Find hotel by ID and destination
  const hotelIndex = hotels.findIndex(
    (hotel) => hotel.id === hotelId && hotel.destinationName === destinationName
  );

  if (hotelIndex === -1) {
    return res.status(404).json({ msg: "Hotel not found." });
  }

  // Update hotel data
  const hotel = hotels[hotelIndex];
  if (name) hotel.name = name;
  if (rating) hotel.rating = rating;
  if (distanceFromCenter) hotel.distanceFromCenter = distanceFromCenter;
  if (pricePerNight) hotel.pricePerNight = pricePerNight;
  if (address) hotel.address = address;
  if (amenities) hotel.amenities = amenities;
  if (contact) hotel.contact = contact;
  if (rooms) hotel.rooms = rooms;
  if (cancellationPolicy) hotel.cancellationPolicy = cancellationPolicy;
  if (checkInTime) hotel.checkInTime = checkInTime;
  if (checkOutTime) hotel.checkOutTime = checkOutTime;

  writeFile(hotelsFile, hotels);

  res.status(200).json(hotel);
});

// Route to delete a hotel
router.delete("/:destinationName/hotels/:hotelId", (req, res) => {
  const destinationName = req.params.destinationName;
  const hotelId = parseInt(req.params.hotelId);

  const destinations = readFile(destinationFile);
  const hotels = readFile(hotelsFile);

  // Validate destination existence
  const destinationExists = destinations.some(
    (destination) => destination.destination === destinationName
  );
  if (!destinationExists) {
    return res.status(404).send("Destination not found.");
  }

  // Find the hotel to delete
  const hotelIndex = hotels.findIndex(
    (hotel) => hotel.id === hotelId && hotel.destinationName === destinationName
  );

  if (hotelIndex === -1) {
    return res.status(404).send("Hotel not found.");
  }

  // Remove hotel
  hotels.splice(hotelIndex, 1);
  writeFile(hotelsFile, hotels);

  res.status(200).json({ msg: `Hotel with ID ${hotelId} has been deleted. `});
});

// Route to search hotels for a specific destination
router.get("/:destinationName/hotels/search", (req, res) => {
  const destinationName = req.params.destinationName;
  const { name, minRating, minPrice, maxPrice } = req.query;

  const destinations = readFile(destinationFile);
  const hotels = readFile(hotelsFile);

  const destinationExists = destinations.some(
    (destination) => destination.destination === destinationName
  );
  if (!destinationExists) {
    return res.status(404).json({ msg: "Destination not found." });
  }

  // Filter hotels by destination and query
  let filteredHotels = hotels.filter((hotel) => hotel.destinationName === destinationName);

  if (name) {
    filteredHotels = filteredHotels.filter((hotel) =>
      hotel.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (minRating) {
    filteredHotels = filteredHotels.filter(
      (hotel) => hotel.rating >= parseFloat(minRating)
    );
  }

  if (minPrice && maxPrice) {
    filteredHotels = filteredHotels.filter(
      (hotel) =>
        hotel.pricePerNight >= parseFloat(minPrice) &&
        hotel.pricePerNight <= parseFloat(maxPrice)
    );
  } else if (minPrice) {
    filteredHotels = filteredHotels.filter(
      (hotel) => hotel.pricePerNight >= parseFloat(minPrice)
    );
  } else if (maxPrice) {
    filteredHotels = filteredHotels.filter(
      (hotel) => hotel.pricePerNight <= parseFloat(maxPrice)
    );
  }

  res.status(200).json(filteredHotels);
});

module.exports = router;
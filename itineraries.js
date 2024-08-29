const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const ITINERARIES_FILE = path.join(__dirname, "./itineraries.json");

const readItinerariesFile = () => {
  if (!fs.existsSync(ITINERARIES_FILE)) {
    fs.writeFileSync(ITINERARIES_FILE, JSON.stringify([]));
  }
  const data = fs.readFileSync(ITINERARIES_FILE, "utf-8");
  let itineraries = [];
  try {
    itineraries = JSON.parse(data);
  } catch (error) {
    console.error("Error parsing itineraries file:", error);
    itineraries = []; // Fallback to an empty array if parsing fails
  }
  return Array.isArray(itineraries) ? itineraries : [];
};

const writeItinerariesFile = (itineraries) => {
  fs.writeFileSync(ITINERARIES_FILE, JSON.stringify(itineraries, null, 2));
};

// Get all itineraries
router.get("/", (req, res) => {
  const itineraries = readItinerariesFile();
  res.json(itineraries);
});

// Create a new itinerary
router.post("/", (req, res) => {
  const itineraries = readItinerariesFile();
  const newItinerary = {
    id: Math.floor(1000 + Math.random() * 9000).toString(), // Generate a 4-digit unique ID
    name: req.body.name,
    destinations: [],
  };
  itineraries.push(newItinerary);
  writeItinerariesFile(itineraries);
  res.status(201).json(newItinerary);
});

// Get an itinerary by ID
router.get("/:id", (req, res) => {
  const itineraries = readItinerariesFile();
  const itinerary = itineraries.find((it) => it.id === req.params.id);
  if (itinerary) {
    res.json(itinerary);
  } else {
    res.status(404).json({ message: "Itinerary not found" });
  }
});

// Update an itinerary
router.put("/:id", (req, res) => {
  const itineraries = readItinerariesFile();
  const itineraryIndex = itineraries.findIndex((it) => it.id === req.params.id);
  if (itineraryIndex !== -1) {
    itineraries[itineraryIndex].name = req.body.name;
    writeItinerariesFile(itineraries);
    res.json(itineraries[itineraryIndex]);
  } else {
    res.status(404).json({ message: "Itinerary not found" });
  }
});

// Delete an itinerary
router.delete("/:id", (req, res) => {
  let itineraries = readItinerariesFile();
  const itineraryIndex = itineraries.findIndex((it) => it.id === req.params.id);
  if (itineraryIndex !== -1) {
    itineraries.splice(itineraryIndex, 1);
    writeItinerariesFile(itineraries);
    res.status(204).end();
  } else {
    res.status(404).json({ message: "Itinerary not found" });
  }
});

// Add a destination to an itinerary
router.post("/:id/destinations", (req, res) => {
  const itineraries = readItinerariesFile();
  const itinerary = itineraries.find((it) => it.id === req.params.id);
  if (itinerary) {
    const newDestinationId = (itinerary.destinations.length + 1).toString(); // Generate a sequential ID
    const newDestination = {
      id: newDestinationId,
      name: req.body.name,
    };
    itinerary.destinations.push(newDestination);
    writeItinerariesFile(itineraries);
    res.status(201).json(newDestination);
  } else {
    res.status(404).json({ message: "Itinerary not found" });
  }
});

// Update a destination
router.put("/:id/destinations/:destinationId", (req, res) => {
  const itineraries = readItinerariesFile();
  const itinerary = itineraries.find((it) => it.id === req.params.id);
  if (itinerary) {
    const destinationIndex = itinerary.destinations.findIndex(
      (dest) => dest.id === req.params.destinationId
    );
    if (destinationIndex !== -1) {
      itinerary.destinations[destinationIndex].name = req.body.name;
      writeItinerariesFile(itineraries);
      res.json(itinerary.destinations[destinationIndex]);
    } else {
      res.status(404).json({ message: "Destination not found" });
    }
  } else {
    res.status(404).json({ message: "Itinerary not found" });
  }
});

// Delete a destination
router.delete("/:id/destinations/:destinationId", (req, res) => {
  const itineraries = readItinerariesFile();
  const itinerary = itineraries.find((it) => it.id === req.params.id);
  if (itinerary) {
    const destinationIndex = itinerary.destinations.findIndex(
      (dest) => dest.id === req.params.destinationId
    );
    if (destinationIndex !== -1) {
      itinerary.destinations.splice(destinationIndex, 1);
      writeItinerariesFile(itineraries);
      res.status(204).end();
    } else {
      res.status(404).json({ message: "Destination not found" });
    }
  } else {
    res.status(404).json({ message: "Itinerary not found" });
  }
});

module.exports = router;
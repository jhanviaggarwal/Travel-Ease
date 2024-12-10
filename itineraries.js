const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Schema and Model
const DestinationSchema = new mongoose.Schema({
  id: String,
  name: String,
});

const ItinerarySchema = new mongoose.Schema({
  id: String,
  name: String,
  destinations: [DestinationSchema],
});

const Itinerary = mongoose.model("Itinerary", ItinerarySchema);

// Routes

// Get all itineraries
router.get("/", async (req, res) => {
  try {
    const itineraries = await Itinerary.find();
    res.json(itineraries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching itineraries", error });
  }
});

// Create a new itinerary
router.post("/", async (req, res) => {
  try {
    const newItinerary = new Itinerary({
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      name: req.body.name,
      destinations: [],
    });
    await newItinerary.save();
    res.status(201).json(newItinerary);
  } catch (error) {
    res.status(500).json({ message: "Error creating itinerary", error });
  }
});

// Get an itinerary by ID
router.get("/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ id: req.params.id });
    if (itinerary) {
      res.json(itinerary);
    } else {
      res.status(404).json({ message: "Itinerary not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching itinerary", error });
  }
});

// Update an itinerary
router.put("/:id", async (req, res) => {
  try {
    const itinerary = await Itinerary.findOneAndUpdate(
      { id: req.params.id },
      { name: req.body.name },
      { new: true }
    );
    if (itinerary) {
      res.json(itinerary);
    } else {
      res.status(404).json({ message: "Itinerary not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating itinerary", error });
  }
});

// Delete an itinerary
router.delete("/:id", async (req, res) => {
  try {
    const result = await Itinerary.findOneAndDelete({ id: req.params.id });
    if (result) {
      res.status(204).end();
    } else {
      res.status(404).json({ message: "Itinerary not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting itinerary", error });
  }
});

// Add a destination to an itinerary
router.post("/:id/destinations", async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ id: req.params.id });
    if (itinerary) {
      const newDestination = {
        id: (itinerary.destinations.length + 1).toString(),
        name: req.body.name,
      };
      itinerary.destinations.push(newDestination);
      await itinerary.save();
      res.status(201).json(newDestination);
    } else {
      res.status(404).json({ message: "Itinerary not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error adding destination", error });
  }
});

// Update a destination
router.put("/:id/destinations/:destinationId", async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ id: req.params.id });
    if (itinerary) {
      const destination = itinerary.destinations.find(
        (dest) => dest.id === req.params.destinationId
      );
      if (destination) {
        destination.name = req.body.name;
        await itinerary.save();
        res.json(destination);
      } else {
        res.status(404).json({ message: "Destination not found" });
      }
    } else {
      res.status(404).json({ message: "Itinerary not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating destination", error });
  }
});

// Delete a destination
router.delete("/:id/destinations/:destinationId", async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ id: req.params.id });
    if (itinerary) {
      const destinationIndex = itinerary.destinations.findIndex(
        (dest) => dest.id === req.params.destinationId
      );
      if (destinationIndex !== -1) {
        itinerary.destinations.splice(destinationIndex, 1);
        await itinerary.save();
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Destination not found" });
      }
    } else {
      res.status(404).json({ message: "Itinerary not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting destination", error });
  }
});

module.exports = router;



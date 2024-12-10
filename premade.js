const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.use(express.json());

// Define schemas and models
const itinerarySchema = new mongoose.Schema({
  season: String,
  totalBudget: Number,
  duration: Number,
  title: String, 
});
const premadeItineraryModel = mongoose.model("PremadeItinerary",itinerarySchema);

const savedItinerarySchema = new mongoose.Schema({
  id: Number,
  name: String,
  season: String,
  totalBudget: Number,
  duration: Number,
  dayWisePlan: Object, 
  hotelRecommendations: [String], 
  flightRecommendations: [String],
  description: String,
});

const savedItineraryModel = mongoose.model("SavedItinerary",savedItinerarySchema);

// Route to get pre-made itineraries based on filters
router.post("/api/filter", async (req, res) => {
  try {
    const { season, totalBudget, duration } = req.body || {};

    const filter = {};
    if (season) filter.season = season;
    if (totalBudget) filter.totalBudget = { $lte: totalBudget };
    if (duration) filter.duration = { $lte: duration };

    const itineraries = await premadeItineraryModel.find(filter).lean();
    res.json(itineraries);

  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

//ROUTE TO SAVE AN ITINERARY
router.post("/api/save", async (req, res) => {
  try {
    const { id } = req.body;

    const itineraryToSave = await premadeItineraryModel.findOne({ id }).lean();
    if (!itineraryToSave) {return res.status(404).json({ error: "Itinerary not found in pre-made itineraries" });
    }

    const existingItinerary = await savedItineraryModel.findOne({ id });
    if (existingItinerary) {return res.status(400).json({ error: "Itinerary with this ID is already saved" });
    }

    const savedItinerary = new savedItineraryModel(itineraryToSave);
    await savedItinerary.save();

    res.json({message: "Itinerary saved successfully",itinerary: savedItinerary,});
  } catch (error) {
    console.error("Error saving itinerary:", error); 
    res.status(500).json({ error: "Error saving itinerary" });
  }
});

// Route to customize and update an itinerary
router.put("/api/update", async (req, res) => {
  try {
    const { id, updatedItinerary } = req.body; 
    const updated = await savedItineraryModel.findOneAndUpdate(
      { id },
      { $set: updatedItinerary },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    res.json({ message: "Itinerary updated successfully", itinerary: updated });
  } catch (error) {
    res.status(500).json({ error: "Error updating itinerary" });
  }
});

module.exports = router;

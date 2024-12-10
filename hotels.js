// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const router = express.Router();

// router.use(express.json());

// const destinationFile = path.join(__dirname, "destinations.json");
// const hotelsFile = path.join(__dirname, "hotels.json");

// // Utility functions to read and write JSON files
// const readFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
// const writeFile = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));//stringify converts the jso to json, null-> no filter, 2 -> 2 indentation

// // Route to get all hotels for a specific destination
// router.get("/:destinationName/hotels", (req, res) => {
//   const destinationName = req.params.destinationName;

//   // Read destinations and hotels data
//   const destinations = readFile(destinationFile);
//   const hotels = readFile(hotelsFile);

//   // Validate if the destination exists
//   const destinationExists = destinations.some(
//     (destination) => destination.destination === destinationName
//   );
//   if (!destinationExists) {
//     return res.status(404).json({ msg: "Destination not found." });
//   }

//   // Filter hotels by destination ID
//   const hotelsForDestination = hotels.filter(
//     (hotel) => hotel.destinationName === destinationName
//   );

//   res.status(200).json(hotelsForDestination);
// });

// // Route to add a new hotel for a specific destination
// router.post("/:destinationName/hotels", (req, res) => {
//   const destinationName = req.params.destinationName;
//   const {
//     name,
//     rating,
//     distanceFromCenter,
//     pricePerNight,
//     address,
//     amenities,
//     contact,
//     rooms,
//     cancellationPolicy,
//     checkInTime,
//     checkOutTime,
//   } = req.body;

//   if (!name || !rating || !distanceFromCenter || !pricePerNight || !address) {
//     return res
//       .status(400)
//       .send(
//         "Required fields: name, rating, distanceFromCenter, pricePerNight, and address."
//       );
//   }

//   const destinations = readFile(destinationFile);

//   // Validate destination existence
//   const destinationExists = destinations.some(
//     (destination) => destination.destination === destinationName
//   );

//   if (!destinationExists) {
//     return res.status(404).json({ msg: "Destination not found." });
//   }

//   const hotels = readFile(hotelsFile);
//   const hotelId = hotels.length ? hotels[hotels.length - 1].id + 1 : 1;

//   const newHotel = {
//     id: hotelId,
//     destinationName,
//     name,
//     rating,
//     distanceFromCenter,
//     pricePerNight,
//     address,
//     amenities: amenities || [],
//     contact: contact || null,
//     rooms: rooms || [],
//     cancellationPolicy: cancellationPolicy || null,
//     checkInTime: checkInTime || null,
//     checkOutTime: checkOutTime || null,
//   };

//   hotels.push(newHotel);
//   writeFile(hotelsFile, hotels);

//   res.status(201).json(newHotel);
// });

// // Route to update hotel details
// router.put("/:destinationName/hotels/:hotelId", (req, res) => {
//   const destinationName = req.params.destinationName;
//   const hotelId = parseInt(req.params.hotelId);
//   const {
//     name,
//     rating,
//     distanceFromCenter,
//     pricePerNight,
//     address,
//     amenities,
//     contact,
//     rooms,
//     cancellationPolicy,
//     checkInTime,
//     checkOutTime,
//   } = req.body;

//   const destinations = readFile(destinationFile);
//   const hotels = readFile(hotelsFile);

//   // Validate destination existence
//   const destinationExists = destinations.some(
//     (destination) => destination.destination === destinationName
//   );
//   if (!destinationExists) {
//     return res.status(404).json({ msg: "Destination not found." });
//   }

//   // Find hotel by ID and destination
//   const hotelIndex = hotels.findIndex(
//     (hotel) => hotel.id === hotelId && hotel.destinationName === destinationName
//   );

//   if (hotelIndex === -1) {
//     return res.status(404).json({ msg: "Hotel not found." });
//   }

//   // Update hotel data
//   const hotel = hotels[hotelIndex];
//   if (name) hotel.name = name;
//   if (rating) hotel.rating = rating;
//   if (distanceFromCenter) hotel.distanceFromCenter = distanceFromCenter;
//   if (pricePerNight) hotel.pricePerNight = pricePerNight;
//   if (address) hotel.address = address;
//   if (amenities) hotel.amenities = amenities;
//   if (contact) hotel.contact = contact;
//   if (rooms) hotel.rooms = rooms;
//   if (cancellationPolicy) hotel.cancellationPolicy = cancellationPolicy;
//   if (checkInTime) hotel.checkInTime = checkInTime;
//   if (checkOutTime) hotel.checkOutTime = checkOutTime;

//   writeFile(hotelsFile, hotels);

//   res.status(200).json(hotel);
// });

// // Route to delete a hotel
// router.delete("/:destinationName/hotels/:hotelId", (req, res) => {
//   const destinationName = req.params.destinationName;
//   const hotelId = parseInt(req.params.hotelId);

//   const destinations = readFile(destinationFile);
//   const hotels = readFile(hotelsFile);

//   // Validate destination existence
//   const destinationExists = destinations.some(
//     (destination) => destination.destination === destinationName
//   );
//   if (!destinationExists) {
//     return res.status(404).send("Destination not found.");
//   }

//   // Find the hotel to delete
//   const hotelIndex = hotels.findIndex(
//     (hotel) => hotel.id === hotelId && hotel.destinationName === destinationName
//   );

//   if (hotelIndex === -1) {
//     return res.status(404).send("Hotel not found.");
//   }

//   // Remove hotel
//   hotels.splice(hotelIndex, 1);
//   writeFile(hotelsFile, hotels);

//   res.status(200).json({ msg: `Hotel with ID ${hotelId} has been deleted. `});
// });

// // Route to search hotels for a specific destination
// router.get("/:destinationName/hotels/search", (req, res) => {
//   const destinationName = req.params.destinationName;
//   const { name, minRating, minPrice, maxPrice } = req.query;

//   const destinations = readFile(destinationFile);
//   const hotels = readFile(hotelsFile);

//   const destinationExists = destinations.some(
//     (destination) => destination.destination === destinationName
//   );
//   if (!destinationExists) {
//     return res.status(404).json({ msg: "Destination not found." });
//   }

//   // Filter hotels by destination and query
//   let filteredHotels = hotels.filter((hotel) => hotel.destinationName === destinationName);

//   if (name) {
//     filteredHotels = filteredHotels.filter((hotel) =>
//       hotel.name.toLowerCase().includes(name.toLowerCase())
//     );
//   }

//   if (minRating) {
//     filteredHotels = filteredHotels.filter(
//       (hotel) => hotel.rating >= parseFloat(minRating)
//     );
//   }

//   if (minPrice && maxPrice) {
//     filteredHotels = filteredHotels.filter(
//       (hotel) =>
//         hotel.pricePerNight >= parseFloat(minPrice) &&
//         hotel.pricePerNight <= parseFloat(maxPrice)
//     );
//   } else if (minPrice) {
//     filteredHotels = filteredHotels.filter(
//       (hotel) => hotel.pricePerNight >= parseFloat(minPrice)
//     );
//   } else if (maxPrice) {
//     filteredHotels = filteredHotels.filter(
//       (hotel) => hotel.pricePerNight <= parseFloat(maxPrice)
//     );
//   }

//   res.status(200).json(filteredHotels);
// });

// module.exports = router;


const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const router = express.Router();
const { Destination } = require("./index"); // Importing Destination model from index.js
//const Destination = require('./index'); // Adjust the path based on your file structure

router.use(express.json());

// Hotel Schema
const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  destinationName: { type: String, required: true },
  rating: { type: Number, required: true }, // Changed from 'starRating' to 'rating' to match the JSON structure
  distanceFromCenter: { type: Number, required: true }, // Changed from 'distance' to 'distanceFromCenter'
  pricePerNight: { type: Number, required: true }, // Changed from 'price' to 'pricePerNight'
  address: { type: String, required: true },
  amenities: [String],
  contact: {
    phone: { type: String },
    email: { type: String },
  },
  rooms: [
    {
      roomType: { type: String, required: true },
      price: { type: Number, required: true },
      availability: { type: String, required: true },
    },
  ],
  cancellationPolicy: { type: String },
  checkInTime: { type: String },
  checkOutTime: { type: String },
});

// Models
const Hotel = mongoose.model("Hotel", hotelSchema);

// Routes

// Get all hotels
router.get("/hotels", async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all hotels for a specific destination
router.get("/:destinationName/hotels", async (req, res) => {
  try {
    const destinationName = req.params.destinationName;

    // Access the destinations collection
    const destinationCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists
    const destinationExists = await destinationCollection.findOne({
      destination: { $regex: new RegExp(destinationName, "i") },
    });

    if (!destinationExists) {
      return res.status(404).json({ msg: "Destination not found." });
    }

    // Access the hotels collection
    const hotelsCollection = mongoose.connection.db.collection("hotels");

    // Fetch hotels for the given destination
    const hotelsForDestination = await hotelsCollection
      .find({ destinationName: { $regex: new RegExp(destinationName, "i") } })
      .toArray();

    // Check if hotels exist for the destination
    if (hotelsForDestination.length === 0) {
      return res
        .status(404)
        .json({ msg: `No hotels found for destination: ${destinationName}.` });
    }

    res.status(200).json(hotelsForDestination);
  } catch (error) {
    console.error("Error fetching hotels:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to add a new hotel for a specific destination
router.post("/:destinationName/hotels", async (req, res) => {
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

  try {
    // Access the destinations collection
    const destinationCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists
    const destinationExists = await destinationCollection.findOne({
      destination: { $regex: new RegExp(destinationName, "i") },
    });

    if (!destinationExists) {
      return res.status(404).json({ msg: "Destination not found." });
    }

    // Access the hotels collection
    const hotelsCollection = mongoose.connection.db.collection("hotels");

    // Create a new hotel object
    const newHotel = {
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

    // Insert the new hotel into the hotels collection
    const result = await hotelsCollection.insertOne(newHotel);

    // Fetch the newly inserted hotel using the insertedId
    const insertedHotel = await hotelsCollection.findOne({
      _id: result.insertedId,
    });

    // Respond with the created hotel document
    res.status(201).json(insertedHotel); // Returning the inserted hotel document
  } catch (error) {
    console.error("Error adding hotel:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to update hotel details
router.put("/:destinationName/hotels/:hotelId", async (req, res) => {
  const destinationName = req.params.destinationName;
  const hotelId = req.params.hotelId;
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

  try {
    // Access the destinations collection
    const destinationCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists
    const destinationExists = await destinationCollection.findOne({
      destination: { $regex: new RegExp(destinationName, "i") },
    });

    if (!destinationExists) {
      return res.status(404).json({ msg: "Destination not found." });
    }

    // Access the hotels collection
    const hotelsCollection = mongoose.connection.db.collection("hotels");

    // Find hotel by hotelId and destinationName
    const hotel = await hotelsCollection.findOne({
      _id: new mongoose.Types.ObjectId(hotelId),
      destinationName: { $regex: new RegExp(destinationName, "i") },
    });

    if (!hotel) {
      return res.status(404).json({ msg: "Hotel not found." });
    }

    // Update hotel data
    const updatedHotel = {
      ...hotel, // Keep existing hotel data
      name: name || hotel.name,
      rating: rating || hotel.rating,
      distanceFromCenter: distanceFromCenter || hotel.distanceFromCenter,
      pricePerNight: pricePerNight || hotel.pricePerNight,
      address: address || hotel.address,
      amenities: amenities || hotel.amenities,
      contact: contact || hotel.contact,
      rooms: rooms || hotel.rooms,
      cancellationPolicy: cancellationPolicy || hotel.cancellationPolicy,
      checkInTime: checkInTime || hotel.checkInTime,
      checkOutTime: checkOutTime || hotel.checkOutTime,
    };

    // Update the hotel in the database
    const result = await hotelsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(hotelId) },
      { $set: updatedHotel }
    );

    // Check if the update was successful
    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .json({ msg: "Hotel update failed. No changes detected." });
    }

    // Fetch the updated hotel data
    const updatedHotelData = await hotelsCollection.findOne({
      _id: new mongoose.Types.ObjectId(hotelId),
    });

    // Respond with the updated hotel
    res.status(200).json(updatedHotelData);
  } catch (error) {
    console.error("Error updating hotel:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to delete a hotel
router.delete("/:destinationName/hotels/:hotelId", async (req, res) => {
  const destinationName = req.params.destinationName;
  const hotelId = req.params.hotelId; // MongoDB ObjectId

  try {
    // Access the destinations collection
    const destinationCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists
    const destinationExists = await destinationCollection.findOne({
      destination: { $regex: new RegExp(destinationName, "i") },
    });

    if (!destinationExists) {
      return res.status(404).json({ msg: "Destination not found." });
    }

    // Access the hotels collection
    const hotelsCollection = mongoose.connection.db.collection("hotels");

    // Delete hotel by ID and destination name
    const result = await hotelsCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(hotelId), // Using 'new' to instantiate ObjectId
      destinationName: { $regex: new RegExp(destinationName, "i") },
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "Hotel not found." });
    }

    res.status(200).json({ msg: `Hotel with ID ${hotelId} has been deleted.` });
  } catch (error) {
    console.error("Error deleting hotel:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to search hotels for a specific destination
router.get("/:destinationName/hotels/search", async (req, res) => {
  const destinationName = req.params.destinationName;
  const { name, minRating, minPrice, maxPrice } = req.query;

  try {
    // Access the destinations collection
    const destinationCollection =
      mongoose.connection.db.collection("destinations");

    // Validate if the destination exists
    const destinationExists = await destinationCollection.findOne({
      destination: { $regex: new RegExp(destinationName, "i") },
    });

    if (!destinationExists) {
      return res.status(404).json({ msg: "Destination not found." });
    }

    // Access the hotels collection
    const hotelsCollection = mongoose.connection.db.collection("hotels");

    // Build the query to search hotels
    let query = {
      destinationName: { $regex: new RegExp(destinationName, "i") },
    };

    // Add filters to the query
    if (name) {
      query.name = { $regex: new RegExp(name, "i") };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (minPrice && maxPrice) {
      query.pricePerNight = {
        $gte: parseFloat(minPrice),
        $lte: parseFloat(maxPrice),
      };
    } else if (minPrice) {
      query.pricePerNight = { $gte: parseFloat(minPrice) };
    } else if (maxPrice) {
      query.pricePerNight = { $lte: parseFloat(maxPrice) };
    }

    // Search hotels with the built query
    const filteredHotels = await hotelsCollection.find(query).toArray();

    res.status(200).json(filteredHotels);
  } catch (error) {
    console.error("Error searching hotels:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



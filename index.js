const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3001;

const { readFile, writeFile } = require("./file");

app.use(cors());
app.use(express.json());

app.use(cors({ origin: "http://localhost:3001" })); 


const itinerariesRouter = require("./itineraries");

app.use("/itineraries", itinerariesRouter);

app.use(express.static(path.join(__dirname, "public")));

// Serve the HTML file for the root path
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "itinerary.html"));
});


// Post a new destination with places
app.post("/destination", (req, res) => {
  const { season, destination, places } = req.body;

  if (!season || !destination || !places) {
    return res.status(400).send("All fields are required.");
  }

  let destinations = readFile();
  let dest_id = destinations.length
    ? destinations[destinations.length - 1].id + 1
    : 1;

  const newDest = { id: dest_id, season, destination, places };
  destinations.push(newDest);
  writeFile(destinations);

  res.status(201).json(newDest);
});

// Retrieve destinations for a particular season
app.get("/destination/:season", (req, res) => {
  const season = req.params.season.toLowerCase();
  const destinations = readFile();
  const selectedDest = destinations.filter(
    (dest) => dest.season.toLowerCase() === season
  );
  res.status(200).json(selectedDest.map((dest) => dest.destination));
});

// Retrieve places for a particular destination
app.get("/destinations/:destination", (req, res) => {
  const destination = req.params.destination.toLowerCase();
  const destinations = readFile();
  const placesArr = destinations.find(
    (dest) => dest.destination.toLowerCase() === destination
  );

  if (placesArr) {
    res.status(200).json(placesArr.places);
  } else {
    res.status(404).send("Destination not found.");
  }
});

// Retrieve a destination by id
app.get("/destinat/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const destinations = readFile();
  const dest = destinations.find((dest) => dest.id === id);

  if (dest) {
    res.status(200).json(dest);
  } else {
    res.status(404).send(`Id ${id} does not exist.`);
  }
});

// PUT method to update a place's details
app.put("/destinations/:id/places/:placeName", (req, res) => {
  const id = parseInt(req.params.id);
  const placeName = req.params.placeName.toLowerCase();
  const {name, description, opening_hours } = req.body;
  const destinations = readFile();
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

  writeFile(destinations);
  res.status(200).json(place);
});

// POST method to add a new place
app.post("/destinations/:id/places", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, opening_hours } = req.body;
  const destinations = readFile();
  const destIndex = destinations.findIndex((dest) => dest.id === id);

  if (destIndex === -1) {
    return res.status(404).send("Destination not found.");
  }

  if (!name || !description || !opening_hours) {
    return res
      .status(400)
      .send("Name, description, and opening hours are required.");
  }

  const newPlace = { name, description, opening_hours };
  destinations[destIndex].places.push(newPlace);
  writeFile(destinations);

  res.status(201).json(newPlace);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
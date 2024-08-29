const baseUrl = "http://localhost:3001";


// Fetch and display all seasons
fetchSeasons();
/*
function fetchSeasons() {
  const seasons = ["Summer", "Winter", "Monsoon"]; 
  const seasonContainer = document.getElementById("seasons");
  seasonContainer.innerHTML = "<h2>Selection of Seasons</h2>";
  seasons.forEach((season) => {
    const button = document.createElement("button");
    button.innerText = season.charAt(0).toUpperCase() + season.slice(1);
    button.className = "button";
    button.onclick = () => window.location.href = `destinations.html?season=${season}`;
    seasonContainer.appendChild(button);
  });
}*/
function fetchSeasons() {
const seasons = ["Summer", "Winter", "Monsoon"]; 
const seasonContainer = document.getElementById("seasons");

const bar = document.createElement("div");
bar.className = "season-bar"; 
bar.innerHTML = "<h2>Explore the Seasons</h2>"; 
seasonContainer.appendChild(bar);

const buttonContainer = document.createElement("div");
buttonContainer.className = "season-button-container";

seasons.forEach((season) => {
    const div = document.createElement("div");
    div.className = "season-item";

    const image = document.createElement("img");
    image.src = `./assets/${season.toLowerCase()}1.jpg`; // Replace with your image paths
    image.className = "season-image";

    const name = document.createElement("div");
    name.className = "season-name";
    name.innerText = season.charAt(0).toUpperCase() + season.slice(1);

    div.appendChild(image);
    div.appendChild(name);

    div.onclick = () => window.location.href = `destinations.html?season=${season}`;

    buttonContainer.appendChild(div);
});

    seasonContainer.appendChild(buttonContainer);
}

function fetchDestinations(season) {
    fetch(`${baseUrl}/destination/${season}`)
      .then((response) => response.json())
      .then((destinations) => {
        const destinationContainer = document.getElementById("destinations");
        
        const titleBar = document.createElement("div");
        titleBar.className = "destination-bar";
        titleBar.innerHTML = "<h2>Select a Destination</h2>";
        
        destinationContainer.innerHTML = "";
        destinationContainer.appendChild(titleBar);
        
        //buttons for each destination with a different style
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";
  
        destinations.forEach((destination) => {
          const div = document.createElement("div");
          div.className = "list-item";
          
          //image element
          const img = document.createElement("img");
          img.src = `./assets/${destination.toLowerCase()}.jpg`; // Assuming images are named after destinations
          img.alt = destination;
          img.className = "destination-image";
          
          //text element for the destination name
          const text = document.createElement("p");
          text.innerText = destination;
          text.className = "destination-name";
          
          // Adding image and text to the div
          div.appendChild(img);
          div.appendChild(text);
          
          // Set onclick event for the div
          div.onclick = () => fetchPlaces(destination);
          
          // Append the div to the button container
          buttonContainer.appendChild(div);
        });
  
        destinationContainer.appendChild(buttonContainer);
      });
  }


  
  
// Fetch and display places to visit for a particular destination
function fetchPlaces(destination) {
  fetch(`${baseUrl}/destinations/${destination}`)
    .then((response) => response.json())
    .then((places) => {
      const placesContainer = document.getElementById("places");
      placesContainer.innerHTML = "<h2>Places to Visit</h2>";
      places.forEach((place) => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `<strong>${place.name}</strong><br>${place.description}<br>Opening Hours: ${place.opening_hours}`;
        placesContainer.appendChild(div);
      });
    });
}

// Navigate to weather forecast page
document.getElementById("weather-btn").onclick = () => {
  window.location.href = "weather.html";
};
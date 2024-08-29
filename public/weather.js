const baseUrl = "http://localhost:3001";

const api_key = "6f939a5e5d230b2ce1b88b44f178ffc5"; 
const search_icon = "./assets/search_icon.png";
const clear_icon = "./assets/clear_icon.png";
const wind_icon = "./assets/wind_icon.png";
const humidity_icon = "./assets/humidity_icon.jpeg";
const cloud_icon = "./assets/cloud_icon.png";
const drizzle_icon = "./assets/drizzle_icon.png";
const rain_icon = "./assets/rain_icon.png";
const snow_icon = "./assets/snow_icon.png";

const allIcons = {
  "01d": clear_icon,
  "01n": clear_icon,
  "02d": cloud_icon,
  "02n": cloud_icon,
  "03d": cloud_icon,
  "03n": cloud_icon,
  "04d": drizzle_icon,
  "04n": drizzle_icon,
  "09d": rain_icon,
  "09n": rain_icon,
  "10d": rain_icon,
  "10n": rain_icon,
  "13d": snow_icon,
  "13n": snow_icon,
};

const search = async (city) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${api_key}`;
    const response = await fetch(url);
    const data = await response.json();
    const iconCode = data.weather[0].icon;
    const icon = allIcons[iconCode] || clear_icon;
    displayWeatherData({
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      temperature: Math.floor(data.main.temp),
      location: data.name,
      icon: icon,
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
};

const displayWeatherData = (weatherData) => {
  const weatherContainer = document.getElementById("weather-container");
  weatherContainer.innerHTML = `
        <div class="weather">
            <div class="search-bar">
                <input type="text" placeholder="Search" id="city-input"/>
                <img src="${search_icon}" alt="Search Icon" id="search-btn"/>
            </div>
            <img src="${weatherData.icon}" alt="Weather Icon" class="weather-icon"/>
            <div class="temperature">${weatherData.temperature}°C</div>
            <div class="location">${weatherData.location}</div> 
            <div class="weather-data">
                <div class="col">
                    <img src="${humidity_icon}" alt="Humidity Icon"/>
                    <div>
                        <p>${weatherData.humidity}%</p>
                        <span>Humidity</span>
                    </div>
                </div> 
                <div class="col">
                    <img src="${wind_icon}" alt="Wind Speed Icon"/>
                    <div>
                        <p>${weatherData.windSpeed} Km/h</p>
                        <span>Wind Speed</span>
                    </div>
                </div> 
            </div>
        </div>
    `;

  document.getElementById("search-btn").onclick = () => {
    const city = document.getElementById("city-input").value;
    search(city);
  };
};

// Default city for initial load
search("Bathinda");

document.getElementById("back-btn").onclick = () => {
  window.location.href = "index.html";
};
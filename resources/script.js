const inputForm = document.querySelector("#search-input");
let searchValue = "";
const searchBtn = document.querySelector("#search-btn");

const apiKey = "b18cda2bfec79a5c4014c5558efbd9aa";

const historyList = document.querySelector("#history-list");

const current = document.querySelector("#current-conditions");

const cityError = document.querySelector("#city-error");
const blankError = document.querySelector("#blank-error");

let searchHistory = [];

const setSearchValue = () => {
  searchValue = inputForm.value.trim();
};

//Shows last 10 cities searched in DOM.
const displaySearchHistory = () => {
  historyList.innerHTML = "";
  searchHistory.forEach((city) => {
    const cityBtn = document.createElement("button");
    cityBtn.classList.add("btn");
    cityBtn.textContent = city;
    historyList.appendChild(cityBtn);

    cityBtn.addEventListener("click", () => handleCitySearch(city));
  });
};

const handleCitySearch = (city) => {
  inputForm.value = city; // Set the input value to the clicked city
  handleSearch(new Event("click")); // Trigger the search handler function
};

//Gets cities from Local Storage.
const getHistory = () => {
  const storedCities = localStorage.getItem("cities");
  searchHistory = storedCities ? JSON.parse(storedCities) : [];
  displaySearchHistory();
};

window.addEventListener("load", () => {
  getHistory();
});

//Saves up to last 10 city searches in localStorage.
const updateHistory = (city) => {
  searchHistory.unshift(city);
  if (searchHistory.length > 10) {
    searchHistory = searchHistory.slice(0, 10);
  }
  localStorage.setItem("cities", JSON.stringify(searchHistory));
};

//Puts new cities in localStorage...
const setHistory = (city) => {
  if (city && !searchHistory.includes(city)) {
    updateHistory(city);
    displaySearchHistory(); // Update the history after adding the city
  }
};

//Here, converting the 'kelvin' degrees (openweather's default unit) to essentially farenheit, by using 'units=imperial', per openweather's docs.
const getWeather = async (cityName) => {
  const fetchUrl = `https://api.openweathermap.org/data/2.5/weather?units=imperial&q=${cityName}&appid=${apiKey}`;

  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(`City not found. Error code: (${response.status})`);
    }

    const data = await response.json();
    const city = data.name;
    const temp = data.main.temp;
    const icon = data.weather[0].icon;
    const wind = data.wind.speed;
    const humidity = data.main.humidity;

    //Just to get date...
    const unixTime = data.dt;
    const date = new Date(unixTime * 1000);
    const formattedDate = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    getForecast(data.coord.lat, data.coord.lon);

    return { city, icon, formattedDate, temp, wind, humidity };
  } catch (error) {
    throw new Error(
      "Failed to fetch weather data. Please check the city name and try again."
    );
  }
};

async function getForecast(lat, lon) {
  let request = `https://api.openweathermap.org/data/2.5/forecast?units=imperial&lat=${lat}&lon=${lon}&appid=${apiKey}`;

  try {
    const response = await fetch(request);
    const data = await response.json();

    if (data.list && data.list.length >= 40) {
      const currentDate = new Date();
      const futureDaysElements = document.querySelectorAll(".future-days");

      // Find the index for the start of the current day
      const startIndex = data.list.findIndex(
        (item) => new Date(item.dt * 1000).getDate() === currentDate.getDate()
      );

      // Retrieve forecast data for the current day and the next 5 days
      for (let i = 0; i < 6; i++) {
        const dataIndex = startIndex + i * 8;

        if (data.list[dataIndex]) {
          const date = new Date(
            data.list[dataIndex].dt * 1000
          ).toLocaleDateString("en-US");
          const icon = data.list[dataIndex].weather[0].icon;
          const temperature = data.list[dataIndex].main.temp;
          const wind = data.list[dataIndex].wind.speed;
          const humidity = data.list[dataIndex].main.humidity;

          if (i === 0) {
            // Display current day's data
            const currentDayElement = futureDaysElements[0];
            displayWeatherData(
              currentDayElement,
              date,
              icon,
              temperature,
              wind,
              humidity
            );
          } else {
            // Display future days' data
            const futureDayElement = futureDaysElements[i - 1];
            displayWeatherData(
              futureDayElement,
              date,
              icon,
              temperature,
              wind,
              humidity
            );
          }
        }
      }
    } else {
      console.error("Insufficient forecast data available.");
    }
  } catch (error) {
    console.error("Error fetching forecast data:", error);
  }
}

function displayWeatherData(element, date, icon, temperature, wind, humidity) {
  // Create elements to display weather information
  const dateElement = document.createElement("p");
  dateElement.textContent = date;

  const iconElement = document.createElement("img");
  iconElement.src = `https://openweathermap.org/img/w/${icon}.png`;
  iconElement.alt = "Weather Icon";

  const tempElement = document.createElement("p");
  tempElement.textContent = `Temperature: ${temperature}°F`;

  const windElement = document.createElement("p");
  windElement.textContent = `Wind: ${wind} mph`;

  const humidityElement = document.createElement("p");
  humidityElement.textContent = `Humidity: ${humidity}%`;

  // Clear previous content
  element.innerHTML = "";

  // Append weather information elements to the specified future day element
  element.appendChild(dateElement);
  element.appendChild(iconElement);
  element.appendChild(tempElement);
  element.appendChild(windElement);
  element.appendChild(humidityElement);
}

const handleSearch = async (e) => {
  e.preventDefault();

  let hasCityError = false;
  let hasBlankError = false;

  setSearchValue();

  if (!searchValue) {
    hasBlankError = true;
    blankError.style.display = "block";
    cityError.style.display = "none";
  } else {
    blankError.style.display = "none";
    setHistory();

    try {
      const { city, formattedDate, temp, wind, humidity, icon } = await getWeather(searchValue);

      const cityHeading = document.createElement("h1");
      cityHeading.textContent = city;

      const details = document.createElement("h3");
      details.textContent = `${formattedDate}: ${temp}°F, Wind ${wind} mph, Humidity ${humidity}%`;

      const iconElement = document.createElement("img");
      iconElement.src = `https://openweathermap.org/img/w/${icon}.png`;
      iconElement.alt = "Weather Icon";

      cityError.style.display = "none";
      current.innerHTML = "";
      current.appendChild(cityHeading);
      current.appendChild(iconElement);
      current.appendChild(details);
      
      setHistory(city);

    } catch (error) {
      hasCityError = true;
      cityError.textContent = error.message; // Display the error message from the caught error
      cityError.style.display = "block";
      // Clear current weather display
      if (error.message.includes("City not found")) {
        // Clear current weather display only for city not found error
        current.innerHTML = "";
      }
      
    }
  }

  if ((!hasCityError && !hasBlankError) || (hasCityError && !hasBlankError)) {
    console.clear();
  }

  inputForm.value = "";
};

searchBtn.addEventListener("click", handleSearch);

inputForm.addEventListener("keydown", (press) => {
  if (press.key === "Enter") {
    press.preventDefault();
    searchBtn.click();
  }
});

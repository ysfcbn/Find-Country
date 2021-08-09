"use strict";

const btn = document.querySelector(".btn-country");
const countriesContainer = document.querySelector(".countries");
let map1;
///////////////////////////////////////

// Promisifying the Geolocation API
const getPosition = function () {
	return new Promise(function (resolve, reject) {
		navigator.geolocation.getCurrentPosition(resolve, reject);
	});
};

// Rendering Country
const renderCountry = function (data, className = "") {
	const html = `
     <article class="country ${className}">
        <img class="country__img" src="${data.flag}" />
        <div class="country__data">
          <h3 class="country__name">${data.name}</h3>
          <h4 class="country__region">${data.region}</h4>
          <p class="country__row"><span>👫</span>${(
						+data.population / 1000000
					).toFixed(1)} million people</p>
          <p class="country__row"><span>🗣️</span>${
						data.languages.length > 1
							? data.languages.map(name => name.name)
							: data.languages[0].name
					}</p>
          <p class="country__row"><span>💰</span>${data.currencies[0].name}</p>
          <p class="country__row"><span>🏛</span>${data.capital}</p>
          <p class="country__row"><span>🏙</span>${
						city ? city : "Need to Confirm"
					}</p>
        </div>
      </article>
  `;

	countriesContainer.insertAdjacentHTML("beforeend", html);
	countriesContainer.style.opacity = 1;
};

const esriMap = L.tileLayer(
	"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
	{
		attribution:
			"Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
		minZoom: 2,
	}
);

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	attribution:
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	minZoom: 2,
});

const stadia = L.tileLayer(
	"https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
	{
		maxZoom: 20,
		attribution:
			'&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
		minZoom: 2,
	}
);

//Open MAp
const openMap = function () {
	map1 = L.map("map").setView([38, 38], 4);
	osm.addTo(map1);
};

// Go to Location on MAp
const goLocationMap = (lat, lng) => map1.flyTo([lat, lng], 11);

// Render Marker
const renderMarker = function (lat, lng) {
	const marker = L.marker([lat, lng])
		.addTo(map1)
		.bindPopup(
			L.popup({
				maxWidth: 200,
				maxHeight: 200,
				autoClose: false,
				closeOnClick: false,
				closeOnEscapeKey: true,
				className: "popup",
			})
		)
		.setPopupContent(`${city}`)
		.openPopup();
	markers.push(marker);
};

const myLocation = document.querySelector(".my-location");
const getLocation = document.querySelector(".get-location");
const lat = document.querySelector(".lat");
const lng = document.querySelector(".lng");
const getNeighbour = document.querySelector(".borders");
const map = document.querySelector("#map");
const satalite = document.querySelector(".satalite");
const maps = document.querySelector(".maps");
const homeBtn = document.querySelector(".home");
const myHome = [41.071999712, 29.039833174];
let clickLocation = [];
let markers = [];
let myLocationArr = [];
let country = [];
let city;
let listNeighbour = [];
let neighbourEl = [];
let clickNeighbour;
let selectedNeighbour;
let selectedCountry;
let neighbourCounter = 0;
openMap();

map1.on("click", function (e) {
	clickLocation = [];
	const { lat: latitude, lng: longitude } = e.latlng;
	clickLocation.push(...[latitude, longitude]);
	[lat.value, lng.value] = clickLocation;
	confirmLocation(...clickLocation);
});

const resetFunc = function () {
	neighbourEl = [];
	selectedNeighbour = "";
	selectedCountry = [];
	listNeighbour = [];
};

const getMyLocation = function () {
	myLocation.style.display = "none";
	// Get current Position
	getPosition()
		.then(pos => {
			const { latitude, longitude } = pos.coords;
			let location = [latitude, longitude];
			myLocationArr.push(...location);

			lat.value = myLocationArr[0];
			lng.value = myLocationArr[1];
			return fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${myLocationArr[0]}&lon=${myLocationArr[1]}&apiKey=c04fbb50ab074a67825fe4169fb9d5b1
  `);
		})
		.then(response => {
			if (!response.ok)
				throw new Error(`Something went wrong! 🚫🚫🚫 (${response.status})`);

			return response.json();
		})
		.then(data => {
			goLocationMap(lat.value, lng.value);
			if (!data.features[0].properties.country) {
				throw new Error(
					`⛔ Country not found! You are at "${data.features[0].properties.name}" ⛔`
				);
			} else countriesContainer.textContent = "";
			console.log(
				`You are in "${data.features[0].properties.city}", "${data.features[0].properties.country}"`
			);
			data.features[0].properties.city
				? (city = data.features[0].properties.city)
				: (city = data.features[0].properties.state);
			renderMarker(lat.value, lng.value);
			return fetch(
				`https://restcountries.eu/rest/v2/name/${data.features[0].properties.country}`
			);
		})
		.then(response => {
			if (!response.ok)
				throw new Error(`Country not found! (${response.status})`);
			return response.json();
		})
		.then(data => {
			console.log(data[0]);
			country.push(data[0]);
			getNeighbour.style.display = "block";

			return renderCountry(data[0]);
		})
		.catch(err => {
			myLocation.style.display = "block";
			countriesContainer.textContent = err.message;
			console.log(`${err.message}`);
		});
};

const showNeighbour = function () {
	getNeighbour.style.display = "none";
	const neighbour = country[0].borders;
	if (neighbour.length < 1) {
		countriesContainer.innerHTML += "No neighbour found!";
		throw new Error("No neighbour found!");
	}
	if (neighbour.length >= 1) {
		const promise1 = new Promise(function (resolve, reject) {
			for (const countries of neighbour) {
				fetch(`https://restcountries.eu/rest/v2/alpha/${countries}`)
					.then(response => {
						if (!response.ok) {
							throw new Error(
								`Something went wrong! 🚫🚫🚫 (${response.status})`
							);
						}
						return response.json();
					})
					.then(data => {
						listNeighbour.push(data);
						console.log(
							`${country[0].name}'s ${neighbourCounter + 1}. neighbour => ${
								data.name
							}`
						);
						city = data.city;
						return renderCountry(data, "neighbour");
					})
					.then(() => {
						return (neighbourEl = [...document.querySelectorAll(".neighbour")]);
					})
					.then(res => {
						neighbourCounter++;
						if (neighbour.length === neighbourCounter) {
							resolve(res);
						}
					})
					.catch(err => {
						countriesContainer.textContent = err.message;
						console.log(`${err.message}`);
					});
			}
		});

		// Select Neighbours
		promise1.then(() => {
			neighbourCounter = 0;
			neighbourEl.forEach((el, i) => {
				el.addEventListener("click", function () {
					const index = neighbourEl.indexOf(el);
					neighbourEl.forEach(element => {
						element.style.border = "";
						element.style.transform = "scale(0.8)";
					});

					el.style.border = "2px  #02b11f solid";
					el.style.transform = "scale(0.85)";
					const selected = el.querySelector(".country__data > .country__name");
					if (
						selected.textContent ===
						neighbourEl[i].querySelector(".country__data > .country__name")
							.textContent
					) {
						selectedNeighbour = selected.textContent;
						selectedCountry = listNeighbour.find(
							el => el.name === selectedNeighbour
						).latlng;
						console.log(
							`selected country: ${selectedNeighbour}'s lat & lng => ` +
								selectedCountry[0] +
								" & " +
								selectedCountry[1]
						);
						lat.value = selectedCountry[0];
						lng.value = selectedCountry[1];
						selectedCountry = [];
					}
				});
			});
		});
	}
};

const confirmLocation = function (latitude, longitude) {
	window.scrollTo({ top: 0, behavior: `smooth` });
	resetFunc();
	country = [];
	fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${+latitude}&lon=${+longitude}&apiKey=c04fbb50ab074a67825fe4169fb9d5b1
  `)
		.then(response => {
			goLocationMap(lat.value, lng.value);
			if (!response.ok) {
				throw new Error(`Something went wrong! 🚫🚫🚫 (${response.status})`);
			}
			return response.json();
		})
		.then(data => {
			if (!data.features[0].properties.country) {
				throw new Error(
					`⛔ Country not found! You are at "${data.features[0].properties.name}" ⛔`
				);
			} else countriesContainer.textContent = "";
			console.log(
				`You are in "${data.features[0].properties.city}", "${data.features[0].properties.country}"`
			);
			data.features[0].properties.city
				? (city = data.features[0].properties.city)
				: (city = data.features[0].properties.state);

			renderMarker(lat.value, lng.value);

			return fetch(
				`https://restcountries.eu/rest/v2/name/${data.features[0].properties.country}`
			);
		})
		.then(response => {
			if (!response.ok)
				throw new Error(`Country not found! (${response.status})`);
			return response.json();
		})
		.then(data => {
			console.log(data[0]);
			country.push(data[0]);
			getNeighbour.style.display = "block";
			return renderCountry(data[0]);
		})
		.catch(err => {
			getNeighbour.style.display = "none";
			myLocation.style.display = "none";
			countriesContainer.textContent = err.message;
			console.log(`${err.message}`);
		});
};

getLocation.addEventListener("click", () =>
	confirmLocation(lat.value, lng.value)
);

getNeighbour.addEventListener("click", showNeighbour);

myLocation.addEventListener("click", getMyLocation);

homeBtn.addEventListener("click", function () {
	[lat.value, lng.value] = myHome;
	goLocationMap(myHome[0], myHome[1]);
	confirmLocation(myHome[0], myHome[1]);
});
satalite.addEventListener("click", function () {
	satalite.style.display = "none";
	maps.style.display = "block";
	map1.removeLayer(osm);
	esriMap.addTo(map1);
});
maps.addEventListener("click", function () {
	satalite.style.display = "block";
	maps.style.display = "none";
	map1.removeLayer(esriMap);
	osm.addTo(map1);
});

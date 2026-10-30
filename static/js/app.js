/**
 * WeatherHub — Frontend Application Logic
 * Consumes Flask REST APIs for Weather and MySQL Favourites
 * Mirrors WeatherHub Dashboard Overview Reference Design
 */

document.addEventListener('DOMContentLoaded', () => {
    // City weather metadata map for instant visual pairing
    const CITY_METADATA = {
        'vijayawada': { temp: 28.5, cond: 'Clear Sky', icon: 'bi-sun-fill text-warning' },
        'hyderabad': { temp: 26.8, cond: 'Partly Cloudy', icon: 'bi-cloud-sun-fill text-warning' },
        'bengaluru': { temp: 24.1, cond: 'Light Rain', icon: 'bi-cloud-rain-fill text-info' },
        'new delhi': { temp: 29.3, cond: 'Clear Sky', icon: 'bi-sun-fill text-warning' },
        'mumbai': { temp: 27.6, cond: 'Cloudy', icon: 'bi-cloud-fill text-secondary' },
        'new york': { temp: 12.4, cond: 'Clear Sky', icon: 'bi-sun-fill text-warning' },
        'london': { temp: 10.1, cond: 'Cloudy', icon: 'bi-cloud-fill text-secondary' },
        'tokyo': { temp: 18.7, cond: 'Partly Cloudy', icon: 'bi-cloud-sun-fill text-warning' },
        'sydney': { temp: 21.3, cond: 'Sunny', icon: 'bi-sun-fill text-warning' }
    };

    // State
    const state = {
        currentCity: 'Vijayawada',
        currentCountry: 'IN',
        isLoading: false,
        theme: localStorage.getItem('weatherhub_theme') || 'dark',
        favorites: []
    };

    // DOM Elements
    const elements = {
        searchForm: document.getElementById('searchForm'),
        searchCityInput: document.getElementById('searchCityInput'),
        searchCountryInput: document.getElementById('searchCountryInput'),
        searchBtn: document.getElementById('searchBtn'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebar: document.getElementById('sidebar'),
        
        // Clock
        clockDate: document.getElementById('clockDate'),
        clockTime: document.getElementById('clockTime'),
        
        // Hero Card
        heroCityName: document.getElementById('heroCityName'),
        heroCountryCode: document.getElementById('heroCountryCode'),
        heroRegion: document.getElementById('heroRegion'),
        heroReportTime: document.getElementById('heroReportTime'),
        heroTemp: document.getElementById('heroTemp'),
        heroCondition: document.getElementById('heroCondition'),
        heroFeelsLike: document.getElementById('heroFeelsLike'),
        
        // 5 Stat Cards
        statFeelsLike: document.getElementById('statFeelsLike'),
        statHumidity: document.getElementById('statHumidity'),
        statWindSpeed: document.getElementById('statWindSpeed'),
        statPressure: document.getElementById('statPressure'),
        statVisibility: document.getElementById('statVisibility'),
        
        // Forecast
        forecastGrid: document.getElementById('forecastGrid'),
        
        // Favourites
        favouritesList: document.getElementById('favouritesList'),
        
        // Add Favourite Modal
        addFavoriteForm: document.getElementById('addFavoriteForm'),
        addCityInput: document.getElementById('addCityInput'),
        addCountryInput: document.getElementById('addCountryInput'),
        addNicknameInput: document.getElementById('addNicknameInput'),
        addFavSpinner: document.getElementById('addFavSpinner'),
        saveAddFavoriteBtn: document.getElementById('saveAddFavoriteBtn'),
        
        // Edit Favourite Modal
        editFavoriteForm: document.getElementById('editFavoriteForm'),
        editFavoriteId: document.getElementById('editFavoriteId'),
        editCityInput: document.getElementById('editCityInput'),
        editCountryInput: document.getElementById('editCountryInput'),
        editNicknameInput: document.getElementById('editNicknameInput'),
        editFavSpinner: document.getElementById('editFavSpinner'),
        saveEditFavoriteBtn: document.getElementById('saveEditFavoriteBtn'),
        
        // Delete Modal
        deleteFavoriteModal: document.getElementById('deleteFavoriteModal'),
        deleteFavoriteId: document.getElementById('deleteFavoriteId'),
        deleteCityName: document.getElementById('deleteCityName'),
        confirmDeleteFavoriteBtn: document.getElementById('confirmDeleteFavoriteBtn'),
        deleteFavSpinner: document.getElementById('deleteFavSpinner'),
        
        // Toasts
        toastContainer: document.getElementById('toastContainer')
    };

    // Initialize Modals
    const modals = {
        addFavorite: new bootstrap.Modal(document.getElementById('addFavoriteModal')),
        editFavorite: new bootstrap.Modal(document.getElementById('editFavoriteModal')),
        deleteFavorite: new bootstrap.Modal(document.getElementById('deleteFavoriteModal'))
    };

    /* ==========================================================================
       1. Theme Switcher (Dark / Light)
       ========================================================================== */
    function applyTheme(theme) {
        state.theme = theme;
        localStorage.setItem('weatherhub_theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
        if (theme === 'light') {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            elements.themeToggleBtn.querySelector('.sun-ico').classList.add('active');
            elements.themeToggleBtn.querySelector('.moon-ico').classList.remove('active');
        } else {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            elements.themeToggleBtn.querySelector('.moon-ico').classList.add('active');
            elements.themeToggleBtn.querySelector('.sun-ico').classList.remove('active');
        }
    }

    elements.themeToggleBtn.addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
    applyTheme(state.theme);

    /* ==========================================================================
       2. Real-time Clock
       ========================================================================== */
    function updateClock() {
        const now = new Date();
        const optionsDate = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
        
        if (elements.clockDate) elements.clockDate.textContent = now.toLocaleDateString('en-GB', optionsDate);
        if (elements.clockTime) elements.clockTime.textContent = now.toLocaleTimeString('en-US', optionsTime);
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ==========================================================================
       3. Toast Notification Helper
       ========================================================================== */
    function showToast(message, type = 'info') {
        const toastId = 'toast_' + Date.now();
        const iconClass = type === 'success' ? 'bi-check-circle-fill text-success' :
                          type === 'danger' ? 'bi-exclamation-triangle-fill text-danger' :
                          type === 'warning' ? 'bi-exclamation-circle-fill text-warning' :
                          'bi-info-circle-fill text-info';

        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="bi ${iconClass} fs-5"></i>
                        <span>${message}</span>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        elements.toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        const toastInstance = new bootstrap.Toast(toastEl, { delay: 4000 });
        toastInstance.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }

    /* ==========================================================================
       4. Current Weather API Integration
       ========================================================================== */
    async function fetchCurrentWeather(city, country = '') {
        if (!city || !city.trim()) {
            showToast('Please enter a city name.', 'warning');
            return false;
        }

        try {
            state.isLoading = true;
            elements.searchBtn.disabled = true;
            elements.searchBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

            let url = `/api/weather/current?city=${encodeURIComponent(city.trim())}`;
            if (country && country.trim()) {
                url += `&country=${encodeURIComponent(country.trim().toUpperCase())}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                showToast(data.error || 'Failed to fetch current weather.', 'danger');
                return false;
            }

            // Update Hero Card
            elements.heroCityName.textContent = data.name;
            elements.heroCountryCode.textContent = (data.sys && data.sys.country) || country || 'IN';
            elements.heroRegion.innerHTML = `<i class="bi bi-geo-alt-fill me-1"></i> ${data.name}, ${(data.sys && data.sys.country) || 'India'}`;

            const now = new Date();
            elements.heroReportTime.textContent = now.toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            elements.heroTemp.textContent = Math.round(data.main.temp * 10) / 10;
            
            const weatherDetail = (data.weather && data.weather[0]) || {};
            const condName = weatherDetail.description ? 
                weatherDetail.description.replace(/\b\w/g, l => l.toUpperCase()) : 'Clear Sky';
            elements.heroCondition.textContent = condName;
            elements.heroFeelsLike.innerHTML = `<i class="bi bi-thermometer-half"></i> Feels like ${Math.round(data.main.feels_like * 10) / 10}°C`;

            // Update 5 Stats Cards
            elements.statFeelsLike.textContent = `${Math.round(data.main.feels_like * 10) / 10}°C`;
            elements.statHumidity.textContent = `${data.main.humidity}%`;
            elements.statWindSpeed.textContent = `${data.wind ? data.wind.speed : 0} m/s`;
            elements.statPressure.textContent = `${data.main.pressure} hPa`;
            const visKm = data.visibility ? Math.round(data.visibility / 1000) : 10;
            elements.statVisibility.textContent = `${visKm} km`;

            state.currentCity = data.name;
            state.currentCountry = (data.sys && data.sys.country) || '';

            return true;
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('Network error while retrieving weather data.', 'danger');
            return false;
        } finally {
            state.isLoading = false;
            elements.searchBtn.disabled = false;
            elements.searchBtn.innerHTML = `<i class="bi bi-search"></i> <span>Search</span>`;
        }
    }

    /* ==========================================================================
       5. 5-Day Forecast API Integration
       ========================================================================== */
    async function fetchFiveDayForecast(city, country = '') {
        try {
            let url = `/api/weather/forecast?city=${encodeURIComponent(city.trim())}`;
            if (country && country.trim()) {
                url += `&country=${encodeURIComponent(country.trim().toUpperCase())}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) return;

            // Group by distinct day
            const dailyMap = {};
            const list = data.list || [];

            list.forEach(item => {
                const dateKey = item.dt_txt ? item.dt_txt.split(' ')[0] : new Date(item.dt * 1000).toISOString().split('T')[0];
                if (!dailyMap[dateKey]) {
                    dailyMap[dateKey] = {
                        temps: [],
                        conditions: {},
                        icons: {},
                        pops: [],
                        dt: item.dt
                    };
                }
                dailyMap[dateKey].temps.push(item.main.temp);
                dailyMap[dateKey].pops.push(item.pop || 0);

                const cond = item.weather[0].main;
                dailyMap[dateKey].conditions[cond] = (dailyMap[dateKey].conditions[cond] || 0) + 1;
            });

            const dayKeys = Object.keys(dailyMap).slice(0, 5);
            if (dayKeys.length === 0) return;

            elements.forecastGrid.innerHTML = '';
            dayKeys.forEach((dayKey, idx) => {
                const dayData = dailyMap[dayKey];
                const dateObj = new Date(dayData.dt * 1000);
                const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                const dayDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                const maxTemp = Math.round(Math.max(...dayData.temps));
                const minTemp = Math.round(Math.min(...dayData.temps));
                const maxPop = Math.round(Math.max(...dayData.pops) * 100);

                const dominantCond = Object.keys(dayData.conditions).reduce((a, b) => dayData.conditions[a] > dayData.conditions[b] ? a : b);

                // Icon class selection
                let iconHtml = '<i class="bi bi-sun-fill f-weather-icon text-warning"></i>';
                if (dominantCond.includes('Rain')) {
                    iconHtml = '<i class="bi bi-cloud-rain-fill f-weather-icon text-info"></i>';
                } else if (dominantCond.includes('Cloud')) {
                    iconHtml = '<i class="bi bi-cloud-sun-fill f-weather-icon text-warning"></i>';
                }

                const cardHtml = `
                    <div class="forecast-item-card ${idx === 0 ? 'active-day' : ''}">
                        <span class="f-day-name">${dayName}</span>
                        <span class="f-day-date">${dayDate}</span>
                        ${iconHtml}
                        <div class="f-temp-split">
                            <span class="f-temp-max">${maxTemp}°</span>
                            <span class="f-temp-slash">/</span>
                            <span class="f-temp-min">${minTemp}°</span>
                        </div>
                        <span class="f-desc">${dominantCond}</span>
                        <span class="f-rain"><i class="bi bi-droplet-fill"></i> ${maxPop}%</span>
                    </div>
                `;
                elements.forecastGrid.insertAdjacentHTML('beforeend', cardHtml);
            });

        } catch (error) {
            console.error('Forecast error:', error);
        }
    }

    async function loadCityWeather(city, country = '') {
        const success = await fetchCurrentWeather(city, country);
        if (success) {
            fetchFiveDayForecast(city, country);
        }
    }

    elements.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = elements.searchCityInput.value.trim();
        const country = elements.searchCountryInput.value.trim();
        if (city) {
            loadCityWeather(city, country);
        }
    });

    /* ==========================================================================
       6. Favourite Cities (CRUD Operations)
       ========================================================================== */
    async function loadFavorites() {
        try {
            const response = await fetch('/api/favorites');
            if (!response.ok) return;

            const favorites = await response.json();
            state.favorites = favorites;

            if (!favorites || favorites.length === 0) {
                elements.favouritesList.innerHTML = `
                    <div class="text-center py-4 text-muted">
                        <i class="bi bi-heart fs-2 text-secondary mb-2 d-block"></i>
                        <p class="mb-0">No favourite cities saved.</p>
                    </div>
                `;
                return;
            }

            elements.favouritesList.innerHTML = '';
            favorites.forEach(fav => {
                const cKey = fav.city.toLowerCase();
                const meta = CITY_METADATA[cKey] || { temp: 26.5, cond: 'Clear Sky', icon: 'bi-sun-fill text-warning' };

                const itemHtml = `
                    <div class="fav-city-item" data-id="${fav.id}" data-city="${escapeHtml(fav.city)}" data-country="${escapeHtml(fav.country)}">
                        <div class="fav-left-meta">
                            <i class="bi ${meta.icon} fav-weather-ico"></i>
                            <div class="fav-name-group">
                                <h5 class="fav-name-title">${escapeHtml(fav.city)}</h5>
                                <span class="fav-country-sub">${escapeHtml(fav.country)}${fav.nickname ? ' | ' + escapeHtml(fav.nickname) : ''}</span>
                            </div>
                        </div>
                        <div class="fav-right-actions">
                            <div class="fav-temp-badge">
                                <span class="fav-temp-deg">${meta.temp}°C</span>
                                <span class="fav-temp-cond">${meta.cond}</span>
                            </div>
                            <button class="fav-action-btn fav-edit-btn" data-id="${fav.id}" title="Edit favourite" aria-label="Edit favourite">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="fav-action-btn fav-delete-btn" data-id="${fav.id}" title="Delete favourite" aria-label="Delete favourite">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                `;
                elements.favouritesList.insertAdjacentHTML('beforeend', itemHtml);
            });

            // Card click to load weather
            document.querySelectorAll('.fav-city-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.fav-action-btn')) return;
                    const city = item.getAttribute('data-city');
                    const country = item.getAttribute('data-country');
                    elements.searchCityInput.value = city;
                    elements.searchCountryInput.value = country;
                    loadCityWeather(city, country);
                });
            });

            // Edit button click
            document.querySelectorAll('.fav-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const favId = parseInt(btn.getAttribute('data-id'));
                    const favorite = state.favorites.find(f => f.id === favId);
                    if (favorite) {
                        elements.editFavoriteId.value = favorite.id;
                        elements.editCityInput.value = favorite.city;
                        elements.editCountryInput.value = favorite.country;
                        elements.editNicknameInput.value = favorite.nickname || '';
                        modals.editFavorite.show();
                    }
                });
            });

            // Delete button click
            document.querySelectorAll('.fav-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const favId = parseInt(btn.getAttribute('data-id'));
                    const favorite = state.favorites.find(f => f.id === favId);
                    if (favorite) {
                        elements.deleteFavoriteId.value = favorite.id;
                        elements.deleteCityName.textContent = `${favorite.city}, ${favorite.country}`;
                        modals.deleteFavorite.show();
                    }
                });
            });

        } catch (error) {
            console.error('Load favorites error:', error);
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

    // Add Favourite Form Submit
    elements.addFavoriteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = elements.addCityInput.value.trim();
        const country = elements.addCountryInput.value.trim().toUpperCase();
        const nickname = elements.addNicknameInput.value.trim();

        if (!city || !country) {
            showToast('City and Country Code are required.', 'warning');
            return;
        }

        try {
            elements.saveAddFavoriteBtn.disabled = true;
            elements.addFavSpinner.classList.remove('d-none');

            const payload = { city, country };
            if (nickname) payload.nickname = nickname;

            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.status === 201) {
                showToast(`Saved ${city}, ${country} to favourites!`, 'success');
                modals.addFavorite.hide();
                elements.addFavoriteForm.reset();
                loadFavorites();
            } else if (response.status === 409) {
                showToast('City and Country combination already exists in favourites.', 'warning');
            } else {
                showToast(data.error || 'Failed to save favourite.', 'danger');
            }
        } catch (error) {
            showToast('Server error while saving favourite.', 'danger');
        } finally {
            elements.saveAddFavoriteBtn.disabled = false;
            elements.addFavSpinner.classList.add('d-none');
        }
    });

    // Populate Add modal with currently viewed city
    document.getElementById('openAddFavoriteModalBtn').addEventListener('click', () => {
        elements.addCityInput.value = state.currentCity || '';
        elements.addCountryInput.value = state.currentCountry || 'IN';
    });

    // Edit Favourite Form Submit
    elements.editFavoriteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const favId = elements.editFavoriteId.value;
        const city = elements.editCityInput.value.trim();
        const country = elements.editCountryInput.value.trim().toUpperCase();
        const nickname = elements.editNicknameInput.value.trim();

        try {
            elements.saveEditFavoriteBtn.disabled = true;
            elements.editFavSpinner.classList.remove('d-none');

            const response = await fetch(`/api/favorites/${favId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, country, nickname: nickname || null })
            });

            if (response.status === 200) {
                showToast(`Updated favourite ${city}!`, 'success');
                modals.editFavorite.hide();
                loadFavorites();
            } else if (response.status === 409) {
                showToast('City and country combination already exists.', 'warning');
            } else {
                showToast('Failed to update favourite.', 'danger');
            }
        } catch (error) {
            showToast('Error updating favourite.', 'danger');
        } finally {
            elements.saveEditFavoriteBtn.disabled = false;
            elements.editFavSpinner.classList.add('d-none');
        }
    });

    // Delete Favourite Confirmation Submit
    elements.confirmDeleteFavoriteBtn.addEventListener('click', async () => {
        const favId = elements.deleteFavoriteId.value;
        if (!favId) return;

        try {
            elements.confirmDeleteFavoriteBtn.disabled = true;
            elements.deleteFavSpinner.classList.remove('d-none');

            const response = await fetch(`/api/favorites/${favId}`, { method: 'DELETE' });

            if (response.status === 200) {
                showToast('Favourite deleted successfully.', 'success');
                modals.deleteFavorite.hide();
                loadFavorites();
            } else {
                showToast('Failed to delete favourite.', 'danger');
            }
        } catch (error) {
            showToast('Error deleting favourite.', 'danger');
        } finally {
            elements.confirmDeleteFavoriteBtn.disabled = false;
            elements.deleteFavSpinner.classList.add('d-none');
        }
    });

    /* ==========================================================================
       7. World Weather Presets & Nav Controls
       ========================================================================== */
    document.querySelectorAll('.world-city-row').forEach(row => {
        row.addEventListener('click', () => {
            const city = row.getAttribute('data-city');
            const country = row.getAttribute('data-country');
            elements.searchCityInput.value = city;
            elements.searchCountryInput.value = country;
            loadCityWeather(city, country);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Sidebar Mobile Toggle
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('open');
        });
    }

    // Initial Load
    loadFavorites();
    loadCityWeather('Vijayawada', 'IN');
});

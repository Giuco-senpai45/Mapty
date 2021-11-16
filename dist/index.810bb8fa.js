'use strict';
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration){
        this.coords = coords; // [lat,lng]
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription() {
        // prettier-ignore
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}
class Running extends Workout {
    type = 'running';
    constructor(coords1, distance1, duration1, cadence){
        super(coords1, distance1, duration1);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = 'cycling';
    constructor(coords2, distance2, duration2, elevationGain){
        super(coords2, distance2, duration2);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];
    constructor(){
        //Get user position
        this._getPosition();
        //Get data from local storage
        this._getLocalStorage();
        //Attach event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField.bind(this));
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert('Could not get your position');
        });
    }
    _loadMap(position) {
        const { latitude  } = position.coords;
        const { longitude  } = position.coords;
        // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);
        const coords = [
            latitude,
            longitude
        ];
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        //Handling clicks on map.
        this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach((work)=>{
            this._renderWorkoutMarker(work);
        });
    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _clearFields() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    }
    _hideForm() {
        this._clearFields();
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display = 'grid'
        , 1000);
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {
        const validInputs = (...inputs)=>inputs.every((inp)=>Number.isFinite(inp)
            )
        ;
        const allPositive = (...inputs)=>inputs.every((inp)=>inp > 0
            )
        ;
        e.preventDefault();
        //Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat , lng  } = this.#mapEvent.latlng;
        let workout;
        //Check if data is valid
        //If workout running create running obj
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert('Inputs have to be positive numbers!');
            workout = new Running([
                lat,
                lng
            ], distance, duration, cadence);
        }
        // If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return alert('Inputs have to be positive numbers!');
            workout = new Cycling([
                lat,
                lng
            ], distance, duration, elevation);
        }
        //Add new object to workout array
        this.#workouts.push(workout);
        //Render workout on map as marker
        this._renderWorkoutMarker(workout);
        //Render workout on list
        this._renderWorkout(workout);
        //Clear input fields
        this._hideForm();
        //Set local storage to all workouts
        this._setLocalStorage();
    }
    _renderWorkoutMarker(workout3) {
        //Display marker
        L.marker(workout3.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout3.type}-popup`
        })).setPopupContent(`${workout3.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout3.description}`).openPopup();
    }
    _renderWorkout(workout1) {
        let html = ` 
    <li class="workout workout--${workout1.type}" data-id="${workout1.id}">
      <h2 class="workout__title">${workout1.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout1.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout1.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout1.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      `;
        if (workout1.type === 'running') html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout1.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout1.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
      </li>
      `;
        if (workout1.type === 'cycling') html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout1.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout1.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
      </li>
      `;
        form.insertAdjacentHTML('afterend', html);
    }
    _moveToPopup(e1) {
        const workoutEl = e1.target.closest('.workout');
        if (!workoutEl) return;
        const workout2 = this.#workouts.find((work)=>work.id === workoutEl.dataset.id
        );
        form.classList.remove('hidden');
        inputDistance.value = workout2.distance;
        inputDuration.value = workout2.duration;
        inputType.value = workout2.type;
        this._toggleElevationField();
        if (workout2.type === 'running') {
            if (inputElevation.classList.contains('form__row--hidden')) this._toggleElevationField();
            inputCadence.value = workout2.cadence;
        }
        if (workout2.type === 'cycling') {
            if (inputCadence.classList.contains('form__row--hidden')) this._toggleElevationField();
            inputElevation.value = workout2.elevationGain;
        }
        form.addEventListener('change', function(workout) {
            workout.distance = +inputDistance.value;
            workout.duration = +inputDuration.value;
            if (workout.type === 'running') workout.cadence = +inputCadence.value;
            if (workout.type === 'cycling') workout.elevationGain = +inputElevation.value;
        }, this);
        this.#map.setView(workout2.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;
        //Converting the data array which has normal objects back to the objects Running and Cycling that I use throughout the application.
        data.forEach(function(work) {
            let workout;
            if (work.type === 'running') workout = new Running(work.coords, work.distance, work.duration, work.cadence);
            if (work.type === 'cycling') workout = new Cycling(work.coords, work.distance, work.duration, work.elevationGain);
            this.#workouts.push(workout);
        }, this);
        this.#workouts.forEach((work)=>{
            this._renderWorkout(work);
        });
    }
    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
    showWorkouts() {
        this.#workouts.forEach((work)=>console.log(work)
        );
    }
}
const app = new App();

//# sourceMappingURL=index.810bb8fa.js.map

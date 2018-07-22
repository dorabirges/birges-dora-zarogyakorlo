function getData(url, callbackFunc) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      callbackFunc(this);
    }
  };
  xhttp.open('GET', url, true);
  xhttp.send();
}

function successAjax(xhttp) {
  // Innen lesz elérhető a JSON file tartalma, tehát az adatok amikkel dolgoznod kell
  var userDatas = JSON.parse(xhttp.responseText)[2].data;
  ascOrder(userDatas);
  deleteNullConsumables(userDatas);
  modifyNullValuesToUnknown(userDatas);
  showSpaceships(userDatas);
  showStatistics(userDatas);
  setupSearch(userDatas);
}

getData('/json/spaceships.json', successAjax);

// 1. A kapott adatokat rendezd ár(cost_in_credits) szerint növekvő sorrendbe.
function ascOrder(array) {
  for (var i = 0; i < array.length - 1; i++) {
    for (var j = i + 1; j < array.length; j++) {
      if (array[i].cost_in_credits !== null && array[j].cost_in_credits === null || array[i].cost_in_credits !== null && array[j].cost_in_credits !== null && parseInt(array[i].cost_in_credits, 10) > parseInt(array[j].cost_in_credits, 10)) {
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  }
  return array;
}

// 2. Töröld az összes olyan adatot, ahol a consumables értéke NULL. Fontos, hogy ne csak undefined-ra állítsd a tömbelemet!!!
function deleteNullConsumables(array) {
  for (var i = array.length - 1; i >= 0; i--) {
    if (array[i].consumables === null) {
      array.splice(i, 1);
    }
  }
  return array;
}

// 3. Az összes NULL értéket (minden objektum minden tulajdonságánál) módosítsd "unknown"-ra
function modifyNullValuesToUnknown(array) {
  for (var i = 0; i < array.length; i++) {
    for (var k in array[i]) {
      if (array[i][k] === null) {
        array[i][k] = 'unknown';
      }
    }
  }
  return array;
}

// 4. A spaceship-list class-ű divbe jelenítsd meg az így kapott hajók adatait, beleérve a képét is.
function showSpaceships(array) {
  var spaceshipList = document.querySelector('.spaceship-list');
  for (var i = 0; i < array.length; i++) {
    createOneSpaceship(array[i], spaceshipList);
  }
}

function createOneSpaceship(spaceship, spaceshipList) {
  var spaceshipListItem = document.createElement('div');
  spaceshipListItem.className = 'spaceship-item';
  var dataDiv = document.createElement('div');
  dataDiv.className = 'left';
  for (var k in spaceship) {
    if (k !== 'image') {
      var spaceshipDatas = document.createElement('p');
      spaceshipDatas.innerHTML = `<strong>${k}:</strong> ${spaceship[k]}`;
      dataDiv.appendChild(spaceshipDatas);
    } else {
      createImage(spaceship.image, spaceshipListItem);
    }
  }
  spaceshipListItem.appendChild(dataDiv);
  var clearDiv = document.createElement('div');
  clearDiv.className = 'clear-div';
  spaceshipListItem.appendChild(clearDiv);
  spaceshipList.appendChild(spaceshipListItem);
}

function createImage(imageName, spaceshipListItem) {
  var imgDiv = document.createElement('div');
  imgDiv.className = 'right';
  var img = document.createElement('img');
  img.src = '/img/' + imageName;
  img.onerror = function imageError(event) {
    event.target.src = '/img/no_image.png';
  };
  imgDiv.appendChild(img);
  spaceshipListItem.appendChild(imgDiv);
}

// 5. Készítened kell egy statisztikát, mely a spaceship-list class-ű div aljára a következő adatokat fogja beleírni:
// Egy fős (crew = 1) legénységgel rendelkező hajók darabszáma.
function numberOfShipsWithOneCrewMember(array) {
  var count = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i].crew === '1') {
      count++;
    }
  }
  return count;
}

// A legnagyobb cargo_capacity-vel rendelkező hajó neve (model)
function biggestCargoCapacity(array) {
  var biggest = null;
  for (var i = 0; i < array.length; i++) {
    if (array[i].cargo_capacity !== 'unknown') {
      if (biggest === null || parseInt(array[i].cargo_capacity, 10) > parseInt(biggest.cargo_capacity, 10)) {
        biggest = array[i];
      }
    }
  }
  return biggest.model;
}

// Az összes hajó utasainak (passengers) összesített száma
function numberOfPassengers(array) {
  var passengers = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i].passengers !== 'unknown') {
      passengers += parseInt(array[i].passengers, 10);
    }
  }
  return passengers;
}

// A leghosszabb(lengthiness) hajó képe
function longestShipImage(array) {
  var longest = null;
  for (var i = 0; i < array.length; i++) {
    if (array[i].lengthiness !== 'unknown') {
      if (longest === null || parseInt(array[i].lengthiness, 10) > parseInt(longest.lengthiness, 10)) {
        longest = array[i];
      }
    }
  }
  return longest.image;
}

function showStatistics(array) {
  var spaceshipList = document.querySelector('.spaceship-list');
  var statDiv = document.createElement('div');
  var stats = '<h2>Statisztika:</h2><ul>';
  stats += `<li>Egy fős (crew = 1) legénységgel rendelkező hajók darabszáma: ${numberOfShipsWithOneCrewMember(array)}</li>`;
  stats += `<li>A legnagyobb cargo_capacity-vel rendelkező hajó neve (model): ${biggestCargoCapacity(array)}</li>`;
  stats += `<li>Az összes hajó utasainak (passengers) összesített száma: ${numberOfPassengers(array)}</li>`;
  stats += `<li>A leghosszabb(lengthiness) hajó képe:</li></ul><div class="stat-image-div"><img src="../img/${longestShipImage(array)}"></div>`;
  statDiv.innerHTML = stats;
  spaceshipList.appendChild(statDiv);
}

/* 6. A jobb oldalon található keresősáv segítségével legyen lehetőség a hajókra rákeresni _model_ szerint.
* A keresés kattintásra induljon
* A keresés nem case sensitive
* Nem csak teljes egyezést vizsgálunk, tehát ha a keresett szöveg szerepel a hajó nevében már az is találat
* Ha több találatunk is lenne, nem foglalkozunk velük, az első találat eredményét (tehát az első megfelelő névvel rendelkező hajó adatait) adjuk vissza.
* Az adott hajó adatait a one-spaceship class-ű div-be kell megjeleníteni rendezett formában, képpel együtt. */

function searchByModel(array, searchTerm) {
  var result = null;
  for (var i = 0; i < array.length; i++) {
    if (array[i].model.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
      if (result === null || array[i].model.localeCompare(result.model) < 0 ) {
        result = array[i];
      }
    }
  }
  return result;
}
function setupSearch(array) {
  document.getElementById('search-button').onclick = ()=> {
    var textField = document.getElementById('search-text');
    var spaceship = searchByModel(array, textField.value);
    showOneSpaceship(spaceship);
  };
}
function showOneSpaceship(spaceship) {
  var oneSpaceship = createSpaceshipDetailsIfNeeded();
  if (spaceship !== null) {
    var oneSpaceshipString = '<div class="selected-spaceship">';
    oneSpaceshipString += `<h2>${spaceship.model}</h2>`;
    for (var k in spaceship) {
      if (k !== 'image' && k !== 'model') {
        oneSpaceshipString += `<p><strong>${k}:</strong> ${spaceship[k]}</p>`;
      }
    }
    oneSpaceshipString += `</div><div><img src="../img/${spaceship.image}" onerror="this.src = '/img/no_image.png'" class="selected-spaceship-image"></div>`;
    oneSpaceship.innerHTML = oneSpaceshipString;
  } else {
    oneSpaceship.innerHTML = 'Nincs találat';
  }
}

function createSpaceshipDetailsIfNeeded() {
  var sidebar = document.querySelector('.one-spaceship');
  var searchbar = document.querySelector('.searchbar');
  var oneSpaceship = document.getElementById('spaceshipDetails');
  if (oneSpaceship === null) {
    oneSpaceship = document.createElement('div');
    oneSpaceship.id = 'spaceshipDetails';
    sidebar.insertBefore(oneSpaceship, searchbar);
  }
  return oneSpaceship;
}


// Configuration

function getBusStopIds () {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('q')?.split(',') || []
}

function setBusStopIds (busStopIds) {
  const urlParams = new URLSearchParams(window.location.search)
  urlParams.set('q', busStopIds.join(','))

  window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`)
}

function showNewBusStopDialog () {
  document.getElementById('newBusStopDialog').showModal()
}

function addNewBusStop () {
  const busStopIds = new Set(getBusStopIds())

  const input = document.getElementById('newBusStopId')
  const newBusStopId = input.value.trim()
  input.value = ''

  if (!newBusStopId) {
    return
  }

  busStopIds.add(newBusStopId)
  setBusStopIds([...busStopIds])
  window.location.reload()
}

function removeBusStop (busStopId) {
  const busStopIds = new Set(getBusStopIds())
  busStopIds.delete(busStopId)

  setBusStopIds([...busStopIds])
  window.location.reload()
}

// Rendering cards

async function getBusStopInfo (busStopId) {
  const resp = await fetch(`https://api.tfl.gov.uk/StopPoint/${busStopId}`)
    .catch((e) => console.error(e))

  const data = await resp.json()

  const commonName = data.commonName
  const stopLetter = data.stopLetter

  let towards = null
  for (const addProp of data.additionalProperties) {
    if (addProp.key === 'Towards') {
      towards = addProp.value
    }
  }

  return { commonName, stopLetter, towards }
}

async function getArrivals (busStopId) {
  const resp = await fetch(`https://api.tfl.gov.uk/StopPoint/${busStopId}/arrivals`)
    .catch((e) => console.error(e))

  if (resp.ok) {
    return await resp.json()
  } else {
    return []
  }
}

function addCard (busStopId) {
  const cardTemplate = document.querySelector('#cardTemplate')
  const newCard = cardTemplate.content.firstElementChild.cloneNode(true)

  const removeCardButton = newCard.querySelector('#removeCardButton')
  removeCardButton.addEventListener('click', () => removeCard(newCard, busStopId))

  const container = document.getElementById('cards')
  container.appendChild(newCard)

  return newCard
}

function removeCard (card, busStopId) {
  card.remove()
  removeBusStop(busStopId)
}

async function renderStopInfo (card, busStopId) {
  const { commonName, stopLetter, towards } = await getBusStopInfo(busStopId)
  card.querySelector('#stationName').textContent = commonName
  card.querySelector('#platformName').textContent = stopLetter
  card.querySelector('#towards').textContent = towards
}

async function renderArrivals (card, busStopId) {
  const arrivals = await getArrivals(busStopId)
  arrivals.sort((a, b) => a.timeToStation - b.timeToStation)

  if (arrivals.length === 0) {
    const noArrivalsTemplate = document.querySelector('#noArrivalsTemplate')
    const noArrivals = noArrivalsTemplate.content.cloneNode(true)
    card.querySelector('.card-body').appendChild(noArrivals)
  } else {
    const table = card.querySelector('tbody')
    const tableRowTemplate = document.querySelector('#tableRowTemplate')
    for (const arrival of arrivals) {
      const newRow = tableRowTemplate.content.cloneNode(true)
      const td = newRow.querySelectorAll('td')
      td[0].textContent = arrival.lineName
      td[1].textContent = arrival.destinationName
      td[2].querySelector('span').textContent = Math.floor(arrival.timeToStation / 60)
      table.appendChild(newRow)
    }
  }
}

//

function main () {
  // setBusStopIds(myBusStopIds)
  for (const busStopId of getBusStopIds()) {
    const card = addCard(busStopId)
    renderStopInfo(card, busStopId)
    renderArrivals(card, busStopId)
  }

  const newBusStopButton = document.getElementById('newBusStopButton')
  newBusStopButton.addEventListener('click', showNewBusStopDialog)

  const addNewBusStopButton = document.getElementById('addNewBusStopButton')
  addNewBusStopButton.addEventListener('click', addNewBusStop)
}

main()

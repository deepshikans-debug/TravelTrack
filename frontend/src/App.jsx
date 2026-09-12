import './App.css'
import { useEffect, useState } from 'react'

const defaultCityOptions = ['kochi', 'goa', 'jaipur', 'varanasi', 'bangalore', 'mumbai']

const citySpotKeywords = {
  guwahati: ['guwahati', 'umananda', 'sukreshwar', 'nehru park', 'pan bazar', 'planetorium', 'ropeway', 'kamakhya', 'kaziranga', 'assam'],
  munnar: ['munnar', 'tea garden', 'tea estate', 'botanical', 'waterfall', 'rose garden', 'forest adventure', 'lakshmi tea', 'attukkad', 'pothamendu'],
  manali: ['manali', 'jogini', 'solang', 'hampta', 'gulaba', 'lagar', 'bhrigu', 'naggar'],
  kochi: ['kochi', 'cherai', 'fort kochi', 'marine drive', 'mattancherry', 'vypin'],
  goa: ['goa', 'baga', 'anjuna', 'panaji', 'calangute', 'candolim', 'fort aguada'],
  jaipur: ['jaipur', 'amber fort', 'hawa mahal', 'nahargarh', 'city palace', 'jal mahal'],
  varanasi: ['varanasi', 'ghats', 'kashi', 'sarnath', 'assi ghat', 'dashashwamedh'],
  bangalore: ['bangalore', 'cubbon park', 'lal bagh', 'mg road', 'nandi hills', 'bannerghatta'],
  mumbai: ['mumbai', 'gateway', 'marine drive', 'bandra', 'elephanta', 'colaba']
}

const hotelTypeOptions = ['Budget', 'Standard', 'Boutique', 'Luxury', 'Resort', 'Hostel']
const foodPreferenceOptions = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Local Food', 'No Preference']
const budgetPreferenceOptions = [
  { label: 'Under ₹2,000', value: 'under_2000', min: 0, max: 2000 },
  { label: '₹2,000 - ₹4,000', value: '2000_4000', min: 2000, max: 4000 },
  { label: '₹4,000 - ₹6,000', value: '4000_6000', min: 4000, max: 6000 },
  { label: '₹6,000 - ₹10,000', value: '6000_10000', min: 6000, max: 10000 },
  { label: 'Above ₹10,000', value: 'above_10000', min: 10000, max: Number.MAX_SAFE_INTEGER }
]

const travelTypeOptions = [
  { label: 'Nature', icon: '🌿' },
  { label: 'Adventure', icon: '🏕️' },
  { label: 'Culture', icon: '🏛️' },
  { label: 'Relaxation', icon: '🧘' },
  { label: 'Food', icon: '🍜' },
  { label: 'Heritage', icon: '🎭' }
]

const normalizeTravelTypes = (value = []) => {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (!value) return []

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const titleCase = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const formatCityName = (city = '') => titleCase(city)

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const getTripNightCount = (daysValue) => Math.max(1, Number(daysValue) || 1)

const getMealSuggestions = (city, foodPreference, travelType, restaurantList = []) => {
  const normalization = (value = '') => String(value || '').trim().toLowerCase()

  const baseRestaurants = Array.isArray(restaurantList) ? [...restaurantList] : []
  const cityKey = normalization(city)
  const preferred = normalization(foodPreference)

  const filterForMeal = (mealType) => {
    const candidateRestaurants = baseRestaurants.filter((restaurant) => {
      const location = normalization(restaurant.location)
      const cityMatch = !cityKey || location.includes(cityKey) || cityKey.includes(location) || location === cityKey
      if (!cityMatch) return false

      const flags = {
        fastFood: Number(restaurant.fast_food_or_not || 0) === 1,
        bakery: Number(restaurant.bakery_or_not || 0) === 1,
        streetFood: Number(restaurant.street_food || 0) === 1,
        southIndian: Number(restaurant.south_indian_or_not || 0) === 1,
        northIndian: Number(restaurant.north_indian_or_not || 0) === 1,
        biryani: Number(restaurant.biryani_or_not || 0) === 1
      }

      if (mealType === 'Evening Snacks') {
        return flags.fastFood || flags.bakery || flags.streetFood
      }

      const heavyFood = flags.northIndian || flags.southIndian || flags.biryani || flags.streetFood
      if (!heavyFood) return false

      if (preferred === 'vegetarian' || preferred === 'vegan' || preferred === 'jain') {
        return flags.southIndian || flags.northIndian
      }

      if (preferred === 'non-vegetarian') {
        return flags.biryani || flags.streetFood || flags.fastFood
      }

      if (preferred === 'local food') {
        return flags.streetFood || flags.southIndian || flags.northIndian
      }

      return true
    })

    return candidateRestaurants
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      .slice(0, 4)
      .map((restaurant) => {
        const name = restaurant.restaurant_name || 'Local eatery'
        const location = restaurant.location || city || 'your destination'
        const rating = restaurant.rating ? ` • ${Number(restaurant.rating).toFixed(1)}★` : ''
        const price = restaurant.average_price ? ` • ₹${restaurant.average_price}` : ''

        return {
          name,
          location,
          fullText: `${name} in ${location}${rating}${price}`,
          label: mealType === 'Evening Snacks' ? 'Snack Stop' : 'Heavy Meal'
        }
      })
  }

  const defaultMeals = {
    Breakfast: [{ name: 'Local breakfast spot', fullText: 'Local breakfast spot in your city', label: 'Heavy Meal' }],
    Lunch: [{ name: 'Family restaurant', fullText: 'Family restaurant in your city', label: 'Heavy Meal' }],
    Dinner: [{ name: 'Traditional dining place', fullText: 'Traditional dining place in your city', label: 'Heavy Meal' }],
    'Evening Snacks': [{ name: 'Cafe or bakery stop', fullText: 'Cafe or bakery stop in your city', label: 'Snack Stop' }]
  }

  if (baseRestaurants.length > 0) {
    return {
      Breakfast: filterForMeal('Breakfast').length ? filterForMeal('Breakfast') : defaultMeals.Breakfast,
      Lunch: filterForMeal('Lunch').length ? filterForMeal('Lunch') : defaultMeals.Lunch,
      Dinner: filterForMeal('Dinner').length ? filterForMeal('Dinner') : defaultMeals.Dinner,
      'Evening Snacks': filterForMeal('Evening Snacks').length ? filterForMeal('Evening Snacks') : defaultMeals['Evening Snacks']
    }
  }

  return defaultMeals
}

function App() {
  const [page, setPage] = useState('login')
  const [cities, setCities] = useState(defaultCityOptions)
  const [hotels, setHotels] = useState([])
  const [touristSpots, setTouristSpots] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [mealPlan, setMealPlan] = useState(null)
  const [showItinerary, setShowItinerary] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    place: '',
    people: '',
    days: '',
    travelType: '',
    foodPreference: '',
    budgetPreference: '',
    hotelType: ''
  })

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/hotels')
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          const cityList = [...new Set(data.map((item) => item.City).filter(Boolean))]
            .map((city) => String(city).trim().toLowerCase())
            .sort((a, b) => a.localeCompare(b))

          if (cityList.length > 0) {
            setCities(cityList)
            return
          }
        }
      } catch (error) {
        console.error('Could not load cities:', error)
      }

      setCities(defaultCityOptions)
    }

    const loadTouristSpots = async (city = '') => {
      try {
        const url = city
          ? `http://127.0.0.1:5000/api/tourist-spots?city=${encodeURIComponent(city)}`
          : 'http://127.0.0.1:5000/api/tourist-spots'

        const response = await fetch(url)
        const data = await response.json()
        if (Array.isArray(data)) {
          setTouristSpots(data)
        }
      } catch (error) {
        console.error('Could not load tourist spots:', error)
      }
    }

    loadCities()
    loadTouristSpots(form.place)
    if (form.place) {
      fetchRestaurantsForSelection(form.place, form.foodPreference)
    }
  }, [form.place, form.foodPreference])

  useEffect(() => {
    if ((page === 'results' || page === 'itinerary') && form.place) {
      fetchRestaurantsForSelection(form.place, form.foodPreference)
    }
  }, [page, form.place, form.foodPreference])

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const fetchRestaurantsForSelection = async (cityValue = form.place, foodValue = form.foodPreference) => {
    if (!cityValue) return

    try {
      const params = new URLSearchParams()
      params.set('city', cityValue)
      if (foodValue) params.set('foodPreference', foodValue)

      const response = await fetch(`http://127.0.0.1:5000/api/restaurants?${params.toString()}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setRestaurants(data)
        setMealPlan({
          city: cityValue,
          food: foodValue,
          suggestions: getMealSuggestions(cityValue, foodValue, normalizeTravelTypes(form.travelType), data)
        })
      }
    } catch (error) {
      console.error('Could not load restaurants:', error)
    }
  }

  const toggleTravelType = (value) => {
    setForm((current) => {
      const selected = normalizeTravelTypes(current.travelType)
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]

      return { ...current, travelType: next }
    })
  }

  const getBudgetRange = (budgetValue) =>
    budgetPreferenceOptions.find((item) => item.value === budgetValue) || null

  const callRecommendations = async () => {
    const selectedTravelTypes = normalizeTravelTypes(form.travelType)
    if (!form.place || !form.people || !form.days || selectedTravelTypes.length === 0 || !form.foodPreference || !form.budgetPreference || !form.hotelType) {
      return
    }

    setLoading(true)

    try {
      const restaurantParams = new URLSearchParams()
      restaurantParams.set('city', form.place)
      restaurantParams.set('foodPreference', form.foodPreference)

      const [restaurantResponse, hotelResponse] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/restaurants?${restaurantParams.toString()}`),
        fetch('http://127.0.0.1:5000/api/recommend-hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: form.place,
            people: Number(form.people),
            days: Number(form.days),
            travelType: selectedTravelTypes,
            foodPreference: form.foodPreference,
            budgetPreference: form.budgetPreference,
            hotelType: form.hotelType
          })
        })
      ])

      const restaurantsData = await restaurantResponse.json().catch(() => [])
      const hotelData = await hotelResponse.json().catch(() => [])

      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : [])
      setHotels(Array.isArray(hotelData) ? hotelData : [])
      setPage('results')
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      setRestaurants([])
      setHotels([])
      setPage('results')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendedSpots = () => {
    const destination = form.place?.toLowerCase() || ''
    const selectedTravelTypes = normalizeTravelTypes(form.travelType)
    const travelKeywords = {
      Nature: ['nature', 'garden', 'lake', 'waterfall', 'forest', 'scenic', 'mountain', 'sunset', 'greenery'],
      Adventure: ['adventure', 'trekking', 'trek', 'wildlife', 'boating', 'amusement', 'outdoor'],
      Culture: ['culture', 'heritage', 'museum', 'temple', 'festival', 'traditional', 'art'],
      Relaxation: ['relaxation', 'serene', 'sunset', 'garden', 'lake', 'scenic'],
      Food: ['food', 'market', 'restaurant', 'tea', 'cuisine', 'shopping'],
      Heritage: ['heritage', 'museum', 'temple', 'palace', 'fort', 'historical']
    }

    const cityKeywords = citySpotKeywords[destination] || [destination]
    const keywordPool = selectedTravelTypes.flatMap((type) => travelKeywords[type] || [])

    return [...touristSpots]
      .map((spot) => {
        const characteristics = `${spot.Name || ''} ${spot.Characteristics || ''}`.toLowerCase()
        const cityMatch = cityKeywords.some((keyword) => characteristics.includes(keyword)) ? 6 : 0
        const destinationMatch = destination && characteristics.includes(destination) ? 4 : 0
        const keywordScore = keywordPool.reduce((score, keyword) => score + (characteristics.includes(keyword) ? 2 : 0), 0)
        return {
          ...spot,
          matchScore: cityMatch + destinationMatch + keywordScore
        }
      })
      .filter((spot) => spot.matchScore > 0 || destination === '')
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4)
  }

  const generateItinerary = () => {
    const tripDays = Math.max(1, Number(form.days) || 2)
    const cityName = formatCityName(form.place)
    const destinationSpots = getRecommendedSpots()
    const selectedTravelTypes = normalizeTravelTypes(form.travelType)
    const mealSuggestions =
      mealPlan && mealPlan.city === form.place && mealPlan.food === form.foodPreference
        ? mealPlan.suggestions
        : getMealSuggestions(form.place, form.foodPreference, form.travelType, restaurants)

    return Array.from({ length: tripDays }, (_, index) => {
      const dayNumber = index + 1
      const primarySpot = destinationSpots[index % destinationSpots.length] || { Name: 'City sightseeing', Characteristics: 'Local experience' }
      const secondSpot = destinationSpots[(index + 1) % destinationSpots.length] || { Name: 'Leisure walk', Characteristics: 'Relaxing local exploration' }
      const travelSummary = selectedTravelTypes.length ? selectedTravelTypes.join(', ') : 'your trip style'

      const breakfastOptions = Array.isArray(mealSuggestions.Breakfast) ? mealSuggestions.Breakfast : [mealSuggestions.Breakfast]
      const lunchOptions = Array.isArray(mealSuggestions.Lunch) ? mealSuggestions.Lunch : [mealSuggestions.Lunch]
      const dinnerOptions = Array.isArray(mealSuggestions.Dinner) ? mealSuggestions.Dinner : [mealSuggestions.Dinner]
      const snackOptions = Array.isArray(mealSuggestions['Evening Snacks']) ? mealSuggestions['Evening Snacks'] : [mealSuggestions['Evening Snacks']]

      const breakfast = breakfastOptions[(dayNumber - 1) % breakfastOptions.length] || breakfastOptions[0]
      const lunch = lunchOptions[(dayNumber - 1) % lunchOptions.length] || lunchOptions[0]
      const dinner = dinnerOptions[(dayNumber - 1) % dinnerOptions.length] || dinnerOptions[0]
      const snacks = snackOptions[(dayNumber - 1) % snackOptions.length] || snackOptions[0]

      return {
        day: dayNumber,
        title: `Day ${dayNumber}: ${titleCase(primarySpot.Name || 'Local Exploration')}`,
        schedule: [
          { time: '08:30 AM', text: `Eat breakfast at ${breakfast.name || 'Local breakfast spot'} — ${breakfast.fullText || 'Breakfast restaurant in your destination'}.` },
          { time: '10:30 AM', text: `Explore ${titleCase(primarySpot.Name || 'a local sightseeing experience')} in ${cityName}.` },
          { time: '12:30 PM', text: `Eat lunch at ${lunch.name || 'Local lunch spot'} — ${lunch.fullText || 'Lunch restaurant in your destination'}.` },
          { time: '04:00 PM', text: `Eat evening snacks at ${snacks.name || 'Cafe or bakery stop'} — ${snacks.fullText || 'Evening snack spot in your destination'}.` },
          { time: '05:30 PM', text: `Visit ${titleCase(secondSpot.Name || 'another nearby attraction')} and enjoy ${titleCase(travelSummary)} experiences.` },
          { time: '07:00 PM', text: `Eat dinner at ${dinner.name || 'Local dinner spot'} — ${dinner.fullText || 'Dinner restaurant in your destination'}.` }
        ],
        meal: `${breakfast.name || 'Local breakfast spot'} • ${lunch.name || 'Local lunch spot'} • ${dinner.name || 'Local dinner spot'} • ${snacks.name || 'Cafe or bakery stop'}`
      }
    })
  }

  const renderLogin = () => (
    <div className="travel-login-shell">
      <div className="travel-login-hero">
        <div className="travel-login-copy">
          <h1>
            TRAVEL
            <span>EXPLORE</span>
            HORIZONS
          </h1>

          <p>Where Your Dream Destinations Become Reality.</p>
          <p className="small-copy">Embark on a journey where every corner of the world is within your reach.</p>
        </div>

        <div className="travel-login-card">
          <div className="login-topbar">
            <button type="button" className="ghost-icon">♡</button>
            <button type="button" className="ghost-icon">◫</button>
          </div>

          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault()
              setPage('place')
            }}
          >
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="Enter your email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder="********"
                required
              />
            </label>

            <div className="login-extra-row">
              <button type="button" className="text-link">Forgot password?</button>
            </div>

            <button type="submit" className="primary-button">Sign in</button>

            <div className="divider"><span>or</span></div>

            <button type="button" className="google-button">
              <span className="google-icon">G</span>
              Sign in with Google
            </button>

            <p className="signup-text">
              Are you new? <button type="button" className="text-link inline">Create an Account</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )

  const stepButtons = {
    place: {
      title: 'Where do you want to go?',
      description: 'Choose your destination.',
      value: form.place,
      onSelect: (value) => updateForm('place', value),
      render: () => (
        <div className="select-wrap">
          <label className="field-label" htmlFor="city-select">Select city</label>
          <select
            id="city-select"
            className="city-select"
            value={form.place}
            onChange={(event) => updateForm('place', event.target.value)}
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city} value={city}>{formatCityName(city)}</option>
            ))}
          </select>
        </div>
      )
    },
    people: {
      title: 'How many people are traveling?',
      description: 'Let us tailor the stay for your group.',
      options: ['1', '2', '3', '4', '5', '6+'].map((value) => ({ label: value, value, icon: '👥' })),
      value: form.people,
      onSelect: (value) => updateForm('people', value)
    },
    days: {
      title: 'How many days?',
      description: 'Choose your trip length.',
      options: ['2', '3', '4', '5', '7', '10+'].map((value) => ({ label: `${value} days`, value, icon: '📅' })),
      value: form.days,
      onSelect: (value) => updateForm('days', value)
    },
    travelType: {
      title: 'What kind of trip do you want?',
      description: 'Pick one or more travel styles.',
      options: travelTypeOptions.map((item) => ({ label: item.label, value: item.label, icon: item.icon })),
      value: normalizeTravelTypes(form.travelType),
      onSelect: (value) => toggleTravelType(value)
    },
    foodPreference: {
      title: 'What food preference do you have?',
      description: 'We will suggest suitable stay options.',
      options: foodPreferenceOptions.map((item) => ({ label: item, value: item, icon: item === 'Vegetarian' ? '🥗' : item === 'Vegan' ? '🌱' : item === 'Local Food' ? '🍜' : item === 'Non-Vegetarian' ? '🍗' : item === 'Jain' ? '🥬' : '🍽️' })),
      value: form.foodPreference,
      onSelect: (value) => updateForm('foodPreference', value)
    },
    budgetPreference: {
      title: 'What is your budget preference?',
      description: 'Choose your ideal hotel budget range.',
      options: budgetPreferenceOptions.map((item) => ({ label: item.label, value: item.value, icon: '💰' })),
      value: form.budgetPreference,
      onSelect: (value) => updateForm('budgetPreference', value)
    },
    hotelType: {
      title: 'Which hotel type do you prefer?',
      description: 'Choose the accommodation style.',
      options: hotelTypeOptions.map((item) => ({ label: item, value: item, icon: item === 'Budget' ? '💰' : item === 'Luxury' ? '👑' : item === 'Resort' ? '🏖️' : item === 'Boutique' ? '✨' : item === 'Hostel' ? '🛏️' : '🏨' })),
      value: form.hotelType,
      onSelect: (value) => updateForm('hotelType', value)
    }
  }

  const renderStepPage = (stepKey) => {
    const step = stepButtons[stepKey]
    const stepIndex = Object.keys(stepButtons).indexOf(stepKey) + 1
    const totalSteps = Object.keys(stepButtons).length
    const isTravelType = stepKey === 'travelType'
    const selectionMissing = isTravelType ? normalizeTravelTypes(step.value).length === 0 : !step.value

    return (
      <div className="pref-shell">
        <div className="pref-card">
          <div className="step-header">
            <span>Step {stepIndex} of {totalSteps}</span>
            <button type="button" className="back-link" onClick={() => setPage('login')}>
              Logout
            </button>
          </div>

          <h1>{step.title}</h1>
          <p>{step.description}</p>

          {step.render ? (
            step.render()
          ) : (
            <div className="option-grid">
              {step.options.map((option) => {
                const isSelected = Array.isArray(step.value)
                  ? step.value.includes(option.value)
                  : step.value === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={isSelected ? 'choice-card selected' : 'choice-card'}
                    onClick={() => {
                      if (isTravelType) {
                        step.onSelect(option.value)
                        return
                      }

                      step.onSelect(option.value)

                      if (stepKey === 'place') setPage('people')
                      else if (stepKey === 'people') setPage('days')
                      else if (stepKey === 'days') setPage('travelType')
                      else if (stepKey === 'foodPreference') setPage('budgetPreference')
                      else if (stepKey === 'budgetPreference') setPage('hotelType')
                      else if (stepKey === 'hotelType') callRecommendations()
                    }}
                  >
                    <span>{option.icon}</span>
                    <strong>{option.label}</strong>
                  </button>
                )
              })}
            </div>
          )}

          <div className="nav-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (stepKey === 'place') setPage('login')
                else if (stepKey === 'people') setPage('place')
                else if (stepKey === 'days') setPage('people')
                else if (stepKey === 'travelType') setPage('days')
                else if (stepKey === 'foodPreference') setPage('travelType')
                else if (stepKey === 'budgetPreference') setPage('foodPreference')
                else if (stepKey === 'hotelType') setPage('budgetPreference')
              }}
            >
              Back
            </button>

            {stepKey === 'place' ? (
              <button
                type="button"
                className="primary-button"
                disabled={!form.place}
                onClick={() => setPage('people')}
              >
                Next
              </button>
            ) : isTravelType ? (
              <button
                type="button"
                className="primary-button"
                disabled={selectionMissing}
                onClick={() => setPage('foodPreference')}
              >
                Continue
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const renderBrowserFrame = (content) => (
    <div className="browser-shell">
      <div className="browser-window">
        <div className="browser-topbar">
          <div className="traffic-lights">
            <span className="light red" />
            <span className="light yellow" />
            <span className="light green" />
          </div>

          <div className="browser-tabs">
            <span className="browser-tab active">Travel</span>
            <span className="browser-tab">Hotels</span>
            <span className="browser-tab">Itinerary</span>
          </div>

          <div className="browser-actions">
            <span className="action-pill">+ New</span>
          </div>
        </div>

        <div className="browser-toolbar">
          <div className="nav-arrows">← →</div>
          <div className="address-bar">traveltrack.app</div>
          <div className="toolbar-icons">⤴</div>
        </div>

        <div className="browser-content">
          {content}
        </div>
      </div>
    </div>
  )

  if (page === 'login') return renderLogin()

  if (page === 'itinerary') {
    const itineraryDays = generateItinerary()

    return renderBrowserFrame(
      <div className="results-shell">
        <div className="results-header itinerary-header-row">
          <div>
            <p className="eyebrow">AI-Planned Trip</p>
            <h1>Itinerary For {formatCityName(form.place)}</h1>
          </div>
          <div className="results-actions">
            <button type="button" className="secondary-button" onClick={() => setPage('results')}>
              Back To Results
            </button>
          </div>
        </div>

        <div className="itinerary-panel detailed-itinerary">
          {itineraryDays.map((day) => (
            <div key={day.day} className="itinerary-day">
              <h4>{day.title}</h4>
              <div className="day-schedule">
                {day.schedule.map((entry) => (
                  <div key={`${day.day}-${entry.time}`} className="schedule-entry">
                    <span className="time-pill">{entry.time}</span>
                    <p>{entry.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (page === 'results') {
    const tripNights = getTripNightCount(form.days)
    const total = hotels.reduce((sum, hotel) => sum + Number(hotel.Hotel_Price || 0) * tripNights, 0)
    const recommendedSpots = getRecommendedSpots()
    const selectedBudget = getBudgetRange(form.budgetPreference)

    return renderBrowserFrame(
      <div className="results-shell">
        <div className="results-header">
          <div>
            <p className="eyebrow">Hello {titleCase(form.name || 'Traveler')}</p>
            <h1>Recommended Stays</h1>
          </div>
          <div className="results-actions">
            <button type="button" className="secondary-button" onClick={() => setPage('place')}>
              Edit Filters
            </button>
            <button type="button" className="primary-button small-button" onClick={() => setPage('itinerary')}>
              Show Itinerary
            </button>
          </div>
        </div>

        <div className="results-grid">
          <div className="results-main">
            {loading ? (
              <div className="empty-state">Finding the best hotels for you...</div>
            ) : hotels.length > 0 ? (
              hotels.map((hotel, index) => {
                const tripPrice = Number(hotel.Hotel_Price || 0) * tripNights

                return (
                  <article key={`${hotel.Hotel_Name}-${index}`} className="hotel-result-card">
                    <div className="hotel-result-top">
                      <div>
                        <h2>{hotel.Hotel_Name}</h2>
                        <p>{formatCityName(hotel.City)}</p>
                      </div>
                      <span className="rating-badge">★ {hotel.Hotel_Rating?.toFixed(1) || '4.5'}</span>
                    </div>

                    <div className="hotel-result-meta">
                      <span>{titleCase(form.people || 'People')} People</span>
                      <span>{titleCase(form.days || 'Days')} Days</span>
                      <span>{titleCase(form.hotelType || 'Hotel Type')}</span>
                    </div>

                    <div className="hotel-result-footer">
                      <div className="price-block">
                        <strong>{formatCurrency(tripPrice)}</strong>
                        <span>For {tripNights} Nights</span>
                      </div>
                      <button type="button">Book Now</button>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="empty-state">No hotels matched your preferences. Try a different city or trip type.</div>
            )}
          </div>

          <aside className="summary-panel results-panel">
            <h3>Trip Summary</h3>
            <ul>
              <li><span>Place</span><strong>{form.place ? formatCityName(form.place) : 'Not Selected'}</strong></li>
              <li><span>People</span><strong>{form.people || '—'}</strong></li>
              <li><span>Days</span><strong>{form.days || '—'}</strong></li>
              <li><span>Travel Type</span><strong>{normalizeTravelTypes(form.travelType).length ? normalizeTravelTypes(form.travelType).join(', ') : '—'}</strong></li>
              <li><span>Food</span><strong>{form.foodPreference || '—'}</strong></li>
              <li><span>Budget</span><strong>{selectedBudget ? selectedBudget.label : '—'}</strong></li>
              <li><span>Hotel Type</span><strong>{form.hotelType || '—'}</strong></li>
            </ul>

            <div className="side-section">
              <h4>Places To Visit</h4>
              <ul className="spot-list">
                {recommendedSpots.length > 0 ? (
                  recommendedSpots.map((spot) => (
                    <li key={spot.DestinationID || spot.Name}>
                      <strong>{titleCase(spot.Name)}</strong>
                      <span>{titleCase(spot.Characteristics || 'Popular Tourist Place')}</span>
                    </li>
                  ))
                ) : (
                  <li className="spot-empty">No matching tourist spots available for this trip.</li>
                )}
              </ul>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </aside>
        </div>

        {showItinerary && (
          <div className="itinerary-panel">
            <div className="itinerary-header">
              <h3>AI-Assisted Itinerary</h3>
              <span>{Number(form.days) || 1} Day Trip</span>
            </div>

            {itineraryDays.map((day) => (
              <div key={day.day} className="itinerary-day">
                <h4>{day.title}</h4>
                <div className="day-schedule">
                  {day.schedule.map((entry) => (
                    <div key={`${day.day}-${entry.time}`} className="schedule-entry">
                      <span className="time-pill">{entry.time}</span>
                      <p>{entry.text}</p>
                    </div>
                  ))}
                </div>
                <p>{day.meal}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return renderStepPage(page)
}

export default App
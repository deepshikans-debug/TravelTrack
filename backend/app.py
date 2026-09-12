from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load datasets
hotels = pd.read_csv("../dataset/hotels.csv")
tourist_spots = pd.read_csv("../dataset/Tourist_Spots.csv")
restaurants = pd.read_csv("../dataset/indian_restaurants.csv")

CITY_KEYWORDS = {
    "guwahati": ["guwahati", "umananda", "sukreshwar", "nehru park", "pan bazar", "planetorium", "ropeway", "kamakhya", "kaziranga"],
    "munnar": ["munnar", "tea garden", "tea estate", "botanical", "waterfall", "rose garden", "forest adventure", "lakshmi tea", "attukkad"],
    "manali": ["manali", "jogini", "solang", "hampta", "gulaba", "bhrigu", "naggar", "lagar"],
    "kochi": ["kochi", "cherai", "fort kochi", "marine drive", "mattancherry", "vypin"],
    "goa": ["goa", "baga", "anjuna", "panaji", "calangute", "candolim", "aguada"],
    "jaipur": ["jaipur", "amber fort", "hawa mahal", "nahargarh", "city palace", "jal mahal"],
    "varanasi": ["varanasi", "kashi", "ghats", "sarnath", "assi ghat", "dashashwamedh"],
    "bangalore": ["bangalore", "cubbon park", "lal bagh", "nandi hills", "bannerghatta"],
    "mumbai": ["mumbai", "gateway", "marine drive", "bandra", "elephanta", "colaba"]
}

TRAVEL_KEYWORDS = {
    "Nature": ["garden", "lake", "mountain", "forest", "beach", "waterfall", "river", "hill", "nature", "pool", "scenic", "view"],
    "Adventure": ["trek", "camp", "adventure", "hiking", "bike", "trekking", "safari", "wild", "outdoor"],
    "Culture": ["culture", "museum", "heritage", "temple", "palace", "historical", "art", "festival", "traditional"],
    "Relaxation": ["spa", "wellness", "pool", "resort", "beach", "massage", "calm", "sunset", "relax"],
    "Food": ["restaurant", "cuisine", "breakfast", "bar", "food", "coffee", "dining", "kitchen"],
    "Heritage": ["heritage", "museum", "fort", "palace", "temple", "ancient", "historical", "monument", "traditional"]
}

HOTEL_KEYWORDS = {
    "Budget": ["budget", "hostel", "apartment", "guesthouse", "residence", "cheap", "3-star"],
    "Standard": ["standard", "3-star", "4-star", "residence", "comfortable", "hotel"],
    "Boutique": ["boutique", "studio", "chic", "unique", "residence", "villa"],
    "Luxury": ["5-star", "luxury", "premium", "spa", "suite", "deluxe", "royal", "villa"],
    "Resort": ["resort", "villa", "beach", "pool", "spa", "lakeview", "resort"],
    "Hostel": ["hostel", "shared", "dorm", "guesthouse", "budget", "residence"]
}

FOOD_KEYWORDS = {
    "Vegetarian": ["vegetarian", "vegan", "salad", "fresh", "breakfast", "veg"],
    "Non-Vegetarian": ["bar", "restaurant", "seafood", "bbq", "grill", "meat", "non-veg"],
    "Vegan": ["vegan", "plant", "salad", "fresh", "veg"],
    "Jain": ["jain", "vegetarian", "pure veg", "veg", "fresh"],
    "Local Food": ["local", "cuisine", "restaurant", "food", "breakfast", "traditional"],
    "No Preference": []
}

RESTAURANT_PREFERENCE_KEYS = {
    "Vegetarian": ["south_indian_or_not", "north_indian_or_not", "bakery_or_not"],
    "Non-Vegetarian": ["street_food", "fast_food_or_not", "biryani_or_not"],
    "Vegan": ["south_indian_or_not", "north_indian_or_not", "bakery_or_not"],
    "Jain": ["south_indian_or_not", "north_indian_or_not"],
    "Local Food": ["street_food", "south_indian_or_not", "north_indian_or_not"],
    "No Preference": []
}

BUDGET_RANGES = {
    "under_2000": (0, 2000),
    "2000_4000": (2000, 4000),
    "4000_6000": (4000, 6000),
    "6000_10000": (6000, 10000),
    "above_10000": (10000, float("inf"))
}


def normalize_text(value):
    return str(value or "").strip().lower()


def match_keywords(text, keyword_list):
    text = normalize_text(text)
    return any(keyword in text for keyword in keyword_list)


@app.route("/")
def home():
    return jsonify({
        "message": "TravelTrack backend is running!"
    })


@app.route("/api/hotels")
def get_hotels():
    return jsonify(
        hotels.to_dict(orient="records")
    )


@app.route("/api/restaurants")
def get_restaurants():
    city = normalize_text(request.args.get("city", ""))
    food_preference = normalize_text(request.args.get("foodPreference", ""))
    rows = restaurants.copy()

    if city:
        city_matches = rows["location"].astype(str).str.lower().str.contains(city, na=False)
        if city_matches.any():
            rows = rows[city_matches]

    if food_preference and food_preference != "no preference":
        columns = RESTAURANT_PREFERENCE_KEYS.get(food_preference.title(), [])
        if columns:
            mask = rows[columns].fillna(0).astype(int).gt(0).any(axis=1)
            rows = rows[mask]

    if rows.empty:
        rows = restaurants.copy()
        if city:
            rows = rows[rows["location"].astype(str).str.lower().str.contains(city[:3], na=False)]
        if rows.empty:
            rows = restaurants.head(8)

    ranked = rows.sort_values(["rating", "average_price"], ascending=[False, True]).head(5)
    return jsonify(
        ranked[
            [
                "restaurant_name",
                "rating",
                "average_price",
                "location",
                "south_indian_or_not",
                "north_indian_or_not",
                "fast_food_or_not",
                "street_food",
                "biryani_or_not",
                "bakery_or_not"
            ]
        ].to_dict(orient="records")
    )


@app.route("/api/tourist-spots")
def get_tourist_spots():
    city = normalize_text(request.args.get("city", ""))
    spots = tourist_spots.copy()

    if city:
        keywords = CITY_KEYWORDS.get(city, [city])
        spots = spots[
            spots.apply(
                lambda row: any(
                    keyword in str(row.get("Name", "")).lower() + " " + str(row.get("Characteristics", "")).lower()
                    for keyword in keywords
                ),
                axis=1,
            )
        ]

    if spots.empty:
        return jsonify([])

    return jsonify(spots.head(8).to_dict(orient="records"))


@app.route("/api/recommend-hotels", methods=["POST"])
def recommend_hotels():
    data = request.get_json() or {}

    destination = normalize_text(data.get("destination", ""))
    people = int(data.get("people") or 2)
    days = int(data.get("days") or 3)
    travel_types = data.get("travelType", [])
    if isinstance(travel_types, str):
        travel_types = [part.strip() for part in travel_types.split(",") if part.strip()]
    travel_types = [normalize_text(item) for item in travel_types]
    hotel_type = normalize_text(data.get("hotelType", ""))
    food_preference = normalize_text(data.get("foodPreference", ""))
    budget_preference = normalize_text(data.get("budgetPreference", ""))

    results = hotels.copy()

    if destination:
        results = results[
            results["City"].astype(str).str.lower().str.contains(destination, na=False)
        ]

    if not results.empty and budget_preference:
        min_budget, max_budget = BUDGET_RANGES.get(budget_preference, (0, float("inf")))
        results = results[
            results["Hotel_Price"].astype(float).between(min_budget, max_budget, inclusive="both")
        ]

    if results.empty:
        results = hotels.copy()

        if budget_preference:
            min_budget, max_budget = BUDGET_RANGES.get(budget_preference, (0, float("inf")))
            results = results[
                results["Hotel_Price"].astype(float).between(min_budget, max_budget, inclusive="both")
            ]

    if results.empty:
        return jsonify([])

    feature_columns = [col for col in results.columns if col.startswith("Feature_")]
    scored_rows = []

    for index, row in results.iterrows():
        text = " ".join(str(row[col]) for col in feature_columns if pd.notna(row[col])).lower()
        score = 0

        if destination and destination in normalize_text(row.get("City", "")):
            score += 8

        if travel_types:
            for travel_type in travel_types:
                keywords = TRAVEL_KEYWORDS.get(travel_type.title(), [])
                if any(keyword in text for keyword in keywords):
                    score += 6

        if hotel_type:
            hotel_keywords = HOTEL_KEYWORDS.get(hotel_type.title(), [])
            if any(keyword in text for keyword in hotel_keywords):
                score += 5

        if food_preference and food_preference.lower() != "no preference":
            food_keywords = FOOD_KEYWORDS.get(food_preference.title(), [])
            if any(keyword in text for keyword in food_keywords):
                score += 4

        if budget_preference:
            price = float(row.get("Hotel_Price", 0) or 0)
            min_budget, max_budget = BUDGET_RANGES.get(budget_preference, (0, float("inf")))
            if min_budget <= price <= max_budget:
                score += 3

        score += float(row.get("Hotel_Rating", 0)) * 2
        score -= (float(row.get("Hotel_Price", 0)) / 10000)
        score += min(people, 6) * 0.3
        score += min(days, 10) * 0.2

        scored_rows.append((index, score, row))

    scored_rows.sort(key=lambda x: x[1], reverse=True)
    recommended = [row for _, _, row in scored_rows[:5]]

    return jsonify([row.to_dict() for row in recommended])


if __name__ == "__main__":
    app.run(debug=True)
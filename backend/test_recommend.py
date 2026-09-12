import requests

response = requests.post(
    "http://127.0.0.1:5000/api/recommend-hotels",
    json={
        "destination": "guwahati",
        "budget": "₹10,000 – ₹20,000",
        "hotelPreference": "Boutique"
    }
)

print(response.json())
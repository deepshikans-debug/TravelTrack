import pandas as pd

hotels = pd.read_csv("../dataset/hotels.csv")

print("Number of hotels:", len(hotels))

print("\nCities in dataset:")
print(hotels["City"].unique())

print("\nPrice range:")
print(hotels["Hotel_Price"].min())
print(hotels["Hotel_Price"].max())
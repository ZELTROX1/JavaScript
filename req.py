import requests

location = "hyderabad"
url = "https://rewardsy-dev-backend-hkbme3c6byhghghv.centralindia-01.azurewebsites.net/store/by-location?location=hyderabad"
params = {"location": location}

response = requests.get(url, params=params)

if response.status_code == 200:
    data = response.json()
    print("Stores at location:", data)
else:
    print("Error:", response.status_code, response.text)

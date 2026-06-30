import requests

url = "http://127.0.0.1:5001/generate-embedding"

files = {
    "image": open("employee.jpg", "rb")
}

response = requests.post(url, files=files)

print("Status:", response.status_code)
print(response.json())



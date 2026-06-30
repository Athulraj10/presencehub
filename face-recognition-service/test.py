import requests

# Load the stored embedding
with open("embedding.txt", "r") as f:
    embedding = f.read().strip()

# Upload the same image
files = {
    "image": open("employee.jpg", "rb")
}

# Send the embedding as a form field
data = {
    "storedEmbedding": embedding
}

response = requests.post(
    "http://127.0.0.1:5001/verify-face",
    files=files,
    data=data
)

print("Status:", response.status_code)
print(response.json())











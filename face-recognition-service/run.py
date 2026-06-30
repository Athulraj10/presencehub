import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("DEBUG", "False").lower() in ("true", "1", "yes")
    
    print(f"Starting Face Recognition Service on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)

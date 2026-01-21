cat > app.py << 'EOF'
from flask import Flask, request
import requests

app = Flask(__name__)

@app.route("/")
def index():
    user = request.args.get("user", "guest")
    r = requests.get(f"http://app2:5000/data?user={user}")
    return r.text

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
EOF

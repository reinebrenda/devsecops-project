from flask import Flask, request
import requests

app = Flask(__name__)

@app.route("/data")
def data():
    user = request.args.get("user", "unknown")
    r = requests.get(f"http://app3:5001/process?user={user}")
    return f"Backend received -> {r.text}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

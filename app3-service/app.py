from flask import Flask, request

app = Flask(__name__)

@app.route("/process")
def process():
    user = request.args.get("user", "none")
    return f"Processed user: {user}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)

FROM python:3.10-slim
WORKDIR /app
COPY app.py .
RUN pip install --no-cache-dir flask
EXPOSE 5001
CMD ["python", "app.py"]

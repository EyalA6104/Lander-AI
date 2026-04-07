# Use a slim Python base image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Ensure logs appear in the Google Cloud console immediately
ENV PYTHONUNBUFFERED=1

# Copy requirements and install dependencies
# We use --no-cache-dir to keep the image small
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browser and OS-level dependencies
RUN playwright install --with-deps chromium

# Copy the rest of the application code into the container
COPY . .

# Start the app using uvicorn, binding to the $PORT env variable (default 8000)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

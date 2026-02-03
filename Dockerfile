# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies for OpenCV and other libraries
# System dependencies removed (Relying on headless wheels)

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["python", "api_backend.py"]

# Use the official Python image from the Docker Hub
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY ./apps/flask_api/requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY ./apps/flask_api/app.py .
COPY ./apps/flask_api/generated_images .
# Expose the port the app runs on
EXPOSE 8045

# Define the command to run the application
CMD ["python", "app.py"]
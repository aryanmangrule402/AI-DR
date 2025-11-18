# 1. Use Python 3.10 Slim (Small & Fast)
FROM python:3.10-slim

# 2. Set the folder inside the container
WORKDIR /app

# 3. Install system tools (needed for some python libraries)
RUN apt-get update && apt-get install -y build-essential curl

# 4. Copy requirements first (Caching trick for faster builds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your code
COPY . .

# 6. Expose the port
EXPOSE 8000

# 7. Run the server (Host 0.0.0.0 is REQUIRED for Docker)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
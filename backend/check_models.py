import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# 1. Load the Key securely
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: API Key not found in .env")
    exit()

# 2. Configure and List Models
genai.configure(api_key=api_key)

print("🔍 Connecting to Google AI...")
print("-----------------------------------")
try:
    found_any = False
    for m in genai.list_models():
        # We only want models that can "generateContent" (Chat models)
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ AVAILABLE: {m.name}")
            found_any = True
    
    if not found_any:
        print("❌ No chat models found. Your API Key might be restricted?")
        
except Exception as e:
    print(f"❌ Connection Error: {e}")
print("-----------------------------------")
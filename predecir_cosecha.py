print("Cargando modelo de predicción de cosecha...")

import joblib
import numpy as np
import pandas as pd 

# === 1️⃣ Cargar modelo ===
modelo = joblib.load("modelo_prediccion_cosecha.pkl")
print("✅ Modelo cargado correctamente.\n")

# === 2️⃣ Ingresar valores de sensores (normalizados de 0 a 1) ===
# Formato: [light, humidity, temperature, days_since_planting]
# Ejemplo: 0.75 de luz, 0.55 de humedad, 0.65 de temperatura, 62 días desde la siembra

nueva_muestra = pd.DataFrame([{
    "light": 0.75,
    "humidity": 0.55,
    "temperature": 0.65,
    "days_since_planting": 62
}])

prediccion = modelo.predict(nueva_muestra)
print(f" Días estimados hasta la cosecha: {prediccion[0]:.2f}")

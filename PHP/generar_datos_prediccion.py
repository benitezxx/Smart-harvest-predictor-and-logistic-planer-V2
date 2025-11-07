print("🌤️ Generando datos de predicción simulados...")

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# === CONFIGURACIÓN ===
np.random.seed(42)
start_date = datetime(2025, 9, 1)
total_days = 60  # 60 días simulados

# === GENERAR DATOS ===
dates = [start_date + timedelta(days=i) for i in range(total_days)]

# Simulaciones realistas:
# La temperatura sube ligeramente conforme avanza el cultivo,
# la humedad tiende a bajar un poco, y la luz varía de forma natural.
temperature = 24 + np.sin(np.linspace(0, 3, total_days)) * 3 + np.random.normal(0, 0.8, total_days)
humidity = 75 - np.linspace(0, 10, total_days) + np.random.normal(0, 2, total_days)
light = 700 + np.sin(np.linspace(0, 6, total_days)) * 200 + np.random.normal(0, 30, total_days)

# Crear DataFrame
df = pd.DataFrame({
    "Id": np.arange(total_days, 0, -1),
    "Fecha y hora": [d.strftime("%d/%m/%Y %H:%M") for d in dates],
    "Valor_luz": np.round(light, 2),
    "Valor_humedad": np.round(humidity, 2),
    "Valor_temp": np.round(temperature, 2)
})

# Asegurar límites razonables
df["Valor_humedad"] = np.clip(df["Valor_humedad"], 35, 90)
df["Valor_temp"] = np.clip(df["Valor_temp"], 18, 35)
df["Valor_luz"] = np.clip(df["Valor_luz"], 300, 1000)

# === GUARDAR ARCHIVO ===
file_name = "datos_de_prediccion.csv"
df.to_csv(file_name, index=False)
print(f"Archivo '{file_name}' generado correctamente con {len(df)} registros.\n")
print(df.head())

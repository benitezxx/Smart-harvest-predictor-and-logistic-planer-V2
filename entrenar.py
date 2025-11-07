print(" Iniciando script de preprocesamiento...")

import os
import pandas as pd
from datetime import datetime

print("Librerías cargadas correctamente.")

# === 1 VERIFICAR EXISTENCIA DEL ARCHIVO ===
archivo_csv = "datos_de_prediccion.csv"

if not os.path.exists(archivo_csv):
    print(f" No se encontró el archivo '{archivo_csv}'. Asegúrate de que esté en la misma carpeta que este script.")
    exit()

print(f"📄 Archivo encontrado: {archivo_csv}")

# === 2️ LEER DATOS DEL CSV ===
try:
    df = pd.read_csv(archivo_csv)
    print(f" Archivo leído correctamente. Total de registros: {len(df)}")
    print("🔍 Vista previa:")
    print(df.head())
except Exception as e:
    print(" Error al leer el CSV:", e)
    exit()

# ===  RENOMBRAR COLUMNAS (ajústalas según tu CSV real) ===
df.rename(columns={
    "Valor_luz": "light",
    "Valor_humedad": "humidity",
    "Valor_temp": "temperature",
    "Fecha y hora": "datetime"
}, inplace=True)

# Verificar que las columnas necesarias existan
columnas_necesarias = ["light", "humidity", "temperature", "datetime"]
for col in columnas_necesarias:
    if col not in df.columns:
        print(f" Advertencia: no se encontró la columna '{col}' en tu CSV.")
        print("Columnas detectadas:", list(df.columns))
        exit()

# === 4FORMATEAR DATOS ===
try:
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce", dayfirst=True)
    df.dropna(subset=["datetime"], inplace=True)
    df["date"] = df["datetime"].dt.date
except Exception as e:
    print("Error al formatear la columna de fecha:", e)
    exit()

# ===  AGRUPAR Y PROMEDIAR POR DÍA ===
df_daily = df.groupby("date").agg({
    "light": "mean",
    "humidity": "mean",
    "temperature": "mean"
}).reset_index()

print(f" Datos agrupados por día. Total de días: {len(df_daily)}")

# === NORMALIZAR VARIABLES ===
for col in ["light", "humidity", "temperature"]:
    col_min = df_daily[col].min()
    col_max = df_daily[col].max()
    if col_max - col_min == 0:
        df_daily[col] = 0
    else:
        df_daily[col] = (df_daily[col] - col_min) / (col_max - col_min)

print(" Normalización completada (valores entre 0 y 1).")

# ===  AGREGAR VARIABLES DERIVADAS ===
planting_date = datetime(2025, 9, 1)
df_daily["days_since_planting"] = (
    pd.to_datetime(df_daily["date"]) - pd.to_datetime(planting_date)
).dt.days

total_days = 90  # Ajusta según tu tipo de cultivo
df_daily["days_until_harvest"] = total_days - df_daily["days_since_planting"]
df_daily = df_daily[df_daily["days_until_harvest"] > 0]

# ===  GUARDAR CSV FINAL ===
salida_csv = "harvest_training_data.csv"

try:
    df_daily.to_csv(salida_csv, index=False)
    print(f" Archivo '{salida_csv}' generado correctamente.")
    print(" Vista previa del archivo resultante:")
    print(df_daily.head())
except Exception as e:
    print("Error al guardar el CSV:", e)
    exit()

print(" Proceso completado con éxito.")

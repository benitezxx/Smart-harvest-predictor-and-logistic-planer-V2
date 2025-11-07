print(" Iniciando entrenamiento del modelo de predicción de cosecha...")

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib  # Para guardar el modelo entrenado

# ===  CARGAR DATOS PREPROCESADOS ===
file_name = "harvest_training_data.csv"

try:
    df = pd.read_csv(file_name)
    print(f" Archivo '{file_name}' cargado correctamente. Registros: {len(df)}")
    print(df.head())
except Exception as e:
    print(" Error al cargar los datos:", e)
    exit()

# ===  SELECCIONAR VARIABLES ===
X = df[["light", "humidity", "temperature", "days_since_planting"]]
y = df["days_until_harvest"]

# ===  DIVIDIR EN TRAIN / TEST ===
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# ===  ENTRENAR MODELO ===
print("Entrenando modelo Random Forest...")
modelo = RandomForestRegressor(n_estimators=100, random_state=42)
modelo.fit(X_train, y_train)

# ===  EVALUAR RENDIMIENTO ===
y_pred = modelo.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f" Error absoluto medio (MAE): {mae:.2f}")
print(f" Coeficiente R²: {r2:.2f}")

# ===  GUARDAR MODELO ENTRENADO ===
modelo_name = "modelo_prediccion_cosecha.pkl"
joblib.dump(modelo, modelo_name)
print(f" Modelo guardado correctamente como '{modelo_name}'")

print(" Entrenamiento completado con éxito.")

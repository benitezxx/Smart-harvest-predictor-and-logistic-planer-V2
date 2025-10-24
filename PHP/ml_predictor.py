#!/usr/bin/env python3
import sys
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os

class YieldPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.model_file = 'yield_model.pkl'
        self.scaler_file = 'scaler.pkl'
        self.encoders_file = 'encoders.pkl'
        
    def generate_training_data(self):
        """Genera datos de entrenamiento sintéticos basados en conocimiento agrícola"""
        np.random.seed(42)
        n_samples = 2000
        
        # Rangos óptimos por cultivo (basado en investigación agrícola)
        crop_data = {
            'tomato': {'base_yield': 45000, 'temp_range': (22, 26), 'humidity_range': (60, 70), 'light_range': (600, 900)},
            'lettuce': {'base_yield': 28000, 'temp_range': (18, 22), 'humidity_range': (70, 80), 'light_range': (400, 600)},
            'strawberry': {'base_yield': 22000, 'temp_range': (20, 24), 'humidity_range': (65, 75), 'light_range': (500, 800)},
            'pepper': {'base_yield': 38000, 'temp_range': (23, 27), 'humidity_range': (55, 65), 'light_range': (700, 1000)}
        }
        
        growth_stages = ['early', 'vegetative', 'flowering', 'fruiting']
        locations = ['lot-a', 'lot-b', 'lot-c', 'greenhouse']
        
        data = []
        
        for _ in range(n_samples):
            crop_type = np.random.choice(list(crop_data.keys()))
            crop_info = crop_data[crop_type]
            
            # Generar datos ambientales alrededor del rango óptimo
            temp = np.random.normal(
                sum(crop_info['temp_range']) / 2, 
                (crop_info['temp_range'][1] - crop_info['temp_range'][0]) / 4
            )
            humidity = np.random.normal(
                sum(crop_info['humidity_range']) / 2,
                (crop_info['humidity_range'][1] - crop_info['humidity_range'][0]) / 4
            )
            light = np.random.normal(
                sum(crop_info['light_range']) / 2,
                (crop_info['light_range'][1] - crop_info['light_range'][0]) / 4
            )
            
            # Asegurar valores dentro de rangos razonables
            temp = max(10, min(35, temp))
            humidity = max(30, min(90, humidity))
            light = max(200, min(1500, light))
            
            days_planting = np.random.randint(1, 120)
            growth_stage = np.random.choice(growth_stages)
            location = np.random.choice(locations)
            
            # Calcular rendimiento base con variaciones
            base_yield = crop_info['base_yield']
            
            # Factores de ajuste
            temp_factor = self._calculate_temperature_factor(temp, crop_info['temp_range'])
            humidity_factor = self._calculate_humidity_factor(humidity, crop_info['humidity_range'])
            light_factor = self._calculate_light_factor(light, crop_info['light_range'])
            growth_factor = self._calculate_growth_factor(growth_stage, days_planting)
            location_factor = self._calculate_location_factor(location)
            
            # Calcular rendimiento final
            final_yield = base_yield * temp_factor * humidity_factor * light_factor * growth_factor * location_factor
            
            # Añadir algo de ruido aleatorio
            final_yield *= np.random.uniform(0.85, 1.15)
            final_yield = int(final_yield)
            
            data.append({
                'crop_type': crop_type,
                'growth_stage': growth_stage,
                'days_planting': days_planting,
                'location': location,
                'temperature': round(temp, 1),
                'humidity': round(humidity, 1),
                'light': int(light),
                'yield': final_yield
            })
        
        return pd.DataFrame(data)
    
    def _calculate_temperature_factor(self, temp, optimal_range):
        """Calcula factor basado en temperatura"""
        optimal_min, optimal_max = optimal_range
        if optimal_min <= temp <= optimal_max:
            return 1.15  # Óptimo
        elif temp < optimal_min - 5 or temp > optimal_max + 5:
            return 0.7   # Crítico
        elif temp < optimal_min - 2 or temp > optimal_max + 2:
            return 0.9   # Subóptimo
        else:
            return 1.0   # Aceptable
    
    def _calculate_humidity_factor(self, humidity, optimal_range):
        """Calcula factor basado en humedad"""
        optimal_min, optimal_max = optimal_range
        if optimal_min <= humidity <= optimal_max:
            return 1.10
        elif humidity < optimal_min - 15 or humidity > optimal_max + 15:
            return 0.8
        else:
            return 0.95
    
    def _calculate_light_factor(self, light, optimal_range):
        """Calcula factor basado en luz"""
        optimal_min, optimal_max = optimal_range
        if optimal_min <= light <= optimal_max:
            return 1.12
        elif light < optimal_min - 200:
            return 0.75
        else:
            return 0.95
    
    def _calculate_growth_factor(self, growth_stage, days_planting):
        """Calcula factor basado en etapa de crecimiento"""
        factors = {
            'early': 0.3,
            'vegetative': 0.7,
            'flowering': 0.9,
            'fruiting': 1.0
        }
        base_factor = factors.get(growth_stage, 1.0)
        
        # Ajuste por días de plantación
        if days_planting < 30:
            return base_factor * 0.4
        elif days_planting < 60:
            return base_factor * 0.7
        elif days_planting < 90:
            return base_factor * 0.9
        else:
            return base_factor
    
    def _calculate_location_factor(self, location):
        """Calcula factor basado en ubicación"""
        factors = {
            'lot-a': 1.0,
            'lot-b': 0.95,
            'lot-c': 0.9,
            'greenhouse': 1.2
        }
        return factors.get(location, 1.0)
    
    def preprocess_data(self, df):
        """Preprocesa los datos para el modelo"""
        # Codificar variables categóricas
        categorical_cols = ['crop_type', 'growth_stage', 'location']
        
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[col] = self.label_encoders[col].fit_transform(df[col])
            else:
                df[col] = self.label_encoders[col].transform(df[col])
        
        # Separar características y objetivo
        X = df[['crop_type', 'growth_stage', 'days_planting', 'location', 'temperature', 'humidity', 'light']]
        y = df['yield']
        
        return X, y
    
    def train_model(self):
        """Entrena el modelo de Random Forest"""
        print("Generando datos de entrenamiento...")
        df = self.generate_training_data()
        
        print("Preprocesando datos...")
        X, y = self.preprocess_data(df)
        
        # Escalar características numéricas
        numerical_cols = ['days_planting', 'temperature', 'humidity', 'light']
        X[numerical_cols] = self.scaler.fit_transform(X[numerical_cols])
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("Entrenando modelo Random Forest...")
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluar modelo
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Modelo entrenado - MAE: {mae:.2f}, R²: {r2:.4f}")
        
        # Guardar modelo y preprocesadores
        self.save_model()
        
        return {
            'mae': float(mae),
            'r2': float(r2),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features': list(X.columns)
        }
    
    def save_model(self):
        """Guarda el modelo entrenado y preprocesadores"""
        with open(self.model_file, 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(self.scaler_file, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        with open(self.encoders_file, 'wb') as f:
            pickle.dump(self.label_encoders, f)
        
        print("Modelo guardado correctamente")
    
    def load_model(self):
        """Carga el modelo entrenado y preprocesadores"""
        try:
            with open(self.model_file, 'rb') as f:
                self.model = pickle.load(f)
            
            with open(self.scaler_file, 'rb') as f:
                self.scaler = pickle.load(f)
            
            with open(self.encoders_file, 'rb') as f:
                self.label_encoders = pickle.load(f)
            
            print("Modelo cargado correctamente")
            return True
        except FileNotFoundError:
            print("Modelo no encontrado, necesita entrenamiento")
            return False
    
    def predict(self, input_data):
        """Realiza predicción con nuevos datos"""
        if not self.model:
            if not self.load_model():
                raise Exception("Modelo no entrenado. Ejecuta train_model() primero.")
        
        # Crear DataFrame con los datos de entrada
        df = pd.DataFrame([input_data])
        
        # Preprocesar datos de entrada
        for col in ['crop_type', 'growth_stage', 'location']:
            if col in self.label_encoders:
                # Para nuevas categorías, usar una categoría por defecto
                try:
                    df[col] = self.label_encoders[col].transform([input_data[col]])[0]
                except ValueError:
                    # Si la categoría es nueva, usar la primera categoría conocida
                    known_categories = list(self.label_encoders[col].classes_)
                    if known_categories:
                        df[col] = self.label_encoders[col].transform([known_categories[0]])[0]
                    else:
                        df[col] = 0
        
        # Escalar características numéricas
        numerical_cols = ['days_planting', 'temperature', 'humidity', 'light']
        df[numerical_cols] = self.scaler.transform(df[numerical_cols])
        
        # Realizar predicción
        prediction = self.model.predict(df)[0]
        
        # Calcular importancia de características (simulada para esta predicción)
        feature_importance = self._calculate_feature_importance(input_data)
        
        return {
            'predicted_yield': int(prediction),
            'confidence': self._calculate_confidence(input_data),
            'feature_importance': feature_importance,
            'model_version': 'scikit-learn-v1.0'
        }
    
    def _calculate_confidence(self, input_data):
        """Calcula la confianza basada en qué tan cerca están los valores del óptimo"""
        confidence = 0.85  # Base
        
        # Ajustar confianza basado en desviación de óptimos
        crop_optimals = {
            'tomato': {'temp': (22, 26), 'humidity': (60, 70), 'light': (600, 900)},
            'lettuce': {'temp': (18, 22), 'humidity': (70, 80), 'light': (400, 600)},
            'strawberry': {'temp': (20, 24), 'humidity': (65, 75), 'light': (500, 800)},
            'pepper': {'temp': (23, 27), 'humidity': (55, 65), 'light': (700, 1000)}
        }
        
        crop = input_data['crop_type']
        if crop in crop_optimals:
            optimals = crop_optimals[crop]
            
            # Verificar temperatura
            temp = input_data['temperature']
            if optimals['temp'][0] <= temp <= optimals['temp'][1]:
                confidence += 0.05
            else:
                confidence -= 0.1
            
            # Verificar humedad
            humidity = input_data['humidity']
            if optimals['humidity'][0] <= humidity <= optimals['humidity'][1]:
                confidence += 0.03
            else:
                confidence -= 0.05
            
            # Verificar luz
            light = input_data['light']
            if optimals['light'][0] <= light <= optimals['light'][1]:
                confidence += 0.04
            else:
                confidence -= 0.06
        
        return max(0.5, min(0.95, confidence)) * 100
    
    def _calculate_feature_importance(self, input_data):
        """Calcula la importancia de cada característica para esta predicción específica"""
        crop_optimals = {
            'tomato': {'temp': (22, 26), 'humidity': (60, 70), 'light': (600, 900)},
            'lettuce': {'temp': (18, 22), 'humidity': (70, 80), 'light': (400, 600)},
            'strawberry': {'temp': (20, 24), 'humidity': (65, 75), 'light': (500, 800)},
            'pepper': {'temp': (23, 27), 'humidity': (55, 65), 'light': (700, 1000)}
        }
        
        crop = input_data['crop_type']
        factors = {}
        
        if crop in crop_optimals:
            optimals = crop_optimals[crop]
            
            # Temperatura
            temp = input_data['temperature']
            temp_dev = min(abs(temp - optimals['temp'][0]), abs(temp - optimals['temp'][1]))
            factors['temperature'] = max(0, 25 - temp_dev * 2)
            
            # Humedad
            humidity = input_data['humidity']
            humidity_dev = min(abs(humidity - optimals['humidity'][0]), abs(humidity - optimals['humidity'][1]))
            factors['humidity'] = max(0, 20 - humidity_dev * 1.5)
            
            # Luz
            light = input_data['light']
            light_dev = min(abs(light - optimals['light'][0]), abs(light - optimals['light'][1]))
            factors['light'] = max(0, 18 - light_dev * 0.05)
        
        # Factores fijos
        factors['growth_stage'] = 12
        factors['days_planting'] = 10
        factors['location'] = 8
        factors['crop_type'] = 7
        
        # Normalizar a porcentajes
        total = sum(factors.values())
        return {k: round((v / total) * 100, 1) for k, v in factors.items()}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Uso: python ml_predictor.py [train|predict|health]'}))
        sys.exit(1)
    
    predictor = YieldPredictor()
    command = sys.argv[1]
    
    if command == 'train':
        print("🔬 Entrenando modelo de predicción de rendimiento...")
        try:
            results = predictor.train_model()
            print(json.dumps(results))
        except Exception as e:
            print(json.dumps({'error': f'Training failed: {str(e)}'}))
        
    elif command == 'predict':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Se requieren datos de entrada para predicción'}))
            sys.exit(1)
        
        try:
            input_data = json.loads(sys.argv[2])
            prediction = predictor.predict(input_data)
            print(json.dumps(prediction))
        except Exception as e:
            print(json.dumps({'error': str(e)}))
    
    elif command == 'health':
        # Verificar si el modelo está listo
        if predictor.load_model():
            print(json.dumps({'status': 'ready', 'message': 'Modelo cargado correctamente'}))
        else:
            print(json.dumps({'status': 'not_trained', 'message': 'Modelo no entrenado'}))

if __name__ == '__main__':
    main()
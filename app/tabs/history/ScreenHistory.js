import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

// Helper para obtener el token
const getToken = async () => {
  const token = await AsyncStorage.getItem("user_token");
  console.log("Token from storage:", token);
  return token;
};

// Hook para la API
const useProgressApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error("No estás autenticado. Por favor, inicia sesión.");
      }

      // Reemplaza 'localhost' con la IP de tu máquina si pruebas en un dispositivo físico
      const response = await fetch("http://localhost:3000/api/progress", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("API Response Status:", response.status);
      const result = await response.json();
      console.log("API Response Body:", JSON.stringify(result, null, 2));


      if (!response.ok || !result.success) {
        throw new Error(result.message || "Error al obtener el historial");
      }
      
      setData(result.data);
    } catch (e) {
      console.error("Fetch error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
};

// Componente de Gráfica
const ProgressChart = ({ title, records }) => {
    if (records.length === 0) {
      return null;
    }
  
    // Ordenar por fecha y tomar los últimos 10 para que no se sature
    const sortedRecords = records.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(-10);
  
    const chartData = {
      labels: sortedRecords.map(r => new Date(r.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          data: sortedRecords.map(r => r.valor),
        },
      ],
    };
  
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 32} // from react-native
          height={220}
          yAxisSuffix=" kg"
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "#1c2024",
            backgroundGradientFrom: "#1c2024",
            backgroundGradientTo: "#1c2024",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(136, 173, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(238, 238, 240, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#88adff",
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    );
  };
  

export default function ScreenHistory() {
  const { data, loading, error, refresh } = useProgressApi();

  // Agrupar datos por ejercicio y tipo de medida
  const groupedData = data
    ? data.reduce((acc, item) => {
        const key = `${item.ejercicio_nombre} (${item.tipo_medida})`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {})
    : {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>H I S T O R I A L</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.sectionLabel}>MI PROGRESO</Text>
          <TouchableOpacity onPress={refresh}>
            <Ionicons name="refresh" size={22} color="#88adff" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#88adff" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.centered}>
            <MaterialIcons name="error-outline" size={48} color="#747578" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && data && Object.keys(groupedData).length > 0 && (
          Object.entries(groupedData).map(([title, records]) => (
            <ProgressChart key={title} title={title} records={records} />
          ))
        )}

        {!loading && !error && (!data || data.length === 0) && (
            <View style={styles.centered}>
                <Ionicons name="analytics-outline" size={48} color="#747578" />
                <Text style={styles.errorText}>Aún no has registrado ningún progreso.</Text>
                <Text style={styles.errorText}>¡Completa una rutina para empezar!</Text>
            </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0c0e10" },
    header: { marginTop: 40, padding: 16, backgroundColor: "#111416", alignItems: "center" },
    headerTitle: { fontFamily: "Lexend_800ExtraBold", fontSize: 18, color: "#eeeef0" },
    content: { flex: 1, padding: 16 },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    sectionLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: "#88adff", letterSpacing: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100, gap: 12 },
    loadingText: { fontFamily: "Manrope_400Regular", color: "#aaabad", fontSize: 14 },
    errorText: { fontFamily: "Manrope_400Regular", color: "#aaabad", fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
    retryBtn: { backgroundColor: "#88adff", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
    retryText: { fontFamily: "Manrope_700Bold", color: "#002052", fontSize: 14 },
    chartContainer: {
        marginBottom: 24,
        backgroundColor: '#171a1c',
        borderRadius: 16,
        padding: 12,
    },
    chartTitle: {
        fontFamily: "Lexend_700Bold",
        fontSize: 16,
        color: "#eeeef0",
        marginBottom: 8,
    }
});
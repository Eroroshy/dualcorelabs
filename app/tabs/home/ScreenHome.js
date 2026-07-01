import { Ionicons } from '@expo/vector-icons';
import AwesomeIcon from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import traducciones from "../../../assets/data/traducciones.json";
import { AuthContext } from "../../context/AuthContext";
import i18n from "../../i18n";
import { supabase } from "../../subapaseClient";

// --- NORMALIZACIÓN DEL DICCIONARIO ---
const diccNormalizado = Object.keys(traducciones).reduce((acc, key) => {
  acc[key.toLowerCase().trim()] = traducciones[key];
  return acc;
}, {});
// -------------------------------------

export default function ScreenHome() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  
  const [localProfile, setLocalProfile] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({ kcal: 0, minutes: 0, streak: 0 });

  const lang = i18n.language === 'es' ? 'es' : 'en';

  const dayTranslations = {
    es: { SUN: "DOM", MON: "LUN", TUE: "MAR", WED: "MIE", THU: "JUE", FRI: "VIE", SAT: "SAB" },
    en: { SUN: "SUN", MON: "MON", TUE: "TUE", WED: "WED", THU: "THU", FRI: "FRI", SAT: "SAT" }
  };

  const obtenerNivelTraducido = (nivelBD) => {
    if (!nivelBD) return lang === 'es' ? "PRINCIPIANTE" : "BEGINNER";
    const nivelLower = nivelBD.toLowerCase();
    if (nivelLower.includes("principiante")) return lang === 'es' ? "PRINCIPIANTE" : "BEGINNER";
    if (nivelLower.includes("intermedio")) return lang === 'es' ? "INTERMEDIO" : "INTERMEDIATE";
    if (nivelLower.includes("avanzado")) return lang === 'es' ? "AVANZADO" : "ADVANCED";
    return nivelBD.toUpperCase();
  };

  const traducirObjetivo = (obj) => {
    if (!obj) return lang === 'es' ? "No definido" : "Not defined";
    const o = obj.toLowerCase();
    if (lang === 'en') {
      if (o.includes("grasa") || o.includes("peso")) return "Lose Fat";
      if (o.includes("musculo") || o.includes("músculo") || o.includes("volumen")) return "Build Muscle";
      if (o.includes("fuerza")) return "Gain Strength";
      if (o.includes("resistencia")) return "Endurance";
      return "General Fitness";
    }
    return obj; 
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAllData = async () => {
        try {
          setLoading(true);
          
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (!supabaseUser) throw new Error("Usuario no autenticado");

          const { data: profileData, error: profileError } = await supabase
            .from("perfiles")
            .select("*")
            .eq("usuario_id", supabaseUser.id)
            .single();

          if (!profileError && profileData) {
            setLocalProfile(profileData);
          }

          const { data: progressData, error: progressError } = await supabase
            .from("registro_progreso")
            .select("*")
            .eq("usuario_id", supabaseUser.id)
            .order("fecha", { ascending: false });

          if (progressError) throw progressError;

          const agrupadoPorDia = (progressData || []).reduce((acc, curr) => {
            const date = curr.fecha || new Date().toISOString().split('T')[0];
            if (!acc[date]) acc[date] = { dateStr: date, volumen: 0, seriesTotales: 0, ejercicios: new Set() };
            acc[date].volumen += (curr.peso_kg * curr.repeticiones * curr.series) || 0;
            acc[date].seriesTotales += (curr.series || 0);
            
            const nombreNormalizado = curr.nombre_ejercicio ? curr.nombre_ejercicio.toLowerCase().trim() : "";
            const nombreTraducido = (lang === 'es' && nombreNormalizado) 
                ? (diccNormalizado[nombreNormalizado] || curr.nombre_ejercicio).toUpperCase()
                : (curr.nombre_ejercicio || "Exercise").toUpperCase();

            acc[date].ejercicios.add(nombreTraducido);
            
            return acc;
          }, {});

          const hoy = new Date();
          const ultimos7Dias = [];
          const nombresDias = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          let totalSeriesSemana = 0;

          for (let i = 6; i >= 0; i--) {
            const d = new Date(hoy);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const infoDia = agrupadoPorDia[dateStr];
            if (infoDia) totalSeriesSemana += infoDia.seriesTotales;
            ultimos7Dias.push({
              dayKey: nombresDias[d.getDay()],
              value: infoDia ? infoDia.volumen : 0,
              completed: !!infoDia
            });
          }

          const maxVolumen = Math.max(...ultimos7Dias.map(d => d.value), 1);
          setChartData(ultimos7Dias.map(d => ({ ...d, heightPercentage: (d.value / maxVolumen) * 100 })));

          setWeeklyStats({
            kcal: Math.round(totalSeriesSemana * 15),
            minutes: Math.round(totalSeriesSemana * 2.5),
            streak: Object.keys(agrupadoPorDia).length 
          });

          const diasOrdenados = Object.keys(agrupadoPorDia).sort((a, b) => new Date(b) - new Date(a));
          const historialReciente = diasOrdenados.slice(0, 3).map(dateStr => {
            const obj = agrupadoPorDia[dateStr];
            const arrEjercicios = Array.from(obj.ejercicios);
            
            const yMas = lang === 'es' ? 'y más' : 'and more';
            const actividadStr = arrEjercicios.length > 2 ? `${arrEjercicios[0]}, ${arrEjercicios[1]} ${yMas}` : arrEjercicios.join(" & ");
            
            return {
              day: dateStr,
              activity: actividadStr || (lang === 'es' ? "Entrenamiento" : "Workout"),
              value: Math.round(obj.volumen),
              completed: true
            };
          });

          setHistoryData(historialReciente);

        } catch (error) {
          console.error("Error cargando Home:", error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchAllData();
    }, [lang])
  );

  const userName = localProfile?.nombre || user?.nombre || user?.email?.split("@")[0] || "Atleta";
  const avatarUrl = localProfile?.foto_url || localProfile?.avatar_url || user?.profile?.avatar_url || null;
  const rawLevel = localProfile?.nivel_experiencia || localProfile?.nivel || user?.profile?.nivel || "Principiante";
  const objetivoUsuario = localProfile?.objetivo || "No definido";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#88adff" />
        <Text style={styles.loadingText}>{lang === 'es' ? "Sincronizando perfil Kinetic..." : "Syncing Kinetic profile..."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      <View style={styles.welcomeCard}>
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#747578" />
            </View>
          )}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{obtenerNivelTraducido(rawLevel)}</Text>
          </View>
        </View>
        <Text style={styles.welcomeTitle}>
          {lang === 'es' ? '¡' : ''}{lang === 'es' ? 'Bienvenido' : 'Welcome'}, {userName}{lang === 'es' ? '!' : ''}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {lang === 'es' ? 'Estado: Activo' : 'Status: Active'} | {lang === 'es' ? 'Objetivo' : 'Objective'}: {traducirObjetivo(objetivoUsuario)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{lang === 'es' ? "Resumen Dinámico" : "Dynamic Summary"}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.statItem}>
            <AwesomeIcon name="fire" size={28} color="#ff716c" />
            <Text style={styles.statLabel}>{t("kcal_burned", lang === 'es' ? "Kcal quemadas" : "Calories Burned")}</Text>
            <Text style={styles.statValue}>{weeklyStats.kcal} Kcal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <AwesomeIcon name="clock-outline" size={28} color="#88adff" />
            <Text style={styles.statLabel}>{t("total_time", lang === 'es' ? "Tiempo Total" : "Total Time")}</Text>
            <Text style={styles.statValue}>{weeklyStats.minutes} min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <AwesomeIcon name="trophy-outline" size={28} color="#88ff88" />
            <Text style={styles.statLabel}>{lang === 'es' ? "Días Activos" : "Active Days"}</Text>
            <Text style={styles.statValue}>
              {weeklyStats.streak} {weeklyStats.streak === 1 ? (lang === 'es' ? "día" : "day") : (lang === 'es' ? "días" : "days")}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{lang === 'es' ? "Gráfica de Tendencia de Volumen" : "Volume Trend Chart"}</Text>
      <View style={styles.card}>
        <Text style={styles.chartTitle}>{lang === 'es' ? "Carga total de peso movido por día" : "Total weight load moved per day"}</Text>
        <View style={styles.chartContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barBackground}>
                <View 
                  style={[styles.barFill, { height: `${item.heightPercentage || 0}%` }, item.completed ? styles.barActive : styles.barInactive]} 
                />
              </View>
              <Text style={[styles.chartDayText, item.completed && {color: "#fff"}]}>
                {dayTranslations[lang][item.dayKey]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* AQUÍ TAMBIÉN CORREGÍ LA RUTA PARA QUE VAYA A "PROGRESS" */}
      <TouchableOpacity style={styles.progressWidget} onPress={() => navigation.navigate("PROGRESS")} >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AwesomeIcon name="trending-up" size={22} color="#88adff" />
          <Text style={styles.progressWidgetText}>{lang === 'es' ? "Ver análisis detallado de progreso" : "View detailed progress analysis"}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#747578" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{lang === 'es' ? "Historial de Sesiones Recientes" : "Recent Workouts History"}</Text>
      <View style={styles.historyList}>
        {historyData.length === 0 ? (
          <Text style={styles.emptyText}>{lang === 'es' ? "No has registrado entrenamientos aún." : "No workouts logged yet."}</Text>
        ) : (
          historyData.map((session, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.historyItem} 
              // 👇 AQUÍ ESTÁ LA CORRECCIÓN CLAVE: SE LLAMA "PROGRESS" EN TU NAVEGADOR
              onPress={() => navigation.navigate("PROGRESS", { date: session.day })}
            >
              <View style={styles.historyIconBox}>
                <AwesomeIcon name="calendar-check" size={20} color="#88adff" />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyActivity} numberOfLines={1} ellipsizeMode="tail">
                  {session.activity}
                </Text>
                <Text style={styles.historyDayDetail}>{session.day}</Text>
              </View>
              <View style={styles.performanceBadge}>
                <Text style={styles.performanceText}>{session.value} kg</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#747578" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>{t("quick_access", lang === 'es' ? "Accesos Rápidos Kinetic" : "Kinetic Quick Access")}</Text>
      <View style={styles.quickAccessRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("LIBRARY")}>
          <AwesomeIcon name="weight-lifter" size={24} color="#0c0e10" />
          <Text style={styles.quickBtnText}>{t("btn_start", lang === 'es' ? "EMPEZAR" : "START").toUpperCase()}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("GYMS")}>
          <AwesomeIcon name="map-marker" size={24} color="#0c0e10" />
          <Text style={styles.quickBtnText}>{t("tab_gyms", lang === 'es' ? "GIMNASIOS" : "GYMS").toUpperCase()}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("ScreenCalculator")}> 
          <AwesomeIcon name="calculator" size={24} color="#0c0e10" />
          <Text style={styles.quickBtnText}>{t("btn_calc_pr", lang === 'es' ? "CALCULAR PR" : "CALC PR").toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10", paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 130, paddingTop: 10 }, 
  loadingContainer: { flex: 1, backgroundColor: "#0c0e10", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#aaabad", marginTop: 12, fontFamily: "Manrope_500Medium" },
  welcomeCard: { backgroundColor: "#171a1c", borderRadius: 20, padding: 22, alignItems: "center", marginTop: 25, marginBottom: 20, borderWidth: 1, borderColor: "#24282c" },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: "#88adff" },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#0c0e10", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#24282c" },
  badgeContainer: { position: "absolute", bottom: -6, alignSelf: "center", backgroundColor: "#88adff", paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: "#171a1c" },
  badgeText: { color: "#0c0e10", fontSize: 9, fontFamily: "Manrope_700Bold", letterSpacing: 0.5 },
  welcomeTitle: { color: "#eeeef0", fontSize: 20, fontFamily: "Lexend_700Bold", textAlign: "center" },
  welcomeSubtitle: { color: "#747578", fontSize: 12, fontFamily: "Manrope_500Medium", marginTop: 6 },
  sectionTitle: { color: "#ffffff", fontSize: 15, fontFamily: "Lexend_600SemiBold", marginBottom: 12, marginTop: 10, letterSpacing: 0.3 },
  card: { backgroundColor: "#171a1c", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#24282c", marginBottom: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statItem: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: "#24282c" },
  statLabel: { color: "#747578", fontSize: 11, fontFamily: "Manrope_500Medium", marginTop: 8, marginBottom: 4, textAlign: "center" },
  statValue: { color: "#eeeef0", fontSize: 13, fontFamily: "Lexend_700Bold" },
  chartTitle: { color: "#aaabad", fontSize: 12, fontFamily: "Manrope_500Medium", marginBottom: 15 },
  chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 110, paddingHorizontal: 5 },
  chartColumn: { alignItems: "center", flex: 1 },
  barBackground: { width: 12, height: 85, backgroundColor: "#24282c", borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 6 },
  barActive: { backgroundColor: "#88adff" },
  barInactive: { backgroundColor: "#46484a" },
  chartDayText: { color: "#747578", fontSize: 11, marginTop: 8, fontFamily: "Manrope_500Medium" },
  progressWidget: { backgroundColor: "#171a1c", borderRadius: 12, borderWidth: 1, borderColor: "#24282c", paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  progressWidgetText: { color: "#eeeef0", fontFamily: "Manrope_600SemiBold", fontSize: 13, marginLeft: 12 },
  historyList: { marginBottom: 15 },
  historyItem: { backgroundColor: "#171a1c", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: "#24282c" },
  historyIconBox: { backgroundColor: "#0c0e10", padding: 8, borderRadius: 8, marginRight: 12 },
  historyInfo: { flex: 1, marginRight: 10 },
  historyActivity: { color: "#fff", fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  historyDayDetail: { color: "#747578", fontSize: 12, fontFamily: "Manrope_400Regular" },
  performanceBadge: { backgroundColor: "#1a2f2b", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  performanceText: { color: "#88ff88", fontSize: 11, fontFamily: "Lexend_700Bold" },
  emptyText: { color: "#747578", fontSize: 13, fontFamily: "Manrope_500Medium", textAlign: "center", marginVertical: 15 },
  quickAccessRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: "#eeeef0", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  quickBtnText: { color: "#0c0e10", fontSize: 10, fontFamily: "Lexend_700Bold", marginTop: 6 }
});
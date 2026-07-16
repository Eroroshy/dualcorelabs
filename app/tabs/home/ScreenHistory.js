import { Ionicons } from '@expo/vector-icons';
import AwesomeIcon from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import traducciones from "../../../assets/data/traducciones.json"; // <-- DICCIONARIO LOCAL
import i18n from "../../i18n";
import { supabase } from "../../subapaseClient";


import { kineticService } from "../../../supabase/kineticService";

 
// --- NORMALIZACIÓN DEL DICCIONARIO (FUERA DEL COMPONENTE) ---
const diccNormalizado = Object.keys(traducciones).reduce((acc, key) => {
  acc[key.toLowerCase().trim()] = traducciones[key];
  return acc;
}, {});
 
export default function ScreenHistory() {
  const { t } = useTranslation(); 
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  
  // --- NUEVO ESTADO PARA PAGINACIÓN DEL HISTORIAL ---
  const [limiteDiasVisibles, setLimiteDiasVisibles] = useState(7); 
  
  const [dbCompletaAPI, setDbCompletaAPI] = useState([]);
  const [exercisesAPI, setExercisesAPI] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [cargandoAPI, setCargandoAPI] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
 
  // --- ESTADO DEL FORMULARIO CONSOLIDADO ---
  const [form, setForm] = useState({ series: "", repeticiones: "", peso: "" });
  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  
  const diasIngles = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const [diaSeleccionado, setDiaSeleccionado] = useState(diasIngles[new Date().getDay()]);
  const [focusedField, setFocusedField] = useState(null);

  const [historySessions, setHistorySessions] = useState([]);
  
  // NUEVO ESTADO: Para guardar el conteo real que viene de la función de Supabase
  const [totalSesionesDB, setTotalSesionesDB] = useState(0);

  const lang = i18n.language === 'es' ? 'es' : 'en';

  const categoriasMusculares = lang === 'es' 
    ? ["PECHO", "ESPALDA", "PIERNAS", "HOMBROS", "BRAZOS", "CARDIO"]
    : ["CHEST", "BACK", "LEGS", "SHOULDERS", "ARMS", "CARDIO"];
    
  const diasFijosOrdenados = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  
  const dayTranslations = {
    es: { MON: "LUN", TUE: "MAR", WED: "MIE", THU: "JUE", FRI: "VIE", SAT: "SAB", SUN: "DOM" },
    en: { MON: "MON", TUE: "TUE", WED: "WED", THU: "THU", FRI: "FRI", SAT: "SAT", SUN: "SUN" }
  };

  // --- NUEVA FUNCIÓN: RECOMENDACIÓN DIARIA BASADA EN CIENCIA (PPL) ---
  const obtenerSugerenciaDelDia = () => {
    const diaActual = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const rutinas = {
      1: { tipo: "EMPUJE (PUSH)", musculos: "Pecho, Hombros y Tríceps", icon: "arrow-up-bold-circle-outline", color: "#88adff" }, // Lunes
      2: { tipo: "TIRÓN (PULL)", musculos: "Espalda y Bíceps", icon: "arrow-down-bold-circle-outline", color: "#88ff88" }, // Martes
      3: { tipo: "PIERNAS (LEGS)", musculos: "Cuádriceps, Femorales y Glúteos", icon: "run", color: "#ffb86c" }, // Miércoles
      4: { tipo: "EMPUJE (PUSH)", musculos: "Pecho, Hombros y Tríceps", icon: "arrow-up-bold-circle-outline", color: "#88adff" }, // Jueves
      5: { tipo: "TIRÓN (PULL)", musculos: "Espalda y Bíceps", icon: "arrow-down-bold-circle-outline", color: "#88ff88" }, // Viernes
      6: { tipo: "PIERNAS / CORE", musculos: "Piernas completas y Abdomen", icon: "run", color: "#ffb86c" }, // Sábado
      0: { tipo: "DESCANSO ACTIVO", musculos: "Cardio ligero, Yoga o Movilidad", icon: "yoga", color: "#ff716c" } // Domingo
    };
    return rutinas[diaActual];
  };
  const sugerenciaHoy = obtenerSugerenciaDelDia();

  const traducirMusculo = (musculo) => {
    if (lang !== 'es') return musculo.toUpperCase();
    const map = {
        "abdominals": "Abdominales", "hamstrings": "Isquiotibiales", "quadriceps": "Cuádriceps",
        "chest": "Pecho", "back": "Espalda", "shoulders": "Hombros", "biceps": "Bíceps",
        "triceps": "Tríceps", "calves": "Pantorrillas", "glutes": "Glúteos", "traps": "Trapecios",
        "lats": "Dorsales", "forearms": "Antebrazos", "lower back": "Espalda Baja",
        "middle back": "Espalda Media", "neck": "Cuello", "abductors": "Abductores", "adductors": "Aductores",
        "cardio": "Cardio", "plyometrics": "Pliometría"
    };
    return map[musculo.toLowerCase()] || musculo.toUpperCase();
  };

  const traducirNombreEjercicio = (nombre) => {
    if (!nombre) return "";
    if (lang !== 'es') return nombre.toUpperCase();
    const nombreLimpio = nombre.toLowerCase().trim();
    const traducido = diccNormalizado[nombreLimpio] || nombre;
    return traducido.toUpperCase();
  };

  const getDayOfWeekAndMuscles = (dateStr, items) => {
    const dateObj = new Date(`${dateStr}T12:00:00`);
    const daysMapEs = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const daysMapEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = lang === 'es' ? daysMapEs[dateObj.getDay()] : daysMapEn[dateObj.getDay()];

    const musclesFound = new Set();
    items.forEach(item => {
        const n = (item.nombre_ejercicio || "").toLowerCase();
        if (n.match(/pecho|press|chest|apertura|flexión/)) musclesFound.add(lang === 'es' ? "Pecho" : "Chest");
        if (n.match(/espalda|remo|row|dominada|pull/)) musclesFound.add(lang === 'es' ? "Espalda" : "Back");
        if (n.match(/pierna|sentadilla|squat|lunge|zancada|muerto|deadlift|pantorrilla/)) musclesFound.add(lang === 'es' ? "Piernas" : "Legs");
        if (n.match(/hombro|elevación|raise|shoulder|deltoid/)) musclesFound.add(lang === 'es' ? "Hombros" : "Shoulders");
        if (n.match(/bicep|curl|tricep|brazo|arm|extensión/)) musclesFound.add(lang === 'es' ? "Brazos" : "Arms");
        if (n.match(/abdom|crunch|sit-up|core|rueda|roller|dog/)) musclesFound.add(lang === 'es' ? "Core" : "Core");
    });

    const musclesStr = musclesFound.size > 0 ? Array.from(musclesFound).join(", ") : (lang === 'es' ? "Variado" : "Mixed");
    return { dayName, musclesStr };
  };

  const obtenerFechaDeDiaSeleccionado = (diaKey) => {
    const hoy = new Date();
    const diaActualIndex = hoy.getDay();
    const mapeoDias = { "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6 };
    let diferencia = mapeoDias[diaKey] - diaActualIndex;
    const fechaResultado = new Date(hoy);
    fechaResultado.setDate(hoy.getDate() + diferencia);
    return fechaResultado.toISOString().split('T')[0];
  };

  useFocusEffect(
    useCallback(() => {
      fetchSupabaseHistory();
    }, [])
  );

  // --- MEMOIZACIÓN DE EJERCICIOS FILTRADOS ---
  const filteredExercises = React.useMemo(() => {
    if (dbCompletaAPI.length === 0) return [];

    return dbCompletaAPI.filter(item => {
        const nombreLimpio = (item.name || "").toLowerCase();
        const nombreTraducido = traducirNombreEjercicio(item.name).toLowerCase();
        const queryLimpia = searchQuery.toLowerCase();
        
        const coincideBusqueda = nombreLimpio.includes(queryLimpia) || nombreTraducido.includes(queryLimpia);

        if (selectedCategories.length === 0) return coincideBusqueda;

        const coincideCategoria = selectedCategories.some(cat => {
            const c = cat.toUpperCase();
            const musculos = (item.primaryMuscles || []).map(m => m.toLowerCase());
            const categoriaApp = (item.category || "").toLowerCase();

            if (c === "PECHO" || c === "CHEST") return musculos.includes("chest");
            if (c === "ESPALDA" || c === "BACK") return musculos.some(m => m.includes("back") || m === "lats" || m === "traps");
            if (c === "PIERNAS" || c === "LEGS") return musculos.some(m => ["quadriceps", "hamstrings", "glutes", "calves"].includes(m));
            if (c === "HOMBROS" || c === "SHOULDERS") return musculos.includes("shoulders");
            if (c === "BRAZOS" || c === "ARMS") return musculos.some(m => ["biceps", "triceps", "forearms"].includes(m));
            if (c === "CARDIO") return categoriaApp === "cardio" || categoriaApp === "plyometrics";
            return false;
        });
        return coincideBusqueda && coincideCategoria;
    }).slice(0, 80);

  }, [selectedCategories, searchQuery, dbCompletaAPI, lang]);

  const fetchSupabaseHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. Traemos el historial tradicional
        const { data, error } = await supabase
          .from("registro_progreso")
          .select("*")
          .eq("usuario_id", user.id)
          .order("fecha", { ascending: false });
        if (error) throw error;
        setHistorySessions(data || []);

        // 🛠️ INTEGRACIÓN: Usamos tu función optimizada de Postgres mediante el KineticService
        const totalDesdeBD = await kineticService.getTotalSesiones(user.id);
        setTotalSesionesDB(totalDesdeBD || 0);
      }
    } catch (error) {
      console.error("Error cargando historial:", error.message);
    } finally { 
      setLoading(false);
    }
  };

  const openExerciseSelector = async () => {
    setIsLogging(true);
    setSearchQuery("");
    setSelectedCategories([]); 
    setDiaSeleccionado(diasIngles[new Date().getDay()]);
    setSelectedExercise(null);

    if (dbCompletaAPI.length > 0) return;

    try {
      setCargandoAPI(true);
      const response = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json");
      if (!response.ok) return;
      const result = await response.json();
      setDbCompletaAPI(result);
    } catch (error) {
      console.error("Falló la descarga del JSON:", error);
    } finally {
      setCargandoAPI(false);
    }
  };

  const handleToggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSaveLoggedSession = async () => {
    if (!selectedExercise || !form.series || !form.repeticiones || !form.peso) {
      Alert.alert(t("incomplete_fields"), t("incomplete_fields_msg"));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numSeries = parseInt(form.series);
      const numReps = parseInt(form.repeticiones);
      const numPeso = parseFloat(form.peso);
      const calculo1RM = numPeso * (1 + numReps / 30);
      const fechaCalculada = obtenerFechaDeDiaSeleccionado(diaSeleccionado);

      const nuevaEntrada = {
        usuario_id: user.id,
        ejercicio_api_id: selectedExercise.id?.toString() || null,
        nombre_ejercicio: selectedExercise.nombreOriginal, 
        peso_kg: numPeso,
        repeticiones: numReps,
        series: numSeries,
        pr_calculado_1rm: parseFloat(calculo1RM.toFixed(2)),
        fecha: fechaCalculada 
      };


      // Al hacer este .insert(), Supabase detecta inmediatamente el cambio en la tabla
      // y ejecuta de forma 100% AUTOMÁTICA el TRIGGER de auditoría/bitácora en el servidor.
      const { error } = await supabase.from("registro_progreso").insert([nuevaEntrada]);
      if (error) throw error; 

      setIsLogging(false);
      setSelectedExercise(null);
      setForm({ series: "", repeticiones: "", peso: "" }); 
      fetchSupabaseHistory();
      Alert.alert(t("success_logged"), t("workout_saved_msg"));

    } catch (error) {
      Alert.alert(t("error_logged"), `${t("workout_save_error")}\n\n${error.message}`);
    }
  };

  const groupedHistory = historySessions.reduce((acc, curr) => {
    const date = curr.fecha || "0000-00-00";
    if (!acc[date]) {
      acc[date] = { dateStr: date, volumenDia: 0, items: [] };
    }
    acc[date].items.push(curr);
    acc[date].volumenDia += parseFloat(curr.volumen_total || 0);
    return acc;
  }, {});

  const diasAgrupados = Object.values(groupedHistory).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));

  const datosGrafica = diasAgrupados.slice(0, 7).reverse();
  const maxVolumen = datosGrafica.reduce((max, d) => Math.max(max, d.volumenDia), 1);
  const sumaVolumen = datosGrafica.reduce((acc, d) => acc + d.volumenDia, 0);
  const promedioVolumen = datosGrafica.length > 0 ? (sumaVolumen / datosGrafica.length) : 0;

  //INTEGRACIÓN: En lugar de calcular el total basándonos solo en lo descargado por el array local,
  // mostramos el valor real y exacto calculado por tu función en Supabase (fn_total_sesiones_usuario).
  const totalSesiones = totalSesionesDB || diasAgrupados.length;
  const volumenAcumulado = historySessions.reduce((acc, item) => acc + (parseFloat(item.volumen_total) || 0), 0);

  // --- LÓGICA DE PAGINACIÓN ---
  const diasVisiblesUI = diasAgrupados.slice(0, limiteDiasVisibles);
  const hayMasDias = limiteDiasVisibles < diasAgrupados.length;

  const cargarMasDias = () => {
    setLimiteDiasVisibles(prev => prev + 7); 
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#88adff" />
        <Text style={styles.loadingText}>{t("loading_analytics")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerX}>
      <View style={styles.headeXr}>
        <Text style={styles.headerTitleX}>K I N E T I C</Text>
      </View>
         
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("history_title")}</Text>
          <Text style={styles.headerSubtitle}>{t("history_subtitle")}</Text>
        </View>

        {!isLogging && (
          <>
            <TouchableOpacity style={styles.primaryLogBtn} onPress={openExerciseSelector}>
              <AwesomeIcon name="plus" size={20} color="#0c0e10" />
              <Text style={styles.primaryLogBtnText}>{t("register_workout_btn")}</Text>
            </TouchableOpacity>

            {/* --- TARJETA DE SUGERENCIA DEL DÍA --- */}
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionHeaderLine}>
                <View style={styles.suggestionTitleBox}>
                  <Ionicons name="sparkles" size={14} color={sugerenciaHoy.color} />
                  <Text style={styles.suggestionTitle}>
                    {lang === 'es' ? "SUGERENCIA PARA HOY" : "SUGGESTION FOR TODAY"}
                  </Text>
                </View>
              </View>
              <View style={styles.suggestionBody}>
                <View style={[styles.suggestionIconBox, { backgroundColor: sugerenciaHoy.color + '20' }]}>
                  <AwesomeIcon name={sugerenciaHoy.icon} size={28} color={sugerenciaHoy.color} />
                </View>
                <View style={styles.suggestionTexts}>
                  <Text style={[styles.suggestionMainText, { color: sugerenciaHoy.color }]}>{sugerenciaHoy.tipo}</Text>
                  <Text style={styles.suggestionSubText}>{sugerenciaHoy.musculos}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {isLogging && (
          <View style={styles.cardPlanning}>
            <Text style={styles.planningTitle}>{t("register_workout_btn")}</Text>
            
            <Text style={styles.stepLabel}>{lang === 'es' ? "1. SELECCIONA EL DÍA" : "1. SELECT DAY"}</Text>
            <View style={styles.daysContainer}>
              {diasFijosOrdenados.map((dayKey) => {
                const esSeleccionado = diaSeleccionado === dayKey;
                return (
                  <TouchableOpacity
                    key={dayKey}
                    style={[styles.dayCardFijo, esSeleccionado && styles.dayCardActive]}
                    onPress={() => setDiaSeleccionado(dayKey)}
                  >
                    <Text style={[styles.dayTextCorto, esSeleccionado && styles.textBlack]}>
                      {dayTranslations[lang][dayKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!selectedExercise ? (
              <View>
                <Text style={styles.stepLabel}>
                  {lang === 'es' ? "2. GRUPOS MUSCULARES" : "2. MUSCLE GROUPS"}
                </Text>
                
                <View style={styles.pillsContainer}>
                  {categoriasMusculares.map((cat) => {
                    const estaActivo = selectedCategories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.pillFilterBtn, estaActivo && styles.pillFilterBtnActive]}
                        onPress={() => handleToggleCategory(cat)}
                      >
                        <Text style={[styles.pillFilterText, estaActivo && styles.textBlack]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.stepLabel}>{lang === 'es' ? "3. ESCOGE EL EJERCICIO" : "3. CHOOSE EXERCISE"}</Text>
                <View style={styles.innerSearchBox}>
                  <Ionicons name="search" size={16} color="#747578" />
                  <TextInput
                    style={styles.innerSearchBarInput}
                    placeholder={lang === 'es' ? "Buscar por nombre..." : "Search by name..."}
                    placeholderTextColor="#46484a"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <ScrollView nestedScrollEnabled style={styles.apiSelectorScroll}>
                  {cargandoAPI ? (
                    <View style={{ alignItems: 'center', marginVertical: 20 }}>
                      <ActivityIndicator size="small" color="#88adff" />
                      <Text style={{ color: '#88adff', fontSize: 10, marginTop: 8 }}>{lang === 'es' ? 'Cargando catálogo...' : 'Loading catalog...'}</Text>
                    </View>
                  ) : filteredExercises.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {selectedCategories.length === 0 
                        ? (lang === 'es' ? "Selecciona un grupo muscular arriba" : "Select a muscle group above")
                        : (lang === 'es' ? "No se encontraron ejercicios" : "No exercises found")}
                    </Text>
                  ) : (
                    filteredExercises.map((item) => {
                      const exerciseData = {
                        id: item.id,
                        nombre: traducirNombreEjercicio(item.name),
                        nombreOriginal: item.name,
                        grupo: traducirMusculo(item.primaryMuscles?.[0] || item.category || "VARIADO")
                      };
                      return (
                        <TouchableOpacity key={exerciseData.id} style={styles.apiItemRow} onPress={() => setSelectedExercise(exerciseData)}>
                          <Text style={styles.apiItemName}>{exerciseData.nombre}</Text>
                          <View style={styles.miniCategoryTag}>
                            <Text style={styles.miniCategoryTagText}>{exerciseData.grupo}</Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })
                  )}
                </ScrollView>

                <TouchableOpacity style={[styles.cancelBtn, { marginTop: 15 }]} onPress={() => setIsLogging(false)}>
                  <Text style={styles.cancelBtnText}>{t("cancel_btn")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.stepLabel}>{lang === 'es' ? "4. DETALLES DE LAS SERIES" : "4. SET DETAILS"}</Text>
                
                <View style={styles.selectedExerciseBadge}>
                  <Text style={styles.selectedExerciseText}>{selectedExercise.nombre}</Text>
                  <TouchableOpacity onPress={() => setSelectedExercise(null)}>
                    <AwesomeIcon name="close-circle" size={20} color="#ff716c" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>{t("sets_label")}</Text>
                <TextInput
                  style={[styles.inputField, focusedField === "series" && styles.inputFocused]}
                  placeholder="Ej: 4"
                  placeholderTextColor="#46484a"
                  keyboardType="numeric"
                  value={form.series}
                  onChangeText={(text) => updateForm('series', text)}
                  onFocus={() => setFocusedField("series")}
                  onBlur={() => setFocusedField(null)}
                />

                <Text style={styles.inputLabel}>{t("reps_label")}</Text>
                <TextInput
                  style={[styles.inputField, focusedField === "reps" && styles.inputFocused]}
                  placeholder="Ej: 12"
                  placeholderTextColor="#46484a"
                  keyboardType="numeric"
                  value={form.repeticiones}
                  onChangeText={(text) => updateForm('repeticiones', text)}
                  onFocus={() => setFocusedField("reps")}
                  onBlur={() => setFocusedField(null)}
                />

                <Text style={styles.inputLabel}>{t("weight_per_set_label")}</Text>
                <TextInput
                  style={[styles.inputField, focusedField === "peso" && styles.inputFocused]}
                  placeholder="Ej: 60"
                  placeholderTextColor="#46484a"
                  keyboardType="numeric"
                  value={form.peso}
                  onChangeText={(text) => updateForm('peso', text)}
                  onFocus={() => setFocusedField("peso")}
                  onBlur={() => setFocusedField(null)}
                />

                <View style={styles.planningActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsLogging(false)}>
                    <Text style={styles.cancelBtnText}>{t("cancel_btn")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.savePlanBtn} onPress={handleSaveLoggedSession}>
                    <Text style={styles.savePlanBtnText}>{t("save_set_btn")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{lang === 'es' ? "DÍAS ENTRENADOS" : "TRAINING DAYS"}</Text>
            {/* 🛠️ Muestra el número real directo de Supabase */}
            <Text style={styles.statValue}>{totalSesiones}</Text> 
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("total_volume")}</Text>
            <Text style={styles.statValue}>{volumenAcumulado} kg</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{lang === 'es' ? "TENDENCIA DE VOLUMEN DIARIO" : "DAILY VOLUME TREND"}</Text>
        <View style={styles.proChartCard}>
          {datosGrafica.length === 0 ? (
            <View style={styles.emptyChartState}>
              <AwesomeIcon name="chart-bell-curve-cumulative" size={40} color="#24282c" />
              <Text style={styles.emptyChartText}>{t("empty_chart_msg")}</Text>
            </View>
          ) : (
            <View style={styles.chartInnerContainer}>
              <View style={styles.yAxis}>
                <Text style={styles.yAxisText}>{(maxVolumen / 1000).toFixed(1)}k</Text>
                <Text style={styles.yAxisText}>{((maxVolumen / 2) / 1000).toFixed(1)}k</Text>
                <Text style={styles.yAxisText}>0k</Text>
              </View>
              
              <View style={styles.barsArea}>
                <View style={styles.gridLineTop} />
                <View style={styles.gridLineMiddle} />
                <View style={styles.gridLineBottom} />

                {promedioVolumen > 0 && (
                  <View style={[styles.averageLine, { bottom: Math.max((promedioVolumen / maxVolumen) * 120, 20) }]}>
                    <Text style={styles.averageLabel}>{lang === 'es' ? 'PROM' : 'AVG'}</Text>
                  </View>
                )}

                <View style={styles.barsWrapper}>
                  {datosGrafica.map((dia, i) => {
                    const barHeight = Math.max((dia.volumenDia / maxVolumen) * 120, 5); 
                    const esMaximo = dia.volumenDia === maxVolumen && maxVolumen > 1; 
                    
                    const dateObj = new Date(`${dia.dateStr}T12:00:00`); 
                    const dayKey = diasIngles[dateObj.getDay()];
                    const etiquetaDia = dayTranslations[lang][dayKey];

                    return (
                      <View key={i} style={styles.chartPointContainer}>
                        <Text style={[styles.volumenTextTop, esMaximo && { color: "#88adff" }]}>
                          {(dia.volumenDia / 1000).toFixed(1)}k
                        </Text>
                        <View style={[styles.chartBarPro, { height: barHeight }, esMaximo && styles.chartBarMax]} />
                        <Text style={[styles.chartDate, esMaximo && { color: "#fff" }]} numberOfLines={1}>
                          {etiquetaDia}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t("workout_history_title")}</Text>
        
        {diasVisiblesUI.length === 0 ? (
          <Text style={styles.emptyText}>{t("empty_history_msg")}</Text>
        ) : (
          diasVisiblesUI.map((diaInfo, index) => {
            const { dayName, musclesStr } = getDayOfWeekAndMuscles(diaInfo.dateStr, diaInfo.items);
            return (
              <View key={index} style={styles.sesionCard}>
                <View style={styles.sesionHeader}>
                  <View style={{flexDirection: 'column'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <AwesomeIcon name="calendar-month" size={16} color="#88adff" />
                      <Text style={styles.sesionDateText}>{dayName} • {diaInfo.dateStr}</Text>
                    </View>
                    <Text style={styles.sesionMusclesText}>{musclesStr}</Text>
                  </View>
                  <Text style={styles.sesionVolTotal}>{diaInfo.volumenDia} kg</Text>
                </View>
                
                {diaInfo.items.map((item, idx) => (
                  <View key={idx} style={styles.historyRow}>
                    <View style={styles.infoBox}>
                      <Text style={styles.exerciseName}>{traducirNombreEjercicio(item.nombre_ejercicio)}</Text>
                      <Text style={styles.exerciseDetail}>
                        {item.series || 0}x{item.repeticiones || 0} • {item.peso_kg || 0} kg 
                      </Text>
                    </View>
                    <View style={styles.ptsBadge}>
                      <Text style={styles.ptsText}>1RM: {item.pr_calculado_1rm || 0}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}

        {hayMasDias && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={cargarMasDias}>
            <Text style={styles.loadMoreText}>
              {lang === 'es' ? "Cargar semanas anteriores" : "Load previous weeks"}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerX: { flex: 1, backgroundColor: "#0c0e10" },
  headeXr: { marginTop: 40, padding: 16, backgroundColor: "#111416", alignItems: "center" },
  headerTitleX: { fontFamily: "Lexend_800ExtraBold", fontSize: 18, color: "#eeeef0" },
  container: { flex: 1, backgroundColor: "#0c0e10", paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 140 }, 
  loadingContainer: { flex: 1, backgroundColor: "#0c0e10", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#aaabad", marginTop: 12, fontFamily: "Manrope_500Medium" },
  header: { marginTop: 60, marginBottom: 15 },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Lexend_700Bold" },
  headerSubtitle: { color: "#747578", fontSize: 14, fontFamily: "Manrope_400Regular" },
  primaryLogBtn: { backgroundColor: "#88adff", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 14, borderRadius: 12, gap: 8, marginBottom: 15 },
  primaryLogBtnText: { color: "#0c0e10", fontFamily: "Lexend_700Bold", fontSize: 14 },
  
  // --- ESTILOS DE LA SUGERENCIA ---
  suggestionCard: { backgroundColor: "#171a1c", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#24282c", marginBottom: 25 },
  suggestionHeaderLine: { flexDirection: "row", marginBottom: 12 },
  suggestionTitleBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#0c0e10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  suggestionTitle: { color: "#aaabad", fontSize: 10, fontFamily: "Lexend_700Bold", marginLeft: 6 },
  suggestionBody: { flexDirection: "row", alignItems: "center" },
  suggestionIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  suggestionTexts: { flex: 1 },
  suggestionMainText: { fontSize: 16, fontFamily: "Lexend_700Bold", marginBottom: 2 },
  suggestionSubText: { color: "#747578", fontSize: 12, fontFamily: "Manrope_500Medium" },
  // ---------------------------------

  cardPlanning: { backgroundColor: "#171a1c", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#88adff", marginBottom: 25 },
  planningTitle: { color: "#fff", fontSize: 16, fontFamily: "Lexend_700Bold", marginBottom: 15 },
  stepLabel: { color: "#88adff", fontSize: 11, marginBottom: 10, marginTop: 10, fontFamily: "Lexend_700Bold", letterSpacing: 0.5 },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dayCardFijo: { flex: 1, height: 38, backgroundColor: "#0c0e10", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 4, borderWidth: 1, borderColor: "#24282c" },
  dayCardActive: { backgroundColor: "#88adff", borderColor: "#88adff" },
  dayTextCorto: { color: "#747578", fontSize: 10, fontFamily: "Lexend_700Bold" },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 },
  pillFilterBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#0c0e10', borderRadius: 20, borderWidth: 1, borderColor: '#24282c' },
  pillFilterBtnActive: { backgroundColor: '#88adff', borderColor: '#88adff' },
  pillFilterText: { color: '#aaabad', fontSize: 11, fontFamily: 'Lexend_700Bold' },
  textBlack: { color: '#0c0e10' },
  innerSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#24282c', borderRadius: 8, paddingHorizontal: 10, marginBottom: 12 },
  innerSearchBarInput: { flex: 1, color: '#fff', paddingVertical: 8, fontSize: 13, fontFamily: 'Manrope_400Regular', marginLeft: 6 },
  apiSelectorScroll: { maxHeight: 180 },
  apiItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 10, backgroundColor: "#24282c", marginBottom: 6 },
  apiItemName: { color: "#fff", fontSize: 12, fontFamily: "Lexend_700Bold", flex: 1, paddingRight: 10 },
  miniCategoryTag: { backgroundColor: '#171a1c', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  miniCategoryTagText: { color: '#88adff', fontSize: 8, fontFamily: 'Lexend_700Bold' },
  formContainer: { marginTop: 5 },
  selectedExerciseBadge: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#24282c", padding: 12, borderRadius: 10, marginBottom: 15 },
  selectedExerciseText: { color: "#88ff88", fontFamily: "Lexend_700Bold", fontSize: 13 },
  inputLabel: { color: "#aaabad", fontSize: 12, marginBottom: 4, marginTop: 8, fontFamily: "Manrope_500Medium" },
  inputField: { backgroundColor: "#24282c", color: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#46484a", fontFamily: "Lexend_700Bold", fontSize: 14 },
  inputFocused: { borderColor: "#88adff" },
  planningActions: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#46484a" },
  cancelBtnText: { color: "#aaabad", fontFamily: "Manrope_600SemiBold" },
  savePlanBtn: { flex: 2, backgroundColor: "#88ff88", padding: 12, borderRadius: 10, alignItems: "center" },
  savePlanBtnText: { color: "#0c0e10", fontFamily: "Lexend_700Bold" },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: "#171a1c", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#24282c" },
  statLabel: { color: "#aaabad", fontSize: 11, fontFamily: "Manrope_500Medium" },
  statValue: { color: "#fff", fontSize: 20, fontFamily: "Lexend_700Bold", marginTop: 4 },
  sectionTitle: { color: "#fff", fontSize: 15, fontFamily: "Lexend_600SemiBold", marginBottom: 15, marginTop: 5 },
  proChartCard: { backgroundColor: "#171a1c", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#24282c", marginBottom: 25 },
  chartInnerContainer: { flexDirection: "row", height: 160, paddingTop: 10 },
  yAxis: { justifyContent: "space-between", paddingRight: 10, paddingBottom: 20 },
  yAxisText: { color: "#46484a", fontSize: 10, fontFamily: "Manrope_500Medium" },
  barsArea: { flex: 1, position: "relative" },
  gridLineTop: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "#24282c" },
  gridLineMiddle: { position: "absolute", top: "50%", left: 0, right: 0, height: 1, backgroundColor: "#24282c" },
  gridLineBottom: { position: "absolute", bottom: 20, left: 0, right: 0, height: 1, backgroundColor: "#24282c" },
  averageLine: { position: "absolute", left: 0, right: 0, borderBottomWidth: 1, borderColor: "#ff716c", borderStyle: "dashed", zIndex: 1 },
  averageLabel: { position: "absolute", right: 0, top: -14, color: "#ff716c", fontSize: 9, fontFamily: "Lexend_700Bold" },
  barsWrapper: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", paddingBottom: 20, zIndex: 2 },
  chartPointContainer: { alignItems: "center", width: 40 },
  volumenTextTop: { color: "#aaabad", fontSize: 9, marginBottom: 4, fontFamily: "Lexend_700Bold" },
  chartBarPro: { width: 14, backgroundColor: "#2a2f35", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartBarMax: { backgroundColor: "#88adff" }, 
  chartDate: { color: "#aaabad", fontSize: 9, marginTop: 6, position: "absolute", bottom: -18, fontFamily: "Manrope_500Medium" },
  emptyChartState: { alignItems: "center", padding: 10, justifyContent: 'center', minHeight: 120 },
  emptyChartText: { color: "#46484a", fontSize: 12, textAlign: "center", marginTop: 8, fontFamily: "Manrope_400Regular" },
  sesionCard: { backgroundColor: "#171a1c", borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "#24282c" },
  sesionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#24282c" },
  sesionDateText: { color: "#fff", fontSize: 14, fontFamily: "Lexend_700Bold", marginLeft: 8 },
  sesionMusclesText: { color: "#aaabad", fontSize: 11, fontFamily: "Manrope_500Medium", marginLeft: 24, marginTop: 2 },
  sesionVolTotal: { color: "#88ff88", fontSize: 12, fontFamily: "Lexend_700Bold", marginTop: 2 },
  historyRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#0c0e10", padding: 12, borderRadius: 10, marginBottom: 8 },
  infoBox: { flex: 1 },
  exerciseName: { color: "#fff", fontSize: 13, fontFamily: "Manrope_700Bold" },
  exerciseDetail: { color: "#747578", fontSize: 11, marginTop: 2, fontFamily: "Manrope_400Regular" },
  ptsBadge: { backgroundColor: "#1a2f2b", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ptsText: { color: "#88ff88", fontSize: 10, fontFamily: "Lexend_700Bold" },
  emptyText: { color: "#46484a", textAlign: "center", marginTop: 15, fontFamily: "Manrope_400Regular" },
  
  // --- ESTILOS DEL BOTÓN DE CARGAR MÁS ---
  loadMoreBtn: { padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#24282c", marginTop: 10, marginBottom: 40 },
  loadMoreText: { color: "#88adff", fontFamily: "Lexend_600SemiBold", fontSize: 13 }
});
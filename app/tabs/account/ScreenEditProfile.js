import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../subapaseClient';

export default function ScreenEditProfile() {
  const { t } = useTranslation();
  const { user, updateUser, refreshProfile } = useContext(AuthContext);
  const navigation = useNavigation(); 
  const profile = user?.profile;

  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [nivel, setNivel] = useState("Intermedio");
  const [objetivo, setObjetivo] = useState("Perder Grasa");
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const opcionesNivel = [
    { id: "Principiante", labelKey: "level_principiante" },
    { id: "Intermedio", labelKey: "level_intermedio" },
    { id: "Avanzado", labelKey: "level_avanzado" },
  ];

  const opcionesObjetivos = [
    { id: "Perder Grasa", labelKey: "obj_perder_grasa" },
    { id: "Ganar Músculo", labelKey: "obj_ganar_musculo" },
    { id: "Mantener Peso", labelKey: "obj_mantener_peso" },
    { id: "Resistencia", labelKey: "obj_resistencia" },
  ];

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || user?.nombre || "");
      setEdad(profile.edad?.toString() || "");
      setPeso(profile.peso_kg?.toString() || "");
      setAltura(profile.altura_cm?.toString() || "");
      setNivel(profile.nivel_experiencia || profile.nivel || "Intermedio");
      setObjetivo(profile.objetivo || "Perder Grasa");
    }
  }, [profile]);

  const guardarCambios = async () => {
    if (!user?.id) return;

    const payload = {
      nombre: nombre,
      edad: parseInt(edad) || null,
      peso_kg: parseFloat(peso) || null,
      altura_cm: parseInt(altura) || null,
      nivel_experiencia: nivel,
      objetivo: objetivo,
    };
    
    try {
      setIsSaving(true);

      const { data: updatedRows, error: updateError } = await supabase
        .from("usuarios")
        .update(payload)
        .select("*")
        .eq("usuario_id", user.id);

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase
          .from("usuarios")
          .insert({ usuario_id: user.id, ...payload });

        if (insertError) throw insertError;
      }

      //CORRECCIÓN DET-06: Incorporamos `...profile` para no borrar la URL de la foto en el estado local
      updateUser({
        profile: {
          ...profile,
          ...payload,
        }
      });

      if (refreshProfile) {
        await refreshProfile();
      }

      Alert.alert(
        t("success"), 
        t("profile_updated"),
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
      
    } catch (error) {
      Alert.alert(t("error"), t("saving_error") + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const objetivoActualSeleccionado = opcionesObjetivos.find(item => item.id === objetivo);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        
        <Text style={styles.sectionLabel}>{t("personal_data")}</Text>

        <Text style={styles.inputLabel}>{t("full_name")}</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor="#46484a"
        />

        <Text style={styles.inputLabel}>{t("edit_age")}</Text>
        <TextInput
          style={styles.input}
          value={edad}
          onChangeText={setEdad}
          keyboardType="numeric"
          placeholderTextColor="#46484a"
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>{t("edit_weight")}</Text>
            <TextInput
              style={styles.input}
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
              placeholderTextColor="#46484a"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.inputLabel}>{t("edit_height")}</Text>
            <TextInput
              style={styles.input}
              value={altura}
              onChangeText={setAltura}
              keyboardType="numeric"
              placeholderTextColor="#46484a"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t("workout_config")}</Text>

        <Text style={styles.inputLabel}>{t("exp_level")}</Text>
        <View style={styles.pillRow}>
          {opcionesNivel.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.pill, nivel === item.id && styles.pillActive]}
              onPress={() => setNivel(item.id)}
            >
              <Text style={[styles.pillText, nivel === item.id && styles.textBlack]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>{t("workout_objective")}</Text>
        
        <TouchableOpacity 
          style={styles.dropdownHeader} 
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownHeaderText}>
            {objetivoActualSeleccionado ? t(objetivoActualSeleccionado.labelKey) : objetivo}
          </Text>
          <Ionicons 
            name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#88adff" 
          />
        </TouchableOpacity>

        {isDropdownOpen && (
          <View style={styles.dropdownList}>
            {opcionesObjetivos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.dropdownItem, objetivo === item.id && styles.dropdownItemActive]}
                onPress={() => {
                  setObjetivo(item.id);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, objetivo === item.id && styles.textBlue]}>
                  {t(item.labelKey)}
                </Text>
                {objetivo === item.id && (
                  <Ionicons name="checkmark" size={16} color="#88adff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={guardarCambios} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#0c0e10" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#0c0e10" />
              <Text style={styles.saveBtnText}>{t("save_changes")}</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0e10", paddingHorizontal: 16, paddingTop: 10 },
  scrollView: { backgroundColor: "#0c0e10" },
  scrollContent: { paddingBottom: 60, backgroundColor: "#0c0e10" },
  sectionLabel: { fontFamily: "Manrope_500Medium", fontSize: 12, color: "#88adff", letterSpacing: 1, marginBottom: 15 },
  inputLabel: { fontFamily: "Manrope_400Regular", fontSize: 13, color: "#aaabad", marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: "#171a1c", borderRadius: 10, color: "#fff", paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontFamily: "Lexend_700Bold", borderWidth: 1, borderColor: "#24282c", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  pillRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, marginTop: 4 },
  pill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#171a1c", borderWidth: 1, borderColor: "#24282c", alignItems: "center", flex: 1, marginHorizontal: 2 },
  pillActive: { backgroundColor: "#88adff", borderColor: "#88adff" },
  pillText: { color: "#aaabad", fontSize: 12, fontFamily: "Manrope_700Bold" },
  textBlack: { color: "#0c0e10" },
  textBlue: { color: "#88adff" },
  
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#171a1c", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#24282c", marginBottom: 4 },
  dropdownHeaderText: { color: "#fff", fontSize: 14, fontFamily: "Lexend_700Bold" },
  dropdownList: { backgroundColor: "#171a1c", borderRadius: 10, borderWidth: 1, borderColor: "#24282c", overflow: "hidden", marginBottom: 15 },
  dropdownItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#24282c" },
  dropdownItemActive: { backgroundColor: "#1e2225" },
  dropdownItemText: { color: "#aaabad", fontSize: 13, fontFamily: "Manrope_600SemiBold" },

  saveBtn: { backgroundColor: "#5eff5e", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, borderRadius: 14, marginTop: 25, gap: 8, minHeight: 54 },
  saveBtnText: { color: "#0c0e10", fontFamily: "Lexend_700Bold", fontSize: 14, letterSpacing: 0.5 }
});
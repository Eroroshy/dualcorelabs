import { useNavigation } from '@react-navigation/native';
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";

const TEXTOS_LOCALES = {
  es: {
    tag: "HERRAMIENTAS DE RENDIMIENTO",
    titulo_1: "POTENCIAL",
    titulo_2: "MÁXIMO",
    descripcion: "Calcula tu repetición máxima estimada utilizando la fórmula científica de Epley.",
    info_titulo: "¿CÓMO FUNCIONA?",
    info_descripcion: "La fórmula de Epley estima tu fuerza máxima teórica (1RM) sin necesidad de levantar un peso límite real. Es una metodología segura que escala matemáticamente esfuerzos submáximos, reduciendo drásticamente la tensión en las articulaciones y los tejidos conectivos para evitar lesiones.",
    peso_label: "PESO LEVANTADO",
    peso_placeholder: "0 kg",
    reps_label: "NÚMERO DE REPETICIONES",
    btn_calcular: "CALCULAR MÁXIMO",
    resultado_label: "1 RM ESTIMADO",
    unidad: "KILOGRAMOS",
  },
  en: {
    tag: "PERFORMANCE TOOLS",
    titulo_1: "MAXIMUM",
    titulo_2: "POTENTIAL",
    descripcion: "Calculate your estimated 1-Rep Max using the Epley formula.",
    info_titulo: "HOW IT WORKS",
    info_descripcion: "The Epley formula estimates your maximum theoretical strength (1RM) without needing to lift an actual maximal weight. This is a safer methodology that mathematically scales submaximal efforts, drastically reducing stress on joints and connective tissues.",
    peso_label: "WEIGHT LIFTED",
    peso_placeholder: "0 kg",
    reps_label: "NUMBER OF REPS",
    btn_calcular: "CALCULATE MAX",
    resultado_label: "ESTIMATED 1 RM",
    unidad: "KILOGRAMS",
  }
};

export default function ScreenCalculator() {
  const navigation = useNavigation();
  const { i18n } = useTranslation();

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [result, setResult] = useState(0);

  const idiomaActual = i18n.language?.startsWith('es') ? 'es' : 'en';
  const txt = TEXTOS_LOCALES[idiomaActual];

  const calculate1RM = () => {
    const w = parseFloat(weight);
    const r = parseFloat(reps);
    if (!w || !r) return;
    if (r === 1 || r === "1") return setResult(w);
    const oneRM = w * (1 + r / 30);
    setResult(Math.round(oneRM));
    Keyboard.dismiss(); // Baja el teclado automáticamente al calcular
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* HEADER SE QUEDA FIJO ARRIBA */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>K I N E T I C</Text>
            <View style={styles.placeholderView} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tag}>{txt.tag.toUpperCase()}</Text>
            <Text style={styles.title}>
              {txt.titulo_1.toUpperCase()}{"\n"}
              <Text style={styles.highlight}>{txt.titulo_2.toUpperCase()}</Text>
            </Text>

            <Text style={styles.text}>{txt.descripcion}</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{txt.info_titulo}</Text>
              <Text style={styles.infoText}>{txt.info_descripcion}</Text>
            </View>

            {/* TARJETA DE FORMULARIO */}
            <View style={styles.card}>
              <View style={styles.inputBlock}>
                <Text style={styles.label}>{txt.peso_label}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={txt.peso_placeholder}
                  placeholderTextColor="#555"
                  value={weight}
                  onChangeText={setWeight}
                  textColor="#fff"
                  activeUnderlineColor="#88adff"
                  underlineColor="transparent"
                />
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.label}>{txt.reps_label}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#555"
                  value={reps}
                  onChangeText={setReps}
                  textColor="#fff"
                  activeUnderlineColor="#88adff"
                  underlineColor="transparent"
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={calculate1RM} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{txt.btn_calcular.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* PANEL DE RESULTADO */}
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>{txt.resultado_label}</Text>
              <Text style={styles.result}>{result}</Text>
              <Text style={styles.resultLabel}>{txt.unidad}</Text>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0e10",
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  header: {
    marginTop: 40,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#111416",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingRight: 10,
  },
  backArrow: {
    color: "#88adff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontFamily: "Lexend_800ExtraBold",
    fontSize: 18,
    color: "#eeeef0",
    textAlign: "center",
  },
  placeholderView: {
    width: 24,
  },
  tag: {
    color: "#88adff",
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 10,
  },
  title: {
    fontSize: 44,
    color: "#fff",
    fontFamily: "Lexend_800ExtraBold",
    lineHeight: 50,
  },
  highlight: {
    color: "#719eff",
  },
  text: {
    color: "#aaa",
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Manrope_400Regular",
  },
  infoCard: {
    backgroundColor: "#111416",
    padding: 18,
    borderRadius: 12,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#88adff",
  },
  infoTitle: {
    color: "#eeeef0",
    fontSize: 14,
    fontFamily: "Lexend_700Bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    color: "#9da0a3",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Manrope_400Regular",
  },
  card: {
    backgroundColor: "#171a1c",
    padding: 24,
    borderRadius: 12,
    marginTop: 15,
  },
  inputBlock: {
    marginBottom: 16,
  },
  label: {
    color: "#aaa",
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: "Manrope_700Bold",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#232629",
    borderRadius: 10,
    fontSize: 18,
  },
  button: {
    backgroundColor: "#719eff",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    textAlign: "center",
    fontFamily: "Lexend_800ExtraBold",
    fontSize: 16,
    color: "#002052",
  },
  resultCard: {
    backgroundColor: "#171a1c",
    padding: 24,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  resultLabel: {
    color: "#88adff",
    fontSize: 14,
    fontFamily: "Lexend_700Bold",
    letterSpacing: 2,
  },
  result: {
    fontSize: 64,
    color: "#fff",
    fontFamily: "Lexend_800ExtraBold",
    lineHeight: 74,
  },
});
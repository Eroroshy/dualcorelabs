import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeIcon from '@react-native-vector-icons/material-design-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'dumbbell',
    titleKey: 'onboarding_1_title',
    defaultTitle: 'BOOST YOUR TRAINING',
    descKey: 'onboarding_1_desc',
    defaultDesc: 'Discover routines, track your progress, and reach your fitness goals with Kinetic’s exercise library.',
  },
  {
    id: '2',
    icon: 'chart-timeline-variant',
    titleKey: 'onboarding_2_title',
    defaultTitle: 'MEASURE YOUR PROGRESS',
    descKey: 'onboarding_2_desc',
    defaultDesc: 'See your weekly progress, calculate your PR, and keep a detailed record of your training volume.',
  },
  {
    id: '3',
    icon: 'map-marker-radius',
    titleKey: 'onboarding_3_title',
    defaultTitle: 'FIND YOUR SPACE',
    descKey: 'onboarding_3_desc',
    defaultDesc: 'Find the best nearby gyms and sports centers with our interactive map.',
  }
];

export default function ScreenOnboarding({ onFinish, storageKey = '@viewedOnboarding' }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(storageKey, 'true');
      onFinish();
    } catch (error) {
      console.error('Error guardando el estado del onboarding:', error);
    }
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AwesomeIcon name={currentSlide.icon} size={100} color="#88adff" />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t(currentSlide.titleKey, currentSlide.defaultTitle)}</Text>
        <Text style={styles.description}>{t(currentSlide.descKey, currentSlide.defaultDesc)}</Text>
      </View>

      <View style={styles.footer}>
        {/* Indicadores de progreso (Puntitos) */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.indicator, currentIndex === index && styles.activeIndicator]} />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={completeOnboarding}>
            <Text style={styles.skipText}>{t('skip', 'Skip')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? t('start', 'Start') : t('next', 'Next')}
            </Text>
            <AwesomeIcon name="arrow-right" size={20} color="#0c0e10" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0e10', alignItems: 'center', justifyContent: 'center' },
  iconContainer: { flex: 2, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  textContainer: { flex: 2, alignItems: 'center', paddingHorizontal: 30 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Lexend_800ExtraBold', textAlign: 'center', marginBottom: 15, letterSpacing: 1 },
  description: { color: '#aaabad', fontSize: 14, fontFamily: 'Manrope_500Medium', textAlign: 'center', lineHeight: 22 },
  footer: { flex: 1, width: '100%', paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 40 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  indicator: { height: 6, width: 6, backgroundColor: '#24282c', borderRadius: 3, marginHorizontal: 4 },
  activeIndicator: { width: 20, backgroundColor: '#88adff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipText: { color: '#747578', fontFamily: 'Manrope_600SemiBold', fontSize: 14 },
  nextButton: { flexDirection: 'row', backgroundColor: '#88adff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', gap: 8 },
  nextButtonText: { color: '#0c0e10', fontFamily: 'Lexend_700Bold', fontSize: 14 }
});
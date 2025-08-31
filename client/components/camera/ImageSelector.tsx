
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ImageSelectorProps {
  onTakePhoto: () => void;
  onSelectFromGallery: () => void;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  onTakePhoto,
  onSelectFromGallery,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.emerald500 + '15' }]}>
        <Camera size={48} color={colors.emerald500} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        {t('camera.title') || 'Meal Scanner'}
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        {t('camera.subtitle') || 'Take a photo or select from gallery to analyze your meal'}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.emerald500 }]}
          onPress={onTakePhoto}
        >
          <Camera size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {t('camera.takePhoto') || 'Take Photo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.emerald500 }]}
          onPress={onSelectFromGallery}
        >
          <ImageIcon size={20} color={colors.emerald500} />
          <Text style={[styles.secondaryButtonText, { color: colors.emerald500 }]}>
            {t('camera.chooseFromGallery') || 'Choose from Gallery'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  buttons: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ANIMATION, EASING } from '../constants/theme';

interface StaggerItemProps {
  index: number;
  style?: any;
  children: React.ReactNode;
  offset?: number;
  delayStep?: number;
}

/**
 * Decorative staggered entrance for grouped items: fade + slide up.
 * Reduced-motion users keep a short opacity fade only (movement dropped).
 * Must never block interaction.
 */
export const StaggerItem: React.FC<StaggerItemProps> = ({
  index,
  style,
  children,
  offset = 8,
  delayStep = 30,
}) => {
  const reducedMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIMATION.fast,
      delay: reducedMotion ? 0 : index * delayStep,
      easing: EASING.easeOut,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, anim, index, delayStep]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: reducedMotion
            ? []
            : [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [offset, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

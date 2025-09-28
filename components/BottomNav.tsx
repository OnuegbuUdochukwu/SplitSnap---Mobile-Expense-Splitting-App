import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
// Note: Lucid's 'Chrome' icon is used as a functional placeholder for the unique logo.
// If an exact Chrome logo is required, a custom SVG component would be necessary.
import {
  Chrome as HomeIcon,
  Users as GroupsIcon,
  Activity as ActivityIcon,
  User as ProfileIcon,
} from 'lucide-react-native';

type TabKey = 'home' | 'groups' | 'activity' | 'profile';

type Props = {
  initialTab?: TabKey;
  onTabPress?: (tab: TabKey) => void;
  // optional override for bar height
  height?: number;
};

// --- PRECISE COLOR CORRECTION ---
// Blue color from the image (Google Blue is close to this)
const ACTIVE_COLOR = '#1976D2'; 
// A light, neutral grey matching the inactive text/icon color in the image
const INACTIVE_COLOR = '#5F6368'; 

export default function BottomNav({
  initialTab = 'home',
  onTabPress,
  height = 56,
}: Props) {
  const [active, setActive] = useState<TabKey>(initialTab);
  const { width } = Dimensions.get('window');
  // Match icon sizing to the visual scale in the image
  const homeSize = width >= 420 ? 30 : 28;
  const otherSize = width >= 420 ? 28 : 26;

  function handlePress(tab: TabKey) {
    setActive(tab);
    if (onTabPress) onTabPress(tab);
  }

  return (
    <View
      style={[styles.container, { height }] /* fixed bottom container */}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { height }]}>
        {/* --- Home Tab (Active) --- */}
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: active === 'home' }}
          style={styles.tab}
          onPress={() => handlePress('home')}
        >
          <HomeIcon
            size={homeSize}
            color={active === 'home' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text
            style={[
              styles.label,
              { color: active === 'home' ? ACTIVE_COLOR : INACTIVE_COLOR },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* --- Groups Tab (Inactive) --- */}
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: active === 'groups' }}
          style={styles.tab}
          onPress={() => handlePress('groups')}
        >
          <GroupsIcon
            size={otherSize}
            color={active === 'groups' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text
            style={[
              styles.label,
              { color: active === 'groups' ? ACTIVE_COLOR : INACTIVE_COLOR },
            ]}
          >
            Groups
          </Text>
        </TouchableOpacity>

        {/* --- Activity Tab (Inactive) --- */}
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: active === 'activity' }}
          style={styles.tab}
          onPress={() => handlePress('activity')}
        >
          <ActivityIcon
            size={otherSize}
            color={active === 'activity' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text
            style={[
              styles.label,
              { color: active === 'activity' ? ACTIVE_COLOR : INACTIVE_COLOR },
            ]}
          >
            Activity
          </Text>
        </TouchableOpacity>

        {/* --- Profile Tab (Inactive) --- */}
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: active === 'profile' }}
          style={styles.tab}
          onPress={() => handlePress('profile')}
        >
          <ProfileIcon
            size={otherSize}
            color={active === 'profile' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text
            style={[
              styles.label,
              { color: active === 'profile' ? ACTIVE_COLOR : INACTIVE_COLOR },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    // Add a light shadow to match the typical bottom bar look, if desired
    // shadowColor: '#000',
    // shadowOpacity: 0.05,
    // shadowRadius: 5,
    // elevation: 5,
  },
  bar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderTopWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    alignItems: 'center',
    width: '100%',
  },
  tab: {
    flex: 1, // Ensures equal width distribution across all 4 tabs (as requested)
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Padding adjusted to balance the icon/text centering within the bar height
    paddingVertical: Platform.OS === 'ios' ? 8 : 6, 
  },
  label: {
    // Vertical spacing corrected to be tighter, matching the image
    marginTop: 2, 
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : undefined,
  },
});

// Usage example (commented):
// <BottomNav initialTab="home" onTabPress={(t) => console.log('tab', t)} />
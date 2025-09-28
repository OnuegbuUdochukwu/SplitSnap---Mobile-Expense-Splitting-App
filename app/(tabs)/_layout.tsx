import { Tabs } from 'expo-router';
import { Platform, Dimensions } from 'react-native';
import { Chrome as Home, Users, Activity, User } from 'lucide-react-native';

export default function TabLayout() {
  const { width } = Dimensions.get('window');
  const INACTIVE_COLOR = '#5F6368'; 
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, 

        tabBarActiveTintColor: '#1976D2', // Active Blue Color
        tabBarInactiveTintColor: INACTIVE_COLOR,
        
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 80 : 64, 
          flexDirection: 'row',
          // CRITICAL: Remove all horizontal padding from the bar container
          paddingHorizontal: 0,
          marginHorizontal: 0, 
        },
        
        tabBarItemStyle: {
          // CRITICAL: Force item to consume all available width
          flex: 1, 
          alignItems: 'center',
          justifyContent: 'center',
          
          // CRITICAL: Remove default horizontal padding/margin on the item itself
          paddingHorizontal: 0,
          marginHorizontal: 0, 
          paddingVertical: 0, // Ensure vertical padding doesn't affect width
        },

        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '500',
          textAlign: 'center',
          color: INACTIVE_COLOR,
        },

        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={width >= 420 ? 30 : 28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => (
            <Users size={width >= 420 ? 28 : 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <Activity size={width >= 420 ? 28 : 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={width >= 420 ? 28 : 26} color={color} />
          ),
        }}
      />
      {/* Hidden Screens */}
      <Tabs.Screen
        name="scan"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="manual"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
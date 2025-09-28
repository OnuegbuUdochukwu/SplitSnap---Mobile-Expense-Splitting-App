import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Camera, Scan, Plus, Receipt } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { AuthScreen } from '@/components/AuthScreen';
import { supabase, Bill } from '@/lib/supabase';

export default function HomeScreen() {
  const {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const router = useRouter();
  const [recentBills, setRecentBills] = useState<Bill[]>([]);

  const fetchRecentBills = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('creator_id', user!.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentBills(data || []);
    } catch (error) {
      console.error('Error fetching recent bills:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRecentBills();
    }
  }, [user, fetchRecentBills]);

  const handleScanReceipt = () => {
    // Navigate to the Scan screen implemented in Phase 2
    try {
      // cast to any to avoid strict router path typing in the editor environment
      router.push('/scan' as any);
    } catch {
      // Fallback for environments where router is not available
      Alert.alert('Open Scanner', 'Scanner is available in the running app.');
    }
  };

  const handleQuickSplit = () => {
    try {
      router.push('/manual' as any);
    } catch {
      Alert.alert(
        'Quick Split',
        'Manual bill creation will be implemented in Phase 2.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onGoogleSignIn={signInWithGoogle}
        onAppleSignIn={signInWithApple}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userName}>{user.full_name}</Text>
          </View>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Main Actions - keep navigation tabs; move secondary actions into the primary card */}
        <View style={styles.mainActions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={handleScanReceipt}
            activeOpacity={0.9}
          >
            <Camera size={32} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Scan Receipt</Text>
            <Text style={styles.primaryActionSubtext}>
              Use AI to digitize your bill
            </Text>

            <View style={styles.inlineActionsRow}>
              <TouchableOpacity
                style={styles.inlineAction}
                onPress={handleQuickSplit}
                activeOpacity={0.8}
              >
                <Plus size={18} color="#3B82F6" />
                <Text style={styles.inlineActionText}>Quick Split</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineAction}
                onPress={() => {
                  try {
                    router.push('/manual' as any);
                  } catch {
                    Alert.alert('Join Split', 'Feature available in-app.');
                  }
                }}
                activeOpacity={0.8}
              >
                <Scan size={18} color="#3B82F6" />
                <Text style={styles.inlineActionText}>Join Split</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bills</Text>
          {recentBills.length > 0 ? (
            <View style={styles.billsList}>
              {recentBills.map((bill) => (
                <View key={bill.bill_id} style={styles.billCard}>
                  <View style={styles.billIcon}>
                    <Receipt size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.billDetails}>
                    <Text style={styles.billAmount}>
                      ₦{bill.total_amount.toLocaleString()}
                    </Text>
                    <Text style={styles.billStatus}>Status: {bill.status}</Text>
                    <Text style={styles.billDate}>
                      {new Date(bill.created_at!).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Receipt size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No recent bills</Text>
              <Text style={styles.emptyStateSubtext}>
                Scan your first receipt to get started
              </Text>
            </View>
          )}
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Share with Friends</Text>
              <Text style={styles.tipText}>
                Invite friends to join your splits by sharing a link or QR code
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 2,
  },
  userAvatar: {
    width: 44,
    height: 44,
    backgroundColor: '#3B82F6',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainActions: {
    padding: 24,
    gap: 16,
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  primaryActionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  billsList: {
    gap: 12,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  billIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  billStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  billDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
  inlineActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  inlineActionText: {
    color: '#374151',
    marginLeft: 8,
    fontWeight: '600',
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import AdminPanelComponent from '@/components/AdminPanel';

const COLORS = {
  background: '#10121C',
  primary: '#0066FF',
  text: '#FFFFFF',
  textSecondary: '#B0B8D4',
};

export default function AdminScreen() {
  const { user, token } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      if (!token || !user) {
        router.replace('/(tabs)/');
        return;
      }

      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (res.ok) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Admin check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMessage}>You don't have admin privileges</Text>
      </View>
    );
  }

  return <AdminPanelComponent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

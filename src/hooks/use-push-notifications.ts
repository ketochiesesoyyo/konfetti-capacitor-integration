import { useEffect, useState, useRef } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Save device token to Supabase
  const saveDeviceToken = async (deviceToken: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No session, skipping token save');
        return;
      }

      console.log('Saving device token for user:', session.user.id);

      // Upsert device token (insert or update if exists)
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: session.user.id,
          token: deviceToken,
          platform: 'ios',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving device token:', error);
      } else {
        console.log('Device token saved successfully');
      }
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  };

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const initPushNotifications = async () => {
      try {
        // Check current permission status
        const permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          // Request permission
          const requestResult = await PushNotifications.requestPermissions();
          setPermissionStatus(requestResult.receive as 'granted' | 'denied' | 'prompt');

          if (requestResult.receive === 'granted') {
            await registerForPush();
          }
        } else if (permStatus.receive === 'granted') {
          setPermissionStatus('granted');
          await registerForPush();
        } else {
          setPermissionStatus('denied');
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    const registerForPush = async () => {
      // Register with Apple Push Notification service
      await PushNotifications.register();
    };

    // Listen for registration success
    PushNotifications.addListener('registration', async (tokenData) => {
      console.log('Push registration success, token:', tokenData.value);
      setToken(tokenData.value);
      tokenRef.current = tokenData.value;

      // Save token to Supabase
      await saveDeviceToken(tokenData.value);
    });

    // Listen for auth state changes - save token when user logs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && tokenRef.current) {
        console.log('User signed in, saving device token');
        await saveDeviceToken(tokenRef.current);
      }
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      
      // Show in-app toast notification
      const title = notification.title || 'New Notification';
      const body = notification.body || '';
      const data = notification.data;
      
      toast(title, {
        description: body,
        action: data?.type ? {
          label: data.type === 'message' ? 'View Chat' : 'View',
          onClick: () => {
            if (data.type === 'match' || data.type === 'like') {
              window.location.href = '/liked';
            } else if (data.type === 'message') {
              window.location.href = data.chatId ? `/chat/${data.chatId}` : '/chats';
            }
          },
        } : undefined,
      });
    });

    // Listen for push notification action (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action performed:', action);

      // Handle navigation based on notification data
      const data = action.notification.data;
      if (data?.type === 'match') {
        window.location.href = '/liked';
      } else if (data?.type === 'message') {
        window.location.href = data.chatId ? `/chat/${data.chatId}` : '/chats';
      } else if (data?.type === 'like') {
        window.location.href = '/liked';
      }
    });

    initPushNotifications();

    // Cleanup listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
      subscription.unsubscribe();
    };
  }, []);

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) return;

    const result = await PushNotifications.requestPermissions();
    setPermissionStatus(result.receive as 'granted' | 'denied' | 'prompt');

    if (result.receive === 'granted') {
      await PushNotifications.register();
    }
  };

  return {
    permissionStatus,
    token,
    requestPermission,
  };
};

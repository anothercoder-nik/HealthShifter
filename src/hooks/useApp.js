"use client";
import { useState, useEffect } from 'react';

// Simple app state store
class AppStore {
  constructor() {
    this.listeners = [];
    this.state = {
      location: null,
      locationError: null,
      locationLoading: false,
      shifts: [],
      shiftsLoading: false,
      perimeter: null,
      notifications: []
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        this.setState({ locationError: error, locationLoading: false });
        reject(new Error(error));
        return;
      }

      this.setState({ locationLoading: true, locationError: null });

      // Enhanced location options for better accuracy
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 30000 // Reduced cache time for fresh location
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          console.log('Location obtained:', newLocation);
          this.setState({ location: newLocation, locationLoading: false, locationError: null });
          resolve(newLocation);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS/network connection.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
              break;
          }
          
          console.error('Geolocation error:', error);
          this.setState({ locationError: errorMessage, locationLoading: false });
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  isWithinPerimeter(userLocation, perimeterData) {
    if (!userLocation || !perimeterData) return false;
    return this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      perimeterData.latitude,
      perimeterData.longitude
    ) <= perimeterData.radius;
  }

  async fetchShifts() {
    this.setState({ shiftsLoading: true });
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        this.setState({ shifts: data, shiftsLoading: false });
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      this.setState({ shiftsLoading: false });
    }
  }

  async fetchPerimeter() {
    try {
      const response = await fetch('/api/perimeter');
      if (response.ok) {
        const data = await response.json();
        this.setState({ perimeter: data });
      }
    } catch (error) {
      console.error('Error fetching perimeter:', error);
    }
  }

  addNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    this.setState({ 
      notifications: [...this.state.notifications, notification] 
    });
    
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }

  removeNotification(id) {
    this.setState({
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }
}

const appStore = new AppStore();

export function useApp() {
  const [state, setState] = useState(appStore.state);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(setState);
    return unsubscribe;
  }, []);

  const distanceFromPerimeter = () => {
    if (!state.location || !state.perimeter) return null;
    return appStore.calculateDistance(
      state.location.latitude,
      state.location.longitude,
      state.perimeter.latitude,
      state.perimeter.longitude
    ) - state.perimeter.radius;
  };

  return {
    ...state,
    getCurrentLocation: () => appStore.getCurrentLocation(),
    isWithinPerimeter: (loc, perim) => appStore.isWithinPerimeter(loc, perim),
    calculateDistance: (lat1, lon1, lat2, lon2) => appStore.calculateDistance(lat1, lon1, lat2, lon2),
    fetchShifts: () => appStore.fetchShifts(),
    fetchPerimeter: () => appStore.fetchPerimeter(),
    addNotification: (msg, type) => appStore.addNotification(msg, type),
    removeNotification: (id) => appStore.removeNotification(id),
    distanceFromPerimeter: distanceFromPerimeter()
  };
}

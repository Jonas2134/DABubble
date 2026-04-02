import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'da-bubble-fed7a',
        appId: '1:193046112939:web:39c744774fe5237130a5ee',
        storageBucket: 'da-bubble-fed7a.firebasestorage.app',
        apiKey: 'AIzaSyDL-3-FphqdH6rZA3Nz67hYvTCkVQ89Sgc',
        authDomain: 'da-bubble-fed7a.firebaseapp.com',
        messagingSenderId: '193046112939',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),   
    provideAnimations()
  ],
};

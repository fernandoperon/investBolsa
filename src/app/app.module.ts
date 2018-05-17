
import { IonicStorageModule } from '@ionic/storage';
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { DaytradePage } from '../pages/daytrade/daytrade';
import { SwingtradePage } from '../pages/swingtrade/swingtrade';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { HttpBackend, HttpXhrBackend } from '@angular/common/http';
import { NativeHttpModule, NativeHttpBackend, NativeHttpFallback } from 'ionic-native-http-connection-backend';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpClientModule } from '@angular/common/http';
import { RestProvider } from '../providers/rest/rest';
import { SwingtradeSetupProvider } from '../providers/setup/swingtradeSetup';
import { DaytradeSetupProvider } from '../providers/setup/daytradeSetup';
import { Platform } from 'ionic-angular';

@NgModule({
  declarations: [
    MyApp,
    DaytradePage,
    SwingtradePage,
    HomePage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NativeHttpModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot({
      name: 'myAppBolsa',
      driverOrder: ['websql']
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DaytradePage,
    SwingtradePage,
    HomePage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: HttpBackend, useClass: NativeHttpFallback, deps: [Platform, NativeHttpBackend, HttpXhrBackend] },
    // { provide: ErrorHandler, useClass: IonicErrorHandler },


    RestProvider,
    SwingtradeSetupProvider,
    DaytradeSetupProvider
  ]
})
export class AppModule { }

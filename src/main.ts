import { bootstrapApplication } from '@angular/platform-browser';
import { setLogLevel, LogLevel } from '@angular/fire';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

setLogLevel(LogLevel.SILENT);

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

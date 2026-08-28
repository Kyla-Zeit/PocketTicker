/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import {registerBackgroundAlertHeadlessTask} from './src/services/backgroundAlerts';
import {runConfiguredAlertCheck} from './src/app/alertTasks';

registerBackgroundAlertHeadlessTask(runConfiguredAlertCheck);

AppRegistry.registerComponent(appName, () => App);

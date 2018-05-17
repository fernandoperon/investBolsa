import { DaytradePage } from './../daytrade/daytrade';
import { Component } from '@angular/core';

import { HomePage } from '../home/home';
import { SwingtradePage } from '../swingtrade/swingtrade';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = DaytradePage;
  tab3Root = SwingtradePage;

  constructor() {

  }
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FarmControl } from "./farm-control/farm-control";
import { FarmStatus } from './farm-status/farm-status';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FarmControl, FarmStatus, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('smart-farm');
  activeTab: 'control' | 'status' = 'control';

  setActiveTab(tab: 'control' | 'status') {
    this.activeTab = tab;
  }
}

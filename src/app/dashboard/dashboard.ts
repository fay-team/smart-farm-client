import { Component, signal } from '@angular/core';
import { FarmControl } from "../farm-control/farm-control";
import { FarmStatus } from '../farm-status/farm-status';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [FarmControl, FarmStatus, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true
})
export class Dashboard {
  activeTab: 'control' | 'status' = 'control';

  setActiveTab(tab: 'control' | 'status') {
    this.activeTab = tab;
  }
}

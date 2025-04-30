import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-boarding',
  imports: [MatButtonModule, RouterModule],
  templateUrl: './boarding.component.html',
  styleUrl: './boarding.component.css',
})
export class BoardingComponent {}

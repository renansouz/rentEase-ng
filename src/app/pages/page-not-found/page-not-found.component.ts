import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-page-not-found',
  imports: [RouterLink, MatIconModule],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css',
  animations: [
    trigger('shrinkOnLoad', [
      state(
        'big',
        style({
          width: '200px',
          transform: 'translateY(-20%)',
        })
      ),
      state(
        'small',
        style({
          width: '10px',
          transform: 'translateY(-70%)',
        })
      ),
      transition('big => small', [animate('30000ms ease-out')]),
    ]),
  ],
})
export class PageNotFoundComponent implements OnInit {
  astroState: 'big' | 'small' = 'big';

  ngOnInit() {
    // after a little pause, shrink it
    setTimeout(() => (this.astroState = 'small'), 200);
  }
}

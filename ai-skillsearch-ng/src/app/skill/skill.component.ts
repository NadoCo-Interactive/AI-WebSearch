import { Component } from '@angular/core';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.css'],
})
export class SkillComponent {
  ngOnInit() {
    this.playEnterSound();
  }

  playEnterSound() {
    const audio = new Audio('assets/select.wav');
    audio.volume = 0.05;
    audio.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  }

  playHoverSound() {
    const audio = new Audio('assets/check.wav');
    audio.volume = 0.05;
    audio.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  }
}

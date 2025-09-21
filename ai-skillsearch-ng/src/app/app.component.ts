import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ai-skillsearch-ng';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  uploadedFile: File | null = null;

  isLoading: Boolean = false;
  isDialogOpen: Boolean = false;

  openFileDialog() {
    console.log('Triggering file dialog...');
    this.isDialogOpen = true;

    // Start watching for dialog close
    this.watchForDialogClose();

    this.fileInput.nativeElement.click();
  }

  private watchForDialogClose() {
    const startTime = Date.now();

    const checkForClose = () => {
      if (!this.isDialogOpen) return; // Already handled

      // Check if dialog is still open (focus returned to window)
      const onFocus = () => {
        if (this.isDialogOpen) {
          const duration = Date.now() - startTime;
          console.log(`Dialog was open for ${duration}ms`);
          this.onDialogInteractionComplete();
        }
        window.removeEventListener('focus', onFocus);
      };

      window.addEventListener('focus', onFocus);
    };

    // Small delay to ensure dialog has opened
    setTimeout(checkForClose, 100);
  }

  onFileSelected(event: Event) {
    console.log(event);
  }

  private onDialogInteractionComplete() {
    console.log('File dialog interaction finished');
    this.isLoading = true;
  }
}

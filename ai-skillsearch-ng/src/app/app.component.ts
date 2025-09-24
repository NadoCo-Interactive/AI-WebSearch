import { Component, ElementRef, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ai-skillsearch-ng';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isLoading: Boolean = false;
  isDialogOpen: Boolean = false;
  skills: Record<string, string>[] = [];
  uploadedFile: File | null = null;

  constructor(private http: HttpClient) {}

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

    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.uploadedFile = files[0];
      console.log('File selected:', this.uploadedFile.name);
    }
  }

  trackBySkill(index: number, skill: any): any {
    return skill.NAME || index; // Use skill name as unique identifier
  }

  private async onDialogInteractionComplete() {
    console.log('File dialog interaction finished');
    this.isLoading = true;

    if (this.uploadedFile == null) {
      console.log('no file was uploaded - skipping');
      return;
    }

    try {
      const formData = new FormData();
      console.log(
        'loading ' + this.uploadedFile + ' into form data and calling API...'
      );
      formData.append('pdf', this.uploadedFile); // 'pdf' matches upload.single('pdf') in backend
      const response: any = await firstValueFrom(
        this.http.post('http://localhost:3000/api/skills', formData)
      );
      this.skills = response;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
